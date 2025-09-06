-- =====================================================
-- NOTIFICATION SYSTEM MIGRATION FOR MYOWNTOUR
-- Add comprehensive notification system with email and in-app notifications
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'booking_created', 
        'booking_updated', 
        'booking_cancelled', 
        'reminder_24h', 
        'checkin_success', 
        'booking_confirmed'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'both')) DEFAULT 'both',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON notifications TO authenticated;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Create function to send 24h reminders (for cron job)
CREATE OR REPLACE FUNCTION send_24h_reminders()
RETURNS INTEGER AS $$
DECLARE
    tomorrow_date DATE;
    booking_record RECORD;
    client_notifications_count INTEGER := 0;
    guide_notifications_count INTEGER := 0;
BEGIN
    -- Get tomorrow's date
    tomorrow_date := CURRENT_DATE + INTERVAL '1 day';
    
    -- Create notifications for clients
    FOR booking_record IN
        SELECT 
            b.id as booking_id,
            b.client_id,
            b.participants_count,
            b.checkin_token,
            e.title as excursion_title,
            s.date as excursion_date,
            s.start_time as excursion_time,
            p.first_name,
            p.last_name,
            p.email
        FROM bookings b
        JOIN excursions e ON b.excursion_id = e.id
        JOIN availability_slots s ON b.slot_id = s.id
        JOIN profiles p ON b.client_id = p.id
        WHERE s.date = tomorrow_date
        AND b.status = 'confirmed'
    LOOP
        -- Insert client notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            channel
        ) VALUES (
            booking_record.client_id,
            'reminder_24h',
            'Rappel - Excursion demain',
            'N''oubliez pas votre excursion demain ! Votre QR code est prêt pour le check-in.',
            json_build_object(
                'recipient_type', 'client',
                'booking_id', booking_record.booking_id,
                'excursion_title', booking_record.excursion_title,
                'excursion_date', booking_record.excursion_date,
                'excursion_time', booking_record.excursion_time,
                'participants_count', booking_record.participants_count,
                'checkin_token', booking_record.checkin_token
            ),
            'both'
        );
        
        client_notifications_count := client_notifications_count + 1;
    END LOOP;
    
    -- Create notifications for guides (grouped by guide)
    FOR booking_record IN
        SELECT 
            g.user_id as guide_user_id,
            e.title as excursion_title,
            s.date as excursion_date,
            s.start_time as excursion_time,
            COUNT(b.id) as total_bookings,
            SUM(b.participants_count) as total_participants
        FROM bookings b
        JOIN excursions e ON b.excursion_id = e.id
        JOIN availability_slots s ON b.slot_id = s.id
        JOIN guides g ON e.guide_id = g.id
        WHERE s.date = tomorrow_date
        AND b.status = 'confirmed'
        GROUP BY g.user_id, e.title, s.date, s.start_time
    LOOP
        -- Insert guide notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            channel
        ) VALUES (
            booking_record.guide_user_id,
            'reminder_24h',
            'Rappel - Excursion demain',
            'Vous avez une excursion demain avec des participants à accueillir.',
            json_build_object(
                'recipient_type', 'guide',
                'excursion_title', booking_record.excursion_title,
                'excursion_date', booking_record.excursion_date,
                'excursion_time', booking_record.excursion_time,
                'total_bookings', booking_record.total_bookings,
                'total_participants', booking_record.total_participants
            ),
            'both'
        );
        
        guide_notifications_count := guide_notifications_count + 1;
    END LOOP;
    
    RETURN client_notifications_count + guide_notifications_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION send_24h_reminders() TO authenticated;

-- Create function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_notifications', COUNT(*),
        'unread_count', COUNT(*) FILTER (WHERE is_read = FALSE),
        'by_type', json_object_agg(type, type_count)
    ) INTO result
    FROM (
        SELECT 
            type,
            COUNT(*) as type_count
        FROM notifications
        WHERE user_id = p_user_id
        GROUP BY type
    ) stats;
    
    RETURN COALESCE(result, '{"total_notifications": 0, "unread_count": 0, "by_type": {}}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_stats(UUID) TO authenticated;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;

-- Create function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;

-- Sample notification types are handled by the application
-- No sample data needed in the database

-- Create view for notification summary
CREATE OR REPLACE VIEW notification_summary AS
SELECT 
    n.user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE n.is_read = FALSE) as unread_count,
    COUNT(*) FILTER (WHERE n.type = 'booking_created') as booking_created_count,
    COUNT(*) FILTER (WHERE n.type = 'booking_confirmed') as booking_confirmed_count,
    COUNT(*) FILTER (WHERE n.type = 'booking_cancelled') as booking_cancelled_count,
    COUNT(*) FILTER (WHERE n.type = 'reminder_24h') as reminder_count,
    COUNT(*) FILTER (WHERE n.type = 'checkin_success') as checkin_count,
    MAX(n.created_at) as last_notification_at
FROM notifications n
GROUP BY n.user_id;

-- Grant permissions on the view
GRANT SELECT ON notification_summary TO authenticated;

-- Add notification preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "in_app_notifications": true,
    "booking_created": true,
    "booking_confirmed": true,
    "booking_cancelled": true,
    "reminder_24h": true,
    "checkin_success": true
}'::jsonb;

-- Create index on notification preferences
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences ON profiles USING GIN (notification_preferences);

-- Add comment explaining the notification system
COMMENT ON TABLE notifications IS 'Stores all user notifications including email and in-app notifications';
COMMENT ON COLUMN notifications.type IS 'Type of notification: booking_created, booking_confirmed, booking_cancelled, reminder_24h, checkin_success';
COMMENT ON COLUMN notifications.channel IS 'Delivery channel: email, in_app, or both';
COMMENT ON COLUMN notifications.data IS 'Additional data for the notification (JSON)';
COMMENT ON FUNCTION send_24h_reminders() IS 'Function to send 24-hour reminders for excursions (to be called by cron job)';
COMMENT ON FUNCTION get_notification_stats(UUID) IS 'Get notification statistics for a user';
COMMENT ON FUNCTION mark_all_notifications_read(UUID) IS 'Mark all notifications as read for a user';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Clean up notifications older than 30 days';

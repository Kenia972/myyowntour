# 🚀 Myowntour Notification System - Complete Setup Guide

## Overview

This guide provides **complete setup instructions** for the Myowntour notification system using **Supabase Edge Functions** and **Cron-job.org** for reliable scheduling. The system includes:

- ✅ **Real-time notifications** for booking events
- ✅ **24-hour automated reminders** via Cron-job.org
- ✅ **Email and in-app notifications**
- ✅ **Resend email service** with domain verification
- ✅ **Complete monitoring and analytics**

## 🎯 Quick Start (5 Minutes)

### Step 1: Run the Setup Script
```bash
# Make the script executable (if not already done)
chmod +x setup-notifications.sh

# Run the automated setup
./setup-notifications.sh
```

### Step 2: Configure Environment Variables
Update your `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Deploy Database Migration
Run this SQL in your Supabase SQL Editor:
```sql
-- Copy and paste the entire NOTIFICATION_SYSTEM_MIGRATION.sql content
```

### Step 4: Deploy Edge Functions
```bash
# Deploy the email sending function
supabase functions deploy send-email

# Deploy the reminder function
supabase functions deploy send-reminders
```

**Important:** Make sure both functions are deployed successfully before proceeding!

### Step 5: Verify Edge Functions Are Working
Test both functions to ensure they're deployed correctly:

```bash
# Test the email function
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianVoeHpqZ2VnanZpZ3N0bGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjUwMzAsImV4cCI6MjA3MTQ0MTAzMH0.9ZGYw5f1_HYXftiymb7pZqrbM1-VFb2nATcSgOVkTec" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@resend.dev", "subject": "Test Email", "type": "html", "html": "<h1>Test from Myowntour</h1>"}' \
  https://nbjuhxzjgegjvigsstljy.supabase.co/functions/v1/send-email

# Test the reminders function
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianVoeHpqZ2VnanZpZ3N0bGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjUwMzAsImV4cCI6MjA3MTQ0MTAzMH0.9ZGYw5f1_HYXftiymb7pZqrbM1-VFb2nATcSgOVkTec" \
  -H "Content-Type: application/json" \
  https://nbjuhxzjgegjvigsstljy.supabase.co/functions/v1/send-reminders
```

**Expected results:**
- **Email function:** `{"success": true, "message": "Email sent successfully", "resend_id": "..."}`
- **Reminders function:** `{"success": true, "count": 0, "message": "Sent 0 reminder notifications"}`

### Step 6: Set Up Cron-job.org (24h Reminders)
1. **Go to [cron-job.org](https://cron-job.org/)**
2. **Create a free account**
3. **Add a new cron job:**
   - **Title:** `Myowntour 24h Reminders`
   - **URL:** `https://nbjuhxzjgegjvigsstljy.supabase.co/functions/v1/send-reminders`
   - **Method:** `POST`
   - **Headers:**
     - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianVoeHpqZ2VnanZpZ3N0bGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjUwMzAsImV4cCI6MjA3MTQ0MTAzMH0.9ZGYw5f1_HYXftiymb7pZqrbM1-VFb2nATcSgOVkTec`
     - `Content-Type: application/json`
   - **Schedule:** `0 9 * * *` (daily at 9 AM UTC)
4. **Test the cron job immediately**

### Step 7: Verify Domain with Resend (Production Setup)

#### **A. Add Domain to Resend**
1. **Go to [Resend Dashboard](https://resend.com/domains)**
2. **Click "Add Domain"**
3. **Enter your domain:** `myowntour.app`
4. **Click "Add"**

#### **B. Add DNS Records in Ionos**
1. **Log into your Ionos control panel**
2. **Go to "Domains & SSL" → "DNS"**
3. **Select your domain:** `myowntour.app`
4. **Add these DNS records:**

   **TXT Record for Verification:**
   ```
   Type: TXT
   Name: @ (or leave empty)
   Value: resend._domainkey.myowntour.app
   TTL: 3600
   ```

   **DKIM Record for Email Authentication:**
   ```
   Type: CNAME
   Name: resend._domainkey
   Value: resend._domainkey.resend.com
   TTL: 3600
   ```

#### **C. Verify Domain in Resend**
1. **Go back to Resend Dashboard**
2. **Click "Verify" next to your domain**
3. **Wait for verification** (5-30 minutes)
4. **Status should change to "Verified"**

#### **D. Update Edge Function for Production**
Once verified, redeploy your Edge Function to use your domain:

```bash
# Redeploy the email function with your domain
supabase functions deploy send-email
```

**Note:** The Edge Function is already configured to use `noreply@myowntour.app` - just needs to be redeployed after domain verification.

### Step 8: Test the System
```bash
# Test the Edge Function
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianVoeHpqZ2VnanZpZ3N0bGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjUwMzAsImV4cCI6MjA3MTQ0MTAzMH0.9ZGYw5f1_HYXftiymb7pZqrbM1-VFb2nATcSgOVkTec" \
  -H "Content-Type: application/json" \
  https://nbjuhxzjgegjvigsstljy.supabase.co/functions/v1/send-reminders
```

**That's it! Your notification system is now live! 🎉**

---

## 📋 Detailed Setup Instructions

### 1. Prerequisites

#### Required Software
- **Node.js** (v18+)
- **Supabase CLI** (latest)
- **Deno** (v1.40+)
- **Git** (for GitHub Actions)

#### Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh

# Windows
# Download from: https://github.com/supabase/cli/releases
```

#### Install Deno
```bash
# macOS
brew install deno

# Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows
# Download from: https://deno.land/manual/getting_started/installation
```

### 2. Database Setup

#### Step 1: Run Migration
Execute the complete migration in your Supabase SQL Editor:

```sql
-- =====================================================
-- NOTIFICATION SYSTEM MIGRATION FOR MYOWNTOUR
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

-- Create indexes
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

-- Create function to send 24h reminders
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

-- Create function to clean up old notifications
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
```

#### Step 2: Verify Database Setup
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';
```

### 3. Supabase Edge Functions Setup

#### Step 1: Login to Supabase
```bash
supabase login
```

#### Step 2: Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

#### Step 3: Deploy the Edge Function
```bash
supabase functions deploy send-reminders
```

#### Step 4: Test the Function
```bash
# Test locally
supabase functions serve send-reminders

# Test deployed function
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders
```

### 4. Cron-job.org Setup (24h Reminders)

#### Step 1: Create Cron-job.org Account
1. **Go to [cron-job.org](https://cron-job.org/)**
2. **Click "Sign Up" (free account)**
3. **Verify your email address**

#### Step 2: Create the Cron Job
1. **Click "Create cronjob"**
2. **Fill in these exact settings:**

   **Basic Settings:**
   - **Title:** `Myowntour 24h Reminders`
   - **URL:** `https://nbjuhxzjgegjvigsstljy.supabase.co/functions/v1/send-reminders`
   - **Method:** `POST`

   **Headers:**
   - **Header 1:**
     - **Name:** `Authorization`
     - **Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianVoeHpqZ2VnanZpZ3N0bGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjUwMzAsImV4cCI6MjA3MTQ0MTAzMH0.9ZGYw5f1_HYXftiymb7pZqrbM1-VFb2nATcSgOVkTec`
   
   - **Header 2:**
     - **Name:** `Content-Type`
     - **Value:** `application/json`

   **Schedule:**
   - **Schedule Type:** `Daily`
   - **Time:** `09:00` (UTC)
   - **Timezone:** `UTC`

   **Advanced Settings:**
   - **Timeout:** `30 seconds`
   - **Retry on failure:** `Yes`
   - **Max retries:** `3`

3. **Click "Create cronjob"**

#### Step 3: Test the Cron Job
1. **After creating the cron job, click "Test now"**
2. **Check the result** - should show success
3. **Look at the response** - should be: `{"success":true,"count":0,"message":"Sent 0 reminder notifications"}`
4. **Set up monitoring** (optional):
   - **Email notifications** for failures
   - **Webhook notifications** for status updates

### 5. Resend Configuration

#### Step 1: Create Resend Account
1. Go to [Resend.com](https://resend.com/)
2. Sign up for a free account (100,000 emails/month FREE!)
3. Get your API key from the dashboard
4. Note your API key (starts with `re_`)

#### Step 2: Email Templates (Already Created)

✅ **All email templates are already created in the code!**

The following templates are built into the Resend service:
- 🎯 **Welcome Emails** - Client, Guide, Tour Operator
- 📧 **Booking Confirmation** - Detailed booking information
- ⏰ **24h Reminders** - Excursion reminders
- 🔐 **Password Reset** - Secure password recovery

**No manual template creation needed!** The templates are:
- ✅ **Professional design** with gradients and icons
- ✅ **Mobile responsive** layouts
- ✅ **Role-based colors** for different user types
- ✅ **Detailed information** with booking data
#### Step 3: Configure Supabase Edge Function
Add the Resend API key to your Supabase Edge Function environment:

1. Go to your Supabase Dashboard
2. Navigate to **Settings > Edge Functions**
3. Add environment variable:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Step 4: Update Environment Variables
```env
VITE_RESEND_API_KEY=re_cj9pzt7o_K4MZfz7YUVX7QuuN1erBetue
```

### 6. Testing the System

#### Test 1: Manual Edge Function Test
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders
```

Expected response:
```json
{
  "success": true,
  "count": 5,
  "message": "Sent 5 reminder notifications",
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

#### Test 2: Create Test Booking
1. Create a booking for tomorrow
2. Check if notifications appear in the database
3. Verify email delivery

#### Test 3: Cron-job.org Test
1. Go to your cron-job.org dashboard
2. Find your "Myowntour 24h Reminders" job
3. Click "Test now" to run manually
4. Check the execution logs for success

### 7. Monitoring and Analytics

#### Database Queries for Monitoring
```sql
-- Check notification counts by type
SELECT type, COUNT(*) as count
FROM notifications
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY type;

-- Check unread notifications
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY user_id;

-- Check 24h reminder performance
SELECT 
  DATE(created_at) as date,
  COUNT(*) as reminders_sent
FROM notifications
WHERE type = 'reminder_24h'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### Edge Function Logs
```bash
# View function logs
supabase functions logs send-reminders

# View real-time logs
supabase functions logs send-reminders --follow
```

### 8. Troubleshooting

#### Common Issues

**1. Edge Function Not Deploying**
```bash
# Check if you're logged in
supabase projects list

# Check function status
supabase functions list

# Redeploy function
supabase functions deploy send-reminders --no-verify-jwt
```

**2. Database Functions Not Working**
```sql
-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';

-- Test function manually
SELECT send_24h_reminders();
```

**3. Email Not Sending**
- Check Resend configuration
- Verify template IDs match
- Check browser console for errors
- Test email templates manually

**4. Cron-job.org Failing**
- Check cron job configuration in dashboard
- Verify URL and headers are exactly correct
- Check execution logs for specific errors
- Ensure Edge Function is deployed and accessible

#### Debug Commands
```bash
# Test Edge Function locally
supabase functions serve send-reminders --no-verify-jwt

# Check Supabase connection
supabase status

# View function logs
supabase functions logs send-reminders --follow
```

### 9. Production Checklist

- [ ] Database migration executed successfully
- [ ] Edge Function deployed and tested
- [ ] Cron-job.org setup working
- [ ] Resend API key configured
- [ ] Environment variables set correctly
- [ ] Notification preferences working
- [ ] Real-time notifications working
- [ ] 24h reminders automated
- [ ] Error handling implemented
- [ ] Monitoring set up

### 10. Advanced Configuration

#### Custom Notification Times
To change reminder timing, modify the cron schedule in `.github/workflows/send-reminders.yml`:
```yaml
schedule:
  - cron: '0 9 * * *'  # 9 AM UTC daily
  - cron: '0 18 * * *' # 6 PM UTC daily (for evening reminders)
```

#### Custom Email Templates
Add new email templates in the Resend service code:
```typescript
// Add new template to notificationService.ts
private static templates: Record<string, NotificationTemplate> = {
  // ... existing templates
  custom_notification: {
    title: "Custom Title",
    message: "Custom message",
    email_subject: "Custom Subject",
    email_template: "custom_template"
  }
};
```

#### Notification Preferences
Users can customize their preferences:
```typescript
// Update user preferences
const preferences = {
  email_notifications: true,
  in_app_notifications: true,
  booking_created: true,
  booking_confirmed: true,
  booking_cancelled: false, // User disabled
  reminder_24h: true,
  checkin_success: true
}
```

---

## 🎉 You're All Set!

Your notification system is now fully operational with:

- ✅ **Automated 24h reminders** via Supabase Edge Functions
- ✅ **Real-time notifications** for all booking events
- ✅ **Email and in-app delivery** with professional templates
- ✅ **Cron-job.org automation** for reliable scheduling
- ✅ **Complete monitoring and analytics**
- ✅ **Production-ready error handling**

The system will automatically:
1. Send 24h reminders every day at 9 AM UTC
2. Notify users of booking events in real-time
3. Clean up old notifications automatically
4. Handle errors gracefully without affecting core functionality

For support or questions, check the troubleshooting section or review the logs! 🚀

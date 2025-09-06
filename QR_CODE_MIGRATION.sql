-- =====================================================
-- QR CODE MIGRATION FOR MYOWNTOUR
-- Add QR code and check-in functionality to bookings table
-- =====================================================

-- Add QR code and check-in fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS checkin_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS is_checked_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checkin_guide_id UUID REFERENCES guides(id);

-- Create index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_bookings_checkin_token ON bookings(checkin_token);
CREATE INDEX IF NOT EXISTS idx_bookings_is_checked_in ON bookings(is_checked_in);

-- Add function to generate unique checkin tokens
CREATE OR REPLACE FUNCTION generate_checkin_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a random token with booking prefix
        token := 'BOOK_' || substr(md5(random()::text), 1, 12) || '_' || extract(epoch from now())::bigint;
        
        -- Check if token already exists
        SELECT COUNT(*) INTO exists_count FROM bookings WHERE checkin_token = token;
        
        -- If token is unique, return it
        IF exists_count = 0 THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add function to validate QR code check-in
CREATE OR REPLACE FUNCTION validate_checkin(
    p_token TEXT,
    p_guide_id UUID
)
RETURNS JSON AS $$
DECLARE
    booking_record RECORD;
    result JSON;
BEGIN
    -- Find booking by token
    SELECT b.*, e.guide_id as excursion_guide_id
    INTO booking_record
    FROM bookings b
    JOIN excursions e ON b.excursion_id = e.id
    WHERE b.checkin_token = p_token;
    
    -- If booking not found
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid QR code - booking not found'
        );
    END IF;
    
    -- Check if already checked in
    IF booking_record.is_checked_in THEN
        RETURN json_build_object(
            'success', false,
            'error', 'This ticket has already been used'
        );
    END IF;
    
    -- Check if guide matches
    IF booking_record.excursion_guide_id != p_guide_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'This ticket is not for your excursion'
        );
    END IF;
    
    -- Check if booking is confirmed
    IF booking_record.status != 'confirmed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking is not confirmed'
        );
    END IF;
    
    -- All validations passed
    RETURN json_build_object(
        'success', true,
        'booking_id', booking_record.id,
        'client_name', booking_record.client_name,
        'participants_count', booking_record.participants_count,
        'excursion_title', (SELECT title FROM excursions WHERE id = booking_record.excursion_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Add function to process check-in
CREATE OR REPLACE FUNCTION process_checkin(
    p_token TEXT,
    p_guide_id UUID
)
RETURNS JSON AS $$
DECLARE
    validation_result JSON;
    booking_id UUID;
BEGIN
    -- Validate the check-in
    validation_result := validate_checkin(p_token, p_guide_id);
    
    -- If validation failed, return error
    IF (validation_result->>'success')::boolean = false THEN
        RETURN validation_result;
    END IF;
    
    -- Get booking ID from validation result
    booking_id := (validation_result->>'booking_id')::UUID;
    
    -- Update booking with check-in information
    UPDATE bookings 
    SET 
        is_checked_in = true,
        checkin_time = NOW(),
        checkin_guide_id = p_guide_id
    WHERE id = booking_id;
    
    -- Return success with booking details
    RETURN json_build_object(
        'success', true,
        'message', 'Check-in successful',
        'booking_id', booking_id,
        'checkin_time', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for check-in operations
CREATE POLICY "Guides can check-in their own excursions" ON bookings
    FOR UPDATE USING (
        checkin_guide_id IS NULL AND
        EXISTS (
            SELECT 1 FROM excursions e 
            WHERE e.id = bookings.excursion_id 
            AND e.guide_id IN (
                SELECT id FROM guides WHERE user_id = auth.uid()
            )
        )
    );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_checkin_token() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_checkin(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_checkin(TEXT, UUID) TO authenticated;

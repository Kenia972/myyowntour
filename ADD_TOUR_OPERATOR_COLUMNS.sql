-- =====================================================
-- ADD TOUR OPERATOR COLUMNS TO BOOKINGS TABLE
-- =====================================================

-- Add tour_operator_id column to track which tour operator made the booking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS tour_operator_id UUID REFERENCES tour_operators(id) ON DELETE SET NULL;

-- Add client_email column for tour operator bookings (when client_id might be null)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Add client_name column for tour operator bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Make client_id nullable since tour operators can create bookings without registered clients
ALTER TABLE bookings 
ALTER COLUMN client_id DROP NOT NULL;

-- Make slot_id nullable since tour operator bookings might not have specific slots
ALTER TABLE bookings 
ALTER COLUMN slot_id DROP NOT NULL;

-- Add index for tour operator queries
CREATE INDEX IF NOT EXISTS idx_bookings_tour_operator_id ON bookings(tour_operator_id);

-- Add index for client email queries
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email);

-- Update existing bookings to have default values
UPDATE bookings 
SET 
    tour_operator_id = NULL,
    client_email = COALESCE(client_email, ''),
    client_name = COALESCE(client_name, 'Client')
WHERE tour_operator_id IS NULL;

-- Add comment explaining the new structure
COMMENT ON COLUMN bookings.tour_operator_id IS 'ID of the tour operator who made this booking (for reseller bookings)';
COMMENT ON COLUMN bookings.client_email IS 'Email of the client (for tour operator bookings without registered profiles)';
COMMENT ON COLUMN bookings.client_name IS 'Name of the client (for tour operator bookings without registered profiles)';

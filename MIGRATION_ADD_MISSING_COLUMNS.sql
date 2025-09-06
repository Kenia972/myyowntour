-- =====================================================
-- MIGRATION: Add missing columns to availability_slots table
-- =====================================================
-- Run this in Supabase SQL Editor to fix the booking system

-- Add missing columns to availability_slots table
ALTER TABLE availability_slots 
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS max_participants INTEGER CHECK (max_participants > 0);

-- Update existing records to have max_participants = available_spots
-- (assuming current available_spots represents the maximum capacity)
UPDATE availability_slots 
SET max_participants = available_spots 
WHERE max_participants IS NULL;

-- Set default end_time for existing records (2 hours after start_time)
UPDATE availability_slots 
SET end_time = start_time + INTERVAL '2 hours'
WHERE end_time IS NULL;

-- Make max_participants NOT NULL after setting values
ALTER TABLE availability_slots 
ALTER COLUMN max_participants SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_availability_slots_max_participants ON availability_slots(max_participants);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'availability_slots' 
ORDER BY ordinal_position;

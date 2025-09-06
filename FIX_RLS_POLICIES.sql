-- =====================================================
-- FIX RLS POLICIES FOR AVAILABILITY SLOTS
-- =====================================================
-- This fixes the "new row violates row-level security policy" error

-- Drop existing policies
DROP POLICY IF EXISTS "Guides can manage own slots" ON availability_slots;
DROP POLICY IF EXISTS "Anyone can view available slots" ON availability_slots;

-- Create new, more permissive policies for availability_slots
CREATE POLICY "Guides can manage own slots" ON availability_slots FOR ALL USING (
  excursion_id IN (
    SELECT id FROM excursions 
    WHERE guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  )
);

-- Allow anyone to view available slots (needed for booking system)
CREATE POLICY "Anyone can view available slots" ON availability_slots FOR SELECT USING (true);

-- Allow guides to insert slots for their own excursions
CREATE POLICY "Guides can insert own slots" ON availability_slots FOR INSERT WITH CHECK (
  excursion_id IN (
    SELECT id FROM excursions 
    WHERE guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  )
);

-- Allow guides to update slots for their own excursions
CREATE POLICY "Guides can update own slots" ON availability_slots FOR UPDATE USING (
  excursion_id IN (
    SELECT id FROM excursions 
    WHERE guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  )
);

-- Allow guides to delete slots for their own excursions
CREATE POLICY "Guides can delete own slots" ON availability_slots FOR DELETE USING (
  excursion_id IN (
    SELECT id FROM excursions 
    WHERE guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  )
);

-- Also fix bookings policies to allow tour operators to see bookings
DROP POLICY IF EXISTS "Guides can view bookings for their excursions" ON bookings;

CREATE POLICY "Guides can view bookings for their excursions" ON bookings FOR SELECT USING (
  excursion_id IN (
    SELECT id FROM excursions 
    WHERE guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  )
);

-- Allow tour operators to view bookings they made
CREATE POLICY "Tour operators can view their bookings" ON bookings FOR SELECT USING (
  tour_operator_id IN (
    SELECT id FROM tour_operators 
    WHERE user_id = auth.uid()
  )
);

-- Allow tour operators to create bookings
CREATE POLICY "Tour operators can create bookings" ON bookings FOR INSERT WITH CHECK (
  tour_operator_id IN (
    SELECT id FROM tour_operators 
    WHERE user_id = auth.uid()
  )
);

-- Allow tour operators to update their bookings
CREATE POLICY "Tour operators can update their bookings" ON bookings FOR UPDATE USING (
  tour_operator_id IN (
    SELECT id FROM tour_operators 
    WHERE user_id = auth.uid()
  )
);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('availability_slots', 'bookings')
ORDER BY tablename, policyname;

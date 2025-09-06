-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR MYOWNTOUR
-- Based on Frontend Code Analysis
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CREATE BASE TABLES (No Dependencies)
-- =====================================================

-- Profiles table - stores user information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('client', 'guide', 'tour_operator', 'admin')) DEFAULT 'client',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE GUIDE TABLE
-- =====================================================

-- Guides table - stores guide business information
CREATE TABLE IF NOT EXISTS guides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    siret TEXT,
    description TEXT,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Martinique',
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    subscription_type TEXT DEFAULT 'basic',
    commission_rate DECIMAL(5,2) DEFAULT 65.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE TOUR OPERATOR TABLE
-- =====================================================

-- Tour operators table - stores tour operator business information
CREATE TABLE IF NOT EXISTS tour_operators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    siret TEXT,
    description TEXT,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Martinique',
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    subscription_type TEXT DEFAULT 'basic',
    commission_rate DECIMAL(5,2) DEFAULT 20.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE EXCURSIONS TABLE
-- =====================================================

-- Excursions table - stores tour information
CREATE TABLE IF NOT EXISTS excursions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    guide_id UUID REFERENCES guides(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    category TEXT CHECK (category IN ('beach', 'hiking', 'cultural', 'nautical', 'adventure', 'gastronomy')) NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0 AND duration_hours <= 24),
    max_participants INTEGER NOT NULL CHECK (max_participants > 0 AND max_participants <= 100),
    price_per_person DECIMAL(10,2) NOT NULL CHECK (price_per_person >= 0),
    included_services TEXT[] DEFAULT '{}',
    meeting_point TEXT,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5) DEFAULT 1,
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE AVAILABILITY SLOTS TABLE
-- =====================================================

-- Availability slots table - stores when tours are available
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    excursion_id UUID REFERENCES excursions(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    available_spots INTEGER NOT NULL CHECK (available_spots >= 0),
    price_override DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 6: CREATE BOOKINGS TABLE
-- =====================================================

-- Bookings table - stores tour reservations
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    excursion_id UUID REFERENCES excursions(id) ON DELETE CASCADE NOT NULL,
    slot_id UUID REFERENCES availability_slots(id) ON DELETE CASCADE NOT NULL,
    participants_count INTEGER NOT NULL CHECK (participants_count > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    commission_amount DECIMAL(10,2) DEFAULT 0 CHECK (commission_amount >= 0),
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    special_requests TEXT,
    booking_date DATE NOT NULL,
    cancellation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 7: CREATE PAYMENTS TABLE
-- =====================================================

-- Payments table - stores payment information
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    refund_amount DECIMAL(10,2) DEFAULT 0 CHECK (refund_amount >= 0),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 8: CREATE REVIEWS TABLE
-- =====================================================

-- Reviews table - stores tour reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    excursion_id UUID REFERENCES excursions(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Guides indexes
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_city ON guides(city);
CREATE INDEX IF NOT EXISTS idx_guides_verified ON guides(is_verified);

-- Tour operators indexes
CREATE INDEX IF NOT EXISTS idx_tour_operators_user_id ON tour_operators(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_operators_city ON tour_operators(city);
CREATE INDEX IF NOT EXISTS idx_tour_operators_verified ON tour_operators(is_verified);

-- Excursions indexes
CREATE INDEX IF NOT EXISTS idx_excursions_guide_id ON excursions(guide_id);
CREATE INDEX IF NOT EXISTS idx_excursions_category ON excursions(category);
CREATE INDEX IF NOT EXISTS idx_excursions_active ON excursions(is_active);
CREATE INDEX IF NOT EXISTS idx_excursions_city ON excursions(guide_id) WHERE guide_id IN (SELECT id FROM guides WHERE city = 'Martinique');

-- Availability slots indexes
CREATE INDEX IF NOT EXISTS idx_availability_slots_excursion_id ON availability_slots(excursion_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_available ON availability_slots(is_available);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_excursion_id ON bookings(excursion_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_excursion_id ON reviews(excursion_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- =====================================================
-- STEP 10: CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tour_operators_updated_at BEFORE UPDATE ON tour_operators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_excursions_updated_at BEFORE UPDATE ON excursions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 11: CREATE PROFILE CREATION TRIGGER
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name,
    last_name,
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 12: CREATE RLS POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE excursions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Guides policies
CREATE POLICY "Guides can view own profile" ON guides FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Guides can update own profile" ON guides FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Guides can insert own profile" ON guides FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone can view verified guides" ON guides FOR SELECT USING (is_verified = true);

-- Tour operators policies
CREATE POLICY "Tour operators can view own profile" ON tour_operators FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Tour operators can update own profile" ON tour_operators FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Tour operators can insert own profile" ON tour_operators FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone can view verified tour operators" ON tour_operators FOR SELECT USING (is_verified = true);

-- Excursions policies
CREATE POLICY "Guides can manage own excursions" ON excursions FOR ALL USING (
  guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid())
);
CREATE POLICY "Anyone can view active excursions" ON excursions FOR SELECT USING (is_active = true);

-- Availability slots policies
CREATE POLICY "Guides can manage own slots" ON availability_slots FOR ALL USING (
  excursion_id IN (SELECT id FROM excursions WHERE guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid()))
);
CREATE POLICY "Anyone can view available slots" ON availability_slots FOR SELECT USING (is_available = true);

-- Bookings policies
CREATE POLICY "Clients can view own bookings" ON bookings FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients can create own bookings" ON bookings FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Guides can view bookings for their excursions" ON bookings FOR SELECT USING (
  excursion_id IN (SELECT id FROM excursions WHERE guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid()))
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid())
);

-- Reviews policies
CREATE POLICY "Users can view all reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews for their bookings" ON reviews FOR INSERT WITH CHECK (
  client_id = auth.uid() AND 
  booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid())
);

-- =====================================================
-- STEP 13: CREATE BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Function to calculate commission for tour operators
CREATE OR REPLACE FUNCTION calculate_commission(booking_amount DECIMAL, commission_rate DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (booking_amount * commission_rate) / 100;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can book (no double booking)
CREATE OR REPLACE FUNCTION can_user_book(
  user_id UUID,
  slot_id UUID,
  participants INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_spots INTEGER;
  already_booked INTEGER;
BEGIN
  -- Check available spots
  SELECT available_spots INTO available_spots 
  FROM availability_slots 
  WHERE id = slot_id AND is_available = true;
  
  IF available_spots IS NULL OR available_spots < participants THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already has a booking for this slot
  SELECT COUNT(*) INTO already_booked 
  FROM bookings 
  WHERE client_id = user_id AND slot_id = slot_id;
  
  RETURN already_booked = 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 14: INSERT SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample admin user (you can modify this)
-- INSERT INTO profiles (id, email, first_name, last_name, role) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@myowntour.com', 'Admin', 'System', 'admin');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This completes the database setup!
-- Your Myowntour platform is now ready with:
-- ✅ User authentication and profiles
-- ✅ Guide and tour operator management
-- ✅ Excursion creation and management
-- ✅ Booking system with availability slots
-- ✅ Payment and review systems
-- ✅ Row Level Security (RLS) policies
-- ✅ Performance indexes
-- ✅ Business logic functions

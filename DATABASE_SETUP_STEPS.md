# 🗄️ Database Setup Steps for Myowntour

## ⚠️ Important: Follow These Steps in Order!

**DO NOT run the entire script at once** - it will cause foreign key constraint errors. Follow each step sequentially.

---

## 📋 Step 1: Enable Extensions
**Run this first in Supabase SQL Editor:**

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Click "Run" and wait for success message.**

---

## 📋 Step 2: Create Base Tables (No Dependencies)
**Run this second:**

```sql
-- =====================================================
-- PROFILES TABLE (Base table - no dependencies)
-- =====================================================
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
-- GUIDES TABLE (Depends on profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS guides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    siret TEXT,
    description TEXT,
    address TEXT,
    city TEXT DEFAULT 'Martinique',
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    subscription_type TEXT DEFAULT 'basic',
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TOUR OPERATORS TABLE (Depends on profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS tour_operators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    siret TEXT,
    description TEXT,
    address TEXT,
    city TEXT DEFAULT 'Martinique',
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    subscription_type TEXT DEFAULT 'basic',
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 3: Create Excursions Table
**Run this third:**

```sql
-- =====================================================
-- EXCURSIONS TABLE (Depends on guides)
-- =====================================================
CREATE TABLE IF NOT EXISTS excursions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    guide_id UUID REFERENCES guides(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    category TEXT CHECK (category IN ('beach', 'hiking', 'cultural', 'nautical', 'adventure', 'gastronomy')) NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    price_per_person DECIMAL(10,2) NOT NULL CHECK (price_per_person > 0),
    included_services TEXT[] DEFAULT '{}',
    meeting_point TEXT,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5) DEFAULT 1,
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 4: Create Availability Slots Table
**Run this fourth:**

```sql
-- =====================================================
-- AVAILABILITY SLOTS TABLE (Depends on excursions)
-- =====================================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    excursion_id UUID REFERENCES excursions(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    available_spots INTEGER NOT NULL CHECK (available_spots >= 0),
    price_override DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 5: Create Bookings Table
**Run this fifth:**

```sql
-- =====================================================
-- BOOKINGS TABLE (Depends on profiles, excursions, availability_slots)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    excursion_id UUID REFERENCES excursions(id) ON DELETE CASCADE NOT NULL,
    slot_id UUID REFERENCES availability_slots(id) ON DELETE CASCADE NOT NULL,
    participants_count INTEGER NOT NULL CHECK (participants_count > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    special_requests TEXT,
    booking_date DATE NOT NULL,
    cancellation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 6: Create Payments Table
**Run this sixth:**

```sql
-- =====================================================
-- PAYMENTS TABLE (Depends on bookings)
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    refund_amount DECIMAL(10,2) DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 7: Create Reviews Table
**Run this seventh:**

```sql
-- =====================================================
-- REVIEWS TABLE (Depends on bookings, profiles, excursions)
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    excursion_id UUID REFERENCES excursions(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 8: Create Indexes
**Run this eighth:**

```sql
-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_operators_user_id ON tour_operators(user_id);
CREATE INDEX IF NOT EXISTS idx_excursions_guide_id ON excursions(guide_id);
CREATE INDEX IF NOT EXISTS idx_excursions_category ON excursions(category);
CREATE INDEX IF NOT EXISTS idx_excursions_is_active ON excursions(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_slots_excursion_id ON availability_slots(excursion_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_excursion_id ON bookings(excursion_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_excursion_id ON reviews(excursion_id);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 9: Create Triggers
**Run this ninth:**

```sql
-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON guides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_operators_updated_at BEFORE UPDATE ON tour_operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_excursions_updated_at BEFORE UPDATE ON excursions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Click "Run" and wait for success message.**

---

## 📋 Step 10: Create Profile Creation Trigger
**Run this tenth:**

```sql
-- =====================================================
-- TRIGGER TO CREATE PROFILE ON USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Click "Run" and wait for success message.**

---

## 📋 Step 11: Enable Row Level Security
**Run this eleventh:**

```sql
-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE excursions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
```

**Click "Run" and wait for success message.**

---

## 📋 Step 12: Create RLS Policies
**Run this twelfth:**

```sql
-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- GUIDES POLICIES
CREATE POLICY "Guides can view their own profile" ON guides
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Guides can update their own profile" ON guides
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified guides" ON guides
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Admins can manage all guides" ON guides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- TOUR OPERATORS POLICIES
CREATE POLICY "Tour operators can view their own profile" ON tour_operators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tour operators can update their own profile" ON tour_operators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified tour operators" ON tour_operators
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Admins can manage all tour operators" ON tour_operators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- EXCURSIONS POLICIES
CREATE POLICY "Anyone can view active excursions" ON excursions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Guides can create excursions" ON excursions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM guides 
            WHERE user_id = auth.uid() AND id = guide_id
        )
    );

CREATE POLICY "Guides can update their own excursions" ON excursions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM guides 
            WHERE user_id = auth.uid() AND id = guide_id
        )
    );

CREATE POLICY "Guides can delete their own excursions" ON excursions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM guides 
            WHERE user_id = auth.uid() AND id = guide_id
        )
    );

CREATE POLICY "Admins can manage all excursions" ON excursions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- AVAILABILITY SLOTS POLICIES
CREATE POLICY "Anyone can view available slots" ON availability_slots
    FOR SELECT USING (is_available = true);

CREATE POLICY "Guides can manage slots for their excursions" ON availability_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM excursions e
            JOIN guides g ON e.guide_id = g.id
            WHERE g.user_id = auth.uid() AND e.id = excursion_id
        )
    );

-- BOOKINGS POLICIES
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Guides can view bookings for their excursions" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM excursions e
            JOIN guides g ON e.guide_id = g.id
            WHERE g.user_id = auth.uid() AND e.id = excursion_id
        )
    );

CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PAYMENTS POLICIES
CREATE POLICY "Users can view payments for their bookings" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE id = booking_id AND client_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- REVIEWS POLICIES
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = client_id);
```

**Click "Run" and wait for success message.**

---

## 📋 Step 13: Create Business Logic Functions
**Run this thirteenth:**

```sql
-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    total_amount DECIMAL,
    commission_rate DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (total_amount * commission_rate) / 100;
END;
$$ LANGUAGE plpgsql;

-- Function to check if slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
    slot_id UUID,
    participants_count INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    available_spots INTEGER;
BEGIN
    SELECT available_spots INTO available_spots
    FROM availability_slots
    WHERE id = slot_id AND is_available = true;
    
    RETURN available_spots >= participants_count;
END;
$$ LANGUAGE plpgsql;
```

**Click "Run" and wait for success message.**

---

## 📋 Step 14: Add Table Comments
**Run this fourteenth (final step):**

```sql
-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE profiles IS 'User profiles with role-based access';
COMMENT ON TABLE guides IS 'Tour guides who create excursions';
COMMENT ON TABLE tour_operators IS 'Tour operators who resell excursions';
COMMENT ON TABLE excursions IS 'Tour activities created by guides';
COMMENT ON TABLE availability_slots IS 'Available time slots for excursions';
COMMENT ON TABLE bookings IS 'Client reservations for excursions';
COMMENT ON TABLE payments IS 'Payment records for bookings';
COMMENT ON TABLE reviews IS 'Client reviews for excursions';
```

**Click "Run" and wait for success message.**

---

## 🎉 Database Setup Complete!

After running all 14 steps successfully, your database is ready! 

### ✅ What's Been Created:
- **8 tables** with proper relationships
- **14 indexes** for performance
- **6 triggers** for automatic updates
- **25+ RLS policies** for security
- **2 business logic functions**

### 🔍 Verify Setup:
1. Go to **Table Editor** in Supabase
2. You should see all 8 tables listed
3. Check that relationships are properly established

### 🚀 Next Steps:
1. Configure your `.env.local` file
2. Start your development server
3. Test user registration and login
4. Create sample data for testing

---

## ⚠️ Troubleshooting

**If you get an error:**
1. Make sure you're running steps in order
2. Check that previous steps completed successfully
3. Look for specific error messages
4. Try running the step again

**Common Issues:**
- **Foreign key constraint**: You're running steps out of order
- **Table already exists**: Skip that step and continue
- **Permission denied**: Make sure you're in the SQL Editor with proper access

---

**🎯 You're now ready to connect your frontend to Supabase!**

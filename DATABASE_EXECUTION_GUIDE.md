# 🗄️ Complete Database Setup Guide for Myowntour

## ⚠️ **IMPORTANT: This is a COMPLETE RESET of your database**

**If you have existing data, it will be lost. This guide will create a fresh, working database.**

---

## 📋 **Prerequisites**
- ✅ Supabase project created
- ✅ Access to Supabase SQL Editor
- ✅ Frontend code ready (already done!)

---

## 🚀 **Step-by-Step Execution**

### **Step 1: Clear Existing Database (Optional but Recommended)**
```sql
-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS excursions CASCADE;
DROP TABLE IF EXISTS tour_operators CASCADE;
DROP TABLE IF EXISTS guides CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_commission(DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS can_user_book(UUID, UUID, INTEGER) CASCADE;
```

**Click "Run" and wait for success.**

---

### **Step 2: Execute Complete Schema**
1. **Copy the entire content** from `COMPLETE_DATABASE_SCHEMA.sql`
2. **Paste it into Supabase SQL Editor**
3. **Click "Run"**

**This will create:**
- ✅ All 8 tables with proper structure
- ✅ All indexes for performance
- ✅ All triggers for automatic updates
- ✅ Profile creation trigger
- ✅ RLS policies for security
- ✅ Business logic functions

**Wait for completion - this may take 1-2 minutes.**

---

### **Step 3: Verify Database Creation**
```sql
-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if trigger exists
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

**You should see 8 tables and the trigger/function.**

---

### **Step 4: Test Profile Creation**
```sql
-- Test the profile creation function manually
SELECT public.handle_new_user();
```

**This should return without errors.**

---

### **Step 5: Test RLS Policies**
```sql
-- Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**All tables should show `t` (true) for rowsecurity.**

---

## 🧪 **Testing the Setup**

### **Test 1: Create a Test User Profile**
```sql
-- Insert a test profile (replace with your actual user ID)
INSERT INTO profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role
) VALUES (
    'your-user-id-here',  -- Replace with actual UUID
    'test@example.com',
    'Test',
    'User',
    'guide'
);
```

### **Test 2: Create a Test Guide Profile**
```sql
-- Insert a test guide profile
INSERT INTO guides (
    user_id,
    company_name,
    city,
    is_verified
) VALUES (
    'your-user-id-here',  -- Same UUID as above
    'Test Guide Company',
    'Martinique',
    true
);
```

### **Test 3: Create a Test Excursion**
```sql
-- Insert a test excursion
INSERT INTO excursions (
    guide_id,
    title,
    description,
    short_description,
    category,
    duration_hours,
    max_participants,
    price_per_person,
    included_services,
    meeting_point,
    difficulty_level,
    images
) VALUES (
    (SELECT id FROM guides WHERE user_id = 'your-user-id-here'),
    'Test Beach Tour',
    'A beautiful beach tour in Martinique',
    'Beach adventure',
    'beach',
    4,
    8,
    50.00,
    ARRAY['Transport', 'Guide', 'Equipment'],
    'Fort-de-France Port',
    1,
    ARRAY['https://example.com/image1.jpg']
);
```

---

## 🔧 **Troubleshooting**

### **If You Get Errors:**

**Error: "relation already exists"**
- Run Step 1 (Clear Existing Database) first

**Error: "function already exists"**
- The DROP statements in Step 1 should handle this

**Error: "trigger already exists"**
- The DROP statements in Step 1 should handle this

**Error: "permission denied"**
- Make sure you're using the correct database role (postgres)

---

## ✅ **What This Setup Provides**

1. **🔐 User Authentication System**
   - Automatic profile creation on signup
   - Role-based access control
   - Secure session management

2. **👥 Multi-Role User Management**
   - Clients (travelers)
   - Guides (tour providers)
   - Tour Operators (resellers)
   - Admins (platform managers)

3. **🏝️ Tour Management**
   - Create/edit/delete excursions
   - Set availability slots
   - Manage pricing and capacity

4. **📅 Booking System**
   - Real-time availability checking
   - Secure booking process
   - Commission calculation

5. **💰 Payment & Reviews**
   - Payment tracking
   - Review system
   - Rating management

6. **🛡️ Security Features**
   - Row Level Security (RLS)
   - User data isolation
   - Secure API access

---

## 🎯 **Next Steps After Database Setup**

1. **Test user registration** in your frontend
2. **Test guide profile creation**
3. **Test excursion creation**
4. **Verify all forms work correctly**

---

## 📞 **Need Help?**

If you encounter any errors:
1. **Copy the exact error message**
2. **Check which step failed**
3. **Verify your Supabase project settings**
4. **Ensure you have proper permissions**

---

**🎉 Your Myowntour database is now ready for production use!**

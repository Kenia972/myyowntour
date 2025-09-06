# ✅ Myowntour Setup Checklist

## 🚀 Quick Setup (Follow in Order)

### 1. Environment Setup
- [ ] Node.js 18+ installed
- [ ] Project cloned and `npm install` run
- [ ] `.env.local` file created with Supabase credentials

### 2. Supabase Project
- [ ] Project created at [supabase.com](https://supabase.com)
- [ ] Project URL copied from Settings → API
- [ ] Anon key copied from Settings → API

### 3. Database Setup (CRITICAL - Follow DATABASE_SETUP_STEPS.md)
- [ ] **Step 1**: Enable extensions ✅
- [ ] **Step 2**: Create base tables ✅
- [ ] **Step 3**: Create excursions table ✅
- [ ] **Step 4**: Create availability slots table ✅
- [ ] **Step 5**: Create bookings table ✅
- [ ] **Step 6**: Create payments table ✅
- [ ] **Step 7**: Create reviews table ✅
- [ ] **Step 8**: Create indexes ✅
- [ ] **Step 9**: Create triggers ✅
- [ ] **Step 10**: Create profile creation trigger ✅
- [ ] **Step 11**: Enable RLS ✅
- [ ] **Step 12**: Create RLS policies ✅
- [ ] **Step 13**: Create business logic functions ✅
- [ ] **Step 14**: Add table comments ✅

### 4. Supabase Authentication
- [ ] Site URL set to `http://localhost:5173`
- [ ] Redirect URLs added:
  - [ ] `http://localhost:5173/**`
  - [ ] `http://localhost:3000/**`

### 5. Test Connection
- [ ] Development server started (`npm run dev`)
- [ ] Website opens at `http://localhost:5173`
- [ ] Supabase connection test shows "Connected" ✅
- [ ] No console errors

### 6. Test Features
- [ ] User registration works
- [ ] User login works
- [ ] Role-based dashboard access works
- [ ] Database tables visible in Supabase

---

## 🔍 Verification Steps

### Database Tables (Check in Supabase Table Editor)
- [ ] `profiles` table exists
- [ ] `guides` table exists
- [ ] `tour_operators` table exists
- [ ] `excursions` table exists
- [ ] `availability_slots` table exists
- [ ] `bookings` table exists
- [ ] `payments` table exists
- [ ] `reviews` table exists

### Authentication (Check in Supabase Auth)
- [ ] Email auth enabled
- [ ] Confirm email disabled (for development)
- [ ] RLS policies active

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Supabase not configured" | Check `.env.local` file exists and restart server |
| "Table doesn't exist" | Follow DATABASE_SETUP_STEPS.md completely |
| "Foreign key constraint" | Run database steps in order |
| "RLS policy violation" | Check user role and authentication |
| "Connection failed" | Verify Supabase URL and anon key |

---

## 🎯 What You Should See

### After Database Setup
- 8 tables in Supabase Table Editor
- 14+ indexes for performance
- 25+ RLS policies for security
- Automatic profile creation on signup

### After Starting Website
- Landing page loads without errors
- Supabase connection test shows green ✅
- Authentication modal opens
- User registration works
- Role-based dashboards accessible

---

## 🚀 Next Steps After Setup

1. **Create Test Users**
   - Register as a client
   - Register as a guide
   - Register as a tour operator

2. **Test Real-time Features**
   - Open multiple browser tabs
   - Make changes in one tab
   - Verify updates in other tabs

3. **Add Sample Data**
   - Create sample excursions
   - Add availability slots
   - Test booking flow

---

## 📞 Need Help?

1. **Check this checklist** - Make sure all steps are complete
2. **Review DATABASE_SETUP_STEPS.md** - Follow the detailed guide
3. **Check browser console** - Look for error messages
4. **Verify Supabase dashboard** - Check tables and policies

---

**🎉 When all checkboxes are green, your Myowntour website is ready to use!**

# 🚀 Supabase Integration Setup Guide for Myowntour

## 📋 Prerequisites
- ✅ Supabase project created
- ✅ `.env.local` file with your Supabase credentials
- ✅ Frontend code ready (already done!)

## 🔧 Step 1: Database Setup

### 1.1 Run the Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content of `supabase-database-setup.sql`
4. Click **Run** to execute all the SQL commands

This will create:
- ✅ All necessary tables (profiles, guides, tour_operators, excursions, etc.)
- ✅ Proper indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic profile creation
- ✅ Functions for business logic

### 1.2 Verify Tables Created
Go to **Table Editor** and verify these tables exist:
- `profiles`
- `guides` 
- `tour_operators`
- `excursions`
- `availability_slots`
- `bookings`
- `payments`
- `reviews`

## 🔐 Step 2: Authentication Setup

### 2.1 Configure Auth Settings
1. Go to **Authentication > Settings**
2. Set **Site URL** to your frontend URL (e.g., `http://localhost:5173`)
3. Add **Redirect URLs**:
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
   - Your production URL when ready

### 2.2 Email Templates (Optional)
1. Go to **Authentication > Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Magic link
   - Change email address
   - Reset password

## 🛡️ Step 3: Row Level Security (RLS)

The SQL script already sets up RLS policies, but verify they're working:

### 3.1 Test RLS Policies
1. Go to **Authentication > Policies**
2. Verify policies are created for each table
3. Test with different user roles

## 📱 Step 4: Frontend Configuration

### 4.1 Environment Variables
Your `.env.local` should contain:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4.2 Test Connection
1. Start your development server: `npm run dev`
2. Open browser console
3. Look for Supabase connection logs
4. Try to sign up a new user

## 🧪 Step 5: Testing the Integration

### 5.1 Test User Registration
1. Go to your website
2. Click "Je suis un voyageur" (or any role)
3. Fill out the signup form
4. Check if user is created in Supabase

### 5.2 Test Authentication
1. Sign out
2. Sign in with the same credentials
3. Verify you're redirected to the correct dashboard

### 5.3 Test Real-time Features
1. Open multiple browser tabs
2. Make changes in one tab
3. Verify changes appear in real-time in other tabs

## 🔍 Step 6: Troubleshooting

### Common Issues & Solutions

#### Issue: "Supabase not configured"
**Solution**: Check your `.env.local` file and restart the dev server

#### Issue: "Table doesn't exist"
**Solution**: Run the database setup SQL script again

#### Issue: "RLS policy violation"
**Solution**: Check if the user has the correct role and permissions

#### Issue: "Authentication failed"
**Solution**: Verify your Supabase URL and anon key are correct

### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check Supabase logs in dashboard
4. Test database queries in SQL Editor

## 🚀 Step 7: Production Deployment

### 7.1 Update Environment Variables
```bash
# Production .env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 7.2 Update Supabase Settings
1. Update Site URL in Authentication settings
2. Add production redirect URLs
3. Configure custom domain if needed

## 📊 Step 8: Monitoring & Analytics

### 8.1 Supabase Dashboard
Monitor:
- Database performance
- Authentication logs
- Real-time connections
- Storage usage

### 8.2 Application Logs
Check browser console for:
- Connection status
- Authentication events
- Real-time updates
- Error messages

## 🎯 What's Now Working

After completing this setup:

✅ **Authentication System**
- User registration with roles
- Login/logout functionality
- Password reset
- Session management

✅ **Real-time Features**
- Live updates across tabs
- Real-time notifications
- Instant data synchronization

✅ **Role-based Access**
- Client dashboard
- Guide dashboard  
- Tour operator dashboard
- Admin dashboard

✅ **Database Operations**
- CRUD operations for all entities
- Automatic profile creation
- Secure data access with RLS
- Optimized queries with indexes

## 🔄 Next Steps

1. **Test all user flows** thoroughly
2. **Add sample data** for testing
3. **Configure email service** (EmailJS)
4. **Set up file uploads** for images
5. **Add payment integration** (Stripe)
6. **Implement advanced features** (search, filters, etc.)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for error messages
4. Verify all environment variables are set correctly

---

**🎉 Congratulations! Your Myowntour website is now fully connected to Supabase and ready for real-time functionality!**

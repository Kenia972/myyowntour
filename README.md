# 🏝️ Myowntour - Martinique Tour Booking Platform

A modern, real-time tour booking platform connecting travelers with local guides and tour operators in Martinique.

## ✨ Features

- **🔐 Multi-role Authentication**: Clients, Guides, Tour Operators, and Admins
- **📱 Real-time Updates**: Live notifications and data synchronization
- **🎯 Role-based Dashboards**: Customized interfaces for each user type
- **📊 Commission Management**: Automated 15% commission for tour operators
- **🛡️ Security**: Row Level Security (RLS) and secure authentication
- **📱 Responsive Design**: Works on all devices with modern UI/UX

## 🚀 Quick Start

### 🧪 Quick Testing (5 minutes)
Want to test immediately? Follow these steps:

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# 3. Follow DATABASE_SETUP_STEPS.md (14 steps)

# 4. Start server
npm run dev

# 5. Open http://localhost:5173 and test!
```

**📋 Full testing guide below** - includes user registration, dashboards, real-time features, and troubleshooting.

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd myowntour
```

### 2. Install Dependencies

```bash
npm install
```



### 6. Start Development Server

```bash
npm run dev
```

Your website will be available at: `http://localhost:5173`

## 🧪 Testing Guide

### 🎯 What to Test First
1. **Landing Page**: Verify it loads without errors
2. **User Registration**: Test creating accounts for each role
3. **Authentication**: Test login/logout for each user type
4. **Dashboards**: Verify role-based access works correctly
5. **Real-time Features**: Test live updates between browser tabs

### 🚨 Common Testing Issues & Solutions
- **"Supabase not configured"** → Check `.env.local` file
- **"Table doesn't exist"** → Follow `DATABASE_SETUP_STEPS.md`
- **"Authentication failed"** → Verify Supabase settings
- **"RLS policy violation"** → Check user role in database

**💡 Pro tip**: Use the testing checklist below for systematic verification.

### 🚀 Initial Setup Testing

#### 1. Verify Database Connection
1. Open browser console
2. Check for any Supabase connection errors
3. Verify `.env.local` file is properly configured

#### 2. Test Basic Navigation
1. Visit `http://localhost:5173`
2. Verify landing page loads without errors
3. Check all navigation elements are visible

### 👥 User Registration Testing

#### Test Client Registration
1. Click "Je suis un voyageur" button
2. Fill out registration form:
   - Email: `testclient@example.com`
   - Password: `test123456`
   - First Name: `Test`
   - Last Name: `Client`
   - Phone: `+1234567890`
3. Submit and verify successful registration
4. Check Supabase dashboard for new user in `profiles` table

#### Test Guide Registration
1. Click "Je suis un guide" button
2. Fill out registration form:
   - Email: `testguide@example.com`
   - Password: `test123456`
   - First Name: `Test`
   - Last Name: `Guide`
   - Phone: `+1234567890`
   - Specialization: `Adventure`
3. Submit and verify successful registration
4. Check `guides` table in Supabase

#### Test Tour Operator Registration
1. Click "Je suis un tour opérateur" button
2. Fill out registration form:
   - Email: `testoperator@example.com`
   - Password: `test123456`
   - Company Name: `Test Tours`
   - First Name: `Test`
   - Last Name: `Operator`
   - Phone: `+1234567890`
3. Submit and verify successful registration
4. Check `tour_operators` table in Supabase

### 🔐 Authentication Testing

#### Test Login/Logout
1. Sign out if currently signed in
2. Sign in with registered credentials
3. Verify redirect to correct dashboard
4. Test logout functionality
5. Verify redirect to landing page

#### Test Role-based Access
1. **Client**: Should see client dashboard with booking options
2. **Guide**: Should see guide dashboard with excursion management
3. **Tour Operator**: Should see operator dashboard with resale options
4. **Admin**: Access via `?admin=myowntour2025` should show admin dashboard

### 📱 Dashboard Functionality Testing

#### Client Dashboard
1. Browse available excursions
2. Test excursion filtering and search
3. Verify excursion details display correctly
4. Test booking flow (if payment integration is ready)

#### Guide Dashboard
1. Create new excursion:
   - Title: `Test Adventure Tour`
   - Description: `Amazing test tour`
   - Price: `50`
   - Duration: `2 hours`
   - Max Participants: `10`
2. Verify excursion appears in excursions list
3. Test editing excursion details
4. Test deleting excursions

#### Tour Operator Dashboard
1. Browse available excursions for resale
2. Test commission calculation (should show 15% markup)
3. Verify resale pricing display

#### Admin Dashboard
1. Access via `?admin=myowntour2025`
2. Verify user management interface
3. Check platform statistics
4. Test user verification features

### 🔄 Real-time Testing

#### Test Live Updates
1. Open application in two browser tabs
2. In one tab, create/edit an excursion (as guide)
3. In second tab, verify changes appear automatically
4. Test booking updates in real-time

#### Test Notifications
1. Create a booking (if payment system is ready)
2. Verify real-time notification appears
3. Check dashboard updates immediately

### 💳 Payment Testing (When Available)

#### Test Booking Flow
1. Select an excursion as a client
2. Complete booking form
3. Test payment integration
4. Verify booking confirmation
5. Check database for new booking record

#### Test Commission Calculations
1. Verify guide receives 10% commission
2. Verify tour operator receives 15% commission
3. Check financial records in database

### 🐛 Debugging and Troubleshooting

#### Common Testing Issues

**"Supabase not configured"**
- Check `.env.local` file exists and has correct values
- Restart development server after environment changes
- Verify Supabase project is active

**"Table doesn't exist"**
- Follow `DATABASE_SETUP_STEPS.md` completely
- Check Supabase Table Editor for missing tables
- Verify all SQL scripts executed successfully

**"Authentication failed"**
- Check browser console for error messages
- Verify Supabase URL and anon key in `.env.local`
- Check Supabase Authentication settings
- Ensure redirect URLs are configured correctly

**"RLS policy violation"**
- Verify user has correct role in database
- Check Row Level Security policies are active
- Ensure user is properly authenticated
- Check user profile in `profiles` table

#### Debug Steps

1. **Browser Console**: Check for JavaScript errors
2. **Network Tab**: Verify Supabase API calls
3. **Supabase Logs**: Check dashboard for backend errors
4. **Database Queries**: Test in Supabase SQL Editor
5. **Environment Variables**: Verify `.env.local` configuration

### 📊 Testing Checklist

#### ✅ Setup Verification
- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with correct values
- [ ] Database setup completed (`DATABASE_SETUP_STEPS.md`)
- [ ] Supabase authentication configured
- [ ] Development server running (`npm run dev`)

#### ✅ Core Functionality
- [ ] Landing page loads without errors
- [ ] User registration works for all roles
- [ ] User authentication and login works
- [ ] Role-based dashboards display correctly
- [ ] Navigation between pages works
- [ ] Real-time updates function properly

#### ✅ User Management
- [ ] Client registration and dashboard
- [ ] Guide registration and dashboard
- [ ] Tour Operator registration and dashboard
- [ ] Admin access and dashboard
- [ ] User profile management
- [ ] Logout functionality

#### ✅ Data Operations
- [ ] Excursion creation and management
- [ ] Booking system (if available)
- [ ] Commission calculations
- [ ] Real-time data synchronization
- [ ] Database operations work correctly

## 🗄️ Database Schema

The platform includes these main entities:

- **👥 Profiles**: User accounts with role-based access
- **🏃 Guides**: Tour guides who create excursions
- **🏢 Tour Operators**: Companies that resell excursions
- **🗺️ Excursions**: Tour activities with availability slots
- **📅 Bookings**: Client reservations and payments
- **⭐ Reviews**: Client feedback and ratings

## 🔐 User Roles & Access

### 👤 Client (Traveler)
- Browse and book excursions
- View booking history
- Leave reviews
- Manage profile

### 🏃 Guide
- Create and manage excursions
- Set availability and pricing
- View bookings and manage participants
- Earn 10% commission

### 🏢 Tour Operator
- Resell guide excursions
- Earn 15% commission
- Manage client relationships
- Access to exclusive deals

### 👑 Admin (Secret Access)
- **URL**: `?admin=myowntour2025`
- Full platform management
- User verification
- Analytics and reporting

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Role-based dashboards
│   └── LandingPage.tsx # Main landing page
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
├── lib/                # Library configurations
│   └── supabase.ts     # Supabase client
├── services/           # API services
└── main.tsx           # App entry point
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ |

## 🚀 Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Deploy to Your Hosting Service

- **Vercel**: Connect GitHub repo and deploy
- **Netlify**: Drag and drop `dist` folder
- **Firebase**: Use Firebase Hosting
- **Custom Server**: Upload `dist` contents

### 3. Update Supabase Settings

1. Go to **Authentication** → **Settings**
2. Update **Site URL** to your production domain
3. Add production redirect URLs

## 📱 Features in Detail

### Real-time Updates
- Live booking notifications
- Instant excursion availability updates
- Real-time chat (future feature)
- Live dashboard updates

### Security Features
- Row Level Security (RLS)
- JWT authentication
- Role-based access control
- Secure API endpoints

### Performance
- Optimized database queries
- Proper indexing
- Efficient data fetching
- Responsive UI components



## 📞 Support

### Getting Help

1. **Check this README** for common solutions
2. **Review Supabase documentation** for backend issues
3. **Check browser console** for frontend errors
4. **Verify database setup** using `DATABASE_SETUP_STEPS.md`
5. **Follow testing checklist** above for systematic verification

### Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License


## 🎯 Project Status

- ✅ **Frontend**: Complete with modern UI/UX
- ✅ **Backend**: Supabase integration ready
- ✅ **Database**: Schema and policies configured
- ✅ **Authentication**: Multi-role system working
- 🔄 **Real-time**: Basic implementation complete
- 🚧 **Payment**: Integration planned
- 🚧 **Mobile**: App development planned

---

**🎉 Welcome to Myowntour - Your gateway to authentic Martinique experiences!**

*Built with ❤️ for the Martinique tourism community*

---

## 🚀 Quick Commands Reference

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
# 1. Follow DATABASE_SETUP_STEPS.md
# 2. Open http://localhost:5173
# 3. Test user registration for each role
# 4. Verify dashboards and real-time features

# Troubleshooting
# Check .env.local, browser console, and Supabase dashboard
```

**📋 Quick Testing Command:**
```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your Supabase credentials

# 3. Follow DATABASE_SETUP_STEPS.md

# 4. Start development server
npm run dev

# 5. Open http://localhost:5173 and follow testing guide above
```

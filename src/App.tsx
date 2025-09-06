import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { ClientDashboard } from './components/dashboard/ClientDashboard';
import { GuideDashboard } from './components/dashboard/GuideDashboard';
import { TourOperatorDashboard } from './components/dashboard/TourOperatorDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ClientConfirmationPage } from './components/client/ClientConfirmationPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  return (
    <MainAppContent />
  );
}

function MainAppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'signin' | 'signup';
    role?: 'client' | 'guide' | 'tour_operator';
  }>({
    isOpen: false,
    mode: 'signin'
  });

  // Debug logging
  console.log('🔍 App Debug:', { user, profile, loading, showAdminLogin });

  const handleOpenAuth = (mode: 'signin' | 'signup', role?: 'client' | 'guide' | 'tour_operator') => {
    setAuthModal({ isOpen: true, mode, role });
  };

  const handleCloseAuth = () => {
    setAuthModal({ isOpen: false, mode: 'signin' });
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Détecter l'URL secrète admin
  React.useEffect(() => {
    console.log('🔍 Checking for admin access...');
    const urlParams = new URLSearchParams(window.location.search);
    const adminAccess = urlParams.get('admin');
    
    console.log('🔍 Admin access parameter:', adminAccess);
    
    // URL secrète : ?admin=myowntour2025
    if (adminAccess === 'myowntour2025') {
      console.log('🔍 Admin access detected! Setting showAdminLogin to true');
      setShowAdminLogin(true);
      // Nettoyer l'URL pour la sécurité
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🔍 URL cleaned for security');
    } else {
      console.log('🔍 No admin access detected or invalid parameter');
    }
  }, []);

  // Afficher la page de connexion admin secrète
  if (showAdminLogin && !user) {
    console.log('🔍 Showing admin login page');
    return (
      <AdminLoginPage 
        onAuthSuccess={() => {
          console.log('🔍 Admin login successful, hiding admin login page');
          setShowAdminLogin(false);
        }}
        onBack={() => {
          console.log('🔍 Admin login cancelled, returning to landing page');
          setShowAdminLogin(false);
        }}
      />
    );
  }

  // Show loading state
  if (loading) {
    console.log('🔍 Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher le bon dashboard
  if (user && profile) {
    console.log('🔍 User authenticated, showing dashboard for role:', profile.role);
    if (profile.role === 'admin') {
      return <AdminDashboard onLogout={handleLogout} />;
    } else if (profile.role === 'guide') {
      return <GuideDashboard onLogout={handleLogout} />;
    } else if (profile.role === 'tour_operator') {
      return <TourOperatorDashboard onLogout={handleLogout} />;
    } else {
      return <ClientDashboard onLogout={handleLogout} />;
    }
  }

  // Afficher la page d'accueil par défaut (quand pas connecté)
  console.log('🔍 No user authenticated, showing landing page');
  return (
    <>
      <LandingPage onOpenAuth={handleOpenAuth} />
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={handleCloseAuth}
        defaultMode={authModal.mode}
        defaultRole={authModal.role}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/confirm-booking/:bookingId" element={<ClientConfirmationPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, isSupabaseConfigured } from '../lib/supabase';
import { profileService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, userData: {
    first_name: string;
    last_name: string;
    role?: 'client' | 'guide' | 'tour_operator';
  }) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: string | null }>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isClient: boolean;
  isGuide: boolean;
  isTourOperator: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthContext: Initializing authentication...');
        
        if (!isSupabaseConfigured() || !supabase) {
          console.warn('❌ AuthContext: Supabase not configured');
          setUser(null);
          setProfile(null);
          setSession(null);
          setLoading(false);
          return;
        }

        console.log('✅ AuthContext: Supabase configured, getting initial session...');

        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('🔍 AuthContext: Initial session:', initialSession);
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          console.log('🔍 AuthContext: User found in session, getting profile...');
          await handleUserProfile(initialSession.user);
        } else {
          console.log('🔍 AuthContext: No user in session');
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔍 AuthContext: Auth state changed:', event, session?.user?.id);
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              await handleUserProfile(session.user);
            } else {
              setProfile(null);
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('❌ AuthContext: Error initializing auth:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
        console.log('🔍 AuthContext: Initialization complete, loading:', false);
      }
    };

    initializeAuth();
  }, []);

  const handleUserProfile = async (user: User) => {
    try {
      if (!supabase) {
        // Create default profile if Supabase is not configured
        const userData = user.user_metadata || {};
        setProfile({
          id: user.id,
          email: user.email || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          role: userData.role || 'client',
          phone: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }

      // Try to get existing profile
      const response = await profileService.getCurrentProfile();
      
      if (response.error) {
        // If profile doesn't exist, create it
        if (response.error.includes('Utilisateur non connecté') || response.error.includes('not found')) {
          const userData = user.user_metadata || {};
          
          const newProfile = {
            id: user.id,
            email: user.email || '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: userData.role || 'client'
          };

          const createResponse = await profileService.updateProfile(newProfile);
          
          if (createResponse.data) {
            setProfile(createResponse.data);
          } else {
            // Fallback to default profile
            setProfile({
              id: user.id,
              email: user.email || '',
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              role: userData.role || 'client',
              phone: null,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } else {
          // Other error, use default profile
          const userData = user.user_metadata || {};
          setProfile({
            id: user.id,
            email: user.email || '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            role: userData.role || 'client',
            phone: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } else if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error handling user profile:', error);
      // Create default profile in case of error
      const userData = user.user_metadata || {};
      setProfile({
        id: user.id,
        email: user.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role || 'client',
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  const signUp = async (email: string, password: string, userData: {
    first_name: string;
    last_name: string;
    role?: 'client' | 'guide' | 'tour_operator';
  }) => {
    setError(null);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: userData
        }
      });
      
      if (error) {
        setError(error.message);
      }
      
      return { data, error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setError(error.message);
      }
      
      return { data, error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      if (!supabase) {
        setUser(null);
        setProfile(null);
        setSession(null);
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) return { error: new Error('No user logged in') };

      const response = await profileService.updateProfile(updates);
      
      if (response.data) {
        setProfile(response.data);
      }
      
      return response;
    } catch (error) {
      return { data: null, error };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const response = await profileService.getCurrentProfile();
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    isClient: profile?.role === 'client',
    isGuide: profile?.role === 'guide',
    isTourOperator: profile?.role === 'tour_operator',
    isAdmin: profile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

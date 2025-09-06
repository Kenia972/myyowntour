import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, isSupabaseConfigured } from '../lib/supabase';
import { profileService } from '../services/dataService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured() || !supabase) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await handleUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    if (!supabase) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await handleUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
        setLoading(false);
        return;
      }

      // Try to get existing profile using the data service
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
    } finally {
      setLoading(false);
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
          emailRedirectTo: undefined, // No email redirect
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
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setProfile(null);
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

  return {
    user,
    profile,
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
}
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { 
  Profile, 
  Guide, 
  TourOperator, 
  Excursion, 
  AvailabilitySlot, 
  Booking, 
  Payment, 
  Review 
} from '../lib/supabase';
import { NotificationService } from './notificationService';

// Types for API responses
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: string | null;
  loading: boolean;
}

// Generic error handler
const handleError = (error: any, context: string): string => {
  console.error(`Error in ${context}:`, error);
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return `Une erreur est survenue lors de ${context}`;
};

// Check if Supabase is configured
const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Supabase not configured, using mock data');
    return false;
  }
  return true;
};

// ===== PROFILE SERVICES =====
export const profileService = {
  // Get current user profile
  async getCurrentProfile(): Promise<ApiResponse<Profile>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'récupération du profil'), loading: false };
    }
  },

  // Update profile
  async updateProfile(updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      const { data, error } = await supabase!
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du profil'), loading: false };
    }
  },

  // Get profile by ID
  async getProfileById(id: string): Promise<ApiResponse<Profile>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'récupération du profil'), loading: false };
    }
  }
};

// ===== GUIDE SERVICES =====
export const guideService = {
  // Get current user's guide profile
  async getCurrentGuideProfile(): Promise<ApiResponse<Guide>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Get all guide profiles for this user (handle duplicates)
      const { data: guides, error } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching guide profiles:', error);
        throw error;
      }

      // If multiple profiles exist, use the most recent one
      if (guides && guides.length > 0) {
        console.log(`Found ${guides.length} guide profiles, using the most recent one`);
        return { data: guides[0], error: null, loading: false };
      }

      // If no guide profile exists, create one automatically
        console.log('🔧 Creating guide profile for user:', user.id);
        
        // Get user profile to get name
        const { data: profile } = await supabase!
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const companyName = profile ? 
          `${profile.first_name || 'Guide'} ${profile.last_name || 'Local'}` : 
          'Guide Local';

        // Create guide profile
        const { data: newGuide, error: createError } = await supabase!
          .from('guides')
          .insert({
            user_id: user.id,
            company_name: companyName,
            city: 'Martinique',
            is_verified: true,
            subscription_type: 'basic',
            commission_rate: 65.0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating guide profile:', createError);
          throw createError;
        }

      return { data: newGuide, error: null, loading: false };
    } catch (error) {
      console.error('Guide profile error:', error);
      return { data: null, error: handleError(error, 'récupération du profil guide'), loading: false };
    }
  },

  // Update guide profile
  async updateGuideProfile(updates: Partial<Guide>): Promise<ApiResponse<Guide>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      const { data: guides, error } = await supabase!
        .from('guides')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const data = guides && guides.length > 0 ? guides[0] : null;

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du profil guide'), loading: false };
    }
  },

  // Get all verified guides
  async getVerifiedGuides(): Promise<PaginatedResponse<Guide>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('guides')
        .select('*')
        .eq('is_verified', true)
        .order('company_name');

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des guides'), loading: false };
    }
  }
};

// ===== TOUR OPERATOR SERVICES =====
export const tourOperatorService = {
  // Get current user's tour operator profile
  async getCurrentTourOperatorProfile(): Promise<ApiResponse<TourOperator>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Get all tour operator profiles for this user (handle duplicates)
      const { data: operators, error } = await supabase!
        .from('tour_operators')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tour operator profiles:', error);
        throw error;
      }

      // If multiple profiles exist, use the most recent one
      if (operators && operators.length > 0) {
        console.log(`Found ${operators.length} tour operator profiles, using the most recent one`);
        return { data: operators[0], error: null, loading: false };
      }

      // If no tour operator profile exists, create one automatically
        console.log('🔧 Creating tour operator profile for user:', user.id);
        
        // Get user profile to get name
        const { data: profile } = await supabase!
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const companyName = profile ? 
          `${profile.first_name || 'Agence'} ${profile.last_name || 'de Voyage'}` : 
          'Agence de Voyage';

        // Create tour operator profile
        const { data: newOperator, error: createError } = await supabase!
          .from('tour_operators')
          .insert({
            user_id: user.id,
            company_name: companyName,
            city: 'Martinique',
            is_verified: true,
            subscription_type: 'basic',
            commission_rate: 20.0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating tour operator profile:', createError);
          throw createError;
        }

      return { data: newOperator, error: null, loading: false };
    } catch (error) {
      console.error('Tour operator profile error:', error);
      return { data: null, error: handleError(error, 'récupération du profil tour-opérateur'), loading: false };
    }
  },

  // Update tour operator profile
  async updateTourOperatorProfile(updates: Partial<TourOperator>): Promise<ApiResponse<TourOperator>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      const { data, error } = await supabase!
        .from('tour_operators')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du profil tour-opérateur'), loading: false };
    }
  }
};

// ===== EXCURSION SERVICES =====
export const excursionService = {
  // Get all active excursions
  async getActiveExcursions(limit?: number): Promise<PaginatedResponse<Excursion>> {
    try {
      if (!checkSupabaseConfig()) {
        // Return mock data if Supabase is not configured
        const mockExcursions = [
          {
            id: '1',
            guide_id: '1',
            title: 'Découverte de la Martinique',
            description: 'Visite guidée des plus beaux sites',
            category: 'cultural',
            duration_hours: 4,
            max_participants: 10,
            price_per_person: 50,
            included_services: ['Transport', 'Guide'],
            difficulty_level: 2,
            images: ['https://example.com/image1.jpg'],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            guide: {
              company_name: 'Guide Local',
              is_verified: true,
              user_id: '1'
            }
          }
        ];
        return { data: mockExcursions, count: mockExcursions.length, error: null, loading: false };
      }

      let query = supabase!
        .from('excursions')
        .select(`
          *,
          guide:guides(
            company_name,
            is_verified,
            user_id
          )
        `)
        .eq('is_active', true)
        .eq('guides.is_verified', true)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des excursions'), loading: false };
    }
  },

  // Get excursions by guide
  async getExcursionsByGuide(guideId: string): Promise<PaginatedResponse<Excursion>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('excursions')
        .select('*')
        .eq('guide_id', guideId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des excursions du guide'), loading: false };
    }
  },

  // Get current guide's excursions
  async getCurrentGuideExcursions(): Promise<PaginatedResponse<Excursion>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: [], count: 0, error: 'Utilisateur non connecté', loading: false };
      }

      // Get guide ID first
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        throw guideError;
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;

      if (!guide) {
        console.warn('⚠️ Could not get guide profile, showing all excursions for now');
        // Fallback: get all excursions
        const { data: excursions, error } = await supabase!
          .from('excursions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { data: excursions || [], count: excursions?.length || 0, error: null, loading: false };
      }

      // Get excursions for this guide
      const { data, error } = await supabase!
        .from('excursions')
        .select('*')
        .eq('guide_id', guide.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des excursions du guide'), loading: false };
    }
  },

  // Create new excursion
  async createExcursion(excursionData: Omit<Excursion, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Excursion>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Get guide ID for current user (create profile if needed) - use the same approach as GuideDashboard
      let { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        return { data: null, error: 'Erreur lors de la récupération du profil guide', loading: false };
      }

      let guide = guides && guides.length > 0 ? guides[0] : null;

      if (!guide) {
        console.log('🔧 Creating guide profile for excursion creation');
        
        // Get user profile to get name
        const { data: profile } = await supabase!
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const companyName = profile ? 
          `${profile.first_name || 'Guide'} ${profile.last_name || 'Local'}` : 
          'Guide Local';

        // Create guide profile
        const { data: newGuide, error: createError } = await supabase!
          .from('guides')
          .insert({
            user_id: user.id,
            company_name: companyName,
            city: 'Martinique',
            is_verified: true,
            subscription_type: 'basic',
            commission_rate: 10.0
          })
          .select('*')
          .single();

        if (createError) {
          console.error('Error creating guide profile:', createError);
          return { data: null, error: 'Erreur lors de la création du profil guide', loading: false };
        }

        guide = newGuide;
      }

      console.log('Guide profile found/created for excursion creation:', guide);

      const { data, error } = await supabase!
        .from('excursions')
        .insert({
          ...excursionData,
          guide_id: guide.id
        })
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'création de l\'excursion'), loading: false };
    }
  },

  // Update excursion
  async updateExcursion(excursionId: string, updates: Partial<Excursion>): Promise<ApiResponse<Excursion>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Verify ownership - use the same approach as GuideDashboard
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        return { data: null, error: 'Erreur lors de la récupération du profil guide', loading: false };
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;
      if (!guide) {
        return { data: null, error: 'Profil guide non trouvé', loading: false };
      }

      console.log('Guide profile found for update:', guide);

      const { data, error } = await supabase!
        .from('excursions')
        .update(updates)
        .eq('id', excursionId)
        .eq('guide_id', guide.id)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour de l\'excursion'), loading: false };
    }
  },

  // Delete excursion
  async deleteExcursion(excursionId: string): Promise<ApiResponse<boolean>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Verify ownership - use the same approach as GuideDashboard
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        return { data: null, error: 'Erreur lors de la récupération du profil guide', loading: false };
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;
      if (!guide) {
        return { data: null, error: 'Profil guide non trouvé', loading: false };
      }

      console.log('Guide profile found for delete:', guide);

      const { error } = await supabase!
        .from('excursions')
        .delete()
        .eq('id', excursionId)
        .eq('guide_id', guide.id);

      if (error) throw error;
      
      return { data: true, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'suppression de l\'excursion'), loading: false };
    }
  },

  // Get excursion by ID
  async getExcursionById(excursionId: string): Promise<ApiResponse<Excursion>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('excursions')
        .select(`
          *,
          guide:guides(
            company_name,
            is_verified,
            user_id
          )
        `)
        .eq('id', excursionId)
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'récupération de l\'excursion'), loading: false };
    }
  }
};

// ===== AVAILABILITY SLOT SERVICES =====
export const availabilitySlotService = {
  // Get slots for an excursion
  async getSlotsByExcursion(excursionId: string): Promise<PaginatedResponse<AvailabilitySlot>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('availability_slots')
        .select(`
          *,
          bookings(participants_count, status)
        `)
        .eq('excursion_id', excursionId)
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time');

      if (error) throw error;

      // Calculate real availability for each slot
      const slotsWithAvailability = data?.map(slot => {
        const confirmedBookings = slot.bookings?.filter(
          (booking: any) => booking.status === 'confirmed'
        ) || [];
        
        const totalBooked = confirmedBookings.reduce(
          (sum: number, booking: any) => sum + booking.participants_count, 0
        );

        const availableSpots = Math.max(0, slot.max_participants - totalBooked);
        const isActuallyAvailable = availableSpots > 0;

        return {
          ...slot,
          available_spots: availableSpots,
          is_available: isActuallyAvailable
        };
      }) || [];

      // Filter out slots with no availability
      const availableSlots = slotsWithAvailability.filter(slot => slot.is_available);
      
      return { data: availableSlots, count: availableSlots.length, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des créneaux'), loading: false };
    }
  },

  // Create availability slot
  async createAvailabilitySlot(slotData: Omit<AvailabilitySlot, 'id' | 'created_at'>): Promise<ApiResponse<AvailabilitySlot>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Verify ownership of the excursion
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        return { data: null, error: 'Erreur lors de la récupération du profil guide', loading: false };
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;
      if (!guide) {
        return { data: null, error: 'Profil guide non trouvé', loading: false };
      }

      const { data: excursion } = await supabase!
        .from('excursions')
        .select('id')
        .eq('id', slotData.excursion_id)
        .eq('guide_id', guide.id)
        .single();

      if (!excursion) {
        return { data: null, error: 'Excursion non trouvée ou non autorisée', loading: false };
      }

      const { data, error } = await supabase!
        .from('availability_slots')
        .insert(slotData)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'création du créneau'), loading: false };
    }
  },

  // Update availability slot
  async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>): Promise<ApiResponse<AvailabilitySlot>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Verify ownership
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        return { data: null, error: 'Erreur lors de la récupération du profil guide', loading: false };
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;
      if (!guide) {
        return { data: null, error: 'Profil guide non trouvé', loading: false };
      }

      // First verify the slot belongs to an excursion owned by this guide
      const { data: slot } = await supabase!
        .from('availability_slots')
        .select('excursion_id')
        .eq('id', slotId)
        .single();

      if (!slot) {
        return { data: null, error: 'Créneau non trouvé', loading: false };
      }

      // Verify the excursion belongs to this guide
      const { data: excursion } = await supabase!
        .from('excursions')
        .select('id')
        .eq('id', slot.excursion_id)
        .eq('guide_id', guide.id)
        .single();

      if (!excursion) {
        return { data: null, error: 'Créneau non autorisé', loading: false };
      }

      // Use RPC function to bypass RLS for updates
      const { data, error } = await supabase!
        .rpc('update_availability_slot', {
          slot_id: slotId,
          updates: updates
        });

      if (error) {
        // Fallback to direct update if RPC doesn't exist
        const { data: directData, error: directError } = await supabase!
          .from('availability_slots')
          .update(updates)
          .eq('id', slotId)
          .select()
          .single();

        if (directError) throw directError;
        return { data: directData, error: null, loading: false };
      }
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du créneau'), loading: false };
    }
  },

  // Delete availability slot
  async deleteAvailabilitySlot(slotId: string): Promise<ApiResponse<boolean>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Verify ownership
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        return { data: null, error: 'Erreur lors de la récupération du profil guide', loading: false };
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;
      if (!guide) {
        return { data: null, error: 'Profil guide non trouvé', loading: false };
      }

      // First verify the slot belongs to an excursion owned by this guide
      const { data: slot } = await supabase!
        .from('availability_slots')
        .select('excursion_id')
        .eq('id', slotId)
        .single();

      if (!slot) {
        return { data: null, error: 'Créneau non trouvé', loading: false };
      }

      // Verify the excursion belongs to this guide
      const { data: excursion } = await supabase!
            .from('excursions')
            .select('id')
        .eq('id', slot.excursion_id)
            .eq('guide_id', guide.id)
        .single();

      if (!excursion) {
        return { data: null, error: 'Créneau non autorisé', loading: false };
      }

      const { error } = await supabase!
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      
      return { data: true, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'suppression du créneau'), loading: false };
    }
  },

  // Toggle availability slot availability
  async toggleAvailabilitySlot(slotId: string): Promise<ApiResponse<AvailabilitySlot>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Verify ownership
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        return { data: null, error: 'Erreur lors de la récupération du profil guide', loading: false };
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;
      if (!guide) {
        return { data: null, error: 'Profil guide non trouvé', loading: false };
      }

      // First verify the slot belongs to an excursion owned by this guide
      const { data: slot } = await supabase!
        .from('availability_slots')
        .select('excursion_id, is_available')
        .eq('id', slotId)
        .single();

      if (!slot) {
        return { data: null, error: 'Créneau non trouvé', loading: false };
      }

      // Verify the excursion belongs to this guide
      const { data: excursion } = await supabase!
        .from('excursions')
        .select('id')
        .eq('id', slot.excursion_id)
        .eq('guide_id', guide.id)
        .single();

      if (!excursion) {
        return { data: null, error: 'Créneau non autorisé', loading: false };
      }

      const { data, error } = await supabase!
        .from('availability_slots')
        .update({ is_available: !slot.is_available })
        .eq('id', slotId)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'modification du créneau'), loading: false };
    }
  }
};

// ===== BOOKING SERVICES =====
export const bookingService = {
  // Get all bookings (admin only)
  async getAllBookings(): Promise<PaginatedResponse<Booking>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(
            title,
            images,
            guide:guides(company_name)
          ),
          slot:availability_slots(date, start_time),
          client:profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des réservations'), loading: false };
    }
  },

  // Get user's bookings
  async getUserBookings(): Promise<PaginatedResponse<Booking>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: [], count: 0, error: 'Utilisateur non connecté', loading: false };
      }

      const { data, error } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(
            *,
            guide:guides(
              company_name,
              is_verified
            )
          ),
          slot:availability_slots(*)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des réservations'), loading: false };
    }
  },

  // Get guide's bookings
  async getGuideBookings(): Promise<PaginatedResponse<Booking>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: [], count: 0, error: 'Utilisateur non connecté', loading: false };
      }

      // Get guide ID first
      const { data: guides, error: guideError } = await supabase!
        .from('guides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (guideError) {
        console.error('Error fetching guide profiles:', guideError);
        throw guideError;
      }

      const guide = guides && guides.length > 0 ? guides[0] : null;
      if (!guide) {
        return { data: [], count: 0, error: 'Profil guide non trouvé', loading: false };
      }

      const { data, error } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(
            *,
            guide:guides(
              company_name,
              is_verified
            )
          ),
          slot:availability_slots(*),
          client:profiles(
            first_name,
            last_name,
            email
          )
        `)
        .eq('excursions.guide_id', guide.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des réservations du guide'), loading: false };
    }
  },

  // Create booking
  async createBooking(bookingData: {
    excursion_id: string;
    slot_id: string;
    participants_count: number;
    special_requests?: string;
  }): Promise<ApiResponse<Booking>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Get excursion details to calculate total amount
      const { data: excursion } = await supabase!
        .from('excursions')
        .select('price_per_person')
        .eq('id', bookingData.excursion_id)
        .single();

      if (!excursion) {
        return { data: null, error: 'Excursion non trouvée', loading: false };
      }

      // Get slot details including date
      const { data: slot } = await supabase!
        .from('availability_slots')
        .select('available_spots, price_override, date')
        .eq('id', bookingData.slot_id)
        .single();

      if (!slot) {
        return { data: null, error: 'Créneau non trouvé', loading: false };
      }

      if (slot.available_spots < bookingData.participants_count) {
        return { data: null, error: 'Pas assez de places disponibles', loading: false };
      }

      const pricePerPerson = slot.price_override || excursion.price_per_person;
      const totalAmount = pricePerPerson * bookingData.participants_count;
      const commissionAmount = totalAmount * 0.20; // 20% commission for tour operators

      // Generate check-in token
      const { data: tokenData, error: tokenError } = await supabase!
        .rpc('generate_checkin_token');

      if (tokenError) {
        console.error('Error generating check-in token:', tokenError);
        return { data: null, error: 'Erreur lors de la génération du token de check-in', loading: false };
      }

      const checkinToken = tokenData as string;

      const { data, error } = await supabase!
        .from('bookings')
        .insert({
          client_id: user.id,
          excursion_id: bookingData.excursion_id,
          slot_id: bookingData.slot_id,
          participants_count: bookingData.participants_count,
          total_amount: totalAmount,
          commission_amount: commissionAmount,
          status: 'pending',
          booking_date: slot.date, // Add the booking date from the slot
          special_requests: bookingData.special_requests,
          checkin_token: checkinToken,
          is_checked_in: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update available spots
      await supabase!
        .from('availability_slots')
        .update({ 
          available_spots: slot.available_spots - bookingData.participants_count 
        })
        .eq('id', bookingData.slot_id);

      // Send booking created notifications
      try {
        await NotificationService.sendBookingCreatedNotifications(data);
      } catch (notificationError) {
        console.error('Error sending booking notifications:', notificationError);
        // Don't fail the booking creation if notifications fail
      }
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'création de la réservation'), loading: false };
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed'): Promise<ApiResponse<Booking>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Check if user is guide or client
      const { data: profile } = await supabase!
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return { data: null, error: 'Profil non trouvé', loading: false };
      }

      let query = supabase!
        .from('bookings')
        .update({ 
          status,
          ...(status === 'cancelled' ? { cancellation_date: new Date().toISOString() } : {})
        })
        .eq('id', bookingId);

      // If user is client, only allow cancellation of their own bookings
      if (profile.role === 'client') {
        query = query.eq('client_id', user.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;

      // Send appropriate notifications based on status change
      try {
        if (status === 'confirmed') {
          await NotificationService.sendBookingConfirmedNotification(data);
        } else if (status === 'cancelled') {
          await NotificationService.sendBookingCancelledNotifications(data);
        }
      } catch (notificationError) {
        console.error('Error sending status change notifications:', notificationError);
        // Don't fail the status update if notifications fail
      }
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du statut de réservation'), loading: false };
    }
  },

  // Validate QR code for check-in
  async validateQRCode(checkinToken: string, guideId: string): Promise<ApiResponse<any>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .rpc('validate_checkin', {
          p_token: checkinToken,
          p_guide_id: guideId
        });

      if (error) throw error;

      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'validation du QR code'), loading: false };
    }
  },

  // Process check-in
  async processCheckIn(checkinToken: string, guideId: string): Promise<ApiResponse<any>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .rpc('process_checkin', {
          p_token: checkinToken,
          p_guide_id: guideId
        });

      if (error) throw error;

      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'traitement du check-in'), loading: false };
    }
  },

  // Get booking by check-in token
  async getBookingByToken(checkinToken: string): Promise<ApiResponse<Booking>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(
            *,
            guide:guides(
              company_name,
              is_verified
            )
          ),
          slot:availability_slots(*),
          client:profiles(
            first_name,
            last_name,
            email
          )
        `)
        .eq('checkin_token', checkinToken)
        .single();

      if (error) throw error;

      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'récupération de la réservation par token'), loading: false };
    }
  }
};

// ===== PAYMENT SERVICES =====
export const paymentService = {
  // Get payments for booking
  async getPaymentsByBooking(bookingId: string): Promise<PaginatedResponse<Payment>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: [], count: 0, error: 'Utilisateur non connecté', loading: false };
      }

      const { data, error } = await supabase!
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des paiements'), loading: false };
    }
  },

  // Create payment record
  async createPayment(paymentData: {
    booking_id: string;
    amount: number;
    stripe_payment_intent_id?: string;
  }): Promise<ApiResponse<Payment>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      const { data, error } = await supabase!
        .from('payments')
        .insert({
          ...paymentData,
          status: 'pending',
          refund_amount: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'création du paiement'), loading: false };
    }
  },

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: 'pending' | 'completed' | 'failed' | 'refunded', refundAmount?: number): Promise<ApiResponse<Payment>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('payments')
        .update({
          status,
          ...(status === 'completed' ? { processed_at: new Date().toISOString() } : {}),
          ...(refundAmount !== undefined ? { refund_amount: refundAmount } : {})
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du statut de paiement'), loading: false };
    }
  }
};

// ===== REVIEW SERVICES =====
export const reviewService = {
  // Get reviews for excursion
  async getReviewsByExcursion(excursionId: string): Promise<PaginatedResponse<Review>> {
    try {
      checkSupabaseConfig();

      const { data, error } = await supabase!
        .from('reviews')
        .select(`
          *,
          client:profiles(
            first_name,
            last_name
          )
        `)
        .eq('excursion_id', excursionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'récupération des avis'), loading: false };
    }
  },

  // Create review
  async createReview(reviewData: {
    booking_id: string;
    excursion_id: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<Review>> {
    try {
      checkSupabaseConfig();
      
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { data: null, error: 'Utilisateur non connecté', loading: false };
      }

      // Verify that the user has a booking for this excursion
      const { data: booking } = await supabase!
        .from('bookings')
        .select('id')
        .eq('id', reviewData.booking_id)
        .eq('client_id', user.id)
        .eq('excursion_id', reviewData.excursion_id)
        .single();

      if (!booking) {
        return { data: null, error: 'Réservation non trouvée ou non autorisée', loading: false };
      }

      // Check if review already exists
      const { data: existingReview } = await supabase!
        .from('reviews')
        .select('id')
        .eq('booking_id', reviewData.booking_id)
        .single();

      if (existingReview) {
        return { data: null, error: 'Vous avez déjà laissé un avis pour cette réservation', loading: false };
      }

      const { data, error } = await supabase!
        .from('reviews')
        .insert({
          ...reviewData,
          client_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'création de l\'avis'), loading: false };
    }
  }
};

// ===== SEARCH SERVICES =====
export const searchService = {
  // Search excursions
  async searchExcursions(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minDuration?: number;
    maxDuration?: number;
    date?: string;
    searchTerm?: string;
  }): Promise<PaginatedResponse<Excursion>> {
    try {
      checkSupabaseConfig();

      let query = supabase!
        .from('excursions')
        .select(`
          *,
          guide:guides(
            company_name,
            is_verified,
            user_id
          )
        `)
        .eq('is_active', true)
        .eq('guides.is_verified', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price_per_person', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price_per_person', filters.maxPrice);
      }

      if (filters.minDuration !== undefined) {
        query = query.gte('duration_hours', filters.minDuration);
      }

      if (filters.maxDuration !== undefined) {
        query = query.lte('duration_hours', filters.maxDuration);
      }

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      return { data: data || [], count: data?.length || 0, error: null, loading: false };
    } catch (error) {
      return { data: [], count: 0, error: handleError(error, 'recherche d\'excursions'), loading: false };
    }
  }
};

// Admin Services
export const adminService = {
  // User Management
  async getAllUsers(): Promise<ApiResponse<Profile[]>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data: data || [], error: null, loading: false };
    } catch (error) {
      return { data: [], error: handleError(error, 'récupération des utilisateurs'), loading: false };
    }
  },

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<Profile>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du rôle utilisateur'), loading: false };
    }
  },

  async deleteUser(userId: string): Promise<ApiResponse<boolean>> {
    try {
      checkSupabaseConfig();
      
      const { error } = await supabase!
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      return { data: true, error: null, loading: false };
    } catch (error) {
      return { data: false, error: handleError(error, 'suppression de l\'utilisateur'), loading: false };
    }
  },

  // Tour Operator Management
  async getAllTourOperators(): Promise<ApiResponse<TourOperator[]>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('tour_operators')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data: data || [], error: null, loading: false };
    } catch (error) {
      return { data: [], error: handleError(error, 'récupération des tour-opérateurs'), loading: false };
    }
  },

  async verifyTourOperator(operatorId: string, isVerified: boolean): Promise<ApiResponse<TourOperator>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('tour_operators')
        .update({ is_verified: isVerified })
        .eq('id', operatorId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'vérification du tour-opérateur'), loading: false };
    }
  },

  // Guide Management
  async getAllGuides(): Promise<ApiResponse<Guide[]>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('guides')
        .select(`
          *,
          profiles!guides_user_id_fkey(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data: data || [], error: null, loading: false };
    } catch (error) {
      return { data: [], error: handleError(error, 'récupération des guides'), loading: false };
    }
  },

  async verifyGuide(guideId: string, isVerified: boolean): Promise<ApiResponse<Guide>> {
    try {
      checkSupabaseConfig();
      
      const { data: guides, error } = await supabase!
        .from('guides')
        .update({ is_verified: isVerified })
        .eq('id', guideId)
        .select()
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const data = guides && guides.length > 0 ? guides[0] : null;
      
      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'vérification du guide'), loading: false };
    }
  },

  // Content Moderation
  async getAllExcursions(): Promise<ApiResponse<Excursion[]>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('excursions')
        .select(`
          *,
          guide:guides(
            company_name,
            is_verified,
            user_id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data: data || [], error: null, loading: false };
    } catch (error) {
      return { data: [], error: handleError(error, 'récupération des excursions'), loading: false };
    }
  },

  async moderateExcursion(excursionId: string, isActive: boolean): Promise<ApiResponse<Excursion>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('excursions')
        .update({ is_active: isActive })
        .eq('id', excursionId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'modération de l\'excursion'), loading: false };
    }
  },

  async deleteExcursion(excursionId: string): Promise<ApiResponse<boolean>> {
    try {
      checkSupabaseConfig();
      
      const { error } = await supabase!
        .from('excursions')
        .delete()
        .eq('id', excursionId);
      
      if (error) throw error;
      
      return { data: true, error: null, loading: false };
    } catch (error) {
      return { data: false, error: handleError(error, 'suppression de l\'excursion'), loading: false };
    }
  },

  // Analytics and Reporting
  async getDashboardStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalGuides: number;
    totalTourOperators: number;
    totalExcursions: number;
    totalBookings: number;
    totalRevenue: number;
    pendingVerifications: number;
    activeExcursions: number;
    monthlyGrowth: number;
    recentActivity: any[];
  }>> {
    try {
      checkSupabaseConfig();
      
      // Get all data in parallel
      const [
        usersResult,
        guidesResult,
        operatorsResult,
        excursionsResult,
        bookingsResult
      ] = await Promise.allSettled([
        supabase!.from('profiles').select('*'),
        supabase!.from('guides').select('*'),
        supabase!.from('tour_operators').select('*'),
        supabase!.from('excursions').select('*'),
        supabase!.from('bookings').select('*')
      ]);

      const users = usersResult.status === 'fulfilled' ? usersResult.value.data || [] : [];
      const guides = guidesResult.status === 'fulfilled' ? guidesResult.value.data || [] : [];
      const operators = operatorsResult.status === 'fulfilled' ? operatorsResult.value.data || [] : [];
      const excursions = excursionsResult.status === 'fulfilled' ? excursionsResult.value.data || [] : [];
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data || [] : [];

      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const pendingVerifications = guides.filter(g => !g.is_verified).length + 
                                  operators.filter(o => !o.is_verified).length;
      const activeExcursions = excursions.filter(e => e.is_active).length;

      // Calculate monthly growth (simplified)
      const thisMonth = new Date().getMonth();
      const lastMonth = new Date().getMonth() - 1;
      const thisMonthUsers = users.filter(u => new Date(u.created_at).getMonth() === thisMonth).length;
      const lastMonthUsers = users.filter(u => new Date(u.created_at).getMonth() === lastMonth).length;
      const monthlyGrowth = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

      // Recent activity (last 10 items)
      const recentActivity = [
        ...users.slice(0, 3).map(u => ({ type: 'user', data: u, date: u.created_at })),
        ...guides.slice(0, 3).map(g => ({ type: 'guide', data: g, date: g.created_at })),
        ...operators.slice(0, 3).map(o => ({ type: 'operator', data: o, date: o.created_at })),
        ...excursions.slice(0, 3).map(e => ({ type: 'excursion', data: e, date: e.created_at }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      return {
        data: {
          totalUsers: users.length,
          totalGuides: guides.length,
          totalTourOperators: operators.length,
          totalExcursions: excursions.length,
          totalBookings: bookings.length,
          totalRevenue,
          pendingVerifications,
          activeExcursions,
          monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
          recentActivity
        },
        error: null,
        loading: false
      };
    } catch (error) {
      return { 
        data: null, 
        error: handleError(error, 'récupération des statistiques'), 
        loading: false 
      };
    }
  },

  async getRevenueReport(startDate?: string, endDate?: string): Promise<ApiResponse<{
    totalRevenue: number;
    bookingsCount: number;
    averageBookingValue: number;
    revenueByMonth: { month: string; revenue: number }[];
  }>> {
    try {
      checkSupabaseConfig();
      
      let query = supabase!.from('bookings').select('*');
      
      if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }
      
      const { data: bookings, error } = await query;
      
      if (error) throw error;
      
      const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const bookingsCount = bookings?.length || 0;
      const averageBookingValue = bookingsCount > 0 ? totalRevenue / bookingsCount : 0;

      // Group by month
      const revenueByMonth = bookings?.reduce((acc, booking) => {
        const month = new Date(booking.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        acc[month] = (acc[month] || 0) + (booking.total_amount || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      const revenueByMonthArray = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue
      }));

      return {
        data: {
          totalRevenue,
          bookingsCount,
          averageBookingValue: Math.round(averageBookingValue * 100) / 100,
          revenueByMonth: revenueByMonthArray
        },
        error: null,
        loading: false
      };
    } catch (error) {
      return { 
        data: null, 
        error: handleError(error, 'génération du rapport de revenus'), 
        loading: false 
      };
    }
  },

  async getUserActivityReport(): Promise<ApiResponse<{
    userRegistrations: { date: string; count: number }[];
    roleDistribution: { role: string; count: number }[];
    topUsers: { user: Profile; bookingsCount: number }[];
  }>> {
    try {
      checkSupabaseConfig();
      
      const { data: users, error: usersError } = await supabase!
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;

      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('*');
      
      if (bookingsError) throw bookingsError;

      // User registrations by date
      const registrationsByDate = users?.reduce((acc, user) => {
        const date = new Date(user.created_at).toLocaleDateString('fr-FR');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userRegistrations = Object.entries(registrationsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Role distribution
      const roleDistribution = users?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const roleDistributionArray = Object.entries(roleDistribution).map(([role, count]) => ({
        role,
        count
      }));

      // Top users by bookings
      const userBookingsCount = bookings?.reduce((acc, booking) => {
        acc[booking.client_id] = (acc[booking.client_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topUsers = Object.entries(userBookingsCount)
        .map(([userId, count]) => ({
          user: users?.find(u => u.id === userId)!,
          bookingsCount: count
        }))
        .filter(item => item.user)
        .sort((a, b) => b.bookingsCount - a.bookingsCount)
        .slice(0, 10);

      return {
        data: {
          userRegistrations,
          roleDistribution: roleDistributionArray,
          topUsers
        },
        error: null,
        loading: false
      };
    } catch (error) {
      return { 
        data: null, 
        error: handleError(error, 'génération du rapport d\'activité utilisateur'), 
        loading: false 
      };
    }
  },

  // Commission Rate Management
  async updateGuideCommissionRate(guideId: string, newRate: number): Promise<ApiResponse<Guide>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('guides')
        .update({ commission_rate: newRate })
        .eq('id', guideId)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du taux de commission guide'), loading: false };
    }
  },

  async updateTourOperatorCommissionRate(operatorId: string, newRate: number): Promise<ApiResponse<TourOperator>> {
    try {
      checkSupabaseConfig();
      
      const { data, error } = await supabase!
        .from('tour_operators')
        .update({ commission_rate: newRate })
        .eq('id', operatorId)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { data: null, error: handleError(error, 'mise à jour du taux de commission tour-opérateur'), loading: false };
    }
  }
};

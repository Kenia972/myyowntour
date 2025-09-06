import { createClient } from '@supabase/supabase-js';

// Vérifier si les variables d'environnement sont configurées
export const isSupabaseConfigured = () => {
  const hasUrl = import.meta.env.VITE_SUPABASE_URL && 
         import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';
  const hasKey = import.meta.env.VITE_SUPABASE_ANON_KEY &&
         import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder-key';
  
  const isConfigured = hasUrl && hasKey &&
         import.meta.env.VITE_SUPABASE_ANON_KEY &&
         import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder-key';
  
  // Only log once on initialization, not every time
  if (!(window as any).supabaseConfigLogged) {
    console.log('🔍 Supabase Configuration Check:', {
      hasUrl,
      hasKey,
      url: import.meta.env.VITE_SUPABASE_URL,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      isConfigured
    });
    (window as any).supabaseConfigLogged = true;
  }
  
  return isConfigured;
};

// Initialiser le client Supabase seulement si configuré correctement
export const supabase = isSupabaseConfigured() 
  ? (() => {
      // Only log once on initialization
      if (!(window as any).supabaseClientLogged) {
        console.log('✅ Creating Supabase client with URL:', import.meta.env.VITE_SUPABASE_URL);
        (window as any).supabaseClientLogged = true;
      }
      return createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        }
      );
    })()
  : (() => {
      console.log('❌ Supabase client not created - configuration failed');
      return null;
    })();

// Types pour TypeScript
export type UserRole = 'client' | 'guide' | 'tour_operator' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type ExcursionCategory = 'beach' | 'hiking' | 'cultural' | 'nautical' | 'adventure' | 'gastronomy';

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Guide {
  id: string;
  user_id: string;
  company_name: string;
  siret?: string;
  description?: string;
  address?: string;
  city: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  is_verified: boolean;
  subscription_type: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

export interface TourOperator {
  id: string;
  user_id: string;
  company_name: string;
  siret?: string;
  description?: string;
  address?: string;
  city: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  is_verified: boolean;
  subscription_type: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Excursion {
  id: string;
  guide_id: string;
  title: string;
  description: string;
  short_description?: string;
  category: ExcursionCategory;
  duration_hours: number;
  max_participants: number;
  price_per_person: number;
  included_services: string[];
  meeting_point?: string;
  difficulty_level: number;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  guide?: Guide;
}

export interface AvailabilitySlot {
  id: string;
  excursion_id: string;
  date: string;
  start_time: string;
  available_spots: number;
  price_override?: number;
  is_available: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id?: string; // Made nullable for tour operator bookings
  excursion_id: string;
  slot_id?: string; // Made nullable for tour operator bookings
  participants_count: number;
  total_amount: number;
  commission_amount: number;
  status: BookingStatus;
  special_requests?: string;
  booking_date: string;
  cancellation_date?: string;
  tour_operator_id?: string; // New: ID of tour operator who made the booking
  client_email?: string; // New: Email for tour operator bookings
  client_name?: string; // New: Name for tour operator bookings
  checkin_token?: string; // QR code token for check-in
  qr_code_data?: string; // Base64 encoded QR code image
  is_checked_in: boolean; // Check-in status
  checkin_time?: string; // When the check-in occurred
  checkin_guide_id?: string; // Which guide checked them in
  created_at: string;
  updated_at: string;
  excursion?: Excursion;
  slot?: AvailabilitySlot;
  client?: Profile;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  status: PaymentStatus;
  refund_amount: number;
  processed_at?: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  client_id: string;
  excursion_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  client?: Profile;
}
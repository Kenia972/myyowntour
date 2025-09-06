import { supabase } from '../lib/supabase';
import { Booking, Excursion } from '../lib/supabase';

export interface BookingRequest {
  excursion_id: string;
  slot_id: string;
  participants_count: number;
  client_name: string;
  client_email: string;
  special_requests?: string;
}

export interface BookingValidationResult {
  isValid: boolean;
  error?: string;
  availableSpots?: number;
  slot?: any;
  excursion?: Excursion;
}

export interface AvailabilityCheck {
  date: string;
  time: string;
  availableSpots: number;
  maxParticipants: number;
  isAvailable: boolean;
  price: number;
}

export class BookingService {
  /**
   * Validates a booking request against availability rules
   */
  static async validateBooking(request: BookingRequest): Promise<BookingValidationResult> {
    try {
      // 1. Check if the slot exists and is available
      const { data: slot, error: slotError } = await supabase!
        .from('availability_slots')
        .select(`
          *,
          excursion:excursions(*)
        `)
        .eq('id', request.slot_id)
        .eq('is_available', true)
        .single();

      if (slotError || !slot) {
        return {
          isValid: false,
          error: 'Ce créneau n\'est pas disponible ou n\'existe pas.'
        };
      }

      // 2. Check if the excursion is active
      if (!slot.excursion || !slot.excursion.is_active) {
        return {
          isValid: false,
          error: 'Cette excursion n\'est plus disponible.'
        };
      }

      // 3. Check if the date is not in the past
      const slotDate = new Date(slot.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (slotDate < today) {
        return {
          isValid: false,
          error: 'Impossible de réserver pour une date passée.'
        };
      }

      // 4. Calculate current availability
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('participants_count, status')
        .eq('slot_id', request.slot_id)
        .eq('status', 'confirmed');

      if (bookingsError) {
        return {
          isValid: false,
          error: 'Erreur lors de la vérification des réservations.'
        };
      }

      const totalBooked = bookings?.reduce((sum, booking) => sum + booking.participants_count, 0) || 0;
      const availableSpots = slot.max_participants - totalBooked;

      // 5. Check if there are enough spots available
      if (availableSpots < request.participants_count) {
        return {
          isValid: false,
          error: `Seulement ${availableSpots} place(s) disponible(s) pour ce créneau.`,
          availableSpots,
          slot,
          excursion: slot.excursion
        };
      }

      // 6. Check if the guide is available on this date
      console.log('🔍 Checking guide availability for:', {
        guide_id: slot.excursion.guide_id,
        date: slot.date
      });
      
      const guideAvailability = await this.checkGuideAvailability(
        slot.excursion.guide_id,
        slot.date
      );

      console.log('📊 Guide availability result:', guideAvailability);

      if (!guideAvailability) {
        return {
          isValid: false,
          error: 'Le guide n\'est pas disponible à cette date.'
        };
      }

      return {
        isValid: true,
        availableSpots,
        slot,
        excursion: slot.excursion
      };

    } catch (error) {
      console.error('Error validating booking:', error);
      return {
        isValid: false,
        error: 'Erreur lors de la validation de la réservation.'
      };
    }
  }

  /**
   * Creates a new booking with real-time availability updates
   */
  static async createBooking(request: BookingRequest): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      // 1. Validate the booking request
      const validation = await this.validateBooking(request);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // 2. Calculate total amount and commission
      const price = validation.slot?.price_override || validation.excursion?.price_per_person || 0;
      const totalAmount = price * request.participants_count;
      const commissionAmount = (totalAmount * 10) / 100; // 10% commission

      console.log('💰 Booking calculation:', {
        price,
        participants: request.participants_count,
        totalAmount,
        commissionAmount
      });

      // 3. Get current user and ensure profile exists
      const { data: { user }, error: userError } = await supabase!.auth.getUser();
      
      if (userError || !user) {
        return {
          success: false,
          error: 'Utilisateur non authentifié'
        };
      }

      // Check if user profile exists, create if not
      let { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.log('⚠️ User profile not found, creating one...');
        
        // Create profile for the user
        const { data: newProfile, error: createError } = await supabase!
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            role: 'client'
          })
          .select('id')
          .single();

        if (createError || !newProfile) {
          console.error('❌ Failed to create user profile:', createError);
          return {
            success: false,
            error: 'Impossible de créer le profil utilisateur. Veuillez contacter le support.'
          };
        }

        profile = newProfile;
        console.log('✅ User profile created:', profile.id);
      } else {
        console.log('✅ User profile found:', profile.id);
      }

      // 4. Create the booking
      const { data: booking, error: bookingError } = await supabase!
        .from('bookings')
        .insert({
          client_id: user.id,
          excursion_id: request.excursion_id,
          slot_id: request.slot_id,
          participants_count: request.participants_count,
          total_amount: totalAmount,
          commission_amount: commissionAmount,
          status: 'pending',
          special_requests: request.special_requests,
          booking_date: validation.slot?.date
        })
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Booking creation error:', bookingError);
        return {
          success: false,
          error: `Erreur lors de la création de la réservation: ${bookingError.message}`
        };
      }

      // 5. Update availability in real-time
      await this.updateAvailabilityRealTime(request.slot_id);

      return {
        success: true,
        booking
      };

    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        error: 'Erreur lors de la création de la réservation.'
      };
    }
  }

  /**
   * Checks if a guide is available on a specific date
   */
  static async checkGuideAvailability(guideId: string, date: string): Promise<boolean> {
    try {
      // First get all excursions for this guide
      const { data: excursions, error: excursionsError } = await supabase!
        .from('excursions')
        .select('id')
        .eq('guide_id', guideId);

      if (excursionsError || !excursions || excursions.length === 0) {
        console.log('No excursions found for guide:', guideId);
        return false;
      }

      // Get excursion IDs
      const excursionIds = excursions.map(exc => exc.id);

      // Check if the guide has any availability slots for this date
      const { data: slots, error } = await supabase!
        .from('availability_slots')
        .select('id, is_available')
        .in('excursion_id', excursionIds)
        .eq('date', date)
        .eq('is_available', true);

      if (error) {
        console.error('Error checking guide availability:', error);
        return false;
      }

      return slots && slots.length > 0;
    } catch (error) {
      console.error('Error checking guide availability:', error);
      return false;
    }
  }

  /**
   * Gets available slots for an excursion
   */
  static async getAvailableSlots(excursionId: string, date?: string): Promise<AvailabilityCheck[]> {
    try {
      let query = supabase!
        .from('availability_slots')
        .select(`
          *,
          bookings(participants_count, status)
        `)
        .eq('excursion_id', excursionId)
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (date) {
        query = query.eq('date', date);
      }

      const { data: slots, error } = await query;

      if (error) {
        console.error('Error fetching available slots:', error);
        return [];
      }

      console.log('📊 Raw slots from booking service:', slots);

      // Calculate availability for each slot
      const availableSlots: AvailabilityCheck[] = slots?.map(slot => {
        const confirmedBookings = slot.bookings?.filter(
          (booking: any) => booking.status === 'confirmed'
        ) || [];
        
        const totalBooked = confirmedBookings.reduce(
          (sum: number, booking: any) => sum + booking.participants_count, 0
        );

        const availableSpots = Math.max(0, slot.max_participants - totalBooked);

        return {
          date: slot.date,
          time: slot.start_time,
          availableSpots,
          maxParticipants: slot.max_participants,
          isAvailable: availableSpots > 0,
          price: slot.price_override || 0
        };
      }) || [];

      console.log('📊 Processed available slots:', availableSlots);
      const filteredSlots = availableSlots.filter(slot => slot.isAvailable);
      console.log('📊 Filtered available slots:', filteredSlots);
      
      return filteredSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Updates availability in real-time by recalculating available spots
   */
  static async updateAvailabilityRealTime(slotId: string): Promise<void> {
    try {
      // Get current bookings for this slot
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('participants_count, status')
        .eq('slot_id', slotId)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('Error fetching bookings for real-time update:', bookingsError);
        return;
      }

      // Get slot details
      const { data: slot, error: slotError } = await supabase!
        .from('availability_slots')
        .select('max_participants')
        .eq('id', slotId)
        .single();

      if (slotError || !slot) {
        console.error('Error fetching slot for real-time update:', slotError);
        return;
      }

      // Calculate new availability
      const totalBooked = bookings?.reduce((sum, booking) => sum + booking.participants_count, 0) || 0;
      const availableSpots = Math.max(0, slot.max_participants - totalBooked);
      const isAvailable = availableSpots > 0;

      // Update the slot
      await supabase!
        .from('availability_slots')
        .update({
          available_spots: availableSpots,
          is_available: isAvailable
        })
        .eq('id', slotId);

      console.log(`Updated availability for slot ${slotId}: ${availableSpots} spots available`);
    } catch (error) {
      console.error('Error updating availability in real-time:', error);
    }
  }

  /**
   * Cancels a booking and updates availability
   */
  static async cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase!
        .from('bookings')
        .select('slot_id, status')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return {
          success: false,
          error: 'Réservation non trouvée.'
        };
      }

      if (booking.status === 'cancelled') {
        return {
          success: false,
          error: 'Cette réservation est déjà annulée.'
        };
      }

      // Cancel the booking
      const { error: updateError } = await supabase!
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', bookingId);

      if (updateError) {
        return {
          success: false,
          error: `Erreur lors de l'annulation: ${updateError.message}`
        };
      }

      // Update availability
      await this.updateAvailabilityRealTime(booking.slot_id);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'annulation de la réservation.'
      };
    }
  }

  /**
   * Confirms a booking and updates availability
   */
  static async confirmBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase!
        .from('bookings')
        .select('slot_id, status')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return {
          success: false,
          error: 'Réservation non trouvée.'
        };
      }

      if (booking.status === 'confirmed') {
        return {
          success: false,
          error: 'Cette réservation est déjà confirmée.'
        };
      }

      // Confirm the booking
      const { error: updateError } = await supabase!
        .from('bookings')
        .update({
          status: 'confirmed'
        })
        .eq('id', bookingId);

      if (updateError) {
        return {
          success: false,
          error: `Erreur lors de la confirmation: ${updateError.message}`
        };
      }

      // Update availability
      await this.updateAvailabilityRealTime(booking.slot_id);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error confirming booking:', error);
      return {
        success: false,
        error: 'Erreur lors de la confirmation de la réservation.'
      };
    }
  }

  /**
   * Gets booking statistics for a guide
   */
  static async getBookingStats(guideId: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
  }> {
    try {
      const { data: bookings, error } = await supabase!
        .from('bookings')
        .select(`
          status,
          total_amount,
          excursion:excursions!inner(guide_id)
        `)
        .eq('excursion.guide_id', guideId);

      if (error) {
        console.error('Error fetching booking stats:', error);
        return {
          totalBookings: 0,
          confirmedBookings: 0,
          pendingBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0
        };
      }

      const stats = {
        totalBookings: bookings?.length || 0,
        confirmedBookings: bookings?.filter(b => b.status === 'confirmed').length || 0,
        pendingBookings: bookings?.filter(b => b.status === 'pending').length || 0,
        cancelledBookings: bookings?.filter(b => b.status === 'cancelled').length || 0,
        totalRevenue: bookings?.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting booking stats:', error);
      return {
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0
      };
    }
  }
}

export const bookingService = BookingService;

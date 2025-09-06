import { supabase } from '../lib/supabase';
import { realtimeService } from './realtimeService';

export interface AvailabilityUpdate {
  slotId: string;
  excursionId: string;
  availableSpots: number;
  isAvailable: boolean;
  timestamp: Date;
}

export interface BookingConflict {
  slotId: string;
  excursionId: string;
  requestedParticipants: number;
  availableSpots: number;
  conflictType: 'insufficient_spots' | 'slot_unavailable' | 'guide_unavailable';
  message: string;
}

export class AvailabilitySyncService {
  private static instance: AvailabilitySyncService;
  private updateCallbacks: Map<string, (update: AvailabilityUpdate) => void> = new Map();
  private conflictCallbacks: Map<string, (conflict: BookingConflict) => void> = new Map();

  static getInstance(): AvailabilitySyncService {
    if (!AvailabilitySyncService.instance) {
      AvailabilitySyncService.instance = new AvailabilitySyncService();
    }
    return AvailabilitySyncService.instance;
  }

  /**
   * Subscribe to real-time availability updates for an excursion
   */
  subscribeToAvailabilityUpdates(
    excursionId: string, 
    callback: (update: AvailabilityUpdate) => void
  ): () => void {
    const callbackId = `availability_${excursionId}_${Date.now()}`;
    this.updateCallbacks.set(callbackId, callback);

    // Subscribe to availability slot changes
    const channel = realtimeService.subscribeToAvailabilitySlots(excursionId, (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
        const update: AvailabilityUpdate = {
          slotId: payload.new?.id || payload.old?.id,
          excursionId: excursionId,
          availableSpots: payload.new?.available_spots || 0,
          isAvailable: payload.new?.is_available || false,
          timestamp: new Date()
        };
        
        // Notify all callbacks for this excursion
        this.updateCallbacks.forEach((cb, id) => {
          if (id.startsWith(`availability_${excursionId}_`)) {
            cb(update);
          }
        });
      }
    });

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callbackId);
      if (channel) {
        realtimeService.unsubscribe(`slots:${excursionId}`);
      }
    };
  }

  /**
   * Subscribe to booking conflicts for an excursion
   */
  subscribeToBookingConflicts(
    excursionId: string,
    callback: (conflict: BookingConflict) => void
  ): () => void {
    const callbackId = `conflict_${excursionId}_${Date.now()}`;
    this.conflictCallbacks.set(callbackId, callback);

    // Subscribe to booking changes that might cause conflicts
    const channel = realtimeService.subscribeToUserBookings('*', (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Check if this booking affects the excursion we're monitoring
        if (payload.new?.excursion_id === excursionId) {
          this.checkForConflicts(excursionId, payload.new);
        }
      }
    });

    return () => {
      this.conflictCallbacks.delete(callbackId);
      if (channel) {
        realtimeService.unsubscribe(`bookings:${excursionId}`);
      }
    };
  }

  /**
   * Check for booking conflicts and notify subscribers
   */
  private async checkForConflicts(excursionId: string, booking: any) {
    try {
      // Get current availability for the slot
      const { data: slot, error } = await supabase!
        .from('availability_slots')
        .select('*')
        .eq('id', booking.slot_id)
        .single();

      if (error || !slot) {
        return;
      }

      // Get all confirmed bookings for this slot
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('participants_count, status')
        .eq('slot_id', booking.slot_id)
        .eq('status', 'confirmed');

      if (bookingsError) {
        return;
      }

      const totalBooked = bookings?.reduce((sum, b) => sum + b.participants_count, 0) || 0;
      const availableSpots = slot.max_participants - totalBooked;

      // Check for conflicts
      if (availableSpots < 0) {
        const conflict: BookingConflict = {
          slotId: slot.id,
          excursionId: excursionId,
          requestedParticipants: booking.participants_count,
          availableSpots: Math.max(0, availableSpots),
          conflictType: 'insufficient_spots',
          message: `Surbooking détecté: ${Math.abs(availableSpots)} participants en trop`
        };

        this.notifyConflictCallbacks(excursionId, conflict);
      }
    } catch (error) {
      console.error('Error checking for conflicts:', error);
    }
  }

  /**
   * Notify all conflict callbacks for an excursion
   */
  private notifyConflictCallbacks(excursionId: string, conflict: BookingConflict) {
    this.conflictCallbacks.forEach((callback, id) => {
      if (id.startsWith(`conflict_${excursionId}_`)) {
        callback(conflict);
      }
    });
  }

  /**
   * Validate booking in real-time before creation
   */
  async validateBookingRealTime(
    excursionId: string,
    slotId: string,
    participantsCount: number
  ): Promise<{ isValid: boolean; conflict?: BookingConflict }> {
    try {
      // Get current slot availability
      const { data: slot, error } = await supabase!
        .from('availability_slots')
        .select('*')
        .eq('id', slotId)
        .eq('excursion_id', excursionId)
        .single();

      if (error || !slot) {
        return {
          isValid: false,
          conflict: {
            slotId,
            excursionId,
            requestedParticipants: participantsCount,
            availableSpots: 0,
            conflictType: 'slot_unavailable',
            message: 'Créneau non trouvé ou indisponible'
          }
        };
      }

      if (!slot.is_available) {
        return {
          isValid: false,
          conflict: {
            slotId,
            excursionId,
            requestedParticipants: participantsCount,
            availableSpots: 0,
            conflictType: 'slot_unavailable',
            message: 'Ce créneau n\'est plus disponible'
          }
        };
      }

      // Get current bookings for this slot
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('participants_count, status')
        .eq('slot_id', slotId)
        .eq('status', 'confirmed');

      if (bookingsError) {
        return {
          isValid: false,
          conflict: {
            slotId,
            excursionId,
            requestedParticipants: participantsCount,
            availableSpots: 0,
            conflictType: 'slot_unavailable',
            message: 'Erreur lors de la vérification des disponibilités'
          }
        };
      }

      const totalBooked = bookings?.reduce((sum, b) => sum + b.participants_count, 0) || 0;
      const availableSpots = slot.max_participants - totalBooked;

      if (availableSpots < participantsCount) {
        return {
          isValid: false,
          conflict: {
            slotId,
            excursionId,
            requestedParticipants: participantsCount,
            availableSpots,
            conflictType: 'insufficient_spots',
            message: `Seulement ${availableSpots} place(s) disponible(s) pour ce créneau`
          }
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating booking in real-time:', error);
      return {
        isValid: false,
        conflict: {
          slotId,
          excursionId,
          requestedParticipants: participantsCount,
          availableSpots: 0,
          conflictType: 'slot_unavailable',
          message: 'Erreur lors de la validation'
        }
      };
    }
  }

  /**
   * Force refresh availability for a slot
   */
  async refreshSlotAvailability(slotId: string): Promise<void> {
    try {
      // Get current bookings for this slot
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('participants_count, status')
        .eq('slot_id', slotId)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('Error fetching bookings for refresh:', bookingsError);
        return;
      }

      // Get slot details
      const { data: slot, error: slotError } = await supabase!
        .from('availability_slots')
        .select('max_participants, excursion_id')
        .eq('id', slotId)
        .single();

      if (slotError || !slot) {
        console.error('Error fetching slot for refresh:', slotError);
        return;
      }

      // Calculate new availability
      const totalBooked = bookings?.reduce((sum, b) => sum + b.participants_count, 0) || 0;
      const availableSpots = Math.max(0, slot.max_participants - totalBooked);
      const isAvailable = availableSpots > 0;

      // Update the slot
      const { error: updateError } = await supabase!
        .from('availability_slots')
        .update({
          available_spots: availableSpots,
          is_available: isAvailable
        })
        .eq('id', slotId);

      if (updateError) {
        console.error('Error updating slot availability:', updateError);
        return;
      }

      // Notify subscribers
      const update: AvailabilityUpdate = {
        slotId,
        excursionId: slot.excursion_id,
        availableSpots,
        isAvailable,
        timestamp: new Date()
      };

      this.updateCallbacks.forEach((callback, id) => {
        if (id.includes(slot.excursion_id)) {
          callback(update);
        }
      });

      console.log(`Refreshed availability for slot ${slotId}: ${availableSpots} spots available`);
    } catch (error) {
      console.error('Error refreshing slot availability:', error);
    }
  }

  /**
   * Get real-time availability for an excursion
   */
  async getRealTimeAvailability(excursionId: string): Promise<{
    slotId: string;
    availableSpots: number;
    isAvailable: boolean;
    lastUpdated: Date;
  }[]> {
    try {
      const { data: slots, error } = await supabase!
        .from('availability_slots')
        .select(`
          id,
          available_spots,
          is_available,
          updated_at,
          bookings!inner(participants_count, status)
        `)
        .eq('excursion_id', excursionId)
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching real-time availability:', error);
        return [];
      }

      return slots?.map(slot => {
        const confirmedBookings = slot.bookings?.filter(
          (booking: any) => booking.status === 'confirmed'
        ) || [];
        
        const totalBooked = confirmedBookings.reduce(
          (sum: number, booking: any) => sum + booking.participants_count, 0
        );

        return {
          slotId: slot.id,
          availableSpots: Math.max(0, slot.available_spots - totalBooked),
          isAvailable: slot.is_available && (slot.available_spots - totalBooked) > 0,
          lastUpdated: new Date(slot.updated_at)
        };
      }) || [];
    } catch (error) {
      console.error('Error getting real-time availability:', error);
      return [];
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.updateCallbacks.clear();
    this.conflictCallbacks.clear();
    realtimeService.unsubscribeAll();
  }
}

export const availabilitySyncService = AvailabilitySyncService.getInstance();

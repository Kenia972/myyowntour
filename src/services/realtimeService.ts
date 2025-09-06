import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Subscribe to profile changes
  subscribeToProfile(userId: string, callback: (payload: any) => void): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured for real-time');
      return null;
    }

    const channelKey = `profile:${userId}`;
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(channelKey, channel);
    return channel;
  }

  // Subscribe to excursion changes
  subscribeToExcursions(callback: (payload: any) => void): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured for real-time');
      return null;
    }

    const channelKey = 'excursions';
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'excursions'
        },
        callback
      )
      .subscribe();

    this.channels.set(channelKey, channel);
    return channel;
  }

  // Subscribe to booking changes for a specific user
  subscribeToUserBookings(userId: string, callback: (payload: any) => void): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured for real-time');
      return null;
    }

    const channelKey = `bookings:${userId}`;
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(channelKey, channel);
    return channel;
  }

  // Subscribe to guide bookings
  subscribeToGuideBookings(guideId: string, callback: (payload: any) => void): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured for real-time');
      return null;
    }

    const channelKey = `guide-bookings:${guideId}`;
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          // Filter for bookings related to this guide's excursions
          if (payload.new && payload.new.excursion_id) {
            // You might want to check if the excursion belongs to this guide
            callback(payload);
          }
        }
      )
      .subscribe();

    this.channels.set(channelKey, channel);
    return channel;
  }

  // Subscribe to availability slot changes
  subscribeToAvailabilitySlots(excursionId: string, callback: (payload: any) => void): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured for real-time');
      return null;
    }

    const channelKey = `slots:${excursionId}`;
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability_slots',
          filter: `excursion_id=eq.${excursionId}`
        },
        callback
      )
      .subscribe();

    this.channels.set(channelKey, channel);
    return channel;
  }

  // Subscribe to admin dashboard updates
  subscribeToAdminUpdates(callback: (payload: any) => void): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured for real-time');
      return null;
    }

    const channelKey = 'admin-updates';
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey)!;
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: '*'
        },
        callback
      )
      .subscribe();

    this.channels.set(channelKey, channel);
    return channel;
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelKey: string): void {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase?.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.channels.forEach((channel, key) => {
      supabase?.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Get all active channels
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

export const realtimeService = RealtimeService.getInstance();

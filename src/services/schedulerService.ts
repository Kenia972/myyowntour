import { supabase } from '../lib/supabase';
import { NotificationService } from './notificationService';

export class SchedulerService {
  // Check if it's time to send 24h reminders (should be called daily)
  static async checkAndSend24HourReminders(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log('🕐 Checking for 24h reminders...');
      
      // Call the database function to send reminders
      const { data, error } = await supabase!.rpc('send_24h_reminders');
      
      if (error) {
        console.error('Error sending 24h reminders:', error);
        return { success: false, count: 0, error: error.message };
      }

      const count = data || 0;
      console.log(`✅ Sent ${count} 24h reminder notifications`);
      
      return { success: true, count };
    } catch (error) {
      console.error('Error in checkAndSend24HourReminders:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Clean up old notifications (should be called weekly)
  static async cleanupOldNotifications(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log('🧹 Cleaning up old notifications...');
      
      const { data, error } = await supabase!.rpc('cleanup_old_notifications');
      
      if (error) {
        console.error('Error cleaning up notifications:', error);
        return { success: false, count: 0, error: error.message };
      }

      const count = data || 0;
      console.log(`✅ Cleaned up ${count} old notifications`);
      
      return { success: true, count };
    } catch (error) {
      console.error('Error in cleanupOldNotifications:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get notification statistics for admin dashboard
  static async getNotificationStats(): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<string, number>;
    recentActivity: any[];
  }> {
    try {
      const { data, error } = await supabase!
        .from('notification_summary')
        .select('*');

      if (error) throw error;

      const totalNotifications = data?.reduce((sum, item) => sum + item.total_notifications, 0) || 0;
      const unreadNotifications = data?.reduce((sum, item) => sum + item.unread_count, 0) || 0;

      // Get recent notifications
      const { data: recentNotifications } = await supabase!
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Group by type
      const notificationsByType: Record<string, number> = {};
      data?.forEach(item => {
        if (item.booking_created_count > 0) notificationsByType['booking_created'] = (notificationsByType['booking_created'] || 0) + item.booking_created_count;
        if (item.booking_confirmed_count > 0) notificationsByType['booking_confirmed'] = (notificationsByType['booking_confirmed'] || 0) + item.booking_confirmed_count;
        if (item.booking_cancelled_count > 0) notificationsByType['booking_cancelled'] = (notificationsByType['booking_cancelled'] || 0) + item.booking_cancelled_count;
        if (item.reminder_count > 0) notificationsByType['reminder_24h'] = (notificationsByType['reminder_24h'] || 0) + item.reminder_count;
        if (item.checkin_count > 0) notificationsByType['checkin_success'] = (notificationsByType['checkin_success'] || 0) + item.checkin_count;
      });

      return {
        totalNotifications,
        unreadNotifications,
        notificationsByType,
        recentActivity: recentNotifications || []
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalNotifications: 0,
        unreadNotifications: 0,
        notificationsByType: {},
        recentActivity: []
      };
    }
  }

  // Manual trigger for testing (admin only)
  static async trigger24HourReminders(): Promise<{ success: boolean; count: number; error?: string }> {
    console.log('🔔 Manually triggering 24h reminders...');
    return await this.checkAndSend24HourReminders();
  }

  // Manual cleanup trigger (admin only)
  static async triggerCleanup(): Promise<{ success: boolean; count: number; error?: string }> {
    console.log('🧹 Manually triggering cleanup...');
    return await this.cleanupOldNotifications();
  }

  // Get upcoming reminders for a specific user
  static async getUpcomingReminders(userId: string): Promise<any[]> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const { data, error } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(title, guide_id),
          slot:availability_slots(date, start_time),
          guide:guides!excursions_guide_id_fkey(company_name)
        `)
        .eq('client_id', userId)
        .eq('slot.date', tomorrowDate)
        .eq('status', 'confirmed');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }

  // Schedule a one-time notification (for future use)
  static async scheduleNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    scheduledFor: Date,
    data?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, we'll store it as a regular notification
      // In a production system, you'd want a separate scheduled_notifications table
      const { error } = await supabase!
        .from('notifications')
        .insert({
          user_id: userId,
          type: type as any,
          title,
          message,
          data: data || {},
          is_read: false,
          channel: 'both'
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

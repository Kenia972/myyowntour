import { supabase } from '../lib/supabase';
import { ResendEmailService } from './resendEmailService';

export interface Notification {
  id?: string;
  user_id: string;
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'reminder_24h' | 'checkin_success' | 'booking_confirmed';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at?: string;
  channel: 'email' | 'in_app' | 'both';
}

export interface NotificationTemplate {
  title: string;
  message: string;
  email_subject?: string;
  email_template?: string;
}

export class NotificationService {
  // Notification templates for different events
  private static templates: Record<string, NotificationTemplate> = {
    booking_created_client: {
      title: "Réservation confirmée !",
      message: "Votre réservation a été créée avec succès. Vous pouvez maintenant télécharger votre QR code pour le check-in.",
      email_subject: "Confirmation de réservation - Myowntour",
      email_template: "booking_confirmation"
    },
    booking_created_guide: {
      title: "Nouvelle réservation",
      message: "Vous avez reçu une nouvelle réservation pour votre excursion.",
      email_subject: "Nouvelle réservation - Myowntour",
      email_template: "new_booking_guide"
    },
    booking_confirmed_client: {
      title: "Réservation confirmée",
      message: "Votre réservation a été confirmée par le guide. Votre QR code est prêt !",
      email_subject: "Réservation confirmée - Myowntour",
      email_template: "booking_confirmed"
    },
    booking_cancelled_client: {
      title: "Réservation annulée",
      message: "Votre réservation a été annulée. Si vous avez des questions, contactez-nous.",
      email_subject: "Réservation annulée - Myowntour",
      email_template: "booking_cancelled"
    },
    booking_cancelled_guide: {
      title: "Réservation annulée",
      message: "Un client a annulé sa réservation pour votre excursion.",
      email_subject: "Réservation annulée - Myowntour",
      email_template: "booking_cancelled_guide"
    },
    reminder_24h_client: {
      title: "Rappel - Excursion demain",
      message: "N'oubliez pas votre excursion demain ! Votre QR code est prêt pour le check-in.",
      email_subject: "Rappel - Votre excursion demain - Myowntour",
      email_template: "reminder_24h"
    },
    reminder_24h_guide: {
      title: "Rappel - Excursion demain",
      message: "Vous avez une excursion demain avec des participants à accueillir.",
      email_subject: "Rappel - Excursion demain - Myowntour",
      email_template: "reminder_guide"
    },
    checkin_success_client: {
      title: "Check-in réussi !",
      message: "Vous avez été enregistré avec succès pour votre excursion. Bonne visite !",
      email_subject: "Check-in confirmé - Myowntour",
      email_template: "checkin_success"
    },
    checkin_success_guide: {
      title: "Check-in effectué",
      message: "Un participant a été enregistré avec succès pour votre excursion.",
      email_subject: "Check-in effectué - Myowntour",
      email_template: "checkin_guide"
    }
  };

  // Send notification to user
  static async sendNotification(
    userId: string,
    type: Notification['type'],
    data: any,
    channel: 'email' | 'in_app' | 'both' = 'both'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const templateKey = `${type}_${data.recipient_type || 'client'}`;
      const template = this.templates[templateKey];
      
      if (!template) {
        console.error(`No template found for ${templateKey}`);
        return { success: false, error: 'Template not found' };
      }

      // Create notification record
      const notification: Omit<Notification, 'id' | 'created_at'> = {
        user_id: userId,
        type,
        title: this.formatMessage(template.title, data),
        message: this.formatMessage(template.message, data),
        data,
        is_read: false,
        channel
      };

      // Save to database
      console.log('🔔 Attempting to save notification:', {
        userId,
        type,
        title: notification.title,
        channel
      });

      const { error: dbError } = await supabase!
        .from('notifications')
        .insert(notification);

      if (dbError) {
        console.error('❌ Error saving notification:', dbError);
        console.error('❌ Full error details:', JSON.stringify(dbError, null, 2));
        return { success: false, error: dbError.message };
      }

      console.log('✅ Notification saved successfully');

      // Send email if requested
      if (channel === 'email' || channel === 'both') {
        await this.sendEmailNotification(userId, template, data);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send email notification
  private static async sendEmailNotification(
    userId: string,
    template: NotificationTemplate,
    data: any
  ): Promise<void> {
    try {
      // Get user email
      const { data: profile } = await supabase!
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        console.warn('No email found for user:', userId);
        return;
      }

      // Send email using Edge Function
      const emailData = {
        to: profile.email,
        subject: template.title,
        html: template.html || template.message,
        type: 'html'
      };

      console.log('📧 Sending email via Edge Function:', emailData);

      const { error } = await supabase!.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('❌ Error sending email:', error);
      } else {
        console.log('✅ Email sent successfully');
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Send email using Resend service
  private static async sendResendEmail(
    profile: { email: string; first_name: string; last_name: string },
    template: NotificationTemplate,
    data: any
  ): Promise<boolean> {
    try {
      const firstName = profile.first_name || 'Utilisateur';
      const lastName = profile.last_name || '';
      const email = profile.email;

      // Determine email type based on template
      const emailTemplate = template.email_template || 'default';
      
      switch (emailTemplate) {
        case 'booking_confirmation':
          return await ResendEmailService.sendBookingConfirmationEmail({
            email,
            firstName,
            lastName,
            bookingId: data.booking_id || 'N/A',
            excursionName: data.excursion_title || 'Excursion',
            date: data.excursion_date || 'N/A',
            time: data.excursion_time || 'N/A',
            participants: data.participants_count || 1,
            totalPrice: data.total_amount || 0,
            guideName: data.guide_name || 'Guide',
            guidePhone: data.guide_phone || 'N/A',
            meetingPoint: data.meeting_point || 'À confirmer'
          });

        case 'reminder_24h':
          return await ResendEmailService.sendReminderEmail({
            email,
            firstName,
            lastName,
            excursionName: data.excursion_title || 'Excursion',
            date: data.excursion_date || 'N/A',
            time: data.excursion_time || 'N/A',
            meetingPoint: data.meeting_point || 'À confirmer',
            guideName: data.guide_name || 'Guide',
            guidePhone: data.guide_phone || 'N/A'
          });

        case 'booking_confirmed':
          return await ResendEmailService.sendBookingConfirmationEmail({
            email,
            firstName,
            lastName,
            bookingId: data.booking_id || 'N/A',
            excursionName: data.excursion_title || 'Excursion',
            date: data.excursion_date || 'N/A',
            time: data.excursion_time || 'N/A',
            participants: data.participants_count || 1,
            totalPrice: data.total_amount || 0,
            guideName: data.guide_name || 'Guide',
            guidePhone: data.guide_phone || 'N/A',
            meetingPoint: data.meeting_point || 'À confirmer'
          });

        default:
          // Default welcome email for other notifications
          return await ResendEmailService.sendWelcomeEmail({
            email,
            firstName,
            lastName,
            role: data.recipient_type === 'guide' ? 'guide' : 'client'
          });
      }
    } catch (error) {
      console.error('Error sending Resend email:', error);
      return false;
    }
  }

  // Format message with data placeholders
  private static formatMessage(template: string, data: any): string {
    let message = template;
    
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });

    return message;
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase!
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase!
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase!
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Send booking created notifications
  static async sendBookingCreatedNotifications(booking: any): Promise<void> {
    try {
      // Get booking details with related data
      const { data: bookingData } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(title, guide_id),
          slot:availability_slots(date, start_time),
          client:profiles(first_name, last_name, email),
          guide:guides!excursions_guide_id_fkey(company_name, user_id)
        `)
        .eq('id', booking.id)
        .single();

      if (!bookingData) return;

      // Notify client
      await this.sendNotification(
        bookingData.client_id,
        'booking_created',
        {
          recipient_type: 'client',
          booking_id: booking.id,
          excursion_title: bookingData.excursion?.title,
          excursion_date: bookingData.slot?.date,
          excursion_time: bookingData.slot?.start_time,
          participants_count: bookingData.participants_count,
          total_amount: bookingData.total_amount,
          checkin_token: bookingData.checkin_token
        },
        'both'
      );

      // Notify guide
      if (bookingData.guide?.user_id) {
        await this.sendNotification(
          bookingData.guide.user_id,
          'booking_created',
          {
            recipient_type: 'guide',
            booking_id: booking.id,
            excursion_title: bookingData.excursion?.title,
            excursion_date: bookingData.slot?.date,
            excursion_time: bookingData.slot?.start_time,
            client_name: `${bookingData.client?.first_name} ${bookingData.client?.last_name}`,
            participants_count: bookingData.participants_count,
            total_amount: bookingData.total_amount
          },
          'both'
        );
      }
    } catch (error) {
      console.error('Error sending booking created notifications:', error);
    }
  }

  // Send booking confirmed notification
  static async sendBookingConfirmedNotification(booking: any): Promise<void> {
    try {
      await this.sendNotification(
        booking.client_id,
        'booking_confirmed',
        {
          recipient_type: 'client',
          booking_id: booking.id,
          excursion_title: booking.excursion?.title,
          excursion_date: booking.slot?.date,
          excursion_time: booking.slot?.start_time,
          checkin_token: booking.checkin_token
        },
        'both'
      );
    } catch (error) {
      console.error('Error sending booking confirmed notification:', error);
    }
  }

  // Send booking cancelled notifications
  static async sendBookingCancelledNotifications(booking: any): Promise<void> {
    try {
      // Notify client
      await this.sendNotification(
        booking.client_id,
        'booking_cancelled',
        {
          recipient_type: 'client',
          booking_id: booking.id,
          excursion_title: booking.excursion?.title,
          excursion_date: booking.slot?.date,
          excursion_time: booking.slot?.start_time
        },
        'both'
      );

      // Notify guide
      if (booking.guide?.user_id) {
        await this.sendNotification(
          booking.guide.user_id,
          'booking_cancelled',
          {
            recipient_type: 'guide',
            booking_id: booking.id,
            excursion_title: booking.excursion?.title,
            excursion_date: booking.slot?.date,
            excursion_time: booking.slot?.start_time,
            client_name: `${booking.client?.first_name} ${booking.client?.last_name}`
          },
          'both'
        );
      }
    } catch (error) {
      console.error('Error sending booking cancelled notifications:', error);
    }
  }

  // Send check-in success notifications
  static async sendCheckInSuccessNotifications(booking: any): Promise<void> {
    try {
      // Notify client
      await this.sendNotification(
        booking.client_id,
        'checkin_success',
        {
          recipient_type: 'client',
          booking_id: booking.id,
          excursion_title: booking.excursion?.title,
          excursion_date: booking.slot?.date,
          excursion_time: booking.slot?.start_time,
          checkin_time: new Date().toLocaleString('fr-FR')
        },
        'both'
      );

      // Notify guide
      if (booking.guide?.user_id) {
        await this.sendNotification(
          booking.guide.user_id,
          'checkin_success',
          {
            recipient_type: 'guide',
            booking_id: booking.id,
            excursion_title: booking.excursion?.title,
            client_name: `${booking.client?.first_name} ${booking.client?.last_name}`,
            checkin_time: new Date().toLocaleString('fr-FR')
          },
          'both'
        );
      }
    } catch (error) {
      console.error('Error sending check-in success notifications:', error);
    }
  }

  // Send 24h reminder notifications
  static async send24HourReminders(): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      // Get all bookings for tomorrow
      const { data: bookings } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(title, guide_id),
          slot:availability_slots(date, start_time),
          client:profiles(first_name, last_name, email),
          guide:guides!excursions_guide_id_fkey(company_name, user_id)
        `)
        .eq('slot.date', tomorrowDate)
        .eq('status', 'confirmed');

      if (!bookings || bookings.length === 0) return;

      // Group bookings by guide
      const guideBookings = new Map();
      const clientBookings = new Map();

      bookings.forEach(booking => {
        // Add to client notifications
        if (!clientBookings.has(booking.client_id)) {
          clientBookings.set(booking.client_id, []);
        }
        clientBookings.get(booking.client_id).push(booking);

        // Add to guide notifications
        if (booking.guide?.user_id) {
          if (!guideBookings.has(booking.guide.user_id)) {
            guideBookings.set(booking.guide.user_id, []);
          }
          guideBookings.get(booking.guide.user_id).push(booking);
        }
      });

      // Send client reminders
      for (const [clientId, clientBookingList] of clientBookings) {
        for (const booking of clientBookingList) {
          await this.sendNotification(
            clientId,
            'reminder_24h',
            {
              recipient_type: 'client',
              booking_id: booking.id,
              excursion_title: booking.excursion?.title,
              excursion_date: booking.slot?.date,
              excursion_time: booking.slot?.start_time,
              participants_count: booking.participants_count,
              checkin_token: booking.checkin_token
            },
            'both'
          );
        }
      }

      // Send guide reminders
      for (const [guideId, guideBookingList] of guideBookings) {
        const totalParticipants = guideBookingList.reduce((sum, booking) => sum + booking.participants_count, 0);
        
        await this.sendNotification(
          guideId,
          'reminder_24h',
          {
            recipient_type: 'guide',
            excursion_title: guideBookingList[0].excursion?.title,
            excursion_date: guideBookingList[0].slot?.date,
            excursion_time: guideBookingList[0].slot?.start_time,
            total_bookings: guideBookingList.length,
            total_participants: totalParticipants
          },
          'both'
        );
      }

      console.log(`Sent 24h reminders for ${bookings.length} bookings`);
    } catch (error) {
      console.error('Error sending 24h reminders:', error);
    }
  }
}

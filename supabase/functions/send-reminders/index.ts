import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  channel: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🕐 Starting 24h reminder process...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the database function to send 24h reminders
    const { data, error } = await supabaseClient.rpc('send_24h_reminders')
    
    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    const reminderCount = data || 0
    console.log(`✅ Successfully sent ${reminderCount} reminder notifications`)

    // Optional: Send additional notifications for guides with multiple bookings
    await sendGuideSummaryNotifications(supabaseClient)

    // Optional: Clean up old notifications
    await cleanupOldNotifications(supabaseClient)

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: reminderCount,
        message: `Sent ${reminderCount} reminder notifications`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Error in send-reminders function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Send summary notifications to guides with multiple bookings tomorrow
async function sendGuideSummaryNotifications(supabaseClient: any) {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    // Get guides with multiple bookings tomorrow
    const { data: guideSummaries } = await supabaseClient
      .from('bookings')
      .select(`
        guide:guides!excursions_guide_id_fkey(user_id, company_name),
        excursion:excursions(title),
        slot:availability_slots(date, start_time),
        count:participants_count
      `)
      .eq('slot.date', tomorrowDate)
      .eq('status', 'confirmed')

    if (!guideSummaries || guideSummaries.length === 0) return

    // Group by guide
    const guideGroups = new Map()
    guideSummaries.forEach((booking: any) => {
      if (booking.guide?.user_id) {
        if (!guideGroups.has(booking.guide.user_id)) {
          guideGroups.set(booking.guide.user_id, {
            guide: booking.guide,
            bookings: [],
            totalParticipants: 0
          })
        }
        const group = guideGroups.get(booking.guide.user_id)
        group.bookings.push(booking)
        group.totalParticipants += booking.count || 0
      }
    })

    // Send summary notifications
    for (const [guideId, group] of guideGroups) {
      if (group.bookings.length > 1) {
        const notification: NotificationData = {
          user_id: guideId,
          type: 'reminder_24h',
          title: 'Rappel - Excursion demain',
          message: `Vous avez ${group.bookings.length} excursions demain avec ${group.totalParticipants} participants au total.`,
          data: {
            recipient_type: 'guide',
            excursion_title: group.bookings[0].excursion?.title,
            excursion_date: group.bookings[0].slot?.date,
            excursion_time: group.bookings[0].slot?.start_time,
            total_bookings: group.bookings.length,
            total_participants: group.totalParticipants
          },
          channel: 'both'
        }

        await supabaseClient
          .from('notifications')
          .insert(notification)
      }
    }

    console.log(`📊 Sent summary notifications to ${guideGroups.size} guides`)
  } catch (error) {
    console.error('Error sending guide summaries:', error)
  }
}

// Clean up old notifications (older than 30 days)
async function cleanupOldNotifications(supabaseClient: any) {
  try {
    const { data, error } = await supabaseClient.rpc('cleanup_old_notifications')
    
    if (error) {
      console.error('Error cleaning up notifications:', error)
      return
    }

    const cleanedCount = data || 0
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old notifications`)
    }
  } catch (error) {
    console.error('Error in cleanup:', error)
  }
}

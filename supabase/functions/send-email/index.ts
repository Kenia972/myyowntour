// Supabase Edge Function for sending emails via Resend
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: 'welcome' | 'booking_confirmation' | 'reminder' | 'password_reset';
  data?: any;
}

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'guide' | 'tour_operator';
}

interface BookingEmailData {
  email: string;
  firstName: string;
  lastName: string;
  bookingId: string;
  excursionName: string;
  date: string;
  time: string;
  participants: number;
  totalPrice: number;
  guideName: string;
  guidePhone: string;
  meetingPoint: string;
}

interface ReminderEmailData {
  email: string;
  firstName: string;
  lastName: string;
  excursionName: string;
  date: string;
  time: string;
  meetingPoint: string;
  guideName: string;
  guidePhone: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the request body
    const { to, subject, html, text, type, data }: EmailRequest = await req.json();

    if (!to || !subject || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Myowntour <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await emailResponse.json();
    console.log('Email sent successfully:', result);

    // Log the email in the database for tracking
    const { error: logError } = await supabaseClient
      .from('email_logs')
      .insert({
        recipient_email: to,
        subject,
        type,
        status: 'sent',
        resend_id: result.id,
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.warn('Failed to log email:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        resend_id: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate HTML email templates
function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const { firstName, lastName, role } = data;
  
  let roleTitle = '';
  let roleColor = '#667eea';
  let roleIcon = '🌴';
  
  switch (role) {
    case 'guide':
      roleTitle = 'guide';
      roleColor = '#28a745';
      roleIcon = '🤝';
      break;
    case 'tour_operator':
      roleTitle = 'tour-opérateur';
      roleColor = '#fd7e14';
      roleIcon = '🤝';
      break;
    default:
      roleTitle = 'client';
      roleColor = '#667eea';
      roleIcon = '🌴';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Myowntour</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${roleColor} 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: ${roleColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${roleColor}; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${roleIcon} Bienvenue sur Myowntour !</h1>
        <p>Votre compte ${roleTitle} est activé</p>
      </div>
      <div class="content">
        <h2>Bonjour ${firstName} ${lastName} !</h2>
        <p>Félicitations ! Votre compte ${roleTitle} Myowntour a été créé et activé avec succès.</p>
        
        <div class="feature">
          <h3>✅ Votre compte est immédiatement utilisable</h3>
          <p>Aucune confirmation supplémentaire requise !</p>
        </div>

        <div style="text-align: center;">
          <a href="https://resend.dev" class="button">🚀 Commencer maintenant</a>
        </div>

        <div class="footer">
          <p><strong>Besoin d'aide ?</strong><br>
          📧 contact@resend.dev<br>
          📞 +596 696 XX XX XX</p>
          <p>Merci de nous faire confiance !<br>
          <strong>L'équipe Myowntour</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateBookingConfirmationHTML(data: BookingEmailData): string {
  const { firstName, lastName, excursionName, date, time, participants, totalPrice, guideName, guidePhone, meetingPoint } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de réservation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border: 2px solid #28a745; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .detail-label { font-weight: bold; color: #495057; }
        .detail-value { color: #212529; }
        .total { background: #28a745; color: white; font-weight: bold; font-size: 18px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 Réservation confirmée !</h1>
        <p>Votre excursion est réservée</p>
      </div>
      <div class="content">
        <h2>Bonjour ${firstName} ${lastName} !</h2>
        <p>Votre réservation a été confirmée avec succès. Voici les détails de votre excursion :</p>
        
        <div class="booking-details">
          <h3>📋 Détails de la réservation</h3>
          <div class="detail-row">
            <span class="detail-label">🏖️ Excursion :</span>
            <span class="detail-value">${excursionName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📅 Date :</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏰ Heure :</span>
            <span class="detail-value">${time}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">👥 Participants :</span>
            <span class="detail-value">${participants} personne(s)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">👨‍🏫 Guide :</span>
            <span class="detail-value">${guideName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📞 Contact guide :</span>
            <span class="detail-value">${guidePhone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📍 Point de rendez-vous :</span>
            <span class="detail-value">${meetingPoint}</span>
          </div>
          <div class="detail-row total">
            <span class="detail-label">💰 Total :</span>
            <span class="detail-value">${totalPrice}€</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Besoin d'aide ?</strong><br>
          📧 contact@resend.dev<br>
          📞 +596 696 XX XX XX</p>
          <p>Merci de votre confiance !<br>
          <strong>L'équipe Myowntour</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReminderHTML(data: ReminderEmailData): string {
  const { firstName, lastName, excursionName, date, time, meetingPoint, guideName, guidePhone } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rappel excursion</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .reminder-details { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border: 2px solid #ffc107; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .detail-label { font-weight: bold; color: #495057; }
        .detail-value { color: #212529; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⏰ Rappel - Votre excursion demain !</h1>
        <p>N'oubliez pas votre excursion</p>
      </div>
      <div class="content">
        <h2>Bonjour ${firstName} ${lastName} !</h2>
        <p>Nous vous rappelons que vous avez une excursion prévue demain. Voici les informations importantes :</p>
        
        <div class="reminder-details">
          <h3>📋 Détails de votre excursion</h3>
          <div class="detail-row">
            <span class="detail-label">🏖️ Excursion :</span>
            <span class="detail-value">${excursionName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📅 Date :</span>
            <span class="detail-value">${date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏰ Heure :</span>
            <span class="detail-value">${time}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">👨‍🏫 Guide :</span>
            <span class="detail-value">${guideName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📞 Contact guide :</span>
            <span class="detail-value">${guidePhone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📍 Point de rendez-vous :</span>
            <span class="detail-value">${meetingPoint}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Besoin d'aide ?</strong><br>
          📧 contact@resend.dev<br>
          📞 +596 696 XX XX XX</p>
          <p>Profitez bien de votre excursion !<br>
          <strong>L'équipe Myowntour</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

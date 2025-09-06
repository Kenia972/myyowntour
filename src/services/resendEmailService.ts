// Professional email service using Resend for Myowntour
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'guide' | 'tour_operator';
}

export interface BookingEmailData {
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

export interface ReminderEmailData {
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

export class ResendEmailService {
  // Send welcome email based on user role
  static async sendWelcomeEmail(userData: WelcomeEmailData): Promise<boolean> {
    try {
      const { email, firstName, lastName, role } = userData;
      
      let subject = '';
      let html = '';
      let text = '';

      switch (role) {
        case 'client':
          subject = '🌴 Bienvenue sur Myowntour - Votre compte est activé !';
          html = this.getClientWelcomeHTML(firstName, lastName);
          text = this.getClientWelcomeText(firstName, lastName);
          break;
        case 'guide':
          subject = '🤝 Bienvenue guide Myowntour - Votre compte est activé !';
          html = this.getGuideWelcomeHTML(firstName, lastName);
          text = this.getGuideWelcomeText(firstName, lastName);
          break;
        case 'tour_operator':
          subject = '🤝 Bienvenue tour-opérateur Myowntour - Votre compte est activé !';
          html = this.getTourOperatorWelcomeHTML(firstName, lastName);
          text = this.getTourOperatorWelcomeText(firstName, lastName);
          break;
      }

      const result = await resend.emails.send({
        from: 'Myowntour <noreply@myowntour.com>',
        to: [email],
        subject,
        html,
        text,
      });

      console.log('✅ Welcome email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }
  }

  // Send booking confirmation email
  static async sendBookingConfirmationEmail(bookingData: BookingEmailData): Promise<boolean> {
    try {
      const { email, firstName, lastName, excursionName, date, time, participants, totalPrice, guideName, guidePhone, meetingPoint } = bookingData;

      const subject = '🎯 Confirmation de réservation - Myowntour';
      const html = this.getBookingConfirmationHTML(bookingData);
      const text = this.getBookingConfirmationText(bookingData);

      const result = await resend.emails.send({
        from: 'Myowntour <bookings@myowntour.com>',
        to: [email],
        subject,
        html,
        text,
      });

      console.log('✅ Booking confirmation email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error sending booking confirmation email:', error);
      return false;
    }
  }

  // Send 24h reminder email
  static async sendReminderEmail(reminderData: ReminderEmailData): Promise<boolean> {
    try {
      const { email, firstName, lastName, excursionName, date, time, meetingPoint, guideName, guidePhone } = reminderData;

      const subject = '⏰ Rappel - Votre excursion demain - Myowntour';
      const html = this.getReminderHTML(reminderData);
      const text = this.getReminderText(reminderData);

      const result = await resend.emails.send({
        from: 'Myowntour <reminders@myowntour.com>',
        to: [email],
        subject,
        html,
        text,
      });

      console.log('✅ Reminder email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error sending reminder email:', error);
      return false;
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `https://myowntour.app/reset-password?token=${resetToken}`;
      
      const subject = '🔐 Réinitialisation de votre mot de passe Myowntour';
      const html = this.getPasswordResetHTML(resetUrl);
      const text = this.getPasswordResetText(resetUrl);

      const result = await resend.emails.send({
        from: 'Myowntour <security@myowntour.com>',
        to: [email],
        subject,
        html,
        text,
      });

      console.log('✅ Password reset email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return false;
    }
  }

  // Client welcome email HTML
  private static getClientWelcomeHTML(firstName: string, lastName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur Myowntour</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌴 Bienvenue sur Myowntour !</h1>
          <p>Votre compte client est activé</p>
        </div>
        <div class="content">
          <h2>Bonjour ${firstName} ${lastName} !</h2>
          <p>Félicitations ! Votre compte client Myowntour a été créé et activé avec succès. Vous pouvez maintenant découvrir et réserver les plus belles excursions de Martinique.</p>
          
          <div class="feature">
            <h3>✅ Votre compte est immédiatement utilisable</h3>
            <p>Aucune confirmation supplémentaire requise !</p>
          </div>

          <h3>🎯 Ce que vous pouvez faire maintenant :</h3>
          <div class="feature">
            <strong>🏖️ Parcourir nos excursions</strong><br>
            Plages, randonnées, culture - découvrez la Martinique
          </div>
          <div class="feature">
            <strong>📅 Réserver vos activités préférées</strong><br>
            Réservation simple et sécurisée en quelques clics
          </div>
          <div class="feature">
            <strong>💬 Laisser des avis</strong><br>
            Partagez vos expériences après vos aventures
          </div>
          <div class="feature">
            <strong>📱 Gérer vos réservations</strong><br>
            Tableau de bord complet pour suivre vos activités
          </div>

          <p>Nos guides locaux passionnés vous feront découvrir les trésors cachés de l'île aux fleurs.</p>

          <div style="text-align: center;">
            <a href="https://myowntour.app" class="button">🚀 Commencer maintenant</a>
          </div>

          <div class="footer">
            <p><strong>Besoin d'aide ?</strong><br>
            📧 contact@myowntour.com<br>
            📞 +596 696 XX XX XX</p>
            <p>Merci de nous faire confiance pour vos aventures martiniquaises !<br>
            <strong>L'équipe Myowntour</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Client welcome email text
  private static getClientWelcomeText(firstName: string, lastName: string): string {
    return `
Bonjour ${firstName} ${lastName} !

Félicitations ! Votre compte client Myowntour a été créé et activé avec succès. 
Vous pouvez maintenant découvrir et réserver les plus belles excursions de Martinique.

✅ Votre compte est immédiatement utilisable - aucune confirmation supplémentaire requise !

🎯 Ce que vous pouvez faire maintenant :
• 🏖️ Parcourir nos excursions (plages, randonnées, culture)
• 📅 Réserver vos activités préférées
• 💬 Laisser des avis après vos expériences
• 📱 Gérer vos réservations depuis votre tableau de bord

Nos guides locaux passionnés vous feront découvrir les trésors cachés de l'île aux fleurs.

🚀 Connectez-vous maintenant : https://myowntour.app

Besoin d'aide ?
📧 contact@myowntour.com
📞 +596 696 XX XX XX

Merci de nous faire confiance pour vos aventures martiniquaises !

L'équipe Myowntour
    `;
  }

  // Guide welcome email HTML
  private static getGuideWelcomeHTML(firstName: string, lastName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue guide Myowntour</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤝 Bienvenue guide Myowntour !</h1>
          <p>Votre compte guide est activé</p>
        </div>
        <div class="content">
          <h2>Bonjour ${firstName} ${lastName} !</h2>
          <p>Félicitations ! Votre compte guide Myowntour a été créé et activé avec succès. Vous rejoignez notre réseau de guides locaux passionnés.</p>
          
          <div class="feature">
            <h3>✅ Votre compte est immédiatement utilisable</h3>
            <p>Aucune confirmation supplémentaire requise !</p>
          </div>

          <h3>💼 Vos avantages guide :</h3>
          <div class="feature">
            <strong>💰 Commission de seulement 15%</strong><br>
            La plus compétitive du marché
          </div>
          <div class="feature">
            <strong>🎯 Visibilité accrue</strong><br>
            Sur notre plateforme de référence
          </div>
          <div class="feature">
            <strong>📊 Outils de gestion</strong><br>
            Réservations et planning intégrés
          </div>
          <div class="feature">
            <strong>💳 Paiements sécurisés</strong><br>
            Automatisés et fiables
          </div>
          <div class="feature">
            <strong>📈 Statistiques détaillées</strong><br>
            Suivez votre performance
          </div>

          <h3>🚀 Prochaines étapes :</h3>
          <ol>
            <li>Complétez votre profil - Ajoutez vos informations d'entreprise</li>
            <li>Créez vos excursions - Présentez vos activités</li>
            <li>Définissez vos créneaux - Gérez votre planning</li>
            <li>Attendez la validation - Notre équipe vérifiera votre profil</li>
          </ol>

          <div style="text-align: center;">
            <a href="https://myowntour.app" class="button">🚀 Commencer maintenant</a>
          </div>

          <div class="footer">
            <p><strong>Support partenaire :</strong><br>
            📧 partenaires@myowntour.com<br>
            📞 +596 696 XX XX XX<br>
            💬 Chat en direct depuis votre tableau de bord</p>
            <p>Ensemble, faisons découvrir les merveilles de la Martinique !<br>
            <strong>L'équipe Myowntour</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Guide welcome email text
  private static getGuideWelcomeText(firstName: string, lastName: string): string {
    return `
Bonjour ${firstName} ${lastName} !

Félicitations ! Votre compte guide Myowntour a été créé et activé avec succès. 
Vous rejoignez notre réseau de guides locaux passionnés.

✅ Votre compte est immédiatement utilisable - aucune confirmation supplémentaire requise !

💼 Vos avantages guide :
• 💰 Commission de seulement 15% (la plus compétitive)
• 🎯 Visibilité accrue sur notre plateforme
• 📊 Outils de gestion des réservations
• 💳 Paiements sécurisés automatisés
• 📈 Statistiques détaillées de performance

🚀 Prochaines étapes :
1. Complétez votre profil - Ajoutez vos informations d'entreprise
2. Créez vos excursions - Présentez vos activités
3. Définissez vos créneaux - Gérez votre planning
4. Attendez la validation - Notre équipe vérifiera votre profil

🚀 Connectez-vous maintenant : https://myowntour.app

Support partenaire :
📧 partenaires@myowntour.com
📞 +596 696 XX XX XX
💬 Chat en direct depuis votre tableau de bord

Ensemble, faisons découvrir les merveilles de la Martinique !

L'équipe Myowntour
    `;
  }

  // Tour operator welcome email HTML
  private static getTourOperatorWelcomeHTML(firstName: string, lastName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue tour-opérateur Myowntour</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #fd7e14; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #fd7e14; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤝 Bienvenue tour-opérateur Myowntour !</h1>
          <p>Votre compte tour-opérateur est activé</p>
        </div>
        <div class="content">
          <h2>Bonjour ${firstName} ${lastName} !</h2>
          <p>Félicitations ! Votre compte tour-opérateur Myowntour a été créé et activé avec succès. Vous rejoignez notre réseau de revendeurs professionnels.</p>
          
          <div class="feature">
            <h3>✅ Votre compte est immédiatement utilisable</h3>
            <p>Aucune confirmation supplémentaire requise !</p>
          </div>

          <h3>💼 Vos avantages tour-opérateur :</h3>
          <div class="feature">
            <strong>🎯 Accès à toutes les excursions</strong><br>
            De nos guides partenaires
          </div>
          <div class="feature">
            <strong>💰 Marge attractive</strong><br>
            Sur chaque vente
          </div>
          <div class="feature">
            <strong>📊 Outils de gestion</strong><br>
            Réservations clients intégrées
          </div>
          <div class="feature">
            <strong>💳 Paiements sécurisés</strong><br>
            Automatisés et fiables
          </div>
          <div class="feature">
            <strong>📈 Statistiques détaillées</strong><br>
            Suivez votre performance
          </div>

          <h3>🚀 Prochaines étapes :</h3>
          <ol>
            <li>Complétez votre profil - Ajoutez vos informations d'entreprise</li>
            <li>Parcourez le catalogue - Découvrez les excursions disponibles</li>
            <li>Commencez à vendre - Proposez les excursions à vos clients</li>
            <li>Attendez la validation - Notre équipe vérifiera votre profil</li>
          </ol>

          <div style="text-align: center;">
            <a href="https://myowntour.app" class="button">🚀 Commencer maintenant</a>
          </div>

          <div class="footer">
            <p><strong>Support tour-opérateurs :</strong><br>
            📧 partenaires@myowntour.com<br>
            📞 +596 696 XX XX XX<br>
            💬 Chat en direct depuis votre tableau de bord</p>
            <p>Ensemble, développons le tourisme martiniquais !<br>
            <strong>L'équipe Myowntour</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Tour operator welcome email text
  private static getTourOperatorWelcomeText(firstName: string, lastName: string): string {
    return `
Bonjour ${firstName} ${lastName} !

Félicitations ! Votre compte tour-opérateur Myowntour a été créé et activé avec succès. 
Vous rejoignez notre réseau de revendeurs professionnels.

✅ Votre compte est immédiatement utilisable - aucune confirmation supplémentaire requise !

💼 Vos avantages tour-opérateur :
• 🎯 Accès à toutes les excursions de nos guides
• 💰 Marge attractive sur chaque vente
• 📊 Outils de gestion des réservations clients
• 💳 Paiements sécurisés automatisés
• 📈 Statistiques détaillées de performance

🚀 Prochaines étapes :
1. Complétez votre profil - Ajoutez vos informations d'entreprise
2. Parcourez le catalogue - Découvrez les excursions disponibles
3. Commencez à vendre - Proposez les excursions à vos clients
4. Attendez la validation - Notre équipe vérifiera votre profil

🚀 Connectez-vous maintenant : https://myowntour.app

Support tour-opérateurs :
📧 partenaires@myowntour.com
📞 +596 696 XX XX XX
💬 Chat en direct depuis votre tableau de bord

Ensemble, développons le tourisme martiniquais !

L'équipe Myowntour
    `;
  }

  // Booking confirmation email HTML
  private static getBookingConfirmationHTML(bookingData: BookingEmailData): string {
    const { firstName, lastName, excursionName, date, time, participants, totalPrice, guideName, guidePhone, meetingPoint } = bookingData;
    
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

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h4>⚠️ Important :</h4>
            <ul>
              <li>Présentez-vous 15 minutes avant l'heure de départ</li>
              <li>Apportez une pièce d'identité</li>
              <li>En cas d'annulation, contactez-nous 24h à l'avance</li>
              <li>Votre guide vous contactera la veille pour confirmer</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>Besoin d'aide ?</strong><br>
            📧 contact@myowntour.com<br>
            📞 +596 696 XX XX XX</p>
            <p>Merci de votre confiance !<br>
            <strong>L'équipe Myowntour</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Booking confirmation email text
  private static getBookingConfirmationText(bookingData: BookingEmailData): string {
    const { firstName, lastName, excursionName, date, time, participants, totalPrice, guideName, guidePhone, meetingPoint } = bookingData;
    
    return `
Bonjour ${firstName} ${lastName} !

Votre réservation a été confirmée avec succès. Voici les détails de votre excursion :

📋 DÉTAILS DE LA RÉSERVATION
🏖️ Excursion : ${excursionName}
📅 Date : ${date}
⏰ Heure : ${time}
👥 Participants : ${participants} personne(s)
👨‍🏫 Guide : ${guideName}
📞 Contact guide : ${guidePhone}
📍 Point de rendez-vous : ${meetingPoint}
💰 Total : ${totalPrice}€

⚠️ IMPORTANT :
• Présentez-vous 15 minutes avant l'heure de départ
• Apportez une pièce d'identité
• En cas d'annulation, contactez-nous 24h à l'avance
• Votre guide vous contactera la veille pour confirmer

Besoin d'aide ?
📧 contact@myowntour.com
📞 +596 696 XX XX XX

Merci de votre confiance !

L'équipe Myowntour
    `;
  }

  // Reminder email HTML
  private static getReminderHTML(reminderData: ReminderEmailData): string {
    const { firstName, lastName, excursionName, date, time, meetingPoint, guideName, guidePhone } = reminderData;
    
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

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <h4>📝 À ne pas oublier :</h4>
            <ul>
              <li>Présentez-vous 15 minutes avant l'heure de départ</li>
              <li>Apportez une pièce d'identité</li>
              <li>Vérifiez la météo et habillez-vous en conséquence</li>
              <li>Apportez de l'eau et de la crème solaire</li>
              <li>Votre guide vous contactera ce soir pour confirmer</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>Besoin d'aide ?</strong><br>
            📧 contact@myowntour.com<br>
            📞 +596 696 XX XX XX</p>
            <p>Profitez bien de votre excursion !<br>
            <strong>L'équipe Myowntour</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Reminder email text
  private static getReminderText(reminderData: ReminderEmailData): string {
    const { firstName, lastName, excursionName, date, time, meetingPoint, guideName, guidePhone } = reminderData;
    
    return `
Bonjour ${firstName} ${lastName} !

Nous vous rappelons que vous avez une excursion prévue demain. Voici les informations importantes :

📋 DÉTAILS DE VOTRE EXCURSION
🏖️ Excursion : ${excursionName}
📅 Date : ${date}
⏰ Heure : ${time}
👨‍🏫 Guide : ${guideName}
📞 Contact guide : ${guidePhone}
📍 Point de rendez-vous : ${meetingPoint}

📝 À NE PAS OUBLIER :
• Présentez-vous 15 minutes avant l'heure de départ
• Apportez une pièce d'identité
• Vérifiez la météo et habillez-vous en conséquence
• Apportez de l'eau et de la crème solaire
• Votre guide vous contactera ce soir pour confirmer

Besoin d'aide ?
📧 contact@myowntour.com
📞 +596 696 XX XX XX

Profitez bien de votre excursion !

L'équipe Myowntour
    `;
  }

  // Password reset email HTML
  private static getPasswordResetHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Réinitialisation de mot de passe</h1>
          <p>Myowntour</p>
        </div>
        <div class="content">
          <h2>Bonjour !</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe Myowntour.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">🔑 Réinitialiser mon mot de passe</a>
          </div>

          <div class="warning">
            <h4>⚠️ Important :</h4>
            <ul>
              <li>Ce lien est valide pendant 1 heure seulement</li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              <li>Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau</li>
            </ul>
          </div>

          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>

          <div class="footer">
            <p><strong>Besoin d'aide ?</strong><br>
            📧 contact@myowntour.com<br>
            📞 +596 696 XX XX XX</p>
            <p>L'équipe Myowntour</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Password reset email text
  private static getPasswordResetText(resetUrl: string): string {
    return `
Réinitialisation de mot de passe Myowntour

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

⚠️ Important :
• Ce lien est valide pendant 1 heure seulement
• Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
• Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau

Besoin d'aide ? Contactez-nous à contact@myowntour.com

L'équipe Myowntour
    `;
  }

  // Check if Resend is configured
  static isConfigured(): boolean {
    return !!import.meta.env.VITE_RESEND_API_KEY;
  }

  // Get configuration instructions
  static getConfigurationInstructions(): string {
    return `
      📧 Configuration Resend requise :
      
      1. Créez un compte sur https://resend.com/
      2. Obtenez votre API key depuis le dashboard
      3. Ajoutez VITE_RESEND_API_KEY dans votre fichier .env
      4. Configurez votre domaine d'envoi (optionnel mais recommandé)
      
      Avantages Resend :
      • 100,000 emails/mois GRATUIT
      • API sécurisée côté serveur
      • Templates professionnels
      • Suivi des livraisons
      • Intégration Supabase parfaite
    `;
  }
}

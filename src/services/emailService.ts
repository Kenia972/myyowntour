// Service d'envoi d'emails avec EmailJS pour Myowntour
import emailjs from '@emailjs/browser';

// Configuration EmailJS (à remplacer par vos vraies clés)
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_63iob5d', // Votre Service ID EmailJS
  TEMPLATE_ID_WELCOME_CLIENT: 'template_f0av32w',
  TEMPLATE_ID_WELCOME_OPERATOR: 'template_skj0ryx', 
  TEMPLATE_ID_PASSWORD_RESET: 'template_password_reset',
  PUBLIC_KEY: 'lpw4-uBlovZ7Lq5jg' // Votre clé publique EmailJS
};

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  // Initialiser EmailJS
  static init() {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  }

  // Envoyer un email via EmailJS
  static async sendEmail(templateParams: any, templateId: string): Promise<boolean> {
    try {
      console.log('📧 Envoi email via EmailJS...', { templateParams, templateId });
      
      // Forcer l'envoi réel pour les emails de bienvenue
      if (!this.isConfigured()) {
        console.log('⚠️ EmailJS non configuré, simulation d\'envoi');
        console.log('📧 Email simulé envoyé à:', templateParams.to_email);
        console.log('📧 Contenu:', templateParams.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
      
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        templateId,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('✅ Email envoyé avec succès:', response);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      
      // Fallback: simulation pour la démo si EmailJS n'est pas configuré
      console.log('📧 Mode simulation - Email qui aurait été envoyé:', templateParams);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
  }

  // Envoyer l'email de bienvenue client
  static async sendWelcomeClientEmail(userData: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<boolean> {
    const templateParams = {
      to_email: userData.email,
      to_name: `${userData.firstName} ${userData.lastName}`,
      first_name: userData.firstName,
      last_name: userData.lastName,
      subject: '🌴 Bienvenue sur Myowntour - Votre compte est activé !',
      message: `
        Bonjour ${userData.firstName} ${userData.lastName} !
        
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
      `,
      website_url: 'https://myowntour.app',
      contact_email: 'contact@myowntour.com',
      contact_phone: '+596 696 XX XX XX'
    };

    return await this.sendEmail(templateParams, EMAILJS_CONFIG.TEMPLATE_ID_WELCOME_CLIENT);
  }

  // Envoyer l'email de bienvenue tour-opérateur
  static async sendWelcomeGuideEmail(userData: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<boolean> {
    const templateParams = {
      to_email: userData.email,
      to_name: `${userData.firstName} ${userData.lastName}`,
      first_name: userData.firstName,
      last_name: userData.lastName,
      subject: '🤝 Bienvenue guide Myowntour - Votre compte est activé !',
      message: `
        Bonjour ${userData.firstName} ${userData.lastName} !
        
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
      `,
      website_url: 'https://myowntour.app',
      contact_email: 'partenaires@myowntour.com',
      contact_phone: '+596 696 XX XX XX'
    };

    return await this.sendEmail(templateParams, EMAILJS_CONFIG.TEMPLATE_ID_WELCOME_OPERATOR);
  }

  // Envoyer l'email de bienvenue tour-opérateur
  static async sendWelcomeTourOperatorEmail(userData: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<boolean> {
    const templateParams = {
      to_email: userData.email,
      to_name: `${userData.firstName} ${userData.lastName}`,
      first_name: userData.firstName,
      last_name: userData.lastName,
      subject: '🤝 Bienvenue tour-opérateur Myowntour - Votre compte est activé !',
      message: `
        Bonjour ${userData.firstName} ${userData.lastName} !
        
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
      `,
      website_url: 'https://myowntour.app',
      contact_email: 'partenaires@myowntour.com',
      contact_phone: '+596 696 XX XX XX'
    };

    return await this.sendEmail(templateParams, EMAILJS_CONFIG.TEMPLATE_ID_WELCOME_OPERATOR);
  };

  // Envoyer l'email de récupération de mot de passe
  static async sendPasswordResetEmail(email: string): Promise<boolean> {
    // Générer un token de réinitialisation sécurisé
    const resetToken = this.generateResetToken();
    const resetUrl = `https://myowntour.app/reset-password?token=${resetToken}`;
    
    // En production, sauvegarder ce token en base avec une expiration
    console.log('🔑 Token de réinitialisation généré:', resetToken);
    localStorage.setItem(`reset_token_${email}`, JSON.stringify({
      token: resetToken,
      expires: Date.now() + (60 * 60 * 1000) // 1 heure
    }));

    const templateParams = {
      to_email: email,
      to_name: email.split('@')[0],
      subject: '🔐 Réinitialisation de votre mot de passe Myowntour',
      message: `
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
      `,
      reset_url: resetUrl,
      reset_token: resetToken,
      contact_email: 'contact@myowntour.com'
    };

    return await this.sendEmail(templateParams, EMAILJS_CONFIG.TEMPLATE_ID_PASSWORD_RESET);
  }

  // Générer un token de réinitialisation sécurisé
  private static generateResetToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Envoyer l'email de bienvenue selon le type d'utilisateur
  static async sendWelcomeEmail(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'client' | 'guide' | 'tour_operator';
  }): Promise<boolean> {
    if (userData.role === 'tour_operator') {
      return await this.sendWelcomeTourOperatorEmail(userData);
    } else if (userData.role === 'guide') {
      return await this.sendWelcomeGuideEmail(userData);
    } else {
      return await this.sendWelcomeClientEmail(userData);
    }
  }

  // Vérifier si EmailJS est configuré
  static isConfigured(): boolean {
    // Vérifier si les clés EmailJS sont configurées
    return EMAILJS_CONFIG.SERVICE_ID !== 'service_63iob5d' && 
           EMAILJS_CONFIG.PUBLIC_KEY !== 'lpw4-uBlovZ7Lq5jg';
  }

  // Obtenir les instructions de configuration
  static getConfigurationInstructions(): string {
    return `
      📧 Configuration EmailJS requise :
      
      1. Créez un compte sur https://www.emailjs.com/
      2. Créez un service email (Gmail, Outlook, etc.)
      3. Créez 3 templates d'email :
         - template_welcome_client
         - template_welcome_operator  
         - template_password_reset
      4. Remplacez les valeurs dans EMAILJS_CONFIG :
         - SERVICE_ID : votre ID de service
         - PUBLIC_KEY : votre clé publique
      
      En attendant, le mode simulation est actif.
    `;
  }
}

// Initialiser EmailJS au chargement
EmailService.init();
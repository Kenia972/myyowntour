import React, { useState } from 'react';
import { X, Mail, Lock, User, Building, ArrowLeft } from 'lucide-react';
import { ResendEmailService } from '../../services/resendEmailService';
import { useAuth } from '../../contexts/AuthContext';

// Initialize Resend Email Service
const emailService = new ResendEmailService();

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  defaultRole?: 'client' | 'guide' | 'tour_operator';
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  defaultMode = 'signin', 
  defaultRole = 'client'
}: AuthModalProps) {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>(defaultMode);
  const [role, setRole] = useState<'client' | 'guide' | 'tour_operator'>(defaultRole || 'client');
  
  // Debug mode changes
  React.useEffect(() => {
    console.log('🔄 AuthModal mode changed to:', mode);
  }, [mode]);
  
  // Debug: afficher les valeurs reçues
  React.useEffect(() => {
    if (defaultMode) setMode(defaultMode);
    if (defaultRole) setRole(defaultRole);
  }, [defaultMode, defaultRole]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    confirmPassword: '',
    resetEmail: ''
  });

  if (!isOpen) return null;

  const sendWelcomeEmail = async (userData: any) => {
    try {
      await emailService.sendWelcomeEmail({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      });
      return true;
    } catch (error) {
      console.error('Erreur envoi email de bienvenue:', error);
      return false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await emailService.sendPasswordResetEmail(formData.resetEmail);
      setSuccess('Un email de récupération a été envoyé à votre adresse email.');
      
      // Retour au mode connexion après 3 secondes
      setTimeout(() => {
        setMode('signin');
        setSuccess(null);
        setFormData(prev => ({ ...prev, resetEmail: '' }));
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email de récupération.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup' && formData.password !== formData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      
      if (mode === 'signup') {
        // Inscription avec Supabase
        const { data, error } = await signUp(formData.email, formData.password, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: role
        });
        
        if (error) {
          throw new Error(error.message || 'Erreur lors de l\'inscription');
        }
        
        if (data?.user) {
          // Envoyer l'email de bienvenue
          const userData = {
            email: formData.email,
            firstName: formData.first_name,
            lastName: formData.last_name,
            role: role
          };
          
          await sendWelcomeEmail(userData);
          setSuccess('🎉 Inscription réussie ! Vérifiez votre email pour confirmer votre compte et pouvoir vous connecter.');
          
          // Don't close modal immediately - let user see the verification message
          // Only close after user has time to read the important verification notice
          setTimeout(() => {
            onClose();
          }, 8000); // Give user 8 seconds to read the verification message
        }
      } else {
        // Connexion avec Supabase
        const { data, error } = await signIn(formData.email, formData.password);
        
        if (error) {
          throw new Error(error.message || 'Erreur lors de la connexion');
        }
        
        if (data?.user) {
          setSuccess('Connexion réussie !');
          
          // Fermer le modal après succès
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Rendu du formulaire de récupération de mot de passe
  if (mode === 'forgot-password') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mot de passe oublié
            </h2>
            <p className="text-gray-600">
              Entrez votre email pour recevoir un lien de récupération
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="resetEmail"
                  value={formData.resetEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de récupération'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode('signin')}
              className="flex items-center justify-center text-gray-600 hover:text-gray-800 mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'signin' ? 'Connexion' : 'Inscription'}
            {role === 'tour_operator' ? ' Tour-opérateur' : 
             role === 'guide' ? ' Guide' : ' Voyageur'}
          </h2>
          <p className="text-gray-600">
            {mode === 'signin' ? (
              role === 'tour_operator'
                ? 'Accédez à votre espace tour-opérateur'
              : role === 'guide'
                ? 'Accédez à votre espace guide'
                : 'Connectez-vous à votre compte voyageur'
            ) : (
              role === 'tour_operator'
                ? 'Rejoignez notre réseau de tour-opérateurs'
              : role === 'guide'
                ? 'Rejoignez notre réseau de guides'
                : 'Créez votre compte voyageur'
            )}
          </p>
        </div>

        {mode === 'signup' && !defaultRole && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de compte
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  role === 'client'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Voyageur</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('guide')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  role === 'guide'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Guide</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('tour_operator')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  role === 'tour_operator'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Tour-opérateur</span>
              </button>
            </div>
          </div>
        )}

        {/* Email verification notice above signup form */}
        {mode === 'signup' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <div className="text-amber-600 mr-2 mt-0.5">ℹ️</div>
              <div className="text-xs text-amber-800">
                <p className="font-medium">Important:</p>
                <p>Après l'inscription, vous recevrez un email de confirmation. Vérifiez votre email pour activer votre compte.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">
                Utilisez une adresse email valide - vous recevrez un lien de confirmation
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
              
              {/* Email verification notice for signup */}
              {mode === 'signup' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-blue-600 mr-3 mt-0.5">📧</div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">Vérification de votre email requise</p>
                      <p className="text-xs mb-2 text-blue-700">
                        <strong>Email:</strong> {formData.email}
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>• Vérifiez votre boîte de réception (et spam)</li>
                        <li>• Cliquez sur le lien de confirmation dans l'email</li>
                        <li>• Revenez ici pour vous connecter après vérification</li>
                      </ul>
                      <p className="text-xs mt-2 text-blue-700">
                        <strong>Note:</strong> Sans vérification, vous ne pourrez pas vous connecter.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Chargement...' : (mode === 'signin' ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        {mode === 'signin' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setMode('forgot-password')}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Mot de passe oublié ?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === 'signin' ? (
              role === 'tour_operator'
                ? 'Pas encore tour-opérateur ?'
              : role === 'guide'
                ? 'Pas encore guide ?'
                : 'Pas encore de compte ?'
            ) : (
              role === 'tour_operator'
                ? 'Déjà tour-opérateur ?'
              : role === 'guide'
                ? 'Déjà guide ?'
                : 'Déjà un compte ?'
            )}
            <button
              onClick={() => {
                const newMode = mode === 'signin' ? 'signup' : 'signin';
                console.log('🔄 Switching mode from', mode, 'to', newMode);
                setMode(newMode);
              }}
              className="text-blue-500 hover:text-blue-600 font-medium ml-1"
            >
              {mode === 'signin' ? (
                role === 'tour_operator' ? 'Devenir tour-opérateur' :
                role === 'guide' ? 'Devenir guide' : 'S\'inscrire'
              ) : (
                'Se connecter'
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
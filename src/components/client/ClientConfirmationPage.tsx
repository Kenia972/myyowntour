import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Booking, Excursion } from '../../lib/supabase';

interface ClientConfirmationPageProps {}

export function ClientConfirmationPage({}: ClientConfirmationPageProps) {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [excursion, setExcursion] = useState<Excursion | null>(null);
  const [tourOperator, setTourOperator] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  
  // Payment validation state
  const [cardValidation, setCardValidation] = useState({
    cardNumber: { isValid: false, type: '' },
    expiry: { isValid: false, message: '' },
    cvv: { isValid: false },
    cardholderName: { isValid: false }
  });
  
  // Test card details for demo
  const testCards = [
    {
      name: 'Visa Test Card',
      number: '4242424242424242',
      expiry: '12/25',
      cvv: '123',
      description: 'Successful payment',
      type: 'visa'
    },
    {
      name: 'Mastercard Test Card',
      number: '5555555555554444',
      expiry: '12/25',
      cvv: '123',
      description: 'Successful payment',
      type: 'mastercard'
    },
    {
      name: 'American Express Test',
      number: '378282246310005',
      expiry: '12/25',
      cvv: '1234',
      description: 'Successful payment',
      type: 'amex'
    },
    {
      name: 'Declined Card',
      number: '4000000000000002',
      expiry: '12/25',
      cvv: '123',
      description: 'Payment declined',
      type: 'visa'
    }
  ];

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load booking details with excursion and tour operator info
      const { data: bookingData, error: bookingError } = await supabase!
        .from('bookings')
        .select(`
          *,
          excursion:excursions(*),
          tour_operator:tour_operators(*)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) {
        throw new Error(`Erreur lors du chargement de la réservation: ${bookingError.message}`);
      }

      if (!bookingData) {
        throw new Error('Réservation non trouvée');
      }

      setBooking(bookingData);
      setExcursion(bookingData.excursion);
      setTourOperator(bookingData.tour_operator);

      // Check if booking is already confirmed
      if (bookingData.status === 'confirmed') {
        setPaymentSuccess(true);
      }

    } catch (error) {
      console.error('❌ Error loading booking details:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);

      // Validate payment form
      if (!validatePaymentForm()) {
        return;
      }

      // Check if it's a declined test card
      if (paymentForm.cardNumber === '4000000000000002') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Paiement refusé par la banque. Veuillez utiliser une autre carte.');
      }

      // Enhanced payment processing simulation
      console.log('💳 Processing payment with card:', paymentForm.cardNumber.substring(0, 4) + '****');
      
      // Simulate real payment processing steps
      const paymentSteps = [
        'Validation de la carte...',
        'Vérification des fonds...',
        'Traitement du paiement...',
        'Confirmation de la transaction...'
      ];
      
      for (let i = 0; i < paymentSteps.length; i++) {
        console.log(`🔄 ${paymentSteps[i]}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Update booking status to confirmed
      const { error: updateError } = await supabase!
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }

      // Update local state
      setPaymentSuccess(true);
      setBooking(prev => prev ? { ...prev, status: 'confirmed' } : null);

      console.log('✅ Payment confirmed successfully');

    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la confirmation');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Real-time card validation functions
  const validateCardNumber = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    const isValid = /^\d{13,19}$/.test(cleanNumber);
    
    // Detect card type
    let type = '';
    if (/^4/.test(cleanNumber)) type = 'visa';
    else if (/^5[1-5]/.test(cleanNumber)) type = 'mastercard';
    else if (/^3[47]/.test(cleanNumber)) type = 'amex';
    else if (/^6/.test(cleanNumber)) type = 'discover';
    
    setCardValidation(prev => ({
      ...prev,
      cardNumber: { isValid, type }
    }));
    
    return isValid;
  };
  
  const validateExpiry = (month: string, year: string) => {
    if (!month || !year) return false;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    let isValid = false;
    let message = '';
    
    if (expYear < currentYear) {
      message = 'Carte expirée';
    } else if (expYear === currentYear && expMonth < currentMonth) {
      message = 'Carte expirée';
    } else if (expMonth < 1 || expMonth > 12) {
      message = 'Mois invalide';
    } else {
      isValid = true;
      message = 'Valide';
    }
    
    setCardValidation(prev => ({
      ...prev,
      expiry: { isValid, message }
    }));
    
    return isValid;
  };
  
  const validateCVV = (cvv: string) => {
    const isValid = /^\d{3,4}$/.test(cvv);
    setCardValidation(prev => ({
      ...prev,
      cvv: { isValid }
    }));
    return isValid;
  };
  
  const validateCardholderName = (name: string) => {
    const isValid = name.trim().length >= 3;
    setCardValidation(prev => ({
      ...prev,
      cardholderName: { isValid }
    }));
    return isValid;
  };
  
  const isFormValid = () => {
    return cardValidation.cardNumber.isValid && 
           cardValidation.expiry.isValid && 
           cardValidation.cvv.isValid && 
           cardValidation.cardholderName.isValid;
  };
  
  const fillTestCard = (testCard: typeof testCards[0]) => {
    setPaymentForm({
      cardNumber: testCard.number,
      expiryMonth: testCard.expiry.split('/')[0],
      expiryYear: testCard.expiry.split('/')[1],
      cvv: testCard.cvv,
      cardholderName: 'Test User'
    });
    
    // Validate the filled card
    validateCardNumber(testCard.number);
    validateExpiry(testCard.expiry.split('/')[0], testCard.expiry.split('/')[1]);
    validateCVV(testCard.cvv);
    validateCardholderName('Test User');
  };

  const validatePaymentForm = () => {
    if (!paymentForm.cardNumber || !paymentForm.expiryMonth || !paymentForm.expiryYear || !paymentForm.cvv || !paymentForm.cardholderName) {
      setError('Veuillez remplir tous les champs de paiement');
      return false;
    }
    
    if (paymentForm.cardNumber.length < 13 || paymentForm.cardNumber.length > 19) {
      setError('Numéro de carte invalide');
      return false;
    }
    
    if (paymentForm.cvv.length < 3 || paymentForm.cvv.length > 4) {
      setError('Code de sécurité invalide');
      return false;
    }
    
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre réservation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToHome}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!booking || !excursion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Réservation non trouvée</h1>
          <p className="text-gray-600 mb-6">Impossible de charger les détails de votre réservation.</p>
          <button
            onClick={handleBackToHome}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🎉 Réservation Confirmée !</h1>
          <p className="text-gray-600 mb-6">
            Votre paiement a été traité avec succès. Votre réservation est maintenant confirmée !
          </p>
          <div className="bg-white rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Détails de la réservation :</h3>
            <p className="text-sm text-gray-600">
              <strong>Activité :</strong> {excursion.title}<br />
              <strong>Date :</strong> {new Date(booking.booking_date).toLocaleDateString('fr-FR')}<br />
              <strong>Participants :</strong> {booking.participants_count}<br />
              <strong>Montant :</strong> {booking.total_amount}€
            </p>
          </div>
          <button
            onClick={handleBackToHome}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBackToHome}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </button>
              <h1 className="text-xl font-bold text-gray-900">Confirmation de réservation</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {booking.status === 'pending' ? 'En attente' : 'Confirmée'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Résumé de votre réservation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Excursion Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">🏔️ Activité</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{excursion.title}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{excursion.duration_hours}h</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">Max {excursion.max_participants} participants</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    {new Date(booking.booking_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">📋 Détails de la réservation</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom du client :</span>
                  <span className="font-medium text-gray-900">{booking.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email :</span>
                  <span className="font-medium text-gray-900">{booking.client_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants :</span>
                  <span className="font-medium text-gray-900">{booking.participants_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agence :</span>
                  <span className="font-medium text-gray-900">{tourOperator?.company_name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total à payer :</span>
              <span className="text-3xl font-bold text-blue-600">{booking.total_amount}€</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💳 Paiement et confirmation</h2>
          
          {booking.status === 'pending' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Réservation en attente de confirmation</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Votre réservation a été créée par {tourOperator?.company_name || 'l\'agence'}. 
                      Pour la confirmer et garantir votre place, veuillez procéder au paiement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations de paiement</h3>
                
                {/* Test Card Selection */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">🧪 Cartes de test disponibles :</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {testCards.map((card, index) => (
                      <button
                        key={index}
                        onClick={() => fillTestCard(card)}
                        className="text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-blue-900">{card.name}</div>
                        <div className="text-sm text-blue-700">{card.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Interactive Payment Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du titulaire de la carte
                    </label>
                    <input
                      type="text"
                      value={paymentForm.cardholderName}
                      onChange={(e) => {
                        setPaymentForm(prev => ({ ...prev, cardholderName: e.target.value }));
                        validateCardholderName(e.target.value);
                      }}
                      placeholder="John Doe"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        cardValidation.cardholderName.isValid 
                          ? 'border-green-300 bg-green-50' 
                          : cardValidation.cardholderName.isValid === false 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                      }`}
                    />
                    {cardValidation.cardholderName.isValid === false && (
                      <p className="text-red-600 text-sm mt-1">Le nom doit contenir au moins 3 caractères</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de carte
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={paymentForm.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                        onChange={(e) => {
                          const cleanNumber = e.target.value.replace(/\s/g, '');
                          setPaymentForm(prev => ({ ...prev, cardNumber: cleanNumber }));
                          validateCardNumber(cleanNumber);
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`w-full px-3 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          cardValidation.cardNumber.isValid 
                            ? 'border-green-300 bg-green-50' 
                            : cardValidation.cardNumber.isValid === false 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-300'
                        }`}
                      />
                      {cardValidation.cardNumber.type && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className={`w-8 h-5 rounded ${
                            cardValidation.cardNumber.type === 'visa' ? 'bg-blue-600' :
                            cardValidation.cardNumber.type === 'mastercard' ? 'bg-red-600' :
                            cardValidation.cardNumber.type === 'amex' ? 'bg-green-600' :
                            'bg-gray-600'
                          }`}></div>
                        </div>
                      )}
                    </div>
                    {cardValidation.cardNumber.isValid === false && (
                      <p className="text-red-600 text-sm mt-1">Numéro de carte invalide</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mois (MM)
                      </label>
                                              <input
                          type="text"
                          value={paymentForm.expiryMonth}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryMonth: e.target.value }))}
                          placeholder="12"
                          maxLength={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Année (AA)
                      </label>
                                              <input
                          type="text"
                          value={paymentForm.expiryYear}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryYear: e.target.value }))}
                          placeholder="25"
                          maxLength={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                                              <input
                          type="text"
                          value={paymentForm.cvv}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, cvv: e.target.value }))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                  </div>
                </div>

                {/* Validation Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">✅ Validation en temps réel :</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className={`flex items-center ${cardValidation.cardNumber.isValid ? 'text-green-600' : 'text-gray-500'}`}>
                      {cardValidation.cardNumber.isValid ? '✓' : '○'} Numéro de carte
                    </div>
                    <div className={`flex items-center ${cardValidation.expiry.isValid ? 'text-green-600' : 'text-gray-500'}`}>
                      {cardValidation.expiry.isValid ? '✓' : '○'} Date d'expiration
                    </div>
                    <div className={`flex items-center ${cardValidation.cvv.isValid ? 'text-green-600' : 'text-gray-500'}`}>
                      {cardValidation.cvv.isValid ? '✓' : '○'} Code de sécurité
                    </div>
                    <div className={`flex items-center ${cardValidation.cardholderName.isValid ? 'text-green-600' : 'text-gray-500'}`}>
                      {cardValidation.cardholderName.isValid ? '✓' : '○'} Nom du titulaire
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    <strong>✅ Système de paiement fonctionnel :</strong> Utilisez les cartes de test ci-dessus 
                    pour simuler des paiements réels. Le système valide les informations et traite les paiements en temps réel.
                  </p>
                </div>

                {/* Payment Processing Steps */}
                {paymentProcessing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-3">🔄 Traitement du paiement en cours...</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-blue-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        Validation de la carte
                      </div>
                      <div className="flex items-center text-blue-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        Vérification des fonds
                      </div>
                      <div className="flex items-center text-blue-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        Traitement du paiement
                      </div>
                      <div className="flex items-center text-blue-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        Confirmation de la transaction
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePaymentConfirmation}
                  disabled={paymentProcessing || !isFormValid()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold text-lg flex items-center justify-center transition-colors"
                >
                  {paymentProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Traitement du paiement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Confirmer et Payer {booking.total_amount}€
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-bounce mb-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🎉 Réservation confirmée !</h3>
              <p className="text-gray-600 mb-4">Votre réservation a été confirmée avec succès !</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-green-800 text-sm">
                  <strong>✅ Paiement traité :</strong> Votre transaction a été validée et votre place est garantie.
                  Vous recevrez un email de confirmation dans quelques instants.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        {tourOperator && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📞 Informations de contact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Agence de voyage</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Nom :</strong> {tourOperator.company_name}</p>
                  {tourOperator.city && <p><strong>Ville :</strong> {tourOperator.city}</p>}
                  {tourOperator.phone && <p><strong>Téléphone :</strong> {tourOperator.phone}</p>}
                  {tourOperator.website && (
                    <p><strong>Site web :</strong> 
                      <a 
                        href={tourOperator.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        {tourOperator.website}
                      </a>
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Besoin d'aide ?</h3>
                <p className="text-gray-600 mb-4">
                  Si vous avez des questions concernant votre réservation, 
                  n'hésitez pas à contacter l'agence directement.
                </p>
                <button
                  onClick={() => window.open(`mailto:${tourOperator.email || 'contact@agence.com'}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Contacter l'agence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

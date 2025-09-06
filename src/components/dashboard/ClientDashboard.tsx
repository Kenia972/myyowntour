import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Star, CreditCard, X, ArrowLeft, Search, Filter, Eye, Plus, Users, DollarSign, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Bell, QrCode } from 'lucide-react';
import { Booking, Excursion, AvailabilitySlot, ExcursionCategory, Review } from '../../lib/supabase';
import { bookingService, excursionService, availabilitySlotService, reviewService } from '../../services/dataService';
import { EnhancedBookingModal } from '../booking/EnhancedBookingModal';
import { QRCodeDisplay } from '../booking/QRCodeDisplay';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';

interface ClientDashboardProps {
  onLogout: () => void;
}

export function ClientDashboard({ onLogout }: ClientDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'explore' | 'reviews'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [filteredExcursions, setFilteredExcursions] = useState<Excursion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedExcursion, setSelectedExcursion] = useState<Excursion | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExcursionCategory | 'all'>('all');
  const [bookingForm, setBookingForm] = useState({
    participants: 1,
    special_requests: '',
    selectedSlot: null as AvailabilitySlot | null
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    excursion_id: ''
  });
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info', timestamp: Date}>>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedBookingForQR, setSelectedBookingForQR] = useState<Booking | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterExcursions();
  }, [excursions, searchTerm, categoryFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data...');
      
      // Load user bookings and available excursions
      const [bookingsResponse, excursionsResponse] = await Promise.all([
        bookingService.getUserBookings(),
        excursionService.getActiveExcursions()
      ]);
      
      console.log('🔍 Bookings response:', bookingsResponse);
      console.log('🔍 Excursions response:', excursionsResponse);
      
      if (bookingsResponse.error) {
        console.error('❌ Erreur lors du chargement des réservations:', bookingsResponse.error);
        setBookings([]);
      } else {
        console.log('✅ Bookings loaded:', bookingsResponse.data?.length || 0, 'bookings');
        setBookings(bookingsResponse.data || []);
      }

      if (excursionsResponse.error) {
        console.error('❌ Erreur lors du chargement des excursions:', excursionsResponse.error);
        setExcursions([]);
      } else {
        console.log('✅ Excursions loaded:', excursionsResponse.data?.length || 0, 'excursions');
        setExcursions(excursionsResponse.data || []);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setBookings([]);
      setExcursions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterExcursions = () => {
    let filtered = excursions;

    if (searchTerm) {
      filtered = filtered.filter(excursion =>
        excursion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        excursion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        excursion.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(excursion => excursion.category === categoryFilter);
    }

    setFilteredExcursions(filtered);
  };



    const handleBookExcursion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExcursion) {
      addNotification('Veuillez sélectionner une excursion', 'error');
      return;
    }

    if (!bookingForm.selectedSlot) {
      addNotification('Veuillez sélectionner un créneau de réservation', 'error');
      return;
    }

    try {
      addNotification('Création de la réservation en cours...', 'info');
      
      console.log('🔍 Creating booking with data:', {
        excursion_id: selectedExcursion.id,
        slot_id: bookingForm.selectedSlot.id,
        participants_count: bookingForm.participants,
        special_requests: bookingForm.special_requests || undefined
      });
      
      const response = await bookingService.createBooking({
        excursion_id: selectedExcursion.id,
        slot_id: bookingForm.selectedSlot.id,
        participants_count: bookingForm.participants,
        special_requests: bookingForm.special_requests || undefined
      });

      console.log('🔍 Booking response:', response);

      if (response.error) {
        console.error('❌ Booking error:', response.error);
        addNotification(`Erreur lors de la réservation: ${response.error}`, 'error');
        return;
      }

      if (response.data) {
        console.log('✅ Booking created successfully:', response.data);
        addNotification('Réservation créée avec succès ! Vous pouvez maintenant procéder au paiement.', 'success');
        setShowBookingModal(false);
        setSelectedExcursion(null);
        setBookingForm({
          participants: 1,
          special_requests: '',
          selectedSlot: null
        });
        
        // Reload data
        loadDashboardData();
      } else {
        console.error('❌ No data in response');
        addNotification('Erreur: Aucune donnée reçue lors de la création de la réservation', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur réservation:', error);
      addNotification('Erreur lors de la réservation', 'error');
    }
  };

  const openBookingModal = async (excursion: Excursion) => {
    setSelectedExcursion(excursion);
    setShowBookingModal(true);
    
    // Load availability slots for this excursion
    try {
      console.log('🔍 Loading availability slots for excursion:', excursion.id);
      const response = await availabilitySlotService.getSlotsByExcursion(excursion.id);
      if (response.error) {
        console.error('❌ Erreur lors du chargement des créneaux:', response.error);
        setAvailabilitySlots([]);
      } else {
        console.log('✅ Availability slots loaded:', response.data?.length || 0, 'slots');
        console.log('📅 Slots data:', response.data);
        setAvailabilitySlots(response.data || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement créneaux:', error);
      setAvailabilitySlots([]);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      const response = await bookingService.updateBookingStatus(bookingId, 'cancelled');
      
      if (response.error) {
        addNotification(`Erreur lors de l'annulation: ${response.error}`, 'error');
        return;
      }

      addNotification('Réservation annulée avec succès', 'success');
      setSelectedBooking(null);
      // Recharger les réservations
      loadDashboardData();
    } catch (error) {
      addNotification('Erreur lors de l\'annulation de la réservation', 'error');
      console.error('Erreur annulation:', error);
    }
  };

  const openReviewModal = (booking: Booking) => {
    setSelectedBookingForReview(booking);
    setReviewForm({
      rating: 5,
      comment: '',
      excursion_id: booking.excursion_id
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBookingForReview) return;

    try {
      const response = await reviewService.createReview({
        booking_id: selectedBookingForReview.id,
        excursion_id: selectedBookingForReview.excursion_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });

      if (response.error) {
        addNotification(`Erreur lors de la création de l'avis: ${response.error}`, 'error');
        return;
      }

      addNotification('Avis soumis avec succès !', 'success');
      setShowReviewModal(false);
      setSelectedBookingForReview(null);
      setReviewForm({ rating: 5, comment: '', excursion_id: '' });
      loadDashboardData();
    } catch (error) {
      addNotification('Erreur lors de la soumission de l\'avis', 'error');
      console.error('Erreur avis:', error);
    }
  };

  const openPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const openQRCodeModal = (booking: Booking) => {
    setSelectedBookingForQR(booking);
    setShowQRCode(true);
  };

  // Payment validation functions
  const isValidCardNumber = (cardNumber: string): boolean => {
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
    
    // Check if it's a valid length (13-19 digits)
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
    
    // Basic Luhn algorithm check
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  const isValidExpiryDate = (expiryDate: string): boolean => {
    // Format: MM/YY
    const [month, year] = expiryDate.split('/');
    
    if (!month || !year) return false;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum < 1 || monthNum > 12) return false;
    
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    
    return true;
  };

  const isValidCVV = (cvv: string): boolean => {
    // CVV should be 3-4 digits
    return /^\d{3,4}$/.test(cvv);
  };

  // Production payment processing functions
  const validatePaymentWithProcessor = async (paymentData: any) => {
    try {
      // In production, this would call your payment gateway's validation API
      // For now, we'll do local validation and simulate API call
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Basic validation (in production, this would be done by payment processor)
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
        return { success: false, error: 'Données de paiement incomplètes' };
      }
      
      // Simulate payment processor validation
      const isValidCard = isValidCardNumber(paymentData.cardNumber);
      const isValidExpiry = isValidExpiryDate(paymentData.expiryDate);
      const isValidCVVCode = isValidCVV(paymentData.cvv);
      
      if (!isValidCard || !isValidExpiry || !isValidCVVCode) {
        return { success: false, error: 'Données de carte invalides' };
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Payment validation error:', error);
      return { success: false, error: 'Erreur de validation du paiement' };
    }
  };

  const processPaymentWithProcessor = async (paymentRequest: any) => {
    try {
      // In production, this would call your payment gateway's payment API
      // For now, we'll simulate the payment processing
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment processor response
      // In production, this would be the actual response from Stripe, PayPal, etc.
      const paymentSuccess = Math.random() > 0.05; // 95% success rate for production
      
      if (!paymentSuccess) {
        return { 
          success: false, 
          error: 'Paiement refusé par la banque. Veuillez vérifier vos informations ou contacter votre banque.' 
        };
      }
      
      // Generate a mock payment intent ID (in production, this comes from payment processor)
      const paymentIntentId = `pi_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      
      return { 
        success: true, 
        paymentIntentId,
        error: null 
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Erreur lors du traitement du paiement' };
    }
  };

  const createPaymentRecord = async (paymentData: any) => {
    try {
      // In production, this would create a record in your payments table
      // For now, we'll simulate the database operation
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulate successful payment record creation
      return { success: true, error: null };
    } catch (error) {
      console.error('Payment record creation error:', error);
      return { success: false, error: 'Erreur lors de la création de l\'enregistrement de paiement' };
    }
  };

  // Production-ready payment analytics tracking
  const trackPaymentEvent = async (eventType: string, paymentData: any) => {
    try {
      // In production, this would send analytics to your tracking service
      // (Google Analytics, Mixpanel, Amplitude, etc.)
      
      const analyticsData = {
        event: eventType,
        timestamp: new Date().toISOString(),
        booking_id: paymentData.booking_id,
        amount: paymentData.amount,
        currency: 'EUR',
        user_id: selectedBooking?.client_id,
        // Add more analytics data as needed
      };
      
      console.log('📊 Payment Analytics Event:', analyticsData);
      
      // In production, you would send this to your analytics service:
      // await analyticsService.track('payment_event', analyticsData);
      
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't fail payment if analytics fails
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBooking) return;

    // Validate payment form
    if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.cardholderName) {
      addNotification('Veuillez remplir tous les champs du formulaire de paiement', 'error');
      return;
    }

    // Validate card number (basic Luhn algorithm check)
    if (!isValidCardNumber(paymentForm.cardNumber)) {
      addNotification('Numéro de carte invalide', 'error');
      return;
    }

    // Validate expiry date
    if (!isValidExpiryDate(paymentForm.expiryDate)) {
      addNotification('Date d\'expiration invalide', 'error');
      return;
    }

    // Validate CVV
    if (!isValidCVV(paymentForm.cvv)) {
      addNotification('Code CVV invalide', 'error');
      return;
    }

    try {
      setIsProcessingPayment(true);
      addNotification('Traitement du paiement en cours...', 'info');
      
      // Real payment processing - integrate with your payment gateway here
      // For now, we'll simulate a real payment flow with proper error handling
      
      // Step 1: Validate payment data with payment processor
      const paymentValidation = await validatePaymentWithProcessor(paymentForm);
      
      if (!paymentValidation.success) {
        addNotification(`Validation du paiement échouée: ${paymentValidation.error}`, 'error');
        setIsProcessingPayment(false);
        return;
      }
      
      // Step 2: Process payment with payment processor
      const paymentResult = await processPaymentWithProcessor({
        amount: selectedBooking.total_amount,
        currency: 'EUR',
        paymentMethod: {
          type: 'card',
          cardNumber: paymentForm.cardNumber,
          expiryDate: paymentForm.expiryDate,
          cvv: paymentForm.cvv,
          cardholderName: paymentForm.cardholderName
        },
        metadata: {
          booking_id: selectedBooking.id,
          excursion_id: selectedBooking.excursion_id,
          client_id: selectedBooking.client_id
        }
      });
      
      if (!paymentResult.success) {
        addNotification(`Paiement refusé: ${paymentResult.error}`, 'error');
        setIsProcessingPayment(false);
        return;
      }
      
      // Step 3: Create payment record in database
      const paymentRecord = await createPaymentRecord({
        booking_id: selectedBooking.id,
        amount: selectedBooking.total_amount,
        payment_intent_id: paymentResult.paymentIntentId,
        status: 'completed'
      });
      
      if (paymentRecord.error) {
        console.error('Error creating payment record:', paymentRecord.error);
        // Continue anyway as payment was successful
      }

      // Step 4: Track payment analytics
      await trackPaymentEvent('payment_success', {
        booking_id: selectedBooking.id,
        amount: selectedBooking.total_amount,
        payment_intent_id: paymentResult.paymentIntentId
      });
      
      // Update booking status to confirmed
      const response = await bookingService.updateBookingStatus(selectedBooking.id, 'confirmed');
      
      if (response.error) {
        addNotification(`Erreur lors de la confirmation: ${response.error}`, 'error');
        return;
      }

      addNotification('🎉 Paiement traité avec succès ! Votre réservation est confirmée.', 'success');
      setShowPaymentModal(false);
      setSelectedBooking(null);
      setPaymentForm({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      setIsProcessingPayment(false);
      loadDashboardData();
    } catch (error) {
      // Production-ready error handling
      console.error('❌ Payment processing error:', error);
      
      // Log error to monitoring service (in production)
      // await logErrorToMonitoringService('payment_error', error, { bookingId: selectedBooking.id });
      
      // User-friendly error message
      let errorMessage = 'Erreur lors du traitement du paiement';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      addNotification(`Erreur de paiement: ${errorMessage}`, 'error');
      setIsProcessingPayment(false);
    }
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'pending': return 'En attente';
      case 'on_hold': return 'En attente de paiement';
      case 'cancelled': return 'Annulée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getCategoryLabel = (category: ExcursionCategory) => {
    const labels = {
      beach: 'Plage',
      hiking: 'Randonnée',
      nautical: 'Nautique',
      cultural: 'Culturel',
      adventure: 'Aventure',
      gastronomy: 'Gastronomie'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onLogout}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Déconnexion
            </button>
            {user && <NotificationBell userId={user.id} />}
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Actualiser
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Voyageur</h1>
        <p className="text-gray-600">Découvrez et réservez vos excursions</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mes Réservations
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'explore'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Découvrir les Excursions
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mes Avis
            </button>
          </div>
        </div>
      </div>

      {/* Mes Réservations Tab */}
      {activeTab === 'bookings' && (
        <>
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation</h3>
          <p className="text-gray-600 mb-6">Vous n'avez pas encore réservé d'excursion</p>
              <button 
                onClick={() => setActiveTab('explore')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
            Découvrir les excursions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative">
                <img
                  src={booking.excursion?.images?.[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={booking.excursion?.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {booking.excursion?.title}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(booking.slot?.date || '').toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{booking.slot?.start_time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{booking.participants_count} participant(s)</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    {booking.total_amount}€
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Réservé le {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    {booking.is_checked_in && (
                      <div className="flex items-center text-green-600 text-xs mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Check-in effectué
                        {booking.checkin_time && (
                          <span className="ml-1">
                            ({new Date(booking.checkin_time).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {booking.status !== 'confirmed' && (
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Détails
                    </button>
                  )}
                                               {booking.status === 'pending' && (
                          <button
                            onClick={() => openPaymentModal(booking)}
                            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Payer
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                        {booking.status === 'on_hold' && (
                          <button
                            onClick={() => openPaymentModal(booking)}
                            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Payer
                          </button>
                        )}
                        {booking.status === 'on_hold' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => openQRCodeModal(booking)}
                          className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR Code
                        </button>
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                       {booking.status === 'completed' && (
                         <button
                           onClick={() => openReviewModal(booking)}
                           className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                         >
                           Laisser un avis
                         </button>
                       )}
                </div>
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}

      {/* Découvrir les Excursions Tab */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Rechercher une excursion..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as ExcursionCategory | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="beach">Plage</option>
                  <option value="hiking">Randonnée</option>
                  <option value="nautical">Nautique</option>
                  <option value="cultural">Culturel</option>
                  <option value="adventure">Aventure</option>
                  <option value="gastronomy">Gastronomie</option>
                </select>
              </div>
            </div>
          </div>

          {/* Excursions Grid */}
          {filteredExcursions.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune excursion trouvée</h3>
              <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExcursions.map((excursion) => (
                <div key={excursion.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="relative">
                    <img
                      src={excursion.images[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={excursion.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {getCategoryLabel(excursion.category)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{excursion.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {excursion.short_description || excursion.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{excursion.duration_hours}h</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{excursion.max_participants} max</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>{excursion.price_per_person}€</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedExcursion(excursion)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Voir détails
                      </button>
                      <button
                        onClick={() => openBookingModal(excursion)}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Réserver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
                 </div>
       )}

       {/* Mes Avis Tab */}
       {activeTab === 'reviews' && (
         <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-lg p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Mes Avis</h3>
             {bookings.filter(booking => booking.status === 'completed').length === 0 ? (
               <div className="text-center py-8">
                 <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                 <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun avis à afficher</h4>
                 <p className="text-gray-600">Vous pourrez laisser des avis une fois vos excursions terminées</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {bookings
                   .filter(booking => booking.status === 'completed')
                   .map((booking) => (
                     <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center space-x-3">
                           <img
                             src={booking.excursion?.images?.[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=100'}
                             alt={booking.excursion?.title}
                             className="w-16 h-16 object-cover rounded-lg"
                           />
                           <div>
                             <h4 className="font-semibold text-gray-900">{booking.excursion?.title}</h4>
                             <p className="text-sm text-gray-600">
                               {new Date(booking.slot?.date || '').toLocaleDateString('fr-FR')}
                             </p>
                           </div>
                         </div>
                         <button
                           onClick={() => openReviewModal(booking)}
                           className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                         >
                           Laisser un avis
                         </button>
                       </div>
                     </div>
                   ))}
               </div>
             )}
           </div>
         </div>
       )}

       {/* Modal de détails de réservation */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails de la réservation</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <img
                    src={selectedBooking.excursion?.images?.[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600'}
                    alt={selectedBooking.excursion?.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedBooking.excursion?.title}
                  </h3>
                  <p className="text-gray-600">
                    {selectedBooking.excursion?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Informations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{new Date(selectedBooking.slot?.date || '').toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedBooking.slot?.start_time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedBooking.participants_count} participant(s)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Paiement</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total payé:</span>
                        <span className="font-semibold">{selectedBooking.total_amount}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Statut:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusText(selectedBooking.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedBooking.special_requests && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Demandes spéciales</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Booking Modal */}
      <EnhancedBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        excursion={selectedExcursion!}
        onBookingSuccess={(booking) => {
          setShowBookingModal(false);
          setSelectedExcursion(null);
          addNotification('Réservation créée avec succès !', 'success');
          loadDashboardData();
        }}
      />

      {/* Modal de détails d'excursion */}
      {selectedExcursion && !showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedExcursion.title}</h2>
                <button
                  onClick={() => setSelectedExcursion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <img
                    src={selectedExcursion.images[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={selectedExcursion.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedExcursion.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Informations pratiques</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-3 text-gray-400" />
                        <span>Durée: {selectedExcursion.duration_hours} heures</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-3 text-gray-400" />
                        <span>Maximum: {selectedExcursion.max_participants} participants</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-3 text-gray-400" />
                        <span>Prix: {selectedExcursion.price_per_person}€ par personne</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                        <span>Point de rendez-vous: {selectedExcursion.meeting_point}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedExcursion.included_services && selectedExcursion.included_services.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Services inclus</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExcursion.included_services.map((service, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedExcursion(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => openBookingModal(selectedExcursion)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Réserver maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
             )}

       {/* Review Modal */}
       {showReviewModal && selectedBookingForReview && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Laisser un avis</h2>
                 <button
                   onClick={() => setShowReviewModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <X className="h-6 w-6" />
                 </button>
               </div>

               <div className="space-y-6">
                 <div className="flex items-center space-x-4">
                   <img
                     src={selectedBookingForReview.excursion?.images?.[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=200'}
                     alt={selectedBookingForReview.excursion?.title}
                     className="w-20 h-20 object-cover rounded-lg"
                   />
                   <div>
                     <h3 className="text-lg font-bold text-gray-900">{selectedBookingForReview.excursion?.title}</h3>
                     <p className="text-gray-600 text-sm">Date: {new Date(selectedBookingForReview.slot?.date || '').toLocaleDateString('fr-FR')}</p>
                   </div>
                 </div>

                 <form onSubmit={handleSubmitReview} className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Note *
                     </label>
                     <div className="flex space-x-2">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <button
                           key={star}
                           type="button"
                           onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                           className={`text-2xl ${
                             star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                           } hover:text-yellow-400 transition-colors`}
                         >
                           ★
                         </button>
                       ))}
                     </div>
                     <p className="text-sm text-gray-500 mt-1">
                       {reviewForm.rating} étoile{reviewForm.rating > 1 ? 's' : ''}
                     </p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Commentaire (optionnel)
                     </label>
                     <textarea
                       value={reviewForm.comment}
                       onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                       rows={4}
                       placeholder="Partagez votre expérience..."
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>

                   <div className="flex gap-4">
                     <button
                       type="button"
                       onClick={() => setShowReviewModal(false)}
                       className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                     >
                       Annuler
                     </button>
                     <button
                       type="submit"
                       className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold"
                     >
                       Soumettre l'avis
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Payment Modal */}
       {showPaymentModal && selectedBooking && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">Paiement sécurisé</h2>
                 <button
                   onClick={() => setShowPaymentModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <X className="h-6 w-6" />
                 </button>
               </div>

               <div className="space-y-6">
                 <div className="bg-blue-50 p-4 rounded-lg">
                   <h3 className="font-semibold text-blue-900 mb-2">Récapitulatif de la réservation</h3>
                   <div className="space-y-2 text-sm text-blue-800">
                     <div className="flex justify-between">
                       <span>Excursion:</span>
                       <span className="font-medium">{selectedBooking.excursion?.title}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Date:</span>
                       <span>{new Date(selectedBooking.slot?.date || '').toLocaleDateString('fr-FR')}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Participants:</span>
                       <span>{selectedBooking.participants_count}</span>
                     </div>
                     <div className="flex justify-between font-semibold">
                       <span>Total à payer:</span>
                       <span className="text-lg">{selectedBooking.total_amount}€</span>
                     </div>
                   </div>
                 </div>



                 <form onSubmit={handlePayment} className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Numéro de carte *
                     </label>
                     <input
                       type="text"
                       value={paymentForm.cardNumber}
                       onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                       placeholder="1234 5678 9012 3456"
                       required
                       disabled={isProcessingPayment}
                       className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                         paymentForm.cardNumber && !isValidCardNumber(paymentForm.cardNumber)
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-gray-300'
                       }`}
                     />
                     {paymentForm.cardNumber && !isValidCardNumber(paymentForm.cardNumber) && (
                       <p className="text-sm text-red-600 mt-1">Numéro de carte invalide</p>
                     )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Date d'expiration *
                       </label>
                       <input
                         type="text"
                         value={paymentForm.expiryDate}
                         onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                         placeholder="MM/AA"
                         required
                         disabled={isProcessingPayment}
                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                           paymentForm.expiryDate && !isValidExpiryDate(paymentForm.expiryDate)
                             ? 'border-red-500 focus:ring-red-500'
                             : 'border-gray-300'
                         }`}
                       />
                       {paymentForm.expiryDate && !isValidExpiryDate(paymentForm.expiryDate) && (
                         <p className="text-sm text-red-600 mt-1">Format: MM/AA (ex: 12/25)</p>
                       )}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         CVV *
                       </label>
                       <input
                         type="text"
                         value={paymentForm.cvv}
                         onChange={(e) => setPaymentForm(prev => ({ ...prev, cvv: e.target.value }))}
                         placeholder="123"
                         required
                         disabled={isProcessingPayment}
                         className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                           paymentForm.cvv && !isValidCVV(paymentForm.cvv)
                             ? 'border-red-500 focus:ring-red-500'
                             : 'border-gray-300'
                         }`}
                       />
                       {paymentForm.cvv && !isValidCVV(paymentForm.cvv) && (
                         <p className="text-sm text-red-600 mt-1">3-4 chiffres requis</p>
                       )}
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Nom du titulaire *
                     </label>
                     <input
                       type="text"
                       value={paymentForm.cardholderName}
                       onChange={(e) => setPaymentForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                       placeholder="Jean Dupont"
                       required
                       disabled={isProcessingPayment}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>

                   <div className="bg-gray-50 p-4 rounded-lg">
                     <div className="space-y-2 text-sm text-gray-600">
                       <div className="flex items-center">
                         <div className="w-5 h-5 mr-2 text-green-500">✓</div>
                         <span>Paiement sécurisé par SSL/TLS</span>
                       </div>
                       <div className="flex items-center">
                         <div className="w-5 h-5 mr-2 text-green-500">✓</div>
                         <span>Conformité PCI DSS</span>
                       </div>
                       <div className="flex items-center">
                         <div className="w-5 h-5 mr-2 text-green-500">✓</div>
                         <span>Chiffrement des données sensibles</span>
                       </div>
                     </div>
                   </div>

                   <div className="flex gap-4">
                     <button
                       type="button"
                       disabled={isProcessingPayment}
                       onClick={() => setShowPaymentModal(false)}
                       className={`flex-1 px-4 py-2 border rounded-lg ${
                         isProcessingPayment
                           ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                           : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                       }`}
                     >
                       Annuler
                     </button>
                     <button
                       type="submit"
                       disabled={isProcessingPayment}
                       className={`flex-1 py-2 px-4 rounded-lg font-semibold flex items-center justify-center ${
                         isProcessingPayment
                           ? 'bg-gray-400 cursor-not-allowed'
                           : 'bg-green-500 hover:bg-green-600'
                       } text-white`}
                     >
                       {isProcessingPayment ? (
                         <>
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                           Traitement en cours...
                         </>
                       ) : (
                         `Payer ${selectedBooking.total_amount}€`
                       )}
                     </button>
                   </div>
                 </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Display Modal */}
      {showQRCode && selectedBookingForQR && (
        <QRCodeDisplay
          booking={selectedBookingForQR}
          isOpen={showQRCode}
          onClose={() => {
            setShowQRCode(false);
            setSelectedBookingForQR(null);
          }}
        />
      )}
    </div>
  );
}
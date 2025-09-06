import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Euro, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Mail,
  MessageSquare,
  ShoppingCart
} from 'lucide-react';
import { Excursion, supabase } from '../../lib/supabase';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { bookingService, BookingRequest, AvailabilityCheck } from '../../services/bookingService';
import { useAuth } from '../../contexts/AuthContext';
import { BookingConflictHandler } from './BookingConflictHandler';

interface TourOperatorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  excursion: Excursion;
  onAddToCart?: (bookingData: any) => void;
}

export function TourOperatorBookingModal({ 
  isOpen, 
  onClose, 
  excursion, 
  onAddToCart 
}: TourOperatorBookingModalProps) {
  const { user, profile } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityCheck | null>(null);
  const [participantsCount, setParticipantsCount] = useState(1);
  const [bookingForm, setBookingForm] = useState({
    client_name: '',
    client_email: '',
    special_requests: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'slot' | 'details' | 'confirmation'>('slot');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSelectedSlot(null);
      setParticipantsCount(1);
      setBookingForm({
        client_name: '',
        client_email: '',
        special_requests: ''
      });
      setError(null);
      setSuccess(null);
      setStep('slot');
    }
  }, [isOpen]);

  const handleSlotSelect = (slot: AvailabilityCheck) => {
    setSelectedSlot(slot);
    setStep('details');
  };

  const handleParticipantsChange = (count: number) => {
    console.log('🔄 Changing participants from', participantsCount, 'to', count);
    if (count > 0 && selectedSlot && count <= selectedSlot.availableSpots) {
      setParticipantsCount(count);
      console.log('✅ Participants count updated to:', count);
    } else {
      console.log('❌ Invalid participant count:', count, 'Available spots:', selectedSlot?.availableSpots);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (participantsCount <= 0) {
      setError('Le nombre de participants doit être supérieur à 0');
      return false;
    }

    if (selectedSlot && participantsCount > selectedSlot.availableSpots) {
      setError(`Seulement ${selectedSlot.availableSpots} place(s) disponible(s) pour ce créneau.`);
      return false;
    }

    if (!bookingForm.client_name.trim()) {
      setError('Veuillez saisir le nom du client');
      return false;
    }

    if (!bookingForm.client_email.trim()) {
      setError('Veuillez saisir l\'email du client');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingForm.client_email)) {
      setError('Veuillez saisir un email valide');
      return false;
    }

    return true;
  };

  const handleAddToCart = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find the slot ID from the selected slot
      const slotId = await findSlotId(selectedSlot!);
      
      if (!slotId) {
        throw new Error('Créneau non trouvé');
      }

      // Prepare booking data (without creating the actual booking)
      const bookingData = {
        excursion_id: excursion.id,
        slot_id: slotId,
        participants_count: participantsCount,
        client_name: bookingForm.client_name.trim(),
        client_email: bookingForm.client_email.trim(),
        special_requests: bookingForm.special_requests.trim() || undefined,
        booking_date: selectedSlot!.date,
        total_amount: calculateTotal(),
        price_per_person: selectedSlot!.price > 0 ? selectedSlot!.price : excursion.price_per_person
      };

      console.log('📦 Adding to cart:', bookingData);

      // Add to cart instead of creating booking
      onAddToCart?.(bookingData);
      
      setSuccess('Excursion ajoutée au panier avec succès !');
      setStep('confirmation');

    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const findSlotId = async (slot: AvailabilityCheck): Promise<string | null> => {
    try {
      console.log('🔍 Finding slot ID for:', {
        excursion_id: excursion.id,
        date: slot.date,
        time: slot.time
      });

      const { data, error } = await supabase!
        .from('availability_slots')
        .select('id')
        .eq('excursion_id', excursion.id)
        .eq('date', slot.date)
        .eq('start_time', slot.time)
        .single();

      if (error) {
        console.error('❌ Error finding slot:', error);
        return null;
      }

      if (!data) {
        console.error('❌ No slot found with these criteria');
        return null;
      }

      console.log('✅ Found slot ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error finding slot ID:', error);
      return null;
    }
  };

  const calculateTotal = () => {
    if (!selectedSlot) return 0;
    const price = selectedSlot.price > 0 ? selectedSlot.price : excursion.price_per_person;
    return price * participantsCount;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Réserver pour un client
            </h2>
            <p className="text-gray-600 mt-1">{excursion.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          {/* Step 1: Slot Selection */}
          {step === 'slot' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Étape 1 : Sélection du créneau
                </h3>
                <p className="text-gray-600">
                  Choisissez la date et l'heure qui conviennent à votre client
                </p>
              </div>
              
              <AvailabilityCalendar
                excursion={excursion}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
              />
            </div>
          )}

          {/* Step 2: Booking Details */}
          {step === 'details' && selectedSlot && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Étape 2 : Détails de la réservation
                </h3>
                <p className="text-gray-600">
                  Remplissez les informations de votre client
                </p>
              </div>

              {/* Selected Slot Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Créneau sélectionné</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedSlot.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(selectedSlot.time)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{selectedSlot.availableSpots} places disponibles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4" />
                    <span>
                      {selectedSlot.price > 0 ? `${selectedSlot.price}€` : `${excursion.price_per_person}€`} par personne
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Informations du client</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet du client *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={bookingForm.client_name}
                        onChange={(e) => handleFormChange('client_name', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nom du client"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email du client *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={bookingForm.client_email}
                        onChange={(e) => handleFormChange('client_email', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@client.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de participants *
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleParticipantsChange(participantsCount - 1)}
                        disabled={participantsCount <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="text-lg font-medium w-8 text-center">{participantsCount}</span>
                      <button
                        onClick={() => handleParticipantsChange(participantsCount + 1)}
                        disabled={participantsCount >= selectedSlot.availableSpots}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum {selectedSlot.availableSpots} participants
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Demandes spéciales
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        value={bookingForm.special_requests}
                        onChange={(e) => handleFormChange('special_requests', e.target.value)}
                        rows={3}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Allergies, préférences, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Résumé de la réservation</h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{excursion.title}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(selectedSlot.date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatTime(selectedSlot.time)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{participantsCount} participant(s)</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total :</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {calculateTotal()}€
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSlot.price > 0 ? `${selectedSlot.price}€` : `${excursion.price_per_person}€`} × {participantsCount} participant(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-green-500" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ajouté au panier !
                </h3>
                <p className="text-gray-600">
                  La réservation a été ajoutée à votre panier. Vous pouvez continuer à ajouter d'autres réservations ou procéder au paiement.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex space-x-2">
            <div className={`w-3 h-3 rounded-full ${step === 'slot' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`w-3 h-3 rounded-full ${step === 'details' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`w-3 h-3 rounded-full ${step === 'confirmation' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </div>

          <div className="flex space-x-3">
            {step === 'details' && (
              <button
                onClick={() => setStep('slot')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Retour
              </button>
            )}
            
            {step === 'confirmation' ? (
              <button
                onClick={onClose}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Fermer
              </button>
            ) : step === 'details' ? (
              <button
                onClick={() => {
                  console.log('🛒 Add to cart button clicked');
                  handleAddToCart();
                }}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 text-lg shadow-lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                <span>{loading ? 'Ajout...' : 'Ajouter au panier'}</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

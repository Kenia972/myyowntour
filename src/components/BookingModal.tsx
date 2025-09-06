import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Clock, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { Excursion, AvailabilitySlot } from '../lib/supabase';
import { bookingService, availabilitySlotService } from '../services/dataService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  excursion: Excursion;
  onBookingSuccess: () => void;
}

interface BookingFormData {
  participants: number;
  date: string;
  slotId: string;
  specialRequests: string;
}

export function BookingModal({ isOpen, onClose, excursion, onBookingSuccess }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  
  const [formData, setFormData] = useState<BookingFormData>({
    participants: 1,
    date: '',
    slotId: '',
    specialRequests: ''
  });

  useEffect(() => {
    if (isOpen && excursion) {
      loadAvailableSlots();
    }
  }, [isOpen, excursion]);

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      setError(null);
      
      const response = await availabilitySlotService.getSlotsByExcursion(excursion.id);
      
      if (response.error) {
        setError(`Erreur lors du chargement des créneaux: ${response.error}`);
        setAvailableSlots([]);
        return;
      }

      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error loading slots:', error);
      setError('Erreur lors du chargement des créneaux disponibles');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slotId) {
      setError('Veuillez sélectionner un créneau');
      return;
    }

    if (formData.participants < 1) {
      setError('Le nombre de participants doit être au moins de 1');
      return;
    }

    // Check if selected slot has enough spots
    const selectedSlot = availableSlots.find(slot => slot.id === formData.slotId);
    if (selectedSlot && selectedSlot.available_spots < formData.participants) {
      setError(`Il ne reste que ${selectedSlot.available_spots} place(s) disponible(s) pour ce créneau`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await bookingService.createBooking({
        excursion_id: excursion.id,
        slot_id: formData.slotId,
        participants_count: formData.participants,
        special_requests: formData.specialRequests || undefined
      });

      if (response.error) {
        setError(`Erreur lors de la réservation: ${response.error}`);
        return;
      }

      if (response.data) {
        alert('Réservation créée avec succès !');
        onBookingSuccess();
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      participants: 1,
      date: '',
      slotId: '',
      specialRequests: ''
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getTotalPrice = () => {
    const selectedSlot = availableSlots.find(slot => slot.id === formData.slotId);
    const pricePerPerson = selectedSlot?.price_override || excursion.price_per_person;
    return pricePerPerson * formData.participants;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      beach: "Plage",
      hiking: "Randonnée", 
      nautical: "Nautique",
      cultural: "Culturel",
      adventure: "Aventure",
      gastronomy: "Gastronomie"
    };
    return labels[category as keyof typeof labels] || category;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Réserver cette excursion</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Excursion Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-4">
              <img
                src={excursion.images?.[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={excursion.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{excursion.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{excursion.short_description || excursion.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{excursion.duration_hours}h</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Max {excursion.max_participants}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{getCategoryLabel(excursion.category)}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>{excursion.price_per_person}€/personne</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de participants
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participants: Math.max(1, prev.participants - 1) }))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-12 text-center">{formData.participants}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, participants: Math.min(excursion.max_participants, prev.participants + 1) }))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
                <span className="text-sm text-gray-500">
                  Maximum: {excursion.max_participants} participants
                </span>
              </div>
            </div>

            {/* Available Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un créneau
              </label>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Chargement des créneaux...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun créneau disponible pour cette excursion</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, slotId: slot.id, date: slot.date }))}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        formData.slotId === slot.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">
                          {new Date(slot.date).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="text-sm text-gray-500">{slot.start_time}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {slot.available_spots} place(s) disponible(s)
                        </span>
                        {slot.price_override && (
                          <span className="font-semibold text-blue-600">
                            {slot.price_override}€/personne
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demandes spéciales (optionnel)
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Précisez vos demandes spéciales, allergies, etc."
              />
            </div>

            {/* Total Price */}
            {formData.slotId && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{getTotalPrice()}€</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.participants} participant(s) × {availableSlots.find(s => s.id === formData.slotId)?.price_override || excursion.price_per_person}€
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.slotId || loadingSlots}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Création en cours...' : 'Confirmer la réservation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

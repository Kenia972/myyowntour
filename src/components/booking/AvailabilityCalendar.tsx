import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Euro,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Excursion } from '../../lib/supabase';
import { bookingService, AvailabilityCheck } from '../../services/bookingService';

interface AvailabilityCalendarProps {
  excursion: Excursion;
  onSlotSelect?: (slot: AvailabilityCheck) => void;
  selectedSlot?: AvailabilityCheck | null;
  showBookingButton?: boolean;
  onBook?: (slot: AvailabilityCheck) => void;
}

export function AvailabilityCalendar({ 
  excursion, 
  onSlotSelect, 
  selectedSlot, 
  showBookingButton = false,
  onBook 
}: AvailabilityCalendarProps) {
  const [availableSlots, setAvailableSlots] = useState<AvailabilityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadAvailableSlots();
  }, [excursion.id, selectedDate]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const slots = await bookingService.getAvailableSlots(excursion.id, selectedDate);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading available slots:', err);
      setError('Erreur lors du chargement des créneaux disponibles');
    } finally {
      setLoading(false);
    }
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

  const getAvailabilityColor = (slot: AvailabilityCheck) => {
    if (slot.availableSpots === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (slot.availableSpots <= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getAvailabilityText = (slot: AvailabilityCheck) => {
    if (slot.availableSpots === 0) return 'Complet';
    if (slot.availableSpots <= 2) return `${slot.availableSpots} place(s) restante(s)`;
    return `${slot.availableSpots} places disponibles`;
  };

  const handleSlotSelect = (slot: AvailabilityCheck) => {
    onSlotSelect?.(slot);
  };

  const handleBook = (slot: AvailabilityCheck) => {
    onBook?.(slot);
  };

  const groupSlotsByDate = (slots: AvailabilityCheck[]) => {
    const grouped: { [key: string]: AvailabilityCheck[] } = {};
    
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });

    return grouped;
  };

  const groupedSlots = groupSlotsByDate(availableSlots);
  const sortedDates = Object.keys(groupedSlots).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement des créneaux disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Créneaux disponibles
          </h3>
          <p className="text-sm text-gray-600">
            Sélectionnez une date et un créneau pour réserver
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <span className="text-sm font-medium text-gray-900">
            {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filtrer par date :
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Afficher toutes les dates
            </button>
          )}
        </div>
      </div>

      {/* Available Slots */}
      {sortedDates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun créneau disponible
          </h4>
          <p className="text-gray-600">
            {selectedDate 
              ? 'Aucun créneau disponible pour cette date.'
              : 'Aucun créneau disponible pour cette excursion.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">
                  {formatDate(date)}
                </h4>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedSlots[date].map((slot, index) => (
                    <div
                      key={`${slot.date}-${slot.time}-${index}`}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {formatTime(slot.time)}
                          </span>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(slot)}`}>
                          {getAvailabilityText(slot)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Max {slot.maxParticipants} participants</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Euro className="h-4 w-4" />
                          <span>
                            {slot.price > 0 ? `${slot.price}€` : `${excursion.price_per_person}€`} par personne
                          </span>
                        </div>
                      </div>
                      
                      {showBookingButton && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBook(slot);
                          }}
                          disabled={slot.availableSpots === 0}
                          className={`w-full mt-3 py-2 px-4 rounded-lg font-medium transition-colors ${
                            slot.availableSpots === 0
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {slot.availableSpots === 0 ? 'Complet' : 'Réserver'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-blue-900">Créneau sélectionné</span>
          </div>
          
          <div className="text-sm text-blue-800">
            <p><strong>Date :</strong> {formatDate(selectedSlot.date)}</p>
            <p><strong>Heure :</strong> {formatTime(selectedSlot.time)}</p>
            <p><strong>Places disponibles :</strong> {selectedSlot.availableSpots}</p>
            <p><strong>Prix :</strong> {selectedSlot.price > 0 ? `${selectedSlot.price}€` : `${excursion.price_per_person}€`} par personne</p>
          </div>
        </div>
      )}

      {/* Availability Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Légende des disponibilités</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">Places disponibles</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">Peu de places restantes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-600">Complet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  CheckCircle,
  X,
  Edit3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Excursion } from '../../lib/supabase';
import { availabilitySlotService } from '../../services/dataService';

interface AvailabilitySlot {
  id?: string;
  excursion_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  available_spots: number;
  is_available: boolean;
  price_override?: number;
}

interface AvailabilityManagerProps {
  excursion: Excursion;
  onAvailabilityUpdate?: () => void;
}

export function AvailabilityManager({ excursion, onAvailabilityUpdate }: AvailabilityManagerProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);

  // New slot form state
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    max_participants: excursion.max_participants,
    price_override: excursion.price_per_person,
    is_available: true
  });

  useEffect(() => {
    loadAvailabilitySlots();
  }, [excursion.id]);

  const loadAvailabilitySlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase!
        .from('availability_slots')
        .select(`
          *,
          bookings(participants_count, status)
        `)
        .eq('excursion_id', excursion.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Erreur lors du chargement: ${error.message}`);
      }

      console.log('📊 Raw slots data from database:', data);

      // Calculate available spots for each slot
      const slotsWithAvailability = data?.map(slot => {
        const confirmedBookings = slot.bookings?.filter(
          (booking: any) => booking.status === 'confirmed'
        ) || [];
        
        const totalBooked = confirmedBookings.reduce(
          (sum: number, booking: any) => sum + booking.participants_count, 0
        );

        return {
          ...slot,
          available_spots: Math.max(0, slot.max_participants - totalBooked),
          is_available: slot.is_available && (slot.max_participants - totalBooked) > 0
        };
      }) || [];

      console.log('📊 Processed slots with availability:', slotsWithAvailability);
      setSlots(slotsWithAvailability);
    } catch (err) {
      console.error('Error loading availability slots:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate form
      if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (newSlot.max_participants <= 0) {
        throw new Error('Le nombre de participants doit être supérieur à 0');
      }

      if (new Date(newSlot.date) < new Date()) {
        throw new Error('La date ne peut pas être dans le passé');
      }

      // Check for conflicts
      const hasConflict = slots.some(slot => 
        slot.date === newSlot.date && 
        slot.start_time === newSlot.start_time &&
        slot.is_available
      );

      if (hasConflict) {
        throw new Error('Un créneau existe déjà à cette date et heure');
      }

      const slotData = {
        excursion_id: excursion.id,
        date: newSlot.date,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        max_participants: newSlot.max_participants,
        available_spots: newSlot.max_participants,
        is_available: newSlot.is_available,
        price_override: newSlot.price_override || null
      };

      console.log('📝 Creating slot with data:', slotData);

      const { data, error } = await supabase!
        .from('availability_slots')
        .insert(slotData)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création: ${error.message}`);
      }

      console.log('✅ Slot created successfully:', data);
      setSuccess('Créneau ajouté avec succès');
      setNewSlot({
        date: '',
        start_time: '',
        end_time: '',
        max_participants: excursion.max_participants,
        price_override: excursion.price_per_person,
        is_available: true
      });
      setShowAddForm(false);
      loadAvailabilitySlots();
      onAvailabilityUpdate?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding slot:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlot = async (slot: AvailabilitySlot) => {
    try {
      setSaving(true);
      setError(null);

      // Use the availability slot service which handles RLS properly
      const { data, error } = await availabilitySlotService.updateAvailabilitySlot(slot.id, {
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_participants: slot.max_participants,
        is_available: slot.is_available,
        price_override: slot.price_override || null
      });

      if (error) {
        throw new Error(`Erreur lors de la mise à jour: ${error}`);
      }

      setSuccess('Créneau mis à jour avec succès');
      setEditingSlot(null);
      loadAvailabilitySlots();
      onAvailabilityUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating slot:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if there are any confirmed bookings
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('id, status')
        .eq('slot_id', slotId)
        .eq('status', 'confirmed');

      if (bookingsError) {
        throw new Error(`Erreur lors de la vérification: ${bookingsError.message}`);
      }

      if (bookings && bookings.length > 0) {
        throw new Error('Impossible de supprimer un créneau avec des réservations confirmées');
      }

      const { error } = await supabase!
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      setSuccess('Créneau supprimé avec succès');
      loadAvailabilitySlots();
      onAvailabilityUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting slot:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const toggleSlotAvailability = async (slot: AvailabilitySlot) => {
    const updatedSlot = { ...slot, is_available: !slot.is_available };
    await handleUpdateSlot(updatedSlot);
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

  const getStatusColor = (slot: AvailabilitySlot) => {
    if (!slot.is_available) return 'bg-gray-100 text-gray-500';
    if (slot.available_spots === 0) return 'bg-red-100 text-red-800';
    if (slot.available_spots <= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (slot: AvailabilitySlot) => {
    if (!slot.is_available) return 'Indisponible';
    if (slot.available_spots === 0) return 'Complet';
    if (slot.available_spots <= 2) return `${slot.available_spots} places restantes`;
    return `${slot.available_spots} places disponibles`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Chargement des créneaux...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Gestion des créneaux - {excursion.title}
          </h3>
          <p className="text-sm text-gray-600">
            Gérez les disponibilités et les créneaux pour cette excursion
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un créneau</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Add New Slot Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un nouveau créneau</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de début *
              </label>
              <input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de fin *
              </label>
              <input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participants max
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newSlot.max_participants}
                onChange={(e) => setNewSlot(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (€) - Optionnel
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newSlot.price_override || ''}
                onChange={(e) => setNewSlot(prev => ({ ...prev, price_override: parseFloat(e.target.value) || null }))}
                placeholder={excursion.price_per_person.toString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newSlot.is_available}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, is_available: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Disponible</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              onClick={handleAddSlot}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Ajout...' : 'Ajouter'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Slots List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Créneaux disponibles</h4>
        </div>

        {slots.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun créneau configuré pour cette excursion</p>
            <p className="text-sm">Cliquez sur "Ajouter un créneau" pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {slots.map((slot) => (
              <div key={slot.id} className="p-6 hover:bg-gray-50">
                {editingSlot?.id === slot.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={slot.date}
                          onChange={(e) => setEditingSlot(prev => prev ? { ...prev, date: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Heure de début
                        </label>
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => setEditingSlot(prev => prev ? { ...prev, start_time: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Participants max
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={slot.max_participants}
                          onChange={(e) => setEditingSlot(prev => prev ? { ...prev, max_participants: parseInt(e.target.value) || 1 } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={slot.is_available}
                            onChange={(e) => setEditingSlot(prev => prev ? { ...prev, is_available: e.target.checked } : null)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Disponible</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingSlot(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => editingSlot && handleUpdateSlot(editingSlot)}
                        disabled={saving}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {formatDate(slot.date)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">
                            {slot.available_spots}/{slot.max_participants} places
                          </span>
                        </div>
                      </div>
                      
                      {slot.price_override && slot.price_override !== excursion.price_per_person && (
                        <div className="mt-2 text-sm text-blue-600">
                          Prix spécial: {slot.price_override}€ (au lieu de {excursion.price_per_person}€)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(slot)}`}>
                        {getStatusText(slot)}
                      </span>
                      
                      <button
                        onClick={() => toggleSlotAvailability(slot)}
                        className={`p-2 rounded-lg ${
                          slot.is_available 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={slot.is_available ? 'Marquer comme indisponible' : 'Marquer comme disponible'}
                      >
                        {slot.is_available ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setEditingSlot(slot)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => slot.id && handleDeleteSlot(slot.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                        disabled={slot.available_spots < slot.max_participants}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

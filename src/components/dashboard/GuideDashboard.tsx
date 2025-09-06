import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Star,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Save,
  X,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { Excursion, AvailabilitySlot, Guide, ExcursionCategory } from '../../lib/supabase';
import { excursionService, guideService, bookingService, availabilitySlotService } from '../../services/dataService';
import { supabase } from '../../lib/supabase';
import { AvailabilityManager } from './AvailabilityManager';
import { QRScanner } from '../booking/QRScanner';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';

interface GuideDashboardProps {
  onLogout: () => void;
}

interface ExcursionFormData {
  title: string;
  description: string;
  short_description: string;
  category: ExcursionCategory;
  duration_hours: number;
  max_participants: number;
  price_per_person: number;
  included_services: string[];
  meeting_point: string;
  difficulty_level: number;
  images: string[];
}

export function GuideDashboard({ onLogout }: GuideDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'excursions' | 'bookings' | 'profile'>('overview');
  const [loading, setLoading] = useState(true);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [guideProfile, setGuideProfile] = useState<Guide | null>(null);
  const [showExcursionModal, setShowExcursionModal] = useState(false);
  const [editingExcursion, setEditingExcursion] = useState<Excursion | null>(null);
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [selectedExcursionForSlots, setSelectedExcursionForSlots] = useState<Excursion | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: '',
    start_time: '',
    available_spots: 1,
    price_override: undefined as number | undefined
  });
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    city: '',
    phone: '',
    website: '',
    description: ''
  });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [guideId, setGuideId] = useState<string>('');
  const [formData, setFormData] = useState<ExcursionFormData>({
    title: '',
    description: '',
    short_description: '',
    category: 'beach',
    duration_hours: 4,
    max_participants: 8,
    price_per_person: 50,
    included_services: [],
    meeting_point: '',
    difficulty_level: 1,
    images: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed:', { showSlotsModal, selectedExcursionForSlots: !!selectedExcursionForSlots });
  }, [showSlotsModal, selectedExcursionForSlots]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les données du guide et ses excursions
      const [guideResponse, excursionsResponse] = await Promise.all([
        guideService.getCurrentGuideProfile(),
        excursionService.getCurrentGuideExcursions()
      ]);

      if (guideResponse.error) {
        console.error('Guide profile error:', guideResponse.error);
        showNotification(`Erreur profil guide: ${guideResponse.error}`, 'error');
      } else {
        setGuideProfile(guideResponse.data);
        // Set guide ID for QR scanner
        if (guideResponse.data) {
          setGuideId(guideResponse.data.id);
          setProfileForm({
            company_name: guideResponse.data.company_name || '',
            city: guideResponse.data.city || '',
            phone: guideResponse.data.phone || '',
            website: guideResponse.data.website || '',
            description: guideResponse.data.description || ''
          });
        }
      }

      if (excursionsResponse.error) {
        console.error('Excursions error:', excursionsResponse.error);
        showNotification(`Erreur excursions: ${excursionsResponse.error}`, 'error');
        setExcursions([]);
      } else {
        setExcursions(excursionsResponse.data || []);
      }

      // Load bookings for guide's excursions
      await loadGuideBookings();

    } catch (error) {
      console.error('Dashboard loading error:', error);
      showNotification('Erreur lors du chargement du tableau de bord', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGuideBookings = async () => {
    try {
      setLoadingBookings(true);
      console.log('🔄 Loading guide bookings...');
      
      if (!guideProfile) {
        console.log('⚠️ No guide profile, skipping bookings load');
        return;
      }

      // Get all excursions for this guide
      const excursionIds = excursions.map(exc => exc.id);
      
      if (excursionIds.length === 0) {
        console.log('⚠️ No excursions found, skipping bookings load');
        setBookings([]);
        return;
      }

      // Get bookings for these excursions
      const { data: bookingsData, error: bookingsError } = await supabase!
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(first_name, last_name, email),
          excursion:excursions(title, guide_id),
          slot:availability_slots(date, start_time)
        `)
        .in('excursion_id', excursionIds)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('❌ Error loading guide bookings:', bookingsError);
        showNotification(`Erreur lors du chargement des réservations: ${bookingsError.message}`, 'error');
        return;
      }

      console.log('✅ Guide bookings loaded:', bookingsData?.length || 0, 'bookings');
      setBookings(bookingsData || []);

    } catch (error) {
      console.error('❌ Error loading guide bookings:', error);
      showNotification('Erreur lors du chargement des réservations', 'error');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleCreateExcursion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating excursion with form data:', formData);
      
      // Get the current guide's ID
      if (!guideProfile) {
        console.error('No guide profile found');
        showNotification('Profil guide non trouvé. Veuillez réessayer.', 'error');
        return;
      }

      console.log('Guide profile found:', guideProfile);

      const excursionPayload = {
        ...formData,
        guide_id: guideProfile.id,
        is_active: true
      };

      console.log('Excursion payload:', excursionPayload);

      const response = await excursionService.createExcursion(excursionPayload);

      console.log('Create excursion response:', response);

      if (response.error) {
        console.error('Create excursion error:', response.error);
        showNotification(`Erreur lors de la création: ${response.error}`, 'error');
        return;
      }

      if (response.data) {
        console.log('Excursion created successfully:', response.data);
        // Refresh the entire dashboard data to ensure consistency
        await loadDashboardData();
        setShowExcursionModal(false);
        resetForm();
        showNotification('Excursion créée avec succès !', 'success');
      }
    } catch (error) {
      console.error('Create excursion exception:', error);
      showNotification('Erreur lors de la création', 'error');
    }
  };

  const handleUpdateExcursion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingExcursion) return;

      console.log('Updating excursion:', editingExcursion.id, 'with data:', formData);
      console.log('Current guide profile:', guideProfile);

      const response = await excursionService.updateExcursion(editingExcursion.id, formData);

      console.log('Update excursion response:', response);

      if (response.error) {
        console.error('Update excursion error:', response.error);
        showNotification(`Erreur lors de la modification: ${response.error}`, 'error');
        return;
      }

      if (response.data) {
        setExcursions(prev => 
          prev.map(exc => 
            exc.id === editingExcursion.id 
              ? response.data!
              : exc
          )
        );
        setShowExcursionModal(false);
        setEditingExcursion(null);
        resetForm();
        showNotification('Excursion modifiée avec succès !', 'success');
      }
    } catch (error) {
      console.error('Update excursion exception:', error);
      showNotification('Erreur lors de la modification', 'error');
    }
  };

  const handleDeleteExcursion = async (excursionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette excursion ?')) return;

    try {
      console.log('Deleting excursion:', excursionId);
      console.log('Current guide profile:', guideProfile);

      const response = await excursionService.deleteExcursion(excursionId);

      console.log('Delete excursion response:', response);

      if (response.error) {
        console.error('Delete excursion error:', response.error);
        showNotification(`Erreur lors de la suppression: ${response.error}`, 'error');
        return;
      }

      if (response.data) {
        setExcursions(prev => prev.filter(exc => exc.id !== excursionId));
        showNotification('Excursion supprimée avec succès !', 'success');
      }
    } catch (error) {
      console.error('Delete excursion exception:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleToggleExcursion = async (excursionId: string) => {
    try {
      const excursion = excursions.find(exc => exc.id === excursionId);
      if (!excursion) return;

      const response = await excursionService.updateExcursion(excursionId, {
        is_active: !excursion.is_active
      });

      if (response.error) {
        showNotification(`Erreur lors de la modification: ${response.error}`, 'error');
        return;
      }

      if (response.data) {
        setExcursions(prev => 
          prev.map(exc => 
            exc.id === excursionId 
              ? response.data!
              : exc
          )
        );
      }
      showNotification('Statut de l\'excursion modifié !', 'success');
    } catch (error) {
      showNotification('Erreur lors de la modification', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      short_description: '',
      category: 'beach',
      duration_hours: 4,
      max_participants: 8,
      price_per_person: 50,
      included_services: [],
      meeting_point: '',
      difficulty_level: 1,
      images: []
    });
  };

  const openEditModal = (excursion: Excursion) => {
    setEditingExcursion(excursion);
    setFormData({
      title: excursion.title,
      description: excursion.description,
      short_description: excursion.short_description || '',
      category: excursion.category,
      duration_hours: excursion.duration_hours,
      max_participants: excursion.max_participants,
      price_per_person: excursion.price_per_person,
      included_services: excursion.included_services || [],
      meeting_point: excursion.meeting_point || '',
      difficulty_level: excursion.difficulty_level,
      images: excursion.images || []
    });
    setShowExcursionModal(true);
  };



  // Slot management functions
  const openSlotsModal = async (excursion: Excursion) => {
    try {
      console.log('🔄 Opening slots modal for excursion:', excursion.title);
      
      // Reset any previous loading states
      setLoadingSlots(false);
      
      // Set excursion first
      setSelectedExcursionForSlots(excursion);
      
      // Show modal immediately
      setShowSlotsModal(true);
      
      // Load slots in background
      loadAvailabilitySlots(excursion.id);
      
      // Reset form
      resetSlotForm();
      
      console.log('✅ Modal opened successfully');
    } catch (error) {
      console.error('❌ Error opening slots modal:', error);
      showNotification('Erreur lors de l\'ouverture du modal', 'error');
    }
  };

  const loadAvailabilitySlots = async (excursionId: string) => {
    try {
      console.log('🔄 Loading availability slots for excursion:', excursionId);
      setLoadingSlots(true);
      
      // Add timeout protection to prevent loading state from getting stuck
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Loading timeout')), 10000)
      );
      
      const slotsPromise = availabilitySlotService.getSlotsByExcursion(excursionId);
      
      const response = await Promise.race([slotsPromise, timeoutPromise]);
      
      if (response.error) {
        console.warn('⚠️ No slots found or error:', response.error);
        setAvailabilitySlots([]);
      } else {
        console.log('✅ Slots loaded:', response.data?.length || 0, 'slots');
        setAvailabilitySlots(response.data || []);
      }
    } catch (error) {
      console.error('❌ Error loading slots:', error);
      setAvailabilitySlots([]);
    } finally {
      setLoadingSlots(false);
      console.log('✅ Loading slots completed');
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExcursionForSlots) {
      showNotification('Aucune excursion sélectionnée', 'error');
      return;
    }
    
    try {
      console.log('🔄 Creating availability slot...');
      setLoadingSlots(true);
      
      const slotData = {
        excursion_id: selectedExcursionForSlots.id,
        date: slotForm.date,
        start_time: slotForm.start_time,
        available_spots: slotForm.available_spots,
        price_override: slotForm.price_override,
        is_available: true
      };
      
      console.log('📋 Slot data:', slotData);
      const response = await availabilitySlotService.createAvailabilitySlot(slotData);
      
      if (response.error) {
        console.error('❌ Error creating slot:', response.error);
        showNotification(`Erreur lors de la création du créneau: ${response.error}`, 'error');
      } else {
        console.log('✅ Slot created successfully:', response.data);
        showNotification('Créneau créé avec succès !', 'success');
        resetSlotForm();
        await loadAvailabilitySlots(selectedExcursionForSlots.id);
      }
    } catch (error) {
      console.error('❌ Error in handleCreateSlot:', error);
      showNotification('Erreur lors de la création du créneau', 'error');
    } finally {
      setLoadingSlots(false);
      console.log('✅ Slot creation completed');
    }
  };

  const handleToggleSlotAvailability = async (slotId: string, isAvailable: boolean) => {
    try {
      const response = await availabilitySlotService.updateAvailabilitySlot(slotId, { is_available: isAvailable });
      
      if (response.error) {
        showNotification(`Erreur lors de la mise à jour: ${response.error}`, 'error');
      } else {
        await loadAvailabilitySlots(selectedExcursionForSlots!.id);
      }
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;
    
    try {
      const response = await availabilitySlotService.deleteAvailabilitySlot(slotId);
      
      if (response.error) {
        showNotification(`Erreur lors de la suppression: ${response.error}`, 'error');
      } else {
        showNotification('Créneau supprimé avec succès !', 'success');
        await loadAvailabilitySlots(selectedExcursionForSlots!.id);
      }
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const resetSlotForm = () => {
    setSlotForm({
      date: '',
      start_time: '',
      available_spots: 1,
      price_override: undefined
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!guideProfile) return;

      const response = await guideService.updateGuideProfile(profileForm);

      if (response.error) {
        showNotification(`Erreur lors de la mise à jour: ${response.error}`, 'error');
        return;
      }

      if (response.data) {
        setGuideProfile(response.data);
        setEditingProfile(false);
        showNotification('Profil mis à jour avec succès !', 'success');
      }
    } catch (error) {
      showNotification('Erreur lors de la mise à jour du profil', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCheckInSuccess = (bookingData: any) => {
    showNotification(`Check-in réussi pour ${bookingData.client_name}`, 'success');
    // Reload bookings to show updated check-in status
    loadGuideBookings();
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
    return labels[category];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Espace Guide</h1>
                <p className="text-sm text-gray-500">
                  {guideProfile?.company_name || 'Mon entreprise'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {guideProfile?.is_verified ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Vérifié
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  ⏳ En attente
                </span>
              )}
              {user && <NotificationBell userId={user.id} />}
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: MapPin },
                { id: 'excursions', label: 'Mes excursions', icon: Calendar },
                { id: 'bookings', label: 'Réservations', icon: Users },
                { id: 'profile', label: 'Mon profil', icon: Building }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Excursions</p>
                    <p className="text-2xl font-bold text-gray-900">{excursions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Actives</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {excursions.filter(e => e.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Réservations</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {loading ? '...' : bookings.length}
                     </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenus</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {loading ? '...' : `${bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0)}€`}
                     </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowExcursionModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Créer une excursion
                </button>
                <button
                  onClick={loadDashboardData}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Actualiser les données
                </button>

              </div>
            </div>
          </div>
        )}

        {/* Mes excursions */}
        {activeTab === 'excursions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
              <h2 className="text-2xl font-bold text-gray-900">Mes excursions</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loading 
                    ? 'Chargement...' 
                    : guideProfile 
                      ? `${excursions.length} excursion${excursions.length !== 1 ? 's' : ''} trouvée${excursions.length !== 1 ? 's' : ''}`
                      : 'Chargement du profil...'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-semibold flex items-center"
                  title="Actualiser les données"
                >
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 ${loading ? '' : 'hidden'}`}></div>
                  {loading ? 'Actualisation...' : 'Actualiser'}
                </button>
              <button
                onClick={() => setShowExcursionModal(true)}
                  disabled={!guideProfile}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
                    guideProfile 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle excursion
              </button>
              </div>
            </div>



            {excursions.length === 0 && !loading ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune excursion</h3>
                <p className="text-gray-600 mb-4">
                  {guideProfile 
                    ? 'Créez votre première excursion pour commencer'
                    : 'Chargement du profil guide...'
                  }
                </p>
                {guideProfile && (
                  <button
                    onClick={() => setShowExcursionModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center mx-auto"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Créer une excursion
                  </button>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {excursions.map((excursion) => (
                <div key={excursion.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="relative">
                    <img
                      src={excursion.images[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={excursion.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        excursion.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {excursion.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{excursion.title}</h3>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {getCategoryLabel(excursion.category)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {excursion.short_description}
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
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(excursion)}
                          className="text-blue-600 hover:text-blue-700 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                          title="Modifier l'excursion"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleExcursion(excursion.id)}
                          className={`p-3 rounded-lg transition-colors cursor-pointer border ${
                            excursion.is_active 
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300' 
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300'
                          }`}
                          title={excursion.is_active ? "Désactiver l'excursion" : "Activer l'excursion"}
                        >
                          {excursion.is_active ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteExcursion(excursion.id)}
                          className="text-red-600 hover:text-red-700 p-3 rounded-lg hover:bg-red-50 transition-colors cursor-pointer border border-red-200 hover:border-red-300"
                          title="Supprimer l'excursion"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openSlotsModal(excursion)}
                          className="text-green-600 hover:text-green-700 p-3 rounded-lg hover:bg-green-50 transition-colors cursor-pointer border border-green-200 hover:border-green-300"
                          title="Gérer les créneaux"
                        >
                          <Calendar className="h-5 w-5" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-400">
                        Niveau {excursion.difficulty_level}/5
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Réservations */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Réservations</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scanner QR
                </button>
                <button
                  onClick={loadGuideBookings}
                  disabled={loadingBookings}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                >
                  {loadingBookings ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {loadingBookings ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>
            </div>

            {loadingBookings ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des réservations...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation</h3>
                <p className="text-gray-600">Les réservations de vos excursions apparaîtront ici</p>
                <p className="text-sm text-gray-500 mt-2">
                  {excursions.length > 0 
                    ? `Vous avez ${excursions.length} excursion${excursions.length !== 1 ? 's' : ''} active${excursions.length !== 1 ? 's' : ''}`
                    : 'Créez d\'abord des excursions pour recevoir des réservations'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bookings.length} réservation{bookings.length !== 1 ? 's' : ''} trouvée{bookings.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Excursion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Heure
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check-in
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-2 rounded-full mr-3">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.client?.first_name} {booking.client?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{booking.client?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.excursion?.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(booking.slot?.date).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.slot?.start_time}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.participants_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.total_amount}€
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {booking.status === 'confirmed' ? 'Confirmée' :
                               booking.status === 'pending' ? 'En attente' :
                               booking.status === 'cancelled' ? 'Annulée' : 'Terminée'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {booking.is_checked_in ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-sm text-green-600 font-medium">Check-in</span>
                                {booking.checkin_time && (
                                  <div className="text-xs text-gray-500 ml-2">
                                    {new Date(booking.checkin_time).toLocaleTimeString('fr-FR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-500">En attente</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {booking.status === 'pending' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase!
                                        .from('bookings')
                                        .update({ status: 'confirmed' })
                                        .eq('id', booking.id);
                                      
                                      if (error) {
                                        showNotification(`Erreur: ${error.message}`, 'error');
                                      } else {
                                        showNotification('Réservation confirmée !', 'success');
                                        await loadGuideBookings();
                                      }
                                    } catch (error) {
                                      showNotification('Erreur lors de la confirmation', 'error');
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Confirmer"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {booking.status === 'pending' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase!
                                        .from('bookings')
                                        .update({ status: 'cancelled' })
                                        .eq('id', booking.id);
                                      
                                      if (error) {
                                        showNotification(`Erreur: ${error.message}`, 'error');
                                      } else {
                                        showNotification('Réservation annulée !', 'success');
                                        await loadGuideBookings();
                                      }
                                    } catch (error) {
                                      showNotification('Erreur lors de l\'annulation', 'error');
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Annuler"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mon profil */}
        {activeTab === 'profile' && guideProfile && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mon profil</h2>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Informations du profil</h3>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                  {editingProfile ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {editingProfile ? 'Annuler' : 'Modifier'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Informations générales</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'entreprise
                      </label>
                      <input
                        type="text"
                        value={editingProfile ? profileForm.company_name : guideProfile.company_name}
                        onChange={(e) => editingProfile && setProfileForm(prev => ({ ...prev, company_name: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editingProfile ? '' : 'bg-gray-50'
                        }`}
                        readOnly={!editingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SIRET
                      </label>
                      <input
                        type="text"
                        value={guideProfile.siret || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={editingProfile ? profileForm.city : guideProfile.city}
                        onChange={(e) => editingProfile && setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editingProfile ? '' : 'bg-gray-50'
                        }`}
                        readOnly={!editingProfile}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        value={editingProfile ? profileForm.phone : guideProfile.phone || ''}
                        onChange={(e) => editingProfile && setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editingProfile ? '' : 'bg-gray-50'
                        }`}
                        readOnly={!editingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site web
                      </label>
                      <input
                        type="text"
                        value={editingProfile ? profileForm.website : guideProfile.website || ''}
                        onChange={(e) => editingProfile && setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editingProfile ? '' : 'bg-gray-50'
                        }`}
                        readOnly={!editingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut
                      </label>
                      <div className="flex items-center">
                        {guideProfile.is_verified ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            ✓ Compte vérifié
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            ⏳ En attente de vérification
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingProfile ? profileForm.description : guideProfile.description || ''}
                  onChange={(e) => editingProfile && setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editingProfile ? '' : 'bg-gray-50'
                  }`}
                  readOnly={!editingProfile}
                />
              </div>

              {editingProfile && (
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal d'excursion */}
      {showExcursionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingExcursion ? 'Modifier l\'excursion' : 'Nouvelle excursion'}
                </h2>
                <button
                  onClick={() => {
                    setShowExcursionModal(false);
                    setEditingExcursion(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={editingExcursion ? handleUpdateExcursion : handleCreateExcursion} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExcursionCategory }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beach">Plage</option>
                      <option value="hiking">Randonnée</option>
                      <option value="nautical">Nautique</option>
                      <option value="cultural">Culturel</option>
                      <option value="adventure">Aventure</option>
                      <option value="gastronomy">Gastronomie</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description courte *
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Résumé en une ligne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description complète *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée (heures) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) }))}
                      required
                      min="1"
                      max="24"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Participants max *
                    </label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                      required
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix par personne (€) *
                    </label>
                    <input
                      type="number"
                      value={formData.price_per_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_per_person: parseFloat(e.target.value) }))}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Point de rendez-vous
                    </label>
                    <input
                      type="text"
                      value={formData.meeting_point}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_point: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Niveau de difficulté (1-5)
                    </label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 - Très facile</option>
                      <option value={2}>2 - Facile</option>
                      <option value={3}>3 - Modéré</option>
                      <option value={4}>4 - Difficile</option>
                      <option value={5}>5 - Très difficile</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Services inclus (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.included_services.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      included_services: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Transport, Guide, Repas, Équipement..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL des images (séparées par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.images.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      images: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExcursionModal(false);
                      setEditingExcursion(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingExcursion ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des créneaux */}
      {showSlotsModal && selectedExcursionForSlots && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Gérer les créneaux de disponibilité
                  {selectedExcursionForSlots && ` - ${selectedExcursionForSlots.title}`}
                </h2>
                <button
                  onClick={() => {
                    console.log('🔄 Closing slots modal');
                    // Reset loading state first
                    setLoadingSlots(false);
                    // Close modal
                    setShowSlotsModal(false);
                    // Clear excursion data
                    setSelectedExcursionForSlots(null);
                    // Reset form
                    resetSlotForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {!selectedExcursionForSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement de l'excursion...</p>
                </div>
              ) : (
                <AvailabilityManager
                  excursion={selectedExcursionForSlots}
                  onAvailabilityUpdate={() => {
                    // Refresh the dashboard data when availability is updated
                    loadDashboardData();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && guideId && (
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onCheckInSuccess={handleCheckInSuccess}
          guideId={guideId}
        />
      )}
    </div>
  );
}
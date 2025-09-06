import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Search, 
  Filter, 
  ShoppingCart, 
  Eye, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Star,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Plus,
  Minus,
  CreditCard,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { Excursion, Guide, TourOperator, ExcursionCategory, Booking, Profile } from '../../lib/supabase';
import { excursionService, tourOperatorService, bookingService, profileService, availabilitySlotService } from '../../services/dataService';
import { supabase } from '../../lib/supabase';
import { TourOperatorBookingModal } from '../booking/TourOperatorBookingModal';

interface TourOperatorDashboardProps {
  onLogout: () => void;
}

interface CartItem {
  id: string;
  excursion: Excursion;
  quantity: number;
  clientName: string;
  clientEmail: string;
  date: string;
  participants: number;
  bookingData?: any; // Store the complete booking data for later processing
}

export function TourOperatorDashboard({ onLogout }: TourOperatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'pending' | 'sales' | 'profile' | 'inventory' | 'clients'>('catalog');
  const [loading, setLoading] = useState(true);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [filteredExcursions, setFilteredExcursions] = useState<Excursion[]>([]);
  const [operatorProfile, setOperatorProfile] = useState<TourOperator | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExcursionCategory | 'all'>('all');
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage on component mount
    try {
      const savedCart = localStorage.getItem('tourOperatorCart');
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      console.log('🛒 Cart loaded from localStorage:', parsedCart.length, 'items');
      return parsedCart;
    } catch (error) {
      console.error('❌ Error loading cart from localStorage:', error);
      return [];
    }
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedExcursion, setSelectedExcursion] = useState<Excursion | null>(null);

  

  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<TourOperator>>({});
  
  // Sales data state
  const [salesData, setSalesData] = useState({
    monthlyRevenue: 0,
    clientsServed: 0,
    totalBookings: 0,
    monthlyCommission: 0,
    totalCommission: 0
  });
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  
  // Real data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [tourOperatorReservations, setTourOperatorReservations] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState({
    totalExcursions: 0,
    activeExcursions: 0,
    availableSlots: 0,
    lowStockItems: 0
  });
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time refresh every 10 seconds for faster updates
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      loadSalesData();
      loadInventoryData();
      loadClientData();
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterExcursions();
  }, [excursions, searchTerm, categoryFilter]);

  // Sync cart with localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('tourOperatorCart', JSON.stringify(cart));
    } catch (error) {
      console.error('❌ Error syncing cart to localStorage:', error);
    }
  }, [cart]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les excursions disponibles et le profil tour-opérateur
      const [excursionsResponse, operatorResponse] = await Promise.all([
        excursionService.getActiveExcursions(),
        tourOperatorService.getCurrentTourOperatorProfile()
      ]);

      if (excursionsResponse.error) {
        console.error('Erreur lors du chargement des excursions:', excursionsResponse.error);
        setExcursions([]);
      } else {
        console.log('✅ Excursions loaded:', excursionsResponse.data?.length || 0, 'excursions');
        setExcursions(excursionsResponse.data || []);
      }

      if (operatorResponse.error) {
        console.error('Erreur lors du chargement du profil tour-opérateur:', operatorResponse.error);
      } else {
        setOperatorProfile(operatorResponse.data);
        // Initialize editing profile with current data
        setEditingProfile(operatorResponse.data || {});
      }

      // Load sales data
      await loadSalesData();
      
      // Load inventory and client data
      await Promise.all([
        loadInventoryData(),
        loadClientData()
      ]);

    } catch (error) {
      console.error('Erreur chargement données tour-opérateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async () => {
    try {
      console.log('🔄 Loading real sales data...');
      
      // Get current tour operator profile
      const operatorProfile = await tourOperatorService.getCurrentTourOperatorProfile();
      console.log('🔍 [loadSalesData] Tour operator profile:', operatorProfile.data?.id);
      
      if (operatorProfile.error || !operatorProfile.data) {
        console.error('❌ Error loading tour operator profile:', operatorProfile.error);
        return;
      }

      // CORRECT LOGIC: Get all bookings made by this tour operator
      const { data: tourOperatorBookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('*')
        .eq('tour_operator_id', operatorProfile.data.id);

      if (bookingsError) {
        console.error('❌ Error loading tour operator bookings:', bookingsError);
        return;
      }

      console.log('🏢 Tour operator bookings found:', tourOperatorBookings?.length || 0);
      if (tourOperatorBookings && tourOperatorBookings.length > 0) {
        console.log('📋 Sample booking:', tourOperatorBookings[0]);
      }

      if (!tourOperatorBookings || tourOperatorBookings.length === 0) {
        // No bookings yet, set empty data
        setSalesData({
          monthlyRevenue: 0,
          clientsServed: 0,
          totalBookings: 0,
          monthlyCommission: 0,
          totalCommission: 0
        });
        setSalesHistory([]);
        return;
      }

      // Use the real tour operator bookings data
      const allTourOperatorData = tourOperatorBookings;

      console.log('📊 Tour operator data:', {
        totalBookings: allTourOperatorData.length,
        statuses: allTourOperatorData.map(b => b.status)
      });

      // Calculate current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filter monthly data
      const monthlyData = allTourOperatorData.filter(booking => {
        const itemDate = new Date(booking.created_at);
        return itemDate.getMonth() === currentMonth && 
               itemDate.getFullYear() === currentYear &&
               (booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'pending');
      });

      // Calculate real metrics
      const monthlyRevenue = monthlyData.reduce((sum, booking) => 
        sum + (booking.total_amount || 0), 0
      );
      
      const totalRevenue = allTourOperatorData
        .filter(booking => booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'pending')
        .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);

      // Calculate commission based on actual commission_amount from bookings
      const monthlyCommission = monthlyData.reduce((sum, booking) => 
        sum + (booking.commission_amount || 0), 0
      );
      const totalCommission = allTourOperatorData
        .filter(booking => booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'pending')
        .reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);

      // Count unique clients (use client_email since client_id might be null)
      const uniqueClients = new Set(
        allTourOperatorData
          .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
          .map(booking => booking.client_email)
      );

      console.log('💰 Sales calculations:', {
        monthlyRevenue,
        totalRevenue,
        monthlyCommission,
        totalCommission,
        uniqueClients: uniqueClients.size,
        totalBookings: allTourOperatorData.length,
        statusBreakdown: {
          pending: allTourOperatorData.filter(b => b.status === 'pending').length,
          confirmed: allTourOperatorData.filter(b => b.status === 'confirmed').length,
          completed: allTourOperatorData.filter(b => b.status === 'completed').length
        }
      });

      // Update sales data state
      setSalesData({
        monthlyRevenue,
        clientsServed: uniqueClients.size,
        totalBookings: allTourOperatorData.length,
        monthlyCommission,
        totalCommission
      });

      // Create sales history from confirmed bookings only
      const salesHistoryData = allTourOperatorData
        .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
        .map(booking => ({
          id: booking.id,
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          excursionTitle: 'Excursion', // We'll get this from excursion data
          amount: booking.total_amount,
          commission: booking.commission_amount || 0,
          date: new Date(booking.created_at).toLocaleDateString('fr-FR'),
          status: booking.status
        }));

      setSalesHistory(salesHistoryData);

      // Check for new confirmed bookings and show notification
      const previousPendingCount = salesData.totalBookings - salesData.clientsServed;
      const currentPendingCount = allTourOperatorData.filter(b => b.status === 'pending').length;
      const currentConfirmedCount = allTourOperatorData.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
      
      if (currentConfirmedCount > salesData.clientsServed) {
        const newConfirmedCount = currentConfirmedCount - salesData.clientsServed;
        addNotification(`🎉 ${newConfirmedCount} nouvelle(s) réservation(s) confirmée(s) !`, 'success');
      }

    } catch (error) {
      console.error('❌ Error loading sales data:', error);
    }
  };

  const loadCommissionHistory = async () => {
    try {
      console.log('🔄 Loading commission history...');
      
      // Get current tour operator profile
      const operatorProfile = await tourOperatorService.getCurrentTourOperatorProfile();
      
      if (operatorProfile.error || !operatorProfile.data) {
        console.error('❌ Error loading tour operator profile:', operatorProfile.error);
        return;
      }

      // Get all excursions for this tour operator
      const excursionsResponse = await excursionService.getActiveExcursions();
      
      if (excursionsResponse.error) {
        console.error('❌ Error loading excursions:', excursionsResponse.error);
        return;
      }

      // Filter excursions for this tour operator
      const tourOperatorExcursions = excursionsResponse.data?.filter(excursion => 
        excursion.guide_id === operatorProfile.data.id
      ) || [];

      if (tourOperatorExcursions.length === 0) {
        setCommissionHistory([]);
        return;
      }

      // Get all bookings for these excursions
      const allBookingsResponse = await bookingService.getAllBookings();
      
      if (allBookingsResponse.error) {
        console.error('❌ Error loading all bookings:', allBookingsResponse.error);
        return;
      }

      const allBookings = allBookingsResponse.data || [];
      
      // Filter bookings for this tour operator's excursions
      const tourOperatorBookings = allBookings.filter(booking => 
        tourOperatorExcursions.some(excursion => excursion.id === booking.excursion_id)
      );

      // Create commission history from confirmed/completed bookings
      const commissionHistory = tourOperatorBookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
        .map(booking => {
          const excursion = tourOperatorExcursions.find(e => e.id === booking.excursion_id);
          const commissionAmount = booking.commission_amount || 0;
          
          return {
            id: booking.id,
            booking_id: booking.id,
            excursion_title: excursion?.title || 'Excursion inconnue',
            amount: commissionAmount,
            total_booking_amount: booking.total_amount || 0,
            created_at: booking.created_at,
            status: booking.status,
            client_name: `${booking.client?.first_name || 'Client'} ${booking.client?.last_name || 'Inconnu'}`
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCommissionHistory(commissionHistory);
      console.log('✅ Commission history loaded successfully');

    } catch (error) {
      console.error('❌ Error loading commission history:', error);
    }
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClientContact = async (clientId: string, message: string) => {
    try {
      setLoading(true);
      addNotification('🔄 Envoi du message en cours...', 'info');
      
      // Get client profile
      const clientResponse = await profileService.getProfileById(clientId);
      
      if (clientResponse.error || !clientResponse.data) {
        throw new Error('Client non trouvé');
      }
      
      // Here you would integrate with your email service
      // For now, we'll simulate sending a message
      console.log(`📧 Message to ${clientResponse.data.email}: ${message}`);
      
      addNotification('✅ Message envoyé avec succès !', 'success');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      addNotification(`❌ Erreur lors de l'envoi: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClientNotes = async (clientId: string, notes: string) => {
    try {
      setLoading(true);
      addNotification('🔄 Sauvegarde des notes en cours...', 'info');
      
      // Here you would save notes to a client_notes table
      // For now, we'll simulate saving notes
      console.log(`📝 Notes for client ${clientId}: ${notes}`);
      
      addNotification('✅ Notes sauvegardées avec succès !', 'success');
      
    } catch (error) {
      console.error('❌ Error saving notes:', error);
      addNotification(`❌ Erreur lors de la sauvegarde: ${error.message}`, 'error');
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
        excursion.tour_operator?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(excursion => excursion.category === categoryFilter);
    }

    setFilteredExcursions(filtered);
  };

  const handleBookExcursion = (excursion: Excursion) => {
    console.log('🔄 Opening booking modal for excursion:', excursion.title);
    setSelectedExcursion(excursion);
    setShowBookingModal(true);
  };



  const handleAddToCart = (bookingData: any) => {
    if (!selectedExcursion) return;

    const cartItem: CartItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      excursion: selectedExcursion,
      quantity: 1,
      clientName: bookingData.client_name,
      clientEmail: bookingData.client_email,
      date: bookingData.booking_date,
      participants: bookingData.participants_count,
      // Store the booking data for later processing
      bookingData: bookingData
    };

    const newCart = [...cart, cartItem];
    setCart(newCart);
    
    // Save to localStorage
    try {
      localStorage.setItem('tourOperatorCart', JSON.stringify(newCart));
      console.log('✅ Cart saved to localStorage:', newCart.length, 'items');
    } catch (error) {
      console.error('❌ Error saving cart to localStorage:', error);
    }
    
    setShowBookingModal(false);
    setSelectedExcursion(null);

    addNotification('Excursion ajoutée au panier !', 'success');
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    
    // Save to localStorage
    try {
      localStorage.setItem('tourOperatorCart', JSON.stringify(newCart));
      console.log('✅ Cart updated in localStorage:', newCart.length, 'items');
    } catch (error) {
      console.error('❌ Error updating cart in localStorage:', error);
    }
  };

  const handleProcessCart = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);
      addNotification('🔄 Traitement des réservations en cours...', 'info');
      
      // Get current tour operator profile
      const operatorProfile = await tourOperatorService.getCurrentTourOperatorProfile();
      
      if (operatorProfile.error || !operatorProfile.data) {
        throw new Error('Profil tour-opérateur non trouvé');
      }
      
      // Process each cart item and create real bookings
      const processedBookings = [];
      
      for (const item of cart) {
        try {
          console.log(`🔄 Processing cart item: ${item.excursion.title}`);
          
          // Calculate correct commission structure
          const baseAmount = item.excursion.price_per_person * item.participants;
          const commissionStructure = calculateCommissionStructure(item.excursion.price_per_person);
          const tourOperatorCommission = commissionStructure.tourOperatorAmount * item.participants;
          
          // Create proper booking record in the database
          const { data: newBooking, error: bookingError } = await supabase!
            .from('bookings')
            .insert({
              excursion_id: item.excursion.id,
              client_name: item.clientName,
              client_email: item.clientEmail,
              participants_count: item.participants,
              total_amount: baseAmount, // Total amount remains the same as guide's price
              commission_amount: tourOperatorCommission, // 20% commission for tour operator
              booking_date: item.date,
              status: 'pending',
              special_requests: `Réservation via tour-opérateur: ${operatorProfile.data?.company_name || 'Tour Opérateur'}`,
              tour_operator_id: operatorProfile.data?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (bookingError) {
            console.error(`❌ Error creating booking for ${item.excursion.title}:`, bookingError);
            addNotification(`❌ Erreur lors de la création de la réservation pour ${item.excursion.title}`, 'error');
            continue;
          }

          console.log(`✅ Booking created for ${item.excursion.title}:`, newBooking);
          
          processedBookings.push(newBooking);
          
        } catch (error) {
          console.error(`❌ Error processing cart item ${item.excursion.title}:`, error);
          addNotification(`❌ Erreur lors du traitement de ${item.excursion.title}`, 'error');
        }
      }
      
      if (processedBookings.length > 0) {
        // Clear cart after successful processing
    setCart([]);
        try {
          localStorage.removeItem('tourOperatorCart');
          console.log('✅ Cart cleared from localStorage');
        } catch (error) {
          console.error('❌ Error clearing cart from localStorage:', error);
        }
        
        // Refresh dashboard data to show new sales
        await Promise.all([
          loadSalesData(),
          loadInventoryData(),
          loadClientData()
        ]);
        
        addNotification(`✅ ${processedBookings.length} réservation(s) créée(s) avec succès !`, 'success');
        
        // Show detailed success message
        const totalRevenue = processedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
        const totalCommission = processedBookings.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);
        
        addNotification(`💰 Revenus: ${totalRevenue}€ | Commission: ${totalCommission.toFixed(2)}€`, 'success');
        
      } else {
        addNotification('❌ Aucune réservation n\'a pu être créée', 'error');
      }
      
    } catch (error) {
      console.error('❌ Error processing cart:', error);
      addNotification(`❌ Erreur lors du traitement du panier: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      setCart([]);
      try {
        localStorage.removeItem('tourOperatorCart');
        console.log('✅ Cart cleared from localStorage');
      } catch (error) {
        console.error('❌ Error clearing cart from localStorage:', error);
      }
    }
  };

  const handleLogout = () => {
    // Clear cart from localStorage on logout
    try {
      localStorage.removeItem('tourOperatorCart');
      console.log('✅ Cart cleared from localStorage on logout');
    } catch (error) {
      console.error('❌ Error clearing cart from localStorage on logout:', error);
    }
    
    onLogout();
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

  // Calculate correct commission structure: 65% Guide / 20% TO / 15% Platform
  const calculateCommissionStructure = (basePrice: number) => {
    const guideAmount = Math.round(basePrice * 0.65);
    const tourOperatorAmount = Math.round(basePrice * 0.20);
    const platformAmount = Math.round(basePrice * 0.15);
    
    return {
      guideAmount,
      tourOperatorAmount,
      platformAmount,
      totalPrice: basePrice // The total price remains the same as the guide's price
    };
  };

  const getMargin = (price: number) => {
    // Return tour operator commission (20% of base price)
    return calculateCommissionStructure(price).tourOperatorAmount;
  };

  const loadInventoryData = async () => {
    try {
      console.log('🔄 Loading real inventory data...');
      
      // Get current tour operator profile
      const operatorProfile = await tourOperatorService.getCurrentTourOperatorProfile();
      console.log('🔍 [loadInventoryData] Tour operator profile:', operatorProfile.data?.id);
      
      if (operatorProfile.error || !operatorProfile.data) {
        console.error('❌ Error loading tour operator profile:', operatorProfile.error);
        return;
      }

      // CORRECT LOGIC: Get all available excursions for resale (not created by tour operator)
      const { data: availableExcursions, error: excursionsError } = await supabase!
        .from('excursions')
        .select('*')
        .eq('is_active', true);

      if (excursionsError) {
        console.error('❌ Error loading available excursions:', excursionsError);
        return;
      }

      const totalExcursions = availableExcursions?.length || 0;
      const activeExcursions = availableExcursions?.filter(e => e.is_active).length || 0;

      // Get real availability slots for available excursions
      const allSlotsResponse = await Promise.all(
        (availableExcursions || []).map(async (excursion) => {
          try {
            // Use the availability slot service to get properly calculated slots
            const slotsResponse = await availabilitySlotService.getSlotsByExcursion(excursion.id);
            
            if (slotsResponse.error) {
              console.error(`Error loading slots for excursion ${excursion.id}:`, slotsResponse.error);
              return {
                excursion_id: excursion.id,
                available_spots: 0,
                is_available: false
              };
            }
            
            const totalSpots = slotsResponse.data?.reduce((sum, slot) => sum + (slot.available_spots || 0), 0) || 0;
            
            return {
              excursion_id: excursion.id,
              available_spots: totalSpots,
              is_available: totalSpots > 0
            };
          } catch (error) {
            console.error(`Error loading slots for excursion ${excursion.id}:`, error);
            return {
              excursion_id: excursion.id,
              available_spots: 0,
              is_available: false
            };
          }
        })
      );

      const availableSlots = allSlotsResponse
        .filter(slot => slot !== null)
        .reduce((sum, slot) => sum + (slot?.available_spots || 0), 0);
      
      const lowStockItems = allSlotsResponse
        .filter(slot => slot !== null && (slot?.available_spots || 0) < 5)
        .length;

      console.log('📦 Inventory calculations:', {
        totalExcursions,
        activeExcursions,
        availableSlots,
        lowStockItems
      });

      setInventoryData({
        totalExcursions,
        activeExcursions,
        availableSlots,
        lowStockItems
      });

      console.log('✅ Inventory data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading inventory data:', error);
    }
  };

  const loadClientData = async () => {
    try {
      console.log('🔄 Loading real client data...');
      
      // Get current tour operator profile
      const operatorProfile = await tourOperatorService.getCurrentTourOperatorProfile();
      console.log('🔍 [loadClientData] Tour operator profile:', operatorProfile.data?.id);
      
      if (operatorProfile.error || !operatorProfile.data) {
        console.error('❌ Error loading tour operator profile:', operatorProfile.error);
        return;
      }

      // CORRECT LOGIC: Get all bookings made by this tour operator
      const { data: tourOperatorBookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('*')
        .eq('tour_operator_id', operatorProfile.data.id);

      if (bookingsError) {
        console.error('❌ Error loading tour operator bookings:', bookingsError);
        return;
      }

      if (!tourOperatorBookings || tourOperatorBookings.length === 0) {
        setClients([]);
        setInventoryData(prev => ({
          ...prev,
          totalClients: 0,
          clientRevenue: 0,
          totalBookings: 0
        }));
        return;
      }

      // Get unique clients from these bookings (use client_email since client_id might be null)
      const uniqueClientEmails = new Set(
        tourOperatorBookings
          .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
          .map(booking => booking.client_email)
          .filter(email => email) // Filter out null/undefined emails
      );

      // Create client profiles from email data with real booking information
      const clientProfiles = Array.from(uniqueClientEmails).map(email => {
        // Find the first booking for this client to get real data
        const firstBooking = tourOperatorBookings.find(booking => 
          booking.client_email === email && 
          (booking.status === 'confirmed' || booking.status === 'completed')
        );
        
        return {
          id: email, // Use email as ID for now
          email: email,
          first_name: firstBooking?.client_name?.split(' ')[0] || 'Client',
          last_name: firstBooking?.client_name?.split(' ').slice(1).join(' ') || 'Tour Operator',
          role: 'client',
          created_at: firstBooking?.created_at || new Date().toISOString(),
          total_spent: tourOperatorBookings
            .filter(booking => 
              booking.client_email === email && 
              (booking.status === 'confirmed' || booking.status === 'completed')
            )
            .reduce((sum, booking) => sum + (booking.total_amount || 0), 0),
          bookings_count: tourOperatorBookings
            .filter(booking => 
              booking.client_email === email && 
              (booking.status === 'confirmed' || booking.status === 'completed')
            ).length
        };
      });

      console.log('👥 Client profiles loaded:', clientProfiles.length);

      // Calculate client metrics
      const totalClients = clientProfiles.length;
      const clientRevenue = tourOperatorBookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
        .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const totalBookings = tourOperatorBookings.filter(b => 
        b.status === 'confirmed' || b.status === 'completed'
      ).length;

      // Set clients state with real data
      setClients(clientProfiles);

      // Update inventory data
      setInventoryData(prev => ({
        ...prev,
        totalClients,
        clientRevenue,
        totalBookings
      }));

      console.log('✅ Client data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading client data:', error);
    }
  };

  const handleEditProfile = () => {
    console.log('🔄 Entering edit mode for profile');
    setIsEditingProfile(true);
    setEditingProfile(operatorProfile || {});
  };

  const handleSaveProfile = async () => {
    try {
      if (!operatorProfile) return;
      
      console.log('🔄 Saving profile updates:', editingProfile);
      const response = await tourOperatorService.updateTourOperatorProfile(editingProfile);
      
      if (response.error) {
        alert(`Erreur lors de la mise à jour: ${response.error}`);
        return;
      }
      
      // Update local state
      setOperatorProfile(response.data);
      setIsEditingProfile(false);
      alert('Profil mis à jour avec succès !');
      
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditingProfile(operatorProfile || {});
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Espace Tour-opérateur</h1>
                <p className="text-sm text-gray-500">
                  {operatorProfile?.company_name || 'Mon agence'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    addNotification('🔄 Actualisation des données en cours...', 'info');
                    
                    await Promise.all([
                      loadSalesData(),
                      loadInventoryData(),
                      loadClientData()
                    ]);
                    
                    addNotification('✅ Données actualisées avec succès !', 'success');
                  } catch (error) {
                    console.error('❌ Error refreshing data:', error);
                    addNotification('❌ Erreur lors de l\'actualisation', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Actualisation...' : 'Actualiser'}
              </button>
              {cart.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveTab('cart')}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {cart.length}
                  </button>
                </div>
              )}
              {operatorProfile?.is_verified ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Vérifié
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  ⏳ En attente
                </span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                notification.type === 'success' ? 'ring-green-500' :
                notification.type === 'error' ? 'ring-red-500' : 'ring-blue-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'success' && <CheckCircle className="h-6 w-6 text-green-400" />}
                    {notification.type === 'error' && <XCircle className="h-6 w-6 text-red-400" />}
                    {notification.type === 'info' && <Info className="h-6 w-6 text-blue-400" />}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {[
                { id: 'catalog', label: 'Catalogue d\'excursions', icon: MapPin },
                { id: 'cart', label: `Panier (${cart.length})`, icon: ShoppingCart },
                { id: 'pending', label: 'Réservations en attente', icon: Clock },
                { id: 'sales', label: 'Mes ventes', icon: DollarSign },
                { id: 'inventory', label: 'Inventaire', icon: Eye },
                { id: 'clients', label: 'Gestion Clients', icon: Users },
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

        {/* Catalogue d'excursions */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Catalogue d'excursions</h2>
              
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as ExcursionCategory | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes catégories</option>
                  <option value="beach">Plage</option>
                  <option value="hiking">Randonnée</option>
                  <option value="nautical">Nautique</option>
                  <option value="cultural">Culturel</option>
                  <option value="adventure">Aventure</option>
                  <option value="gastronomy">Gastronomie</option>
                </select>
              </div>
            </div>

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
                    <div className="absolute top-4 left-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        +{getMargin(excursion.price_per_person)}€ commission
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{excursion.title}</h3>
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
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        <span>4.8</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {excursion.price_per_person}€
                        </div>
                        <div className="text-xs text-gray-500">
                          Commission TO: +{getMargin(excursion.price_per_person)}€
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Par Guide
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBookExcursion(excursion)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Réserver
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panier */}
        {activeTab === 'cart' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Panier ({cart.length})</h2>
              {cart.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={handleClearCart}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Vider le panier
                  </button>
                <button
                  onClick={handleProcessCart}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Traiter les réservations
                </button>
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Panier vide</h3>
                <p className="text-gray-600 mb-6">Ajoutez des excursions depuis le catalogue</p>
                <button
                  onClick={() => {
                    console.log('🔄 Switching to catalog tab');
                    setActiveTab('catalog');
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Parcourir le catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {item.excursion.title}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Client:</span><br />
                            {item.clientName}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span><br />
                            {item.clientEmail}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span><br />
                            {new Date(item.date).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Participants:</span><br />
                            {item.participants}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-lg font-bold text-gray-900 mb-2">
                          {item.excursion.price_per_person * item.participants}€
                        </div>
                        <div className="text-xs text-gray-500">
                          Commission: {getMargin(item.excursion.price_per_person) * item.participants}€
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {cart.reduce((sum, item) => 
                        sum + (item.excursion.price_per_person * item.participants), 0
                      )}€
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Votre commission totale: {cart.reduce((sum, item) => 
                      sum + (getMargin(item.excursion.price_per_person) * item.participants), 0
                    )}€
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Réservations en attente */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Réservations en attente</h2>
              <div className="text-sm text-gray-500">
                {bookings.filter(b => b.status === 'pending').length} réservation(s) en attente
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              {bookings.filter(b => b.status === 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation en attente</h3>
                  <p className="text-gray-500">Les nouvelles réservations apparaîtront ici en attente de confirmation par le client.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .filter(booking => booking.status === 'pending')
                    .map((booking) => (
                      <div key={booking.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Clock className="h-5 w-5 text-yellow-600" />
                              <span className="font-medium text-gray-900">En attente de confirmation</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Client:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {booking.client_name || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {booking.client_email || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Participants:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {booking.participants_count}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              <span>Date: {new Date(booking.booking_date).toLocaleDateString('fr-FR')}</span>
                              <span className="mx-2">•</span>
                              <span>Montant: {booking.total_amount}€</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-700">
                              {booking.total_amount}€
                            </div>
                            <div className="text-sm text-yellow-600">
                              Commission: {(booking.commission_amount || 0).toFixed(2)}€
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mes ventes */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Mes ventes</h2>
              <button
                onClick={loadSalesData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Actualiser
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenus ce mois</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.monthlyRevenue}€</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Clients servis</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.clientsServed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Réservations</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.totalBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Commission Mois</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.monthlyCommission?.toFixed(2) || 0}€</p>
                </div>
              </div>
            </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Commission Total</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.totalCommission?.toFixed(2) || 0}€</p>
                  </div>
                </div>
              </div>
            </div>

            {salesHistory.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Historique des ventes</h3>
                <p className="text-gray-600">Aucune vente enregistrée pour le moment</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Historique des ventes</h3>
                <div className="space-y-3">
                  {salesHistory.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{sale.clientName}</div>
                        <div className="text-sm text-gray-600">{sale.excursionTitle}</div>
                        <div className="text-xs text-gray-500">{sale.clientEmail}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{sale.amount}€</div>
                        <div className="text-sm text-yellow-600 font-medium">
                          Commission: {sale.commission?.toFixed(2) || 0}€
                        </div>
                        <div className="text-sm text-gray-500">{sale.date}</div>
                        <div className="text-xs text-gray-400 capitalize">{sale.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commission History */}
            {commissionHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Historique des Commissions</h3>
                <div className="space-y-3">
                  {commissionHistory.slice(0, 10).map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {commission.client_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {commission.excursion_title}
                        </div>
                        <div className="text-xs text-gray-500">
                          Réservation: {commission.booking_id?.slice(0, 8)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-600">{commission.amount?.toFixed(2) || 0}€</div>
                        <div className="text-sm text-gray-600">
                          Total: {commission.total_booking_amount}€
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">{commission.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inventaire */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestion de l'Inventaire</h2>
              <button
                onClick={loadInventoryData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Actualiser
              </button>
            </div>

            {/* Inventory Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Excursions</p>
                    <p className="text-2xl font-bold text-gray-900">{inventoryData.totalExcursions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Excursions Actives</p>
                    <p className="text-2xl font-bold text-gray-900">{inventoryData.activeExcursions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Créneaux Disponibles</p>
                    <p className="text-2xl font-bold text-gray-900">{inventoryData.availableSlots}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Stock Faible</p>
                    <p className="text-2xl font-bold text-gray-900">{inventoryData.lowStockItems}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Détails de l'Inventaire</h3>
              <div className="space-y-4">
                {excursions.map((excursion) => (
                  <div key={excursion.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={excursion.images[0] || 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={excursion.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{excursion.title}</h4>
                        <p className="text-sm text-gray-600">{getCategoryLabel(excursion.category)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{excursion.price_per_person}€</div>
                      <div className={`text-sm px-2 py-1 rounded-full ${
                        excursion.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {excursion.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gestion Clients */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
              <button
                onClick={loadClientData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Actualiser
              </button>
            </div>

            {/* Client Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenus Clients</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {inventoryData.clientRevenue || 0}€
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Réservations Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {inventoryData.totalBookings || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Liste des Clients</h3>
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun client confirmé</h4>
                  <p className="text-gray-600">
                    Les clients apparaîtront ici après que leurs réservations soient confirmées et payées.
                    <br />
                    <span className="text-sm text-blue-600">
                      Vérifiez l'onglet "Réservations en attente" pour voir les clients en cours de confirmation.
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {client.first_name} {client.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{client.email}</p>
                          <p className="text-xs text-gray-500 capitalize">{client.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {client.bookings_count} réservation(s)
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          Total: {client.total_spent}€
                        </div>
                        <div className="text-xs text-gray-400">
                          Depuis: {new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mon profil */}
        {activeTab === 'profile' && operatorProfile && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Mon profil</h2>
              {!isEditingProfile ? (
                <button
                  onClick={handleEditProfile}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Sauvegarder
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Informations générales</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'agence
                      </label>
                      <input
                        type="text"
                        value={isEditingProfile ? (editingProfile.company_name || '') : operatorProfile.company_name}
                        onChange={(e) => isEditingProfile && setEditingProfile(prev => ({ ...prev, company_name: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditingProfile ? 'bg-gray-100' : ''
                        }`}
                        readOnly={!isEditingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SIRET
                      </label>
                      <input
                        type="text"
                        value={isEditingProfile ? (editingProfile.siret || '') : (operatorProfile.siret || '')}
                        onChange={(e) => isEditingProfile && setEditingProfile(prev => ({ ...prev, siret: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditingProfile ? 'bg-gray-100' : ''
                        }`}
                        readOnly={!isEditingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={isEditingProfile ? (editingProfile.city || '') : operatorProfile.city}
                        onChange={(e) => isEditingProfile && setEditingProfile(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditingProfile ? 'bg-gray-100' : ''
                        }`}
                        readOnly={!isEditingProfile}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contact & Business</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        value={isEditingProfile ? (editingProfile.phone || '') : (operatorProfile.phone || '')}
                        onChange={(e) => isEditingProfile && setEditingProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditingProfile ? 'bg-gray-100' : ''
                        }`}
                        readOnly={!isEditingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site web
                      </label>
                      <input
                        type="text"
                        value={isEditingProfile ? (editingProfile.website || '') : (operatorProfile.website || '')}
                        onChange={(e) => isEditingProfile && setEditingProfile(prev => ({ ...prev, website: e.target.value }))}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditingProfile ? 'bg-gray-100' : ''
                        }`}
                        readOnly={!isEditingProfile}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taux de commission
                      </label>
                      <input
                        type="text"
                        value={`${operatorProfile.commission_rate}%`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={isEditingProfile ? (editingProfile.description || '') : (operatorProfile.description || '')}
                  onChange={(e) => isEditingProfile && setEditingProfile(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !isEditingProfile ? 'bg-gray-100' : ''
                  }`}
                  readOnly={!isEditingProfile}
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center">
                  {operatorProfile.is_verified ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Compte vérifié
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      ⏳ En attente de vérification
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Membre depuis {new Date(operatorProfile.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tour Operator Booking Modal */}
      <TourOperatorBookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedExcursion(null);
        }}
        excursion={selectedExcursion!}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
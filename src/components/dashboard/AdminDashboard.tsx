import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  Download,
  Phone,
  Globe,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { Profile, TourOperator, Excursion, Booking, Guide } from '../../lib/supabase';
import { bookingService, adminService } from '../../services/dataService';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface DashboardStats {
  totalUsers: number;
  totalGuides: number;
  totalTourOperators: number;
  totalExcursions: number;
  totalBookings: number;
  totalRevenue: number;
  pendingVerifications: number;
  activeExcursions: number;
  monthlyGrowth: number;
}

interface ActivityItem {
  type: 'operator' | 'excursion' | 'booking';
  text: string;
  time: string;
  icon: any;
  color: string;
  iconColor: string;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'operators' | 'excursions' | 'bookings' | 'analytics' | 'reports' | 'moderation' | 'commission'>('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  
  // États pour les données
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalGuides: 0,
    totalTourOperators: 0,
    totalExcursions: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    activeExcursions: 0,
    monthlyGrowth: 0
  });
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tourOperators, setTourOperators] = useState<TourOperator[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newUserRole, setNewUserRole] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des données admin...');

      // Utiliser le service admin pour charger toutes les données
      const [
        usersResult,
        guidesResult,
        operatorsResult,
        excursionsResult,
        bookingsResult
      ] = await Promise.allSettled([
        adminService.getAllUsers(),
        adminService.getAllGuides(),
        adminService.getAllTourOperators(),
        adminService.getAllExcursions(),
        bookingService.getAllBookings()
      ]);

      // Extract data from results
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data || [] : [];
      const guides = guidesResult.status === 'fulfilled' ? guidesResult.value.data || [] : [];
      const operators = operatorsResult.status === 'fulfilled' ? operatorsResult.value.data || [] : [];
      const excursions = excursionsResult.status === 'fulfilled' ? excursionsResult.value.data || [] : [];
      const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data || [] : [];

      // Log any failed requests
      if (usersResult.status === 'rejected') console.error('❌ Failed to load users:', usersResult.reason);
      if (guidesResult.status === 'rejected') console.error('❌ Failed to load guides:', guidesResult.reason);
      if (operatorsResult.status === 'rejected') console.error('❌ Failed to load operators:', operatorsResult.reason);
      if (excursionsResult.status === 'rejected') console.error('❌ Failed to load excursions:', excursionsResult.reason);
      if (bookingsResult.status === 'rejected') console.error('❌ Failed to load bookings:', bookingsResult.reason);

      // Calculate statistics
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const pendingVerifications = guides.filter(g => !g.is_verified).length + 
                                  operators.filter(o => !o.is_verified).length;
      const activeExcursions = excursions.filter(e => e.is_active).length;

      // Set stats immediately with the loaded data
      setStats({
        totalUsers: users.length,
        totalGuides: guides.length,
        totalTourOperators: operators.length,
        totalExcursions: excursions.length,
        totalBookings: bookings.length,
        totalRevenue,
        pendingVerifications,
        activeExcursions,
        monthlyGrowth: 0 // Placeholder for now
      });

      // Log the actual data counts for debugging
      console.log('🔍 Data loaded - Users:', users.length, 'Guides:', guides.length, 'Operators:', operators.length);

      if (usersResult.status === 'fulfilled' && usersResult.value.data) {
        setUsers(usersResult.value.data);
      }

      if (guidesResult.status === 'fulfilled' && guidesResult.value.data) {
        setGuides(guidesResult.value.data);
        console.log('📊 Guides chargés:', guidesResult.value.data.length);
      }

      if (operatorsResult.status === 'fulfilled' && operatorsResult.value.data) {
        setTourOperators(operatorsResult.value.data);
        console.log('🏢 Tour-opérateurs chargés:', operatorsResult.value.data.length);
        console.log('🏢 Tour-opérateurs data:', operatorsResult.value.data);
      }

      if (excursionsResult.status === 'fulfilled' && excursionsResult.value.data) {
        setExcursions(excursionsResult.value.data);
      }

      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.data) {
        setBookings(bookingsResult.value.data);
      }

      console.log('✅ Données admin chargées avec succès');
      console.log('📊 Stats calculées:', stats);
      console.log('👥 Utilisateurs chargés:', users.length);
      console.log('🏃 Guides chargés:', guides.length);
      console.log('🏢 Tour-opérateurs chargés:', operators.length);
      console.log('🗺️ Excursions chargées:', excursions.length);
      console.log('📅 Réservations chargées:', bookings.length);

      // Update last updated timestamp
      setLastUpdated(new Date());

    } catch (error) {
      console.error('❌ Erreur chargement données admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOperator = async (operatorId: string, verified: boolean) => {
    try {
      console.log(`🔄 ${verified ? 'Validation' : 'Rejet'} du tour-opérateur:`, operatorId);
      
      const response = await adminService.verifyTourOperator(operatorId, verified);

      if (response.error) {
        console.error('❌ Erreur lors de la vérification:', response.error);
        alert(`❌ Erreur lors de la ${verified ? 'validation' : 'rejection'}: ${response.error}`);
        return;
      }

      // Mettre à jour l'état local
      setTourOperators(prev => 
        prev.map(op => op.id === operatorId ? { ...op, is_verified: verified } : op)
      );

      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications + (verified ? -1 : 1)
      }));

      const operator = tourOperators.find(op => op.id === operatorId);
      const message = verified 
        ? `✅ Tour-opérateur "${operator?.company_name}" VALIDÉ avec succès !\n\n🎉 Ses excursions sont maintenant visibles publiquement.`
        : `❌ Tour-opérateur "${operator?.company_name}" REJETÉ.\n\n⚠️ Ses excursions restent invisibles publiquement.`;
      
      alert(message);
      
      console.log(`✅ Tour-opérateur ${verified ? 'validé' : 'rejeté'} avec succès`);
    } catch (error) {
      console.error('Erreur vérification:', error);
      alert(`❌ Erreur lors de la ${verified ? 'validation' : 'rejection'}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleVerifyGuide = async (guideId: string, verified: boolean) => {
    try {
      console.log(`🔄 ${verified ? 'Validation' : 'Rejet'} du guide:`, guideId);
      
      const response = await adminService.verifyGuide(guideId, verified);

      if (response.error) {
        console.error('❌ Erreur lors de la vérification:', response.error);
        alert(`❌ Erreur lors de la ${verified ? 'validation' : 'rejection'}: ${response.error}`);
        return;
      }

      // Mettre à jour l'état local
      setGuides(prev => 
        prev.map(guide => guide.id === guideId ? { ...guide, is_verified: verified } : guide)
      );

      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications + (verified ? -1 : 1)
      }));

      const guide = guides.find(g => g.id === guideId);
      const message = verified 
        ? `✅ Guide "${guide?.company_name}" VALIDÉ avec succès !\n\n🎉 Ses excursions sont maintenant visibles publiquement.`
        : `❌ Guide "${guide?.company_name}" REJETÉ.\n\n⚠️ Ses excursions restent invisibles publiquement.`;
      
      alert(message);
      
      console.log(`✅ Guide ${verified ? 'validé' : 'rejeté'} avec succès`);
    } catch (error) {
      console.error('Erreur vérification:', error);
      alert(`❌ Erreur lors de la ${verified ? 'validation' : 'rejection'}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const response = await adminService.deleteUser(userId);

      if (response.error) {
        alert(`❌ Erreur lors de la suppression: ${response.error}`);
        return;
      }

      setUsers(prev => prev.filter(user => user.id !== userId));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      
      alert('Utilisateur supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await adminService.updateUserRole(userId, newRole);

      if (response.error) {
        alert(`❌ Erreur lors de la mise à jour du rôle: ${response.error}`);
        return;
      }

      setUsers(prev => 
        prev.map(user => user.id === userId ? { ...user, role: newRole as any } : user)
      );
      
      alert('Rôle utilisateur mis à jour avec succès !');
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewUserRole('');
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  // Utility function to convert data to CSV
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  // Download CSV file
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download revenue report
  const handleDownloadRevenueReport = () => {
    try {
      const revenueData = bookings.map(booking => ({
        'ID Réservation': booking.id.slice(0, 8),
        'Client': `${booking.client?.first_name || ''} ${booking.client?.last_name || ''}`,
        'Email Client': booking.client?.email || '',
        'Excursion': booking.excursion?.title || '',
        'Guide': booking.excursion?.guide?.company_name || '',
        'Montant Total': booking.total_amount || 0,
        'Statut': booking.status === 'confirmed' ? 'Confirmée' : 
                 booking.status === 'pending' ? 'En attente' :
                 booking.status === 'cancelled' ? 'Annulée' : 'Terminée',
        'Date Réservation': new Date(booking.created_at).toLocaleDateString('fr-FR'),
        'Date Excursion': booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('fr-FR') : '',
        'Participants': booking.participants_count || 1
      }));

      const headers = [
        'ID Réservation', 'Client', 'Email Client', 'Excursion', 'Guide', 
        'Montant Total', 'Statut', 'Date Réservation', 'Date Excursion', 'Participants'
      ];

      const csvContent = convertToCSV(revenueData, headers);
      const filename = `rapport_revenus_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      
      console.log('✅ Rapport de revenus téléchargé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement du rapport de revenus:', error);
      alert('❌ Erreur lors du téléchargement du rapport de revenus');
    }
  };

  // Download users report
  const handleDownloadUsersReport = () => {
    try {
      const usersData = users.map(user => ({
        'ID Utilisateur': user.id.slice(0, 8),
        'Nom': user.first_name || '',
        'Prénom': user.last_name || '',
        'Email': user.email || '',
        'Rôle': user.role === 'admin' ? 'Admin' : 
                user.role === 'guide' ? 'Guide' :
                user.role === 'tour_operator' ? 'Tour-opérateur' : 'Client',
        'Date Inscription': new Date(user.created_at).toLocaleDateString('fr-FR'),
        'Vérifié': user.role === 'guide' ? 
          (guides.find(g => g.user_id === user.id)?.is_verified ? 'Oui' : 'Non') :
          user.role === 'tour_operator' ? 
          (tourOperators.find(t => t.user_id === user.id)?.is_verified ? 'Oui' : 'Non') : 'N/A'
      }));

      const headers = [
        'ID Utilisateur', 'Nom', 'Prénom', 'Email', 'Rôle', 'Date Inscription', 'Vérifié'
      ];

      const csvContent = convertToCSV(usersData, headers);
      const filename = `rapport_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      
      console.log('✅ Rapport utilisateurs téléchargé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement du rapport utilisateurs:', error);
      alert('❌ Erreur lors du téléchargement du rapport utilisateurs');
    }
  };

  const handleToggleExcursion = async (excursionId: string, isActive: boolean) => {
    try {
      const response = await adminService.moderateExcursion(excursionId, !isActive);

      if (response.error) {
        alert(`❌ Erreur lors de la modification: ${response.error}`);
        return;
      }

      setExcursions(prev => 
        prev.map(exc => exc.id === excursionId ? { ...exc, is_active: !isActive } : exc)
      );

      setStats(prev => ({
        ...prev,
        activeExcursions: prev.activeExcursions + (isActive ? -1 : 1)
      }));

      alert(`Excursion ${!isActive ? 'activée' : 'désactivée'} avec succès !`);
    } catch (error) {
      console.error('Erreur toggle excursion:', error);
      alert('Erreur lors de la modification');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOperators = tourOperators.filter(operator => {
    const matchesSearch = operator.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'verified' && operator.is_verified) ||
      (filterStatus === 'pending' && !operator.is_verified);
    return matchesSearch && matchesFilter;
  });

  const filteredExcursions = excursions.filter(excursion =>
    excursion.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Chargement du panneau administrateur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-xl font-bold text-white">Administration Myowntour</h1>
                <p className="text-purple-200 text-sm">Panneau de contrôle</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-xs text-purple-200">
                Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </div>
              <button
                onClick={loadDashboardData}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
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
            <div className="flex space-x-8 overflow-x-auto">
                             {[
                 { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                 { id: 'users', label: 'Utilisateurs', icon: Users },
                 { id: 'operators', label: 'Tour-opérateurs', icon: Building },
                 { id: 'excursions', label: 'Excursions', icon: MapPin },
                 { id: 'bookings', label: 'Réservations', icon: Calendar },
                 { id: 'analytics', label: 'Analytiques', icon: TrendingUp },
                 { id: 'reports', label: 'Rapports', icon: Download },
                 { id: 'moderation', label: 'Modération', icon: Shield },
                 { id: 'commission', label: 'Commissions', icon: DollarSign }
               ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === id
                      ? 'border-purple-500 text-purple-600'
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
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utilisateurs totaux</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tour-opérateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTourOperators}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Excursions actives</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeExcursions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue}€</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alertes et actions rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  Actions requises
                </h3>
                <div className="space-y-3">
                  {stats.pendingVerifications > 0 ? (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 p-2 rounded-full mr-3">
                          <Building className="h-4 w-4 text-yellow-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {stats.pendingVerifications} tour-opérateurs en attente
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('operators')}
                        className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                      >
                        Voir →
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-6 bg-green-50 rounded-lg">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800">
                          Aucune action requise
                        </p>
                        <p className="text-xs text-green-600">
                          Tous les tour-opérateurs sont validés
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 text-green-500 mr-2" />
                    Activité récente
                  </h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Temps réel
                  </div>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const recentActivities: ActivityItem[] = [];
                    
                    // Add recent tour operators (last 24 hours)
                    const recentOperators = tourOperators
                      .filter(op => {
                        const created = new Date(op.created_at);
                        const now = new Date();
                        const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
                        return hoursDiff <= 24;
                      })
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 3);
                    
                    recentOperators.forEach(operator => {
                      const created = new Date(operator.created_at);
                      const now = new Date();
                      const hoursDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
                      const timeText = hoursDiff === 0 ? 'À l\'instant' : 
                                     hoursDiff === 1 ? 'Il y a 1h' : 
                                     `Il y a ${hoursDiff}h`;
                      
                      recentActivities.push({
                        type: 'operator',
                        text: `Nouveau tour-opérateur: ${operator.company_name}`,
                        time: timeText,
                        icon: Building,
                        color: 'bg-blue-100',
                        iconColor: 'text-blue-600'
                      });
                    });
                    
                    // Add recent excursions (last 24 hours)
                    const recentExcursions = excursions
                      .filter(exc => {
                        const created = new Date(exc.created_at);
                        const now = new Date();
                        const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
                        return hoursDiff <= 24;
                      })
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 3);
                    
                    recentExcursions.forEach(excursion => {
                      const created = new Date(excursion.created_at);
                      const now = new Date();
                      const hoursDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
                      const timeText = hoursDiff === 0 ? 'À l\'instant' : 
                                     hoursDiff === 1 ? 'Il y a 1h' : 
                                     `Il y a ${hoursDiff}h`;
                      
                      recentActivities.push({
                        type: 'excursion',
                        text: `Nouvelle excursion: ${excursion.title}`,
                        time: timeText,
                        icon: MapPin,
                        color: 'bg-purple-100',
                        iconColor: 'text-purple-600'
                      });
                    });
                    
                    // Add recent bookings (last 24 hours)
                    const recentBookings = bookings
                      .filter(booking => {
                        const created = new Date(booking.created_at);
                        const now = new Date();
                        const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
                        return hoursDiff <= 24;
                      })
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 3);
                    
                    recentBookings.forEach(booking => {
                      const created = new Date(booking.created_at);
                      const now = new Date();
                      const hoursDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
                      const timeText = hoursDiff === 0 ? 'À l\'instant' : 
                                     hoursDiff === 1 ? 'Il y a 1h' : 
                                     `Il y a ${hoursDiff}h`;
                      
                      recentActivities.push({
                        type: 'booking',
                        text: `Réservation confirmée: ${booking.excursion?.title || 'Excursion'}`,
                        time: timeText,
                        icon: Calendar,
                        color: 'bg-green-100',
                        iconColor: 'text-green-600'
                      });
                    });
                    
                    // Sort all activities by time (most recent first) and take top 5
                    const sortedActivities = recentActivities
                      .sort((a, b) => {
                        const aTime = a.time.includes('À l\'instant') ? 0 : 
                                     parseInt(a.time.match(/\d+/)?.[0] || '999');
                        const bTime = b.time.includes('À l\'instant') ? 0 : 
                                     parseInt(b.time.match(/\d+/)?.[0] || '999');
                        return aTime - bTime;
                      })
                      .slice(0, 5);
                    
                    if (sortedActivities.length === 0) {
                      return (
                        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Aucune activité récente
                            </p>
                            <p className="text-xs text-gray-500">
                              Les nouvelles activités apparaîtront ici
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return sortedActivities.map((activity, index) => {
                      const IconComponent = activity.icon;
                      return (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className={`${activity.color} p-1 rounded-full mr-3`}>
                            <IconComponent className={`h-3 w-3 ${activity.iconColor}`} />
                          </div>
                          <span className="flex-1">{activity.text}</span>
                          <span className="ml-auto text-gray-400">{activity.time}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gestion des utilisateurs */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-purple-100 p-2 rounded-full mr-3">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'guide' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'tour_operator' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 
                             user.role === 'guide' ? 'Guide' :
                             user.role === 'tour_operator' ? 'Tour-opérateur' : 'Client'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedItem(user);
                                setShowModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setNewUserRole(user.role);
                                setShowRoleModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier le rôle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Supprimer l'utilisateur"
                              >
                                <Trash2 className="h-4 w-4" />
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
          </div>
        )}

        {/* Gestion des guides et tour-opérateurs */}
        {activeTab === 'operators' && (
          <div className="space-y-8">
            {/* Guides */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Gestion des guides</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Tous</option>
                    <option value="verified">Vérifiés</option>
                    <option value="pending">En attente</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un guide..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.filter(guide => {
                  const matchesSearch = guide.company_name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesFilter = filterStatus === 'all' || 
                    (filterStatus === 'verified' && guide.is_verified) ||
                    (filterStatus === 'pending' && !guide.is_verified);
                  return matchesSearch && matchesFilter;
                }).map((guide) => (
                  <div key={guide.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{guide.company_name}</h3>
                          <p className="text-sm text-gray-500">{guide.city}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        guide.is_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {guide.is_verified ? 'Vérifié' : 'En attente'}
                      </span>
                    </div>

                    {guide.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {guide.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {guide.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {guide.phone}
                        </div>
                      )}
                      {guide.website && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="h-4 w-4 mr-2" />
                          <a href={guide.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Site web
                          </a>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Inscrit le {new Date(guide.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedItem(guide);
                          setShowModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Voir détails
                      </button>
                      
                      {!guide.is_verified && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerifyGuide(guide.id, true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => handleVerifyGuide(guide.id, false)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tour-opérateurs */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Gestion des tour-opérateurs</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Tous</option>
                    <option value="verified">Vérifiés</option>
                    <option value="pending">En attente</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un tour-opérateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOperators.map((operator) => (
                  <div key={operator.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{operator.company_name}</h3>
                        <p className="text-sm text-gray-500">{operator.city}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      operator.is_verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {operator.is_verified ? 'Vérifié' : 'En attente'}
                    </span>
                  </div>

                  {operator.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {operator.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {operator.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {operator.phone}
                      </div>
                    )}
                    {operator.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="h-4 w-4 mr-2" />
                        <a href={operator.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Site web
                        </a>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Inscrit le {new Date(operator.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedItem(operator);
                        setShowModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Voir détails
                    </button>
                    
                    {!operator.is_verified && (
                      <div className="flex space-x-2">
                        <div className="text-xs text-gray-500 mr-2">
                          ID: {operator.user_id?.slice(0, 8)}...
                        </div>
                        <button
                          onClick={() => handleVerifyOperator(operator.id, true)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleVerifyOperator(operator.id, false)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* Gestion des excursions */}
        {activeTab === 'excursions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestion des excursions</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une excursion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        excursion.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {excursion.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{excursion.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{excursion.short_description}</p>
                    
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
                      <span className="text-sm text-gray-500">
                        Par {excursion.guide?.company_name}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(excursion);
                            setShowModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleExcursion(excursion.id, excursion.is_active)}
                          className={`${
                            excursion.is_active 
                              ? 'text-red-600 hover:text-red-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {excursion.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gestion des réservations */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestion des réservations</h2>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Réservation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Excursion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{booking.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.client?.first_name} {booking.client?.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.excursion?.title}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytiques et rapports</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <PieChart className="h-5 w-5 text-purple-600 mr-2" />
                  Répartition des utilisateurs
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Clients</span>
                    <span className="font-semibold">{users.filter(u => u.role === 'client').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Guides</span>
                    <span className="font-semibold">{guides.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tour-opérateurs</span>
                    <span className="font-semibold">{tourOperators.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Administrateurs</span>
                    <span className="font-semibold">{users.filter(u => u.role === 'admin').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
                  Performance mensuelle
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Croissance utilisateurs</span>
                    <span className="font-semibold text-green-600">+{stats.monthlyGrowth}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenus ce mois</span>
                    <span className="font-semibold">{stats.totalRevenue}€</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nouvelles réservations</span>
                    <span className="font-semibold">{stats.totalBookings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Rapports détaillés</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  Rapport de revenus
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenus totaux</span>
                    <span className="font-semibold">{stats.totalRevenue}€</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nombre de réservations</span>
                    <span className="font-semibold">{stats.totalBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valeur moyenne</span>
                    <span className="font-semibold">
                      {stats.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings) : 0}€
                    </span>
                  </div>
                  <button 
                    onClick={handleDownloadRevenueReport}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    Exporter le rapport
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  Rapport utilisateurs
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Utilisateurs totaux</span>
                    <span className="font-semibold">{stats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Guides vérifiés</span>
                    <span className="font-semibold">{tourOperators.filter(op => op.is_verified).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">En attente de vérification</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingVerifications}</span>
                  </div>
                  <button 
                    onClick={handleDownloadUsersReport}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    Exporter le rapport
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Moderation */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Modération de contenu</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  Excursions en attente
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Excursions inactives</span>
                    <span className="font-semibold">{excursions.filter(exc => !exc.is_active).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Guides non vérifiés</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingVerifications}</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('excursions')}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4 inline mr-2" />
                    Voir les excursions
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 text-purple-600 mr-2" />
                  Actions de modération
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Excursions supprimées</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Utilisateurs suspendus</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
                    <Shield className="h-4 w-4 inline mr-2" />
                    Historique des actions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Management */}
        {activeTab === 'commission' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestion des Commissions</h2>
              <div className="text-sm text-gray-600">
                Seul l'administrateur peut modifier les taux de commission
              </div>
            </div>

            {/* Commission Rates Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Guides</p>
                    <p className="text-2xl font-bold text-gray-900">65%</p>
                    <p className="text-xs text-gray-500">Commission par défaut</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tour-opérateurs</p>
                    <p className="text-2xl font-bold text-gray-900">20%</p>
                    <p className="text-xs text-gray-500">Commission par défaut</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admin</p>
                    <p className="text-2xl font-bold text-gray-900">15%</p>
                    <p className="text-xs text-gray-500">Commission fixe</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guide Commission Management */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Taux de Commission des Guides</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => (
                  <div key={guide.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{guide.company_name}</h4>
                          <p className="text-sm text-gray-500">{guide.city}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Taux actuel:</span>
                        <span className="font-semibold text-lg">{guide.commission_rate}%</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          defaultValue={guide.commission_rate}
                          data-guide-id={guide.id}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nouveau taux"
                        />
                        <button
                          onClick={async () => {
                            const input = document.querySelector(`input[data-guide-id="${guide.id}"]`) as HTMLInputElement;
                            const newRate = parseFloat(input?.value || '65');
                            if (newRate >= 0 && newRate <= 100) {
                              const response = await adminService.updateGuideCommissionRate(guide.id, newRate);
                              if (response.error) {
                                alert(`Erreur: ${response.error}`);
                              } else {
                                alert(`Taux de commission mis à jour: ${newRate}%`);
                                loadDashboardData();
                              }
                            } else {
                              alert('Le taux doit être entre 0 et 100%');
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Mettre à jour
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tour Operator Commission Management */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Taux de Commission des Tour-opérateurs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tourOperators.map((operator) => (
                  <div key={operator.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <Building className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{operator.company_name}</h4>
                          <p className="text-sm text-gray-500">{operator.city}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Taux actuel:</span>
                        <span className="font-semibold text-lg">{operator.commission_rate}%</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          defaultValue={operator.commission_rate}
                          data-operator-id={operator.id}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Nouveau taux"
                        />
                        <button
                          onClick={async () => {
                            const input = document.querySelector(`input[data-operator-id="${operator.id}"]`) as HTMLInputElement;
                            const newRate = parseFloat(input?.value || '20');
                            if (newRate >= 0 && newRate <= 100) {
                              const response = await adminService.updateTourOperatorCommissionRate(operator.id, newRate);
                              if (response.error) {
                                alert(`Erreur: ${response.error}`);
                              } else {
                                alert(`Taux de commission mis à jour: ${newRate}%`);
                                loadDashboardData();
                              }
                            } else {
                              alert('Le taux doit être entre 0 et 100%');
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Mettre à jour
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(selectedItem).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-200 pb-2">
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {typeof value === 'object' && value !== null 
                        ? JSON.stringify(value, null, 2)
                        : String(value || 'N/A')
                      }
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des rôles */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Modifier le rôle</h2>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                    setNewUserRole('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Utilisateur:</p>
                  <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Rôle actuel:</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                    selectedUser.role === 'guide' ? 'bg-blue-100 text-blue-800' :
                    selectedUser.role === 'tour_operator' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.role === 'admin' ? 'Admin' : 
                     selectedUser.role === 'guide' ? 'Guide' :
                     selectedUser.role === 'tour_operator' ? 'Tour-opérateur' : 'Client'}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Nouveau rôle:</p>
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="client">Client</option>
                    <option value="guide">Guide</option>
                    <option value="tour_operator">Tour-opérateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                      setNewUserRole('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (newUserRole && newUserRole !== selectedUser.role) {
                        handleUpdateUserRole(selectedUser.id, newUserRole);
                      } else {
                        alert('Veuillez sélectionner un rôle différent');
                      }
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
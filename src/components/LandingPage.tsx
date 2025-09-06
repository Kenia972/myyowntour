import React, { useState } from 'react';
import { useEffect } from 'react';
import { Calendar, MapPin, Users, Star, Phone, Mail, Menu, X, Camera, Clock, DollarSign } from 'lucide-react';
import { Excursion } from '../lib/supabase';
import { excursionService } from '../services/dataService';
import { SupabaseTest } from './SupabaseTest';

interface LandingPageProps {
  onOpenAuth: (mode: 'signin' | 'signup', role?: 'client' | 'guide' | 'tour_operator') => void;
}

export function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [loadingExcursions, setLoadingExcursions] = useState(true);

  useEffect(() => {
    loadExcursions();
  }, []);

  const loadExcursions = async () => {
    try {
      setLoadingExcursions(true);
      
      const response = await excursionService.getActiveExcursions(6);
      
      if (response.error) {
        console.error('Erreur lors du chargement des excursions:', response.error);
        setExcursions([]);
        return;
      }

      if (response.data && response.data.length > 0) {
        console.log(`✅ ${response.data.length} excursions chargées depuis la base de données`);
        setExcursions(response.data);
      } else {
        console.log('Aucune excursion active trouvée');
        setExcursions([]);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des excursions:', error);
      setExcursions([]);
    } finally {
      setLoadingExcursions(false);
    }
  };

  // Fonction pour obtenir une image par défaut selon la catégorie
  const getDefaultImage = (category: string) => {
    const defaultImages = {
      beach: "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
      hiking: "https://images.pexels.com/photos/1450082/pexels-photo-1450082.jpeg?auto=compress&cs=tinysrgb&w=800",
      nautical: "https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=800",
      cultural: "https://images.pexels.com/photos/1450361/pexels-photo-1450361.jpeg?auto=compress&cs=tinysrgb&w=800",
      adventure: "https://images.pexels.com/photos/1450082/pexels-photo-1450082.jpeg?auto=compress&cs=tinysrgb&w=800",
      gastronomy: "https://images.pexels.com/photos/1450361/pexels-photo-1450361.jpeg?auto=compress&cs=tinysrgb&w=800"
    };
    return defaultImages[category as keyof typeof defaultImages] || defaultImages.beach;
  };

  // Fonction pour traduire les catégories
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

  const testimonials = [
    {
      name: "Marie & Pierre",
      location: "Paris, France",
      text: "Une expérience inoubliable ! Les guides sont passionnés et connaissent parfaitement leur île. Nous recommandons vivement.",
      rating: 5
    },
    {
      name: "Sarah Johnson",
      location: "London, UK",
      text: "Perfect organization and breathtaking landscapes. The catamaran trip was the highlight of our vacation!",
      rating: 5
    },
    {
      name: "Carlos & Ana",
      location: "Madrid, Spain",
      text: "Excursiones muy bien organizadas y guías excelentes. Martinica es preciosa y estas excursiones lo demuestran.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Supabase Connection Test */}
      <SupabaseTest />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Camera className="h-8 w-8 text-blue-500 mr-2" />
                <span className="text-xl font-bold text-gray-900">Myowntour</span>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#excursions" className="text-gray-700 hover:text-blue-500 transition-colors">Excursions</a>
              <a href="#about" className="text-gray-700 hover:text-blue-500 transition-colors">À propos</a>
              <a href="#partners" className="text-gray-700 hover:text-blue-500 transition-colors">Partenaires</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-500 transition-colors">Contact</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => onOpenAuth('signin', 'client')}
                className="text-gray-700 hover:text-blue-500 transition-colors"
              >
                Connexion voyageur
              </button>
              <button
                onClick={() => onOpenAuth('signin', 'tour_operator')}
                className="text-gray-700 hover:text-blue-500 transition-colors"
              >
                Connexion pro
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-500"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#excursions" className="block px-3 py-2 text-gray-700 hover:text-blue-500">Excursions</a>
              <a href="#about" className="block px-3 py-2 text-gray-700 hover:text-blue-500">À propos</a>
              <a href="#partners" className="block px-3 py-2 text-gray-700 hover:text-blue-500">Partenaires</a>
              <a href="#contact" className="block px-3 py-2 text-gray-700 hover:text-blue-500">Contact</a>
              <div className="border-t border-gray-200 pt-4 pb-3">
                <button
                  onClick={() => onOpenAuth('signin', 'client')}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-500"
                >
                  Connexion voyageur
                </button>
                <button
                  onClick={() => onOpenAuth('signin', 'tour_operator')}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-500"
                >
                  Connexion pro
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-teal-600">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1600')"
          }}
        ></div>
        
        <div className="relative text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Découvrez la <span className="text-yellow-400">Martinique</span> autrement
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-100">
            Des excursions authentiques avec des guides locaux passionnés
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onOpenAuth('signup', 'client')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Je suis un voyageur
            </button>
            <button
              onClick={() => onOpenAuth('signup', 'guide')}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300"
            >
              Je suis un guide
            </button>
            <button
              onClick={() => onOpenAuth('signup', 'tour_operator')}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300"
            >
              Je suis un tour-opérateur
            </button>
          </div>
        </div>
      </section>

      {/* Excursions Section */}
      <section id="excursions" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Nos Excursions
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explorez les trésors cachés de la Martinique avec nos excursions soigneusement sélectionnées
            </p>
          </div>

          {loadingExcursions ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-600">Chargement des excursions...</span>
            </div>
          ) : excursions.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune excursion disponible</h3>
              <p className="text-gray-600 mb-6">
                Les excursions de nos partenaires apparaîtront ici une fois qu'elles seront créées et activées.
              </p>
              <button
                onClick={() => onOpenAuth('signup', 'guide')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Devenir guide
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {excursions.map((excursion) => (
                <div key={excursion.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative">
                    <img 
                      src={excursion.images && excursion.images.length > 0 ? excursion.images[0] : getDefaultImage(excursion.category)} 
                      alt={excursion.title}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        // Si l'image ne charge pas, utiliser l'image par défaut
                        const target = e.target as HTMLImageElement;
                        target.src = getDefaultImage(excursion.category);
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-gray-900">{excursion.price_per_person}€</span>
                    </div>
                    <div className="absolute top-4 left-4 bg-blue-500 bg-opacity-90 px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-white">{getCategoryLabel(excursion.category)}</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{excursion.title}</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">4.8</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">{excursion.short_description || excursion.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="mr-4">{excursion.duration_hours}h</span>
                      <Users className="h-4 w-4 mr-1" />
                      <span className="mr-4">Max {excursion.max_participants}</span>
                      {excursion.tour_operator?.is_verified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          ✓ Vérifié
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {excursion.included_services && excursion.included_services.slice(0, 3).map((service, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {service}
                        </span>
                      ))}
                      {excursion.included_services && excursion.included_services.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          +{excursion.included_services.length - 3} autres
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-500">
                        Par {excursion.tour_operator?.company_name || 'Tour-opérateur local'}
                      </div>
                      <div className="text-sm text-gray-400">
                        Niveau {excursion.difficulty_level}/5
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onOpenAuth('signup', 'client')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors duration-300"
                    >
                      Réserver cette excursion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section d'encouragement pour les tour-opérateurs si pas d'excursions */}
      {!loadingExcursions && excursions.length === 0 && (
        <section className="py-16 bg-blue-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Vous êtes guide ou tour-opérateur en Martinique ?
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              Rejoignez notre plateforme ! Guides : créez vos excursions. Tour-opérateurs : revendez les excursions de nos guides.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onOpenAuth('signup', 'guide')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Devenir guide
              </button>
              <button
                onClick={() => onOpenAuth('signup', 'tour_operator')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Devenir tour-opérateur
              </button>
              <button
                onClick={() => onOpenAuth('signin', 'guide')}
                className="bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                J'ai déjà un compte
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section d'encouragement pour créer plus d'excursions */}
      {!loadingExcursions && excursions.length > 0 && excursions.length < 6 && (
        <section className="py-12 bg-gradient-to-r from-blue-500 to-teal-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Plus d'excursions arrivent bientôt !
            </h3>
            <p className="text-lg text-blue-100 mb-6">
              Nos partenaires travaillent dur pour vous proposer encore plus d'aventures exceptionnelles.
            </p>
            <button
              onClick={() => onOpenAuth('signup', 'guide')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Devenir guide
            </button>
          </div>
        </section>
      )}

      {/* Reste des sections... */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Votre passerelle vers l'authenticité martiniquaise
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Myowntour connecte les voyageurs avec les meilleurs tour-opérateurs locaux pour des expériences inoubliables en Martinique. Notre mission est de promouvoir un tourisme durable et authentique.
              </p>
              <div className="space-y-4">
                <div className="relative">
                  <div className="bg-green-100 p-2 rounded-full mr-4">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-700">Guides locaux certifiés</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Petits groupes privilégiés</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-full mr-4">
                    <Star className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-gray-700">Expériences authentiques</span>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.pexels.com/photos/1450082/pexels-photo-1450082.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Paysage martiniquais"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Votre passerelle vers l'authenticité martiniquaise
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Myowntour connecte les voyageurs avec les meilleurs tour-opérateurs locaux pour des expériences inoubliables en Martinique. Notre mission est de promouvoir un tourisme durable et authentique.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-4">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-700">Guides locaux certifiés</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Petits groupes privilégiés</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-full mr-4">
                    <Star className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-gray-700">Expériences authentiques</span>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.pexels.com/photos/1450082/pexels-photo-1450082.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Paysage martiniquais"
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Rejoignez notre réseau
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Vous êtes tour-opérateur en Martinique ? Développez votre activité avec notre plateforme
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Augmentez vos revenus</h3>
                <p className="text-gray-600">Commission de seulement 15% - la plus compétitive du marché</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gestion simplifiée</h3>
                <p className="text-gray-600">Outils de gestion des réservations et paiements sécurisés</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <Star className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Visibilité renforcée</h3>
                <p className="text-gray-600">Mettez en valeur vos excursions sur notre plateforme</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onOpenAuth('signup', 'tour_operator')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Devenir tour-opérateur
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-lg text-gray-600">Des expériences qui marquent une vie</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Contactez-nous
            </h2>
            <p className="text-lg text-gray-300">
              Une question ? Un projet de partenariat ? Nous sommes là pour vous
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-6">Informations de contact</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-blue-400 mr-3" />
                  <span>+596 696 XX XX XX</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-blue-400 mr-3" />
                  <span>contact@myowntour.com</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-blue-400 mr-3" />
                  <span>Fort-de-France, Martinique</span>
                </div>
              </div>
            </div>
            
            <div>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Votre email"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Votre message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors duration-300"
                >
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Camera className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold">Myowntour</span>
              </div>
              <p className="text-gray-400">
                Votre plateforme de réservation d'excursions en Martinique
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Excursions</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Plages & Côtes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Randonnées</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Activités nautiques</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Culture & Patrimoine</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Professionnels</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Devenir guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Devenir tour-opérateur</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Espace pro</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conditions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Myowntour. Tous droits réservés.</p>
            <div className="mt-2">
              <button
                onClick={() => window.location.href = '?admin=myowntour2025'}
                className="text-xs text-gray-600 hover:text-gray-500 transition-colors"
                style={{ opacity: 0.1 }}
                title="Accès administrateur"
              >
                •
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={() => window.location.href = '?admin=myowntour2025'}
                className="text-xs text-gray-600 hover:text-gray-500 transition-colors"
                style={{ opacity: 0.1 }}
              >
                •
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Users,
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';
import { BookingConflict } from '../../services/availabilitySyncService';
import { availabilitySyncService } from '../../services/availabilitySyncService';

interface BookingConflictHandlerProps {
  excursionId: string;
  onConflictResolved?: () => void;
  onRetryBooking?: () => void;
}

export function BookingConflictHandler({ 
  excursionId, 
  onConflictResolved, 
  onRetryBooking 
}: BookingConflictHandlerProps) {
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!excursionId) return;

    // Subscribe to booking conflicts
    const unsubscribe = availabilitySyncService.subscribeToBookingConflicts(
      excursionId,
      (conflict) => {
        setConflicts(prev => {
          // Avoid duplicates
          const exists = prev.some(c => 
            c.slotId === conflict.slotId && 
            c.conflictType === conflict.conflictType
          );
          
          if (!exists) {
            return [...prev, conflict];
          }
          return prev;
        });
      }
    );

    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [excursionId]);

  const handleDismissConflict = (conflictIndex: number) => {
    setConflicts(prev => prev.filter((_, index) => index !== conflictIndex));
  };

  const handleRetryBooking = () => {
    setConflicts([]);
    onRetryBooking?.();
  };

  const handleRefreshAvailability = async () => {
    try {
      // Refresh availability for all conflicted slots
      for (const conflict of conflicts) {
        await availabilitySyncService.refreshSlotAvailability(conflict.slotId);
      }
      
      // Clear conflicts after refresh
      setConflicts([]);
      onConflictResolved?.();
    } catch (error) {
      console.error('Error refreshing availability:', error);
    }
  };

  const getConflictIcon = (conflictType: BookingConflict['conflictType']) => {
    switch (conflictType) {
      case 'insufficient_spots':
        return <Users className="h-5 w-5 text-red-500" />;
      case 'slot_unavailable':
        return <Calendar className="h-5 w-5 text-red-500" />;
      case 'guide_unavailable':
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getConflictTitle = (conflictType: BookingConflict['conflictType']) => {
    switch (conflictType) {
      case 'insufficient_spots':
        return 'Places insuffisantes';
      case 'slot_unavailable':
        return 'Créneau indisponible';
      case 'guide_unavailable':
        return 'Guide indisponible';
      default:
        return 'Conflit de réservation';
    }
  };

  const getConflictDescription = (conflict: BookingConflict) => {
    switch (conflict.conflictType) {
      case 'insufficient_spots':
        return `Vous avez demandé ${conflict.requestedParticipants} place(s), mais seulement ${conflict.availableSpots} place(s) reste(nt) disponible(s).`;
      case 'slot_unavailable':
        return 'Ce créneau n\'est plus disponible. Il a peut-être été supprimé ou marqué comme indisponible par le guide.';
      case 'guide_unavailable':
        return 'Le guide n\'est pas disponible à cette date. Veuillez choisir un autre créneau.';
      default:
        return conflict.message;
    }
  };

  const getConflictActions = (conflict: BookingConflict) => {
    switch (conflict.conflictType) {
      case 'insufficient_spots':
        return [
          {
            label: 'Réduire le nombre de participants',
            action: () => {
              // This would typically open a modal to adjust participant count
              console.log('Adjust participant count');
            },
            variant: 'primary' as const
          },
          {
            label: 'Choisir un autre créneau',
            action: () => {
              setConflicts([]);
              onRetryBooking?.();
            },
            variant: 'secondary' as const
          }
        ];
      case 'slot_unavailable':
        return [
          {
            label: 'Actualiser les disponibilités',
            action: handleRefreshAvailability,
            variant: 'primary' as const
          },
          {
            label: 'Choisir un autre créneau',
            action: () => {
              setConflicts([]);
              onRetryBooking?.();
            },
            variant: 'secondary' as const
          }
        ];
      case 'guide_unavailable':
        return [
          {
            label: 'Choisir un autre créneau',
            action: () => {
              setConflicts([]);
              onRetryBooking?.();
            },
            variant: 'primary' as const
          }
        ];
      default:
        return [
          {
            label: 'Réessayer',
            action: handleRetryBooking,
            variant: 'primary' as const
          }
        ];
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {conflicts.map((conflict, index) => (
        <div
          key={`${conflict.slotId}-${conflict.conflictType}-${index}`}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getConflictIcon(conflict.conflictType)}
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">
                  {getConflictTitle(conflict.conflictType)}
                </h4>
                <p className="text-red-800 text-sm mb-3">
                  {getConflictDescription(conflict)}
                </p>
                
                {/* Conflict Details */}
                <div className="bg-red-100 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-red-600" />
                      <span className="text-red-800">
                        Demandé: {conflict.requestedParticipants}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-800">
                        Disponible: {conflict.availableSpots}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {getConflictActions(conflict).map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={action.action}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        action.variant === 'primary'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-white hover:bg-red-50 text-red-700 border border-red-300'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleDismissConflict(index)}
              className="text-red-400 hover:text-red-600 p-1"
              title="Ignorer ce conflit"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Global Actions */}
      {conflicts.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Info className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">
                Actions globales
              </h4>
              <p className="text-blue-800 text-sm mb-3">
                Vous avez {conflicts.length} conflit(s) de réservation. 
                Vous pouvez actualiser toutes les disponibilités ou recommencer votre réservation.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefreshAvailability}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser toutes les disponibilités</span>
            </button>
            
            <button
              onClick={handleRetryBooking}
              className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Recommencer la réservation
            </button>
          </div>
        </div>
      )}

      {/* Subscription Status */}
      {!isSubscribed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-800 text-sm">
              Surveillance des conflits en cours de connexion...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingConflictHandler;

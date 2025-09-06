import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Calendar, 
  Users, 
  QrCode,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { NotificationService, Notification } from '../../services/notificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking_created':
    case 'booking_confirmed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'booking_cancelled':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'reminder_24h':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'checkin_success':
      return <QrCode className="h-5 w-5 text-purple-500" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'booking_created':
    case 'booking_confirmed':
      return 'bg-green-50 border-green-200';
    case 'booking_cancelled':
      return 'bg-red-50 border-red-200';
    case 'reminder_24h':
      return 'bg-blue-50 border-blue-200';
    case 'checkin_success':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export function NotificationCenter({ isOpen, onClose, userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        NotificationService.getUserNotifications(userId, 50),
        NotificationService.getUnreadCount(userId)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(userId);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span className="text-gray-600">Chargement des notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
              <p className="text-gray-600">Vous n'avez pas encore de notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id!)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at!)}
                          </span>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${
                        !notification.is_read ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.data && Object.keys(notification.data).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {notification.data.excursion_title && (
                            <div>Excursion: {notification.data.excursion_title}</div>
                          )}
                          {notification.data.excursion_date && (
                            <div>Date: {new Date(notification.data.excursion_date).toLocaleDateString('fr-FR')}</div>
                          )}
                          {notification.data.participants_count && (
                            <div>Participants: {notification.data.participants_count}</div>
                          )}
                        </div>
                      )}
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id!);
                        }}
                        className="flex-shrink-0 text-blue-600 hover:text-blue-800"
                        title="Marquer comme lu"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
            <button
              onClick={loadNotifications}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

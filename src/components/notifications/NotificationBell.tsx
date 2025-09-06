import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationService } from '../../services/notificationService';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUnreadCount();
      // Set up polling for real-time updates
      const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowNotificationCenter(true);
  };

  const handleNotificationCenterClose = () => {
    setShowNotificationCenter(false);
    // Refresh unread count when closing
    loadUnreadCount();
  };

  if (loading) {
    return (
      <div className="relative">
        <button
          disabled
          className="p-2 text-gray-400 cursor-not-allowed"
        >
          <Bell className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={handleBellClick}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors relative"
          title="Notifications"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {showNotificationCenter && (
        <NotificationCenter
          isOpen={showNotificationCenter}
          onClose={handleNotificationCenterClose}
          userId={userId}
        />
      )}
    </>
  );
}

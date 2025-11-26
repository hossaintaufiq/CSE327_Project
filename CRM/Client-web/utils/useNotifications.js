"use client";

import { useEffect } from 'react';
import useNotificationStore from '@/store/notificationStore';
import { notificationAPI } from '@/utils/api';
import useAuthStore from '@/store/authStore';

export function useNotifications() {
  const { user, activeCompanyId } = useAuthStore();
  const { setNotifications, addNotification, setLoading, setError } = useNotificationStore();

  // Fetch notifications when user or company changes
  useEffect(() => {
    if (user && activeCompanyId) {
      fetchNotifications();
    }
  }, [user, activeCompanyId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ limit: 50 });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = () => {
    if (user && activeCompanyId) {
      fetchNotifications();
    }
  };

  // Set up polling for new notifications (every 30 seconds)
  useEffect(() => {
    if (!user || !activeCompanyId) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, activeCompanyId]);

  return {
    refreshNotifications,
    fetchNotifications,
  };
}

// Hook for real-time notification updates (can be extended with WebSocket/SSE)
export function useRealtimeNotifications() {
  const { addNotification } = useNotificationStore();

  // This can be extended to listen for WebSocket or Server-Sent Events
  // For now, it's a placeholder for future real-time implementation
  useEffect(() => {
    // TODO: Implement WebSocket or SSE connection for real-time notifications
    // Example:
    // const ws = new WebSocket('ws://localhost:5000/notifications');
    // ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   addNotification(notification);
    // };

    return () => {
      // Cleanup WebSocket connection
    };
  }, []);

  return {};
}
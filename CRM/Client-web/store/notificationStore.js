import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,

      // Actions
      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        set({ notifications, unreadCount });
      },

      addNotification: (notification) => {
        const currentNotifications = get().notifications;
        const newNotifications = [notification, ...currentNotifications];
        const unreadCount = newNotifications.filter(n => !n.isRead).length;
        set({ notifications: newNotifications, unreadCount });
      },

      markAsRead: (notificationId) => {
        const currentNotifications = get().notifications;
        const updatedNotifications = currentNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        );
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
        set({ notifications: updatedNotifications, unreadCount });
      },

      markAllAsRead: () => {
        const currentNotifications = get().notifications;
        const updatedNotifications = currentNotifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        }));
        set({ notifications: updatedNotifications, unreadCount: 0 });
      },

      removeNotification: (notificationId) => {
        const currentNotifications = get().notifications;
        const filteredNotifications = currentNotifications.filter(n => n._id !== notificationId);
        const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
        set({ notifications: filteredNotifications, unreadCount });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Clear all notifications
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      // Get notifications by type
      getNotificationsByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },

      // Get unread notifications
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.isRead);
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Only persist last 50 notifications
        unreadCount: state.unreadCount,
      }),
    }
  )
);

export default useNotificationStore;
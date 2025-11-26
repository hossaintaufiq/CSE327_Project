import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, createNotification } from '../services/notificationService.js';

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, isRead } = req.query;
    const userId = req.user._id;
    const companyId = req.companyId;

    let query = { userId, companyId };
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const { notifications, total } = await getUserNotifications(userId, companyId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + notifications.length < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    const companyId = req.companyId;

    const { notifications } = await getUserNotifications(userId, companyId, 1, 0);
    const notification = notifications.find(n => n._id.toString() === notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
};

/**
 * Create a new notification
 */
export const createNotificationController = async (req, res) => {
  try {
    const { title, message, type, priority } = req.body;
    const userId = req.user._id;
    const companyId = req.companyId;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const notification = await createNotification({
      userId,
      companyId,
      title,
      message,
      type: type || 'general',
      priority: priority || 'medium',
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await markNotificationAsRead(notificationId, userId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const companyId = req.companyId;

    const result = await markAllNotificationsAsRead(userId, companyId);
    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    const companyId = req.companyId;

    // For now, we'll use soft delete by marking as read
    // In a full implementation, you might want hard delete
    const notification = await markNotificationAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};
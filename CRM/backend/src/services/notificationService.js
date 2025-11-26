import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { sendStatusUpdateEmail, sendIssueAlertEmail } from './emailService.js';

// Create a notification
export const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    console.log(`🔔 Notification created: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

// Send notification and email for status change
export const sendStatusChangeNotification = async (companyId, entityType, entityId, entity, oldStatus, newStatus, recipientId = null) => {
  try {
    // Determine recipients
    let recipients = [];

    if (recipientId) {
      recipients = [recipientId];
    } else {
      // For tasks, notify assigned user
      if (entityType === 'task' && entity.assignedTo) {
        recipients = [entity.assignedTo];
      }
      // For issues, notify reportedBy and assignedTo
      else if (entityType === 'issue') {
        recipients = [];
        if (entity.reportedBy) recipients.push(entity.reportedBy);
        if (entity.assignedTo) recipients.push(entity.assignedTo);
      }
      // For clients, notify assigned user
      else if (entityType === 'client' && entity.assignedTo) {
        recipients = [entity.assignedTo];
      }
      // For projects and orders, notify team members or admins
      else {
        // Get company admins
        const admins = await User.find({
          'companies.companyId': companyId,
          'companies.role': { $in: ['company_admin', 'manager'] },
          isActive: true,
        }).select('_id');
        recipients = admins.map(admin => admin._id);
      }
    }

    if (recipients.length === 0) {
      console.log(`⚠️ No recipients found for ${entityType} status change`);
      return;
    }

    // Create notifications for each recipient
    const notifications = [];
    for (const recipient of recipients) {
      const notification = await createNotification({
        userId: recipient,
        companyId,
        type: entityType,
        entityId,
        title: `Status Update: ${entity.title || entity.name || entity.orderNumber || `Issue #${entity._id}`}`,
        message: `Status changed from ${oldStatus || 'Unknown'} to ${newStatus}`,
        priority: entity.priority === 'urgent' || entity.priority === 'high' ? 'high' : 'medium',
        relatedEntity: entityId,
        entityType: entityType.charAt(0).toUpperCase() + entityType.slice(1),
        metadata: {
          oldStatus: oldStatus || 'Unknown',
          newStatus,
          entityTitle: entity.title || entity.name || entity.orderNumber || `Issue #${entity._id}`,
          jiraIssueKey: entity.jiraIssues?.[0]?.issueKey,
        },
      });
      notifications.push(notification);
    }

    // Send emails
    await sendStatusChangeEmails(notifications, entityType, entity, oldStatus, newStatus);

    return notifications;
  } catch (error) {
    console.error('❌ Error sending status change notification:', error);
    throw error;
  }
};

// Send emails for status changes
const sendStatusChangeEmails = async (notifications, entityType, entity, oldStatus, newStatus) => {
  try {
    for (const notification of notifications) {
      try {
        // Get recipient details
        const recipient = await User.findById(notification.userId).select('email name');
        if (!recipient || !recipient.email) {
          console.log(`⚠️ No email found for recipient ${notification.userId}`);
          continue;
        }

        // Send email
        await sendStatusUpdateEmail(
          recipient.email,
          recipient.name || 'User',
          entityType.charAt(0).toUpperCase() + entityType.slice(1),
          notification.metadata.entityTitle,
          notification.metadata.oldStatus,
          notification.metadata.newStatus,
          notification.metadata.jiraIssueKey
        );

        // Mark as emailed
        notification.emailSent = true;
        await notification.save();

      } catch (emailError) {
        console.error(`❌ Error sending email for notification ${notification._id}:`, emailError);
        // Continue with other notifications
      }
    }
  } catch (error) {
    console.error('❌ Error in sendStatusChangeEmails:', error);
    throw error;
  }
};

// Send issue alert notification
export const sendIssueAlertNotification = async (companyId, issueId, issue, recipientId = null) => {
  try {
    let recipients = [];

    if (recipientId) {
      recipients = [recipientId];
    } else {
      // Notify admins and managers
      const admins = await User.find({
        'companies.companyId': companyId,
        'companies.role': { $in: ['company_admin', 'manager'] },
        isActive: true,
      }).select('_id');
      recipients = admins.map(admin => admin._id);
    }

    const notifications = [];
    for (const recipient of recipients) {
      const notification = await createNotification({
        userId: recipient,
        companyId,
        type: 'issue',
        entityId: issueId,
        title: `New Issue Alert: ${issue.title}`,
        message: `Priority: ${issue.priority}, Status: ${issue.status}`,
        priority: issue.priority === 'urgent' ? 'urgent' : issue.priority === 'high' ? 'high' : 'medium',
        relatedEntity: issueId,
        entityType: 'Issue',
        metadata: {
          entityTitle: issue.title,
          priority: issue.priority,
          status: issue.status,
        },
      });
      notifications.push(notification);
    }

    // Send emails
    await sendIssueAlertEmails(notifications, issue);

    return notifications;
  } catch (error) {
    console.error('❌ Error sending issue alert notification:', error);
    throw error;
  }
};

// Send issue alert emails
const sendIssueAlertEmails = async (notifications, issue) => {
  try {
    for (const notification of notifications) {
      try {
        const recipient = await User.findById(notification.userId).select('email name');
        if (!recipient || !recipient.email) continue;

        await sendIssueAlertEmail(
          recipient.email,
          recipient.name || 'User',
          issue.title,
          issue.priority,
          issue.status,
          issue.reportedBy?.name || 'Unknown',
          issue.description
        );

        notification.emailSent = true;
        await notification.save();

      } catch (emailError) {
        console.error(`❌ Error sending issue alert email for notification ${notification._id}:`, emailError);
      }
    }
  } catch (error) {
    console.error('❌ Error in sendIssueAlertEmails:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId, companyId, limit = 50, offset = 0) => {
  try {
    const notifications = await Notification.find({
      userId,
      companyId
    })
    .populate('companyId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);

    const total = await Notification.countDocuments({ userId, companyId });

    return { notifications, total };
  } catch (error) {
    console.error('❌ Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId, companyId) => {
  try {
    const result = await Notification.updateMany(
      { userId, companyId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};

// Clean up old notifications (optional utility)
export const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up old notifications:', error);
    throw error;
  }
};

// Create notifications for status change (called from jiraSync)
export const createNotificationForStatusChange = async (entityType, entity, newStatus) => {
  try {
    console.log(`🔔 Creating notifications for ${entityType} status change to ${newStatus}`);

    // Get company ID from entity
    const companyId = entity.companyId || entity.company;

    if (!companyId) {
      console.warn(`⚠️ No company ID found for ${entityType}, skipping notifications`);
      return;
    }

    // Determine recipients based on entity type
    let recipients = [];

    // For tasks, notify assigned user and project manager
    if (entityType === 'task' && entity.assignedTo) {
      recipients = [entity.assignedTo];
      // Also notify project manager if different
      if (entity.projectId && entity.projectId.manager && entity.projectId.manager.toString() !== entity.assignedTo.toString()) {
        recipients.push(entity.projectId.manager);
      }
    }
    // For issues, notify reportedBy and assignedTo
    else if (entityType === 'issue') {
      recipients = [];
      if (entity.reportedBy) recipients.push(entity.reportedBy);
      if (entity.assignedTo && !recipients.includes(entity.assignedTo)) recipients.push(entity.assignedTo);
    }
    // For clients, notify assigned user
    else if (entityType === 'client' && entity.assignedTo) {
      recipients = [entity.assignedTo];
    }
    // For projects and orders, notify company admins and managers
    else {
      const admins = await User.find({
        'companies.companyId': companyId,
        'companies.role': { $in: ['company_admin', 'manager'] },
        isActive: true,
      }).select('_id');
      recipients = admins.map(admin => admin._id);
    }

    if (recipients.length === 0) {
      console.log(`⚠️ No recipients found for ${entityType} status change`);
      return;
    }

    // Create notifications for each recipient
    const notifications = [];
    for (const recipient of recipients) {
      const notification = await createNotification({
        userId: recipient,
        companyId,
        type: entityType,
        entityId: entity._id,
        title: `Status Update: ${entity.title || entity.name || entity.orderNumber || `Issue #${entity._id}`}`,
        message: `Status changed to ${newStatus}`,
        priority: entity.priority === 'urgent' || entity.priority === 'high' ? 'high' : 'medium',
        relatedEntity: entity._id,
        entityType: entityType.charAt(0).toUpperCase() + entityType.slice(1),
        metadata: {
          newStatus,
          entityTitle: entity.title || entity.name || entity.orderNumber || `Issue #${entity._id}`,
          jiraIssueKey: entity.jiraIssues?.[0]?.issueKey,
          syncedToJira: true,
        },
      });
      notifications.push(notification);
    }

    // Send emails for status changes
    await sendStatusChangeEmails(notifications, entityType, entity, null, newStatus);

    console.log(`✅ Created ${notifications.length} notifications for ${entityType} status change`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating notifications for status change:', error);
    throw error;
  }
};
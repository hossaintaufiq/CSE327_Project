import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { sendStatusUpdateEmail, sendIssueAlertEmail } from './emailService.js';
import { sendNotification as sendTelegramNotification } from './telegramService.js';

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
      
      // Send Telegram notification
      const telegramMessage = 
        `🔔 *Status Update*\n\n` +
        `*${entityType.charAt(0).toUpperCase() + entityType.slice(1)}:* ${entity.title || entity.name || entity.orderNumber || `Issue #${entity._id}`}\n` +
        `*Status:* ${oldStatus || 'Unknown'} → ${newStatus}\n` +
        `*Priority:* ${entity.priority || 'Normal'}`;
      
      await sendTelegramNotification(recipient, telegramMessage).catch(err => 
        console.log(`⚠️ Failed to send Telegram notification to ${recipient}:`, err.message)
      );
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
      
      // Send Telegram notification for issues
      const telegramMessage = 
        `🚨 *New Issue Alert*\n\n` +
        `*Issue:* ${issue.title}\n` +
        `*Priority:* ${issue.priority}\n` +
        `*Status:* ${issue.status}\n` +
        `*Category:* ${issue.category || 'N/A'}\n\n` +
        `${issue.description ? issue.description.substring(0, 100) + '...' : 'No description'}`;
      
      await sendTelegramNotification(recipient, telegramMessage).catch(err => 
        console.log(`⚠️ Failed to send Telegram notification to ${recipient}:`, err.message)
      );
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

    console.log(`✅ Created ${notifications.length} notifications for ${entityType} status change`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating notifications for status change:', error);
    throw error;
  }
};

/**
 * Send task assignment notification (with Telegram)
 */
export const sendTaskAssignmentNotification = async (companyId, taskId, task, assigneeId) => {
  try {
    const notification = await createNotification({
      userId: assigneeId,
      companyId,
      type: 'task',
      entityId: taskId,
      title: `New Task Assigned: ${task.title}`,
      message: `You have been assigned a new task`,
      priority: task.priority === 'urgent' || task.priority === 'high' ? 'high' : 'medium',
      relatedEntity: taskId,
      entityType: 'Task',
      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        status: task.status,
      },
    });

    // Send Telegram notification
    const dueDate = task.dueDate ? `\n*Due:* ${new Date(task.dueDate).toLocaleDateString()}` : '';
    const telegramMessage = 
      `📋 *New Task Assigned*\n\n` +
      `*Task:* ${task.title}\n` +
      `*Priority:* ${task.priority || 'Normal'}` +
      dueDate +
      `\n*Status:* ${task.status || 'To Do'}`;
    
    await sendTelegramNotification(assigneeId, telegramMessage).catch(err => 
      console.log(`⚠️ Failed to send Telegram notification to ${assigneeId}:`, err.message)
    );

    return notification;
  } catch (error) {
    console.error('❌ Error sending task assignment notification:', error);
    throw error;
  }
};

/**
 * Send order notification to specific roles
 */
export const sendOrderNotification = async (companyId, orderId, order, notificationType = 'created') => {
  try {
    // Get admins and managers
    const admins = await User.find({
      'companies.companyId': companyId,
      'companies.role': { $in: ['company_admin', 'manager'] },
      isActive: true,
    }).select('_id');

    if (admins.length === 0) {
      console.log(`⚠️ No admins found for order notification`);
      return;
    }

    const notifications = [];
    const orderTitle = order.orderNumber || `Order #${orderId}`;
    const title = notificationType === 'created' 
      ? `New Order: ${orderTitle}`
      : `Order Update: ${orderTitle}`;

    for (const admin of admins) {
      const notification = await createNotification({
        userId: admin._id,
        companyId,
        type: 'order',
        entityId: orderId,
        title,
        message: `Order ${notificationType}`,
        priority: 'medium',
        relatedEntity: orderId,
        entityType: 'Order',
        metadata: {
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
        },
      });
      notifications.push(notification);

      // Send Telegram notification to admins only
      const telegramMessage = 
        `📦 *${notificationType === 'created' ? 'New Order' : 'Order Update'}*\n\n` +
        `*Order:* ${orderTitle}\n` +
        `*Status:* ${order.status}\n` +
        `*Amount:* $${order.totalAmount || 0}\n` +
        `*Client:* ${order.clientName || 'N/A'}`;
      
      await sendTelegramNotification(admin._id, telegramMessage).catch(err => 
        console.log(`⚠️ Failed to send Telegram notification to admin ${admin._id}:`, err.message)
      );
    }

    return notifications;
  } catch (error) {
    console.error('❌ Error sending order notification:', error);
    throw error;
  }
};

/**
 * Send client notification to assigned employee
 */
export const sendClientNotification = async (companyId, clientId, client, assigneeId) => {
  try {
    if (!assigneeId) {
      console.log(`⚠️ No assignee for client notification`);
      return;
    }

    const notification = await createNotification({
      userId: assigneeId,
      companyId,
      type: 'client',
      entityId: clientId,
      title: `Client Assigned: ${client.name}`,
      message: `You have been assigned a new client`,
      priority: 'medium',
      relatedEntity: clientId,
      entityType: 'Client',
      metadata: {
        clientName: client.name,
        clientEmail: client.email,
        status: client.status,
      },
    });

    // Send Telegram notification to assigned employee only
    const telegramMessage = 
      `👤 *New Client Assigned*\n\n` +
      `*Client:* ${client.name}\n` +
      `*Email:* ${client.email || 'N/A'}\n` +
      `*Phone:* ${client.phone || 'N/A'}\n` +
      `*Status:* ${client.status || 'Active'}`;
    
    await sendTelegramNotification(assigneeId, telegramMessage).catch(err => 
      console.log(`⚠️ Failed to send Telegram notification to ${assigneeId}:`, err.message)
    );

    return notification;
  } catch (error) {
    console.error('❌ Error sending client notification:', error);
    throw error;
  }
};

/**
 * Send message notification to specific user (for conversations)
 */
export const sendMessageNotification = async (companyId, recipientId, sender, message) => {
  try {
    const notification = await createNotification({
      userId: recipientId,
      companyId,
      type: 'message',
      entityId: message._id,
      title: `New Message from ${sender.name}`,
      message: message.text?.substring(0, 100) || 'New message received',
      priority: 'medium',
      relatedEntity: message.conversationId,
      entityType: 'Message',
      metadata: {
        senderName: sender.name,
        conversationId: message.conversationId,
      },
    });

    // Send Telegram notification
    const messagePreview = message.text?.substring(0, 80) || 'New message';
    const telegramMessage = 
      `💬 *New Message*\n\n` +
      `*From:* ${sender.name}\n` +
      `*Message:* ${messagePreview}${message.text?.length > 80 ? '...' : ''}`;
    
    await sendTelegramNotification(recipientId, telegramMessage).catch(err => 
      console.log(`⚠️ Failed to send Telegram notification to ${recipientId}:`, err.message)
    );

    return notification;
  } catch (error) {
    console.error('❌ Error sending message notification:', error);
    throw error;
  }
};
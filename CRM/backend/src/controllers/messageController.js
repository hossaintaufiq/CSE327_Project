import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

// Get all messages (Super Admin sees all, others see only their company)
export const getAllMessages = async (req, res) => {
  try {
    const user = req.user;
    const { companyId } = req;
    
    let query = {};
    
    // Super Admin can see all messages (companyId is null for super admin)
    if (user.globalRole !== 'super_admin' && companyId) {
      // Regular users see only their company messages
      query.companyId = companyId;
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        messages: messages.map((msg) => ({
          id: msg._id,
          companyId: msg.companyId?._id || msg.companyId,
          companyName: msg.companyId?.name,
          sender: {
            id: msg.senderId?._id,
            name: msg.senderId?.name,
            email: msg.senderId?.email,
          },
          recipient: msg.recipientId ? {
            id: msg.recipientId._id,
            name: msg.recipientId.name,
            email: msg.recipientId.email,
          } : null,
          subject: msg.subject,
          content: msg.content,
          isRead: msg.isRead,
          priority: msg.priority,
          category: msg.category,
          createdAt: msg.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Get message by ID
export const getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { companyId } = req;
    const user = req.user;

    const message = await Message.findById(messageId)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .populate('companyId', 'name');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check access: Super Admin can see all, others only their company
    if (user.globalRole !== 'super_admin' && message.companyId._id.toString() !== companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if recipient is viewing
    if (!message.isRead && message.recipientId && message.recipientId._id.toString() === user._id.toString()) {
      message.isRead = true;
      await message.save();
    }

    res.json({
      success: true,
      data: {
        message: {
          id: message._id,
          companyId: message.companyId?._id,
          companyName: message.companyId?.name,
          sender: {
            id: message.senderId?._id,
            name: message.senderId?.name,
            email: message.senderId?.email,
          },
          recipient: message.recipientId ? {
            id: message.recipientId._id,
            name: message.recipientId.name,
            email: message.recipientId.email,
          } : null,
          subject: message.subject,
          content: message.content,
          isRead: message.isRead,
          priority: message.priority,
          category: message.category,
          createdAt: message.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get message by ID error:', error);
    res.status(500).json({ message: 'Error fetching message' });
  }
};

// Create a new message
export const createMessage = async (req, res) => {
  try {
    const { companyId: targetCompanyId, recipientId, subject, content, priority, category } = req.body;
    const user = req.user;
    let { companyId } = req;

    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }

    // Super admin can specify companyId, regular users use their own
    if (user.globalRole === 'super_admin' && targetCompanyId) {
      companyId = targetCompanyId;
    } else if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // If recipientId is provided, verify they belong to the same company (unless super admin)
    if (recipientId && user.globalRole !== 'super_admin') {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      const recipientCompany = recipient.companies.find(
        (c) => c.companyId?.toString() === companyId.toString()
      );
      
      if (!recipientCompany) {
        return res.status(403).json({ message: 'Recipient does not belong to your company' });
      }
    }

    const message = await Message.create({
      companyId,
      senderId: user._id,
      recipientId: recipientId || null,
      subject,
      content,
      priority: priority || 'medium',
      category: category || 'general',
    });

    await message.populate('senderId', 'name email');
    await message.populate('recipientId', 'name email');
    await message.populate('companyId', 'name');

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: {
        message: {
          id: message._id,
          companyId: message.companyId?._id,
          companyName: message.companyId?.name,
          sender: {
            id: message.senderId?._id,
            name: message.senderId?.name,
            email: message.senderId?.email,
          },
          recipient: message.recipientId ? {
            id: message.recipientId._id,
            name: message.recipientId.name,
            email: message.recipientId.email,
          } : null,
          subject: message.subject,
          content: message.content,
          priority: message.priority,
          category: message.category,
          createdAt: message.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Error creating message: ' + error.message });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const user = req.user;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only recipient or super admin can mark as read
    if (user.globalRole !== 'super_admin' && 
        (!message.recipientId || message.recipientId.toString() !== user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const user = req.user;
    const { companyId } = req;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Super Admin can delete any message, others only their own or company messages
    if (user.globalRole !== 'super_admin') {
      if (message.senderId.toString() !== user._id.toString() && 
          message.companyId.toString() !== companyId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
};


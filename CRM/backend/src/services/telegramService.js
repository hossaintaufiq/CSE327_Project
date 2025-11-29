import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { Client } from '../models/Client.js';

let bot = null;
const pendingVerifications = new Map(); // Store pending verifications

/**
 * Initialize Telegram Bot
 */
export const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('⚠️ Telegram bot token not configured - Telegram integration disabled');
    return false;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
    
    // Set up message handlers
    setupBotHandlers();
    
    console.log('✅ Telegram bot initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
    return false;
  }
};

/**
 * Get Telegram Bot instance
 */
export const getTelegramBot = () => bot;

/**
 * Set up bot command and message handlers
 */
const setupBotHandlers = () => {
  // Start command - Initial greeting and verification
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const verificationCode = match[1]?.trim();

    if (verificationCode) {
      // User came from a verification link
      await handleVerification(chatId, verificationCode, msg.from);
    } else {
      // New user - show welcome message
      await bot.sendMessage(chatId, 
        `👋 Welcome to CRM Prime Bot!\n\n` +
        `This bot allows you to:\n` +
        `• Receive notifications from your CRM\n` +
        `• Chat with your assigned leads/clients\n` +
        `• View your tasks and updates\n\n` +
        `To get started, please link your CRM account:\n` +
        `1. Log in to your CRM dashboard\n` +
        `2. Go to Settings > Integrations\n` +
        `3. Click "Connect Telegram"\n` +
        `4. Enter the code shown there, or use the link provided`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 Link Account', callback_data: 'link_account' }],
              [{ text: '❓ Help', callback_data: 'help' }]
            ]
          }
        }
      );
    }
  });

  // Help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await sendHelpMessage(chatId);
  });

  // Status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    await handleStatusCommand(chatId);
  });

  // Tasks command
  bot.onText(/\/tasks/, async (msg) => {
    const chatId = msg.chat.id;
    await handleTasksCommand(chatId);
  });

  // Unlink command
  bot.onText(/\/unlink/, async (msg) => {
    const chatId = msg.chat.id;
    await handleUnlinkCommand(chatId, msg.from);
  });

  // Handle callback queries (button clicks)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    await bot.answerCallbackQuery(query.id);

    switch (data) {
      case 'link_account':
        await bot.sendMessage(chatId,
          `To link your account:\n\n` +
          `1. Go to your CRM dashboard\n` +
          `2. Navigate to Settings > Integrations\n` +
          `3. Click "Connect Telegram"\n` +
          `4. Enter code: \`${chatId}\`\n\n` +
          `Or scan the QR code from the dashboard.`,
          { parse_mode: 'Markdown' }
        );
        break;
      case 'help':
        await sendHelpMessage(chatId);
        break;
    }
  });

  // Handle regular messages (potential chat messages)
  bot.on('message', async (msg) => {
    if (msg.text?.startsWith('/')) return; // Ignore commands

    const chatId = msg.chat.id;
    await handleIncomingMessage(chatId, msg);
  });
};

/**
 * Handle verification from CRM link
 */
const handleVerification = async (chatId, code, telegramUser) => {
  try {
    const verification = pendingVerifications.get(code);
    
    if (!verification) {
      await bot.sendMessage(chatId,
        `❌ Invalid or expired verification code.\n\n` +
        `Please request a new link from your CRM dashboard.`
      );
      return;
    }

    // Find and update user
    const user = await User.findById(verification.userId);
    if (!user) {
      await bot.sendMessage(chatId, `❌ User not found. Please try again.`);
      return;
    }

    // Update user with Telegram info
    user.telegramChatId = chatId.toString();
    user.telegramUsername = telegramUser.username;
    user.telegramLinkedAt = new Date();
    await user.save();

    // Remove pending verification
    pendingVerifications.delete(code);

    await bot.sendMessage(chatId,
      `✅ Account linked successfully!\n\n` +
      `Welcome, ${user.name}!\n\n` +
      `You will now receive notifications and can chat with your leads/clients here.\n\n` +
      `Commands:\n` +
      `/status - Check your CRM status\n` +
      `/tasks - View your tasks\n` +
      `/help - Get help\n` +
      `/unlink - Unlink your account`
    );
  } catch (error) {
    console.error('Verification error:', error);
    await bot.sendMessage(chatId, `❌ An error occurred. Please try again.`);
  }
};

/**
 * Generate verification code for linking
 */
export const generateVerificationCode = (userId) => {
  const code = crypto.randomBytes(16).toString('hex');
  
  pendingVerifications.set(code, {
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  // Clean up expired codes
  for (const [key, value] of pendingVerifications.entries()) {
    if (value.expiresAt < new Date()) {
      pendingVerifications.delete(key);
    }
  }

  return code;
};

/**
 * Get bot username for link generation
 */
export const getBotUsername = async () => {
  if (!bot) return null;
  try {
    const me = await bot.getMe();
    return me.username;
  } catch (error) {
    console.error('Failed to get bot info:', error);
    return null;
  }
};

/**
 * Send notification to user
 */
export const sendNotification = async (userId, message, options = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user?.telegramChatId) {
      return { success: false, reason: 'User not linked to Telegram' };
    }

    await bot.sendMessage(user.telegramChatId, message, {
      parse_mode: 'Markdown',
      ...options,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple users
 */
export const broadcastNotification = async (userIds, message, options = {}) => {
  const results = await Promise.allSettled(
    userIds.map(userId => sendNotification(userId, message, options))
  );

  return {
    sent: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
    failed: results.filter(r => r.status === 'rejected' || !r.value?.success).length,
  };
};

/**
 * Handle incoming chat messages
 */
const handleIncomingMessage = async (chatId, msg) => {
  try {
    // Find user by Telegram chat ID
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    
    if (!user) {
      await bot.sendMessage(chatId,
        `Please link your account first using /start`
      );
      return;
    }

    // Check if user has an active chat session
    const activeRoom = await ChatRoom.findOne({
      'participants.userId': user._id,
      isActive: true,
      'metadata.telegramActive': true,
    }).sort({ lastActivity: -1 });

    if (activeRoom) {
      // Add message to chat room
      const chatMessage = new ChatMessage({
        chatRoomId: activeRoom._id,
        senderId: user._id,
        senderType: 'user',
        content: msg.text,
        messageType: 'text',
        metadata: {
          source: 'telegram',
          telegramMessageId: msg.message_id,
        },
      });

      await chatMessage.save();

      // Update room activity
      activeRoom.lastMessage = chatMessage._id;
      activeRoom.lastActivity = new Date();
      await activeRoom.save();

      await bot.sendMessage(chatId, `✓ Message sent`);
    } else {
      await bot.sendMessage(chatId,
        `You don't have an active chat session.\n\n` +
        `To start a chat, please use the CRM dashboard to open a conversation.`
      );
    }
  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
};

/**
 * Handle status command
 */
const handleStatusCommand = async (chatId) => {
  try {
    const user = await User.findOne({ telegramChatId: chatId.toString() })
      .populate('companies.companyId');
    
    if (!user) {
      await bot.sendMessage(chatId, `Please link your account first using /start`);
      return;
    }

    const companies = user.companies.filter(c => c.isActive);
    const companyList = companies.length > 0
      ? companies.map(c => `• ${c.companyId?.name || 'Unknown'} (${c.role})`).join('\n')
      : 'No active companies';

    await bot.sendMessage(chatId,
      `📊 *Your CRM Status*\n\n` +
      `*Name:* ${user.name}\n` +
      `*Email:* ${user.email}\n` +
      `*Role:* ${user.globalRole}\n\n` +
      `*Companies:*\n${companyList}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error handling status command:', error);
    await bot.sendMessage(chatId, `❌ Failed to fetch status. Please try again.`);
  }
};

/**
 * Handle tasks command
 */
const handleTasksCommand = async (chatId) => {
  try {
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    
    if (!user) {
      await bot.sendMessage(chatId, `Please link your account first using /start`);
      return;
    }

    const Task = (await import('../models/Task.js')).Task;
    const tasks = await Task.find({
      assignee: user._id,
      status: { $in: ['todo', 'in_progress', 'review'] },
      isActive: true,
    })
      .sort({ dueDate: 1 })
      .limit(10);

    if (tasks.length === 0) {
      await bot.sendMessage(chatId, `✅ You have no pending tasks!`);
      return;
    }

    const taskList = tasks.map(t => {
      const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date';
      const priority = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
      return `${priority} *${t.title}*\n   Status: ${t.status} | Due: ${dueDate}`;
    }).join('\n\n');

    await bot.sendMessage(chatId,
      `📋 *Your Tasks* (${tasks.length})\n\n${taskList}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error handling tasks command:', error);
    await bot.sendMessage(chatId, `❌ Failed to fetch tasks. Please try again.`);
  }
};

/**
 * Handle unlink command
 */
const handleUnlinkCommand = async (chatId, telegramUser) => {
  try {
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    
    if (!user) {
      await bot.sendMessage(chatId, `Your account is not linked.`);
      return;
    }

    user.telegramChatId = null;
    user.telegramUsername = null;
    user.telegramLinkedAt = null;
    await user.save();

    await bot.sendMessage(chatId,
      `✅ Account unlinked successfully.\n\n` +
      `You will no longer receive notifications here.\n` +
      `Use /start to link again.`
    );
  } catch (error) {
    console.error('Error handling unlink command:', error);
    await bot.sendMessage(chatId, `❌ Failed to unlink. Please try again.`);
  }
};

/**
 * Send help message
 */
const sendHelpMessage = async (chatId) => {
  await bot.sendMessage(chatId,
    `❓ *CRM Prime Bot Help*\n\n` +
    `*Commands:*\n` +
    `/start - Start the bot and link your account\n` +
    `/status - View your CRM status\n` +
    `/tasks - View your pending tasks\n` +
    `/unlink - Unlink your Telegram account\n` +
    `/help - Show this help message\n\n` +
    `*Features:*\n` +
    `• Receive real-time notifications\n` +
    `• Chat with leads and clients\n` +
    `• View task updates\n\n` +
    `For support, contact your CRM administrator.`,
    { parse_mode: 'Markdown' }
  );
};

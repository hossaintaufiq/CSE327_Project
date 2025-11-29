import { Bot, InlineKeyboard } from 'grammy';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { ChatMessage } from '../models/ChatMessage.js';

let bot = null;
const pendingVerifications = new Map(); // Store pending verifications

/**
 * Initialize Telegram Bot using grammY
 */
export const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('⚠️ Telegram bot token not configured - Telegram integration disabled');
    return false;
  }

  try {
    bot = new Bot(token);
    
    // Set up message handlers
    setupBotHandlers();
    
    // Start the bot
    bot.start({
      onStart: () => console.log('✅ Telegram bot initialized and running'),
    });
    
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
  bot.command('start', async (ctx) => {
    const chatId = ctx.chat.id;
    const args = ctx.match?.trim();

    if (args) {
      // User came from a verification link
      await handleVerification(ctx, args);
    } else {
      // New user - show welcome message
      const keyboard = new InlineKeyboard()
        .text('🔗 Link Account', 'link_account')
        .row()
        .text('❓ Help', 'help');

      await ctx.reply(
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
        { reply_markup: keyboard }
      );
    }
  });

  // Help command
  bot.command('help', async (ctx) => {
    await sendHelpMessage(ctx);
  });

  // Status command
  bot.command('status', async (ctx) => {
    await handleStatusCommand(ctx);
  });

  // Tasks command
  bot.command('tasks', async (ctx) => {
    await handleTasksCommand(ctx);
  });

  // Unlink command
  bot.command('unlink', async (ctx) => {
    await handleUnlinkCommand(ctx);
  });

  // Handle callback queries (button clicks)
  bot.callbackQuery('link_account', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    await ctx.reply(
      `To link your account:\n\n` +
      `1. Go to your CRM dashboard\n` +
      `2. Navigate to Settings > Integrations\n` +
      `3. Click "Connect Telegram"\n` +
      `4. Enter code: \`${chatId}\`\n\n` +
      `Or scan the QR code from the dashboard.`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery('help', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendHelpMessage(ctx);
  });

  // Handle regular messages (potential chat messages)
  bot.on('message:text', async (ctx) => {
    if (ctx.message.text?.startsWith('/')) return; // Ignore commands
    await handleIncomingMessage(ctx);
  });

  // Error handler
  bot.catch((err) => {
    console.error('Telegram bot error:', err);
  });
};

/**
 * Handle verification from CRM link
 */
const handleVerification = async (ctx, code) => {
  const chatId = ctx.chat.id;
  const telegramUser = ctx.from;

  try {
    const verification = pendingVerifications.get(code);
    
    if (!verification) {
      await ctx.reply(
        `❌ Invalid or expired verification code.\n\n` +
        `Please request a new link from your CRM dashboard.`
      );
      return;
    }

    // Find and update user
    const user = await User.findById(verification.userId);
    if (!user) {
      await ctx.reply(`❌ User not found. Please try again.`);
      return;
    }

    // Update user with Telegram info
    user.telegramChatId = chatId.toString();
    user.telegramUsername = telegramUser.username;
    user.telegramLinkedAt = new Date();
    await user.save();

    // Remove pending verification
    pendingVerifications.delete(code);

    await ctx.reply(
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
    await ctx.reply(`❌ An error occurred. Please try again.`);
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
    const me = await bot.api.getMe();
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
  if (!bot) {
    return { success: false, reason: 'Telegram bot not initialized' };
  }

  try {
    const user = await User.findById(userId);
    if (!user?.telegramChatId) {
      return { success: false, reason: 'User not linked to Telegram' };
    }

    await bot.api.sendMessage(user.telegramChatId, message, {
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
 * Send notification to a specific chat ID (direct)
 */
export const sendDirectNotification = async (chatId, message, options = {}) => {
  if (!bot) {
    return { success: false, reason: 'Telegram bot not initialized' };
  }

  try {
    await bot.api.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...options,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send direct Telegram notification:', error);
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
const handleIncomingMessage = async (ctx) => {
  const chatId = ctx.chat.id;
  const msg = ctx.message;

  try {
    // Find user by Telegram chat ID
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    
    if (!user) {
      await ctx.reply(`Please link your account first using /start`);
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

      await ctx.reply(`✓ Message sent`);
    } else {
      await ctx.reply(
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
const handleStatusCommand = async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: chatId.toString() })
      .populate('companies.companyId');
    
    if (!user) {
      await ctx.reply(`Please link your account first using /start`);
      return;
    }

    const companies = user.companies.filter(c => c.isActive);
    const companyList = companies.length > 0
      ? companies.map(c => `• ${c.companyId?.name || 'Unknown'} (${c.role})`).join('\n')
      : 'No active companies';

    await ctx.reply(
      `📊 *Your CRM Status*\n\n` +
      `*Name:* ${user.name}\n` +
      `*Email:* ${user.email}\n` +
      `*Role:* ${user.globalRole}\n\n` +
      `*Companies:*\n${companyList}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error handling status command:', error);
    await ctx.reply(`❌ Failed to fetch status. Please try again.`);
  }
};

/**
 * Handle tasks command
 */
const handleTasksCommand = async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    
    if (!user) {
      await ctx.reply(`Please link your account first using /start`);
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
      await ctx.reply(`✅ You have no pending tasks!`);
      return;
    }

    const taskList = tasks.map(t => {
      const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date';
      const priority = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
      return `${priority} *${t.title}*\n   Status: ${t.status} | Due: ${dueDate}`;
    }).join('\n\n');

    await ctx.reply(
      `📋 *Your Tasks* (${tasks.length})\n\n${taskList}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error handling tasks command:', error);
    await ctx.reply(`❌ Failed to fetch tasks. Please try again.`);
  }
};

/**
 * Handle unlink command
 */
const handleUnlinkCommand = async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    
    if (!user) {
      await ctx.reply(`Your account is not linked.`);
      return;
    }

    user.telegramChatId = null;
    user.telegramUsername = null;
    user.telegramLinkedAt = null;
    await user.save();

    await ctx.reply(
      `✅ Account unlinked successfully.\n\n` +
      `You will no longer receive notifications here.\n` +
      `Use /start to link again.`
    );
  } catch (error) {
    console.error('Error handling unlink command:', error);
    await ctx.reply(`❌ Failed to unlink. Please try again.`);
  }
};

/**
 * Send help message
 */
const sendHelpMessage = async (ctx) => {
  await ctx.reply(
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

/**
 * Graceful shutdown
 */
export const stopTelegramBot = () => {
  if (bot) {
    bot.stop();
    console.log('Telegram bot stopped');
  }
};

import { Bot, InlineKeyboard } from 'grammy';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { ChatMessage } from '../models/ChatMessage.js';
import * as geminiService from './geminiService.js';
import * as mcpServer from './mcpServer.js';

let bot = null;
const pendingVerifications = new Map(); // Store pending verifications
const userSessions = new Map(); // Store user session data for context

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
    
    // Set up error handling for the bot
    bot.catch((err) => {
      const ctx = err.ctx;
      const error = err.error;
      // Handle Telegram API conflict errors gracefully (another bot instance running)
      if (error.error_code === 409) {
        console.log('⚠️ Telegram bot conflict detected - another instance may be running. Stopping bot polling.');
        bot.stop();
      } else {
        console.error('❌ Telegram bot error:', error.message || error);
      }
    });
    
    // Set up message handlers
    setupBotHandlers();
    
    // Start the bot with error handling for conflicts
    bot.start({
      onStart: () => console.log('✅ Telegram bot initialized and running'),
      drop_pending_updates: true,
    }).catch((error) => {
      // Handle Telegram API conflict errors gracefully (another bot instance running)
      if (error.error_code === 409) {
        console.log('⚠️ Telegram bot conflict detected - another instance may be running. Notifications will still work.');
      } else {
        console.error('❌ Telegram bot error:', error.message);
      }
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
        `• Chat with AI Assistant (Gemini + MCP)\n` +
        `• Manage tasks, clients, orders\n` +
        `• View analytics and insights\n\n` +
        `To get started, link your CRM account:\n` +
        `1. Log in to your CRM dashboard\n` +
        `2. Go to Settings > Integrations\n` +
        `3. Click "Connect Telegram"\n` +
        `4. Enter the code or use the link provided`,
        { reply_markup: keyboard }
      );
    }
  });

  // Help command - role-specific help
  bot.command('help', async (ctx) => {
    await sendHelpMessage(ctx);
  });

  // Menu command - show role-specific menu
  bot.command('menu', async (ctx) => {
    await showRoleBasedMenu(ctx);
  });

  // Status command
  bot.command('status', async (ctx) => {
    await handleStatusCommand(ctx);
  });

  // Tasks command
  bot.command('tasks', async (ctx) => {
    await handleTasksCommand(ctx);
  });

  // Clients command (Admin/Employee/Manager)
  bot.command('clients', async (ctx) => {
    await handleClientsCommand(ctx);
  });

  // Orders command
  bot.command('orders', async (ctx) => {
    await handleOrdersCommand(ctx);
  });

  // Pipeline command (Admin/Manager)
  bot.command('pipeline', async (ctx) => {
    await handlePipelineCommand(ctx);
  });

  // Stats command (Admin/Manager)
  bot.command('stats', async (ctx) => {
    await handleStatsCommand(ctx);
  });

  // Projects command (Admin/Employee/Manager)
  bot.command('projects', async (ctx) => {
    await handleProjectsCommand(ctx);
  });

  // Conversations command (for clients)
  bot.command('conversations', async (ctx) => {
    await handleConversationsCommand(ctx);
  });

  // Quick actions
  bot.command('quick', async (ctx) => {
    await showQuickActions(ctx);
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

  // Handle all other callback queries for quick actions and menu items
  bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery();

    const actionMap = {
      'qa_today_tasks': 'Show me tasks due today',
      'qa_pipeline': 'Show me the sales pipeline status',
      'qa_new_leads': 'Show me leads from the last 7 days',
      'qa_pending_orders': 'Show me pending orders',
      'qa_team_stats': 'Show me team performance statistics',
      'qa_my_tasks': 'Show me my tasks',
      'qa_my_clients': 'Show me my assigned clients',
      'qa_my_orders': 'Show me my orders',
      'qa_today': 'Show me my activities for today',
      'qa_conversations': 'Show me my conversations',
      'qa_support': 'I need help',
      'cmd_stats': 'Show me company statistics',
      'cmd_pipeline': 'Show me the sales pipeline',
      'cmd_clients': 'Show me clients',
      'cmd_orders': 'Show me orders',
      'cmd_tasks': 'Show me my tasks',
      'cmd_projects': 'Show me projects',
      'cmd_conversations': 'Show me my conversations',
      'cmd_ai_help': 'Tell me what you can help me with',
    };

    const query = actionMap[action];
    if (query) {
      const chatId = ctx.chat.id;
      const { user, companyId, error } = await getUserInfo(chatId);

      if (error) {
        await ctx.reply(`❌ ${error}`);
        return;
      }

      try {
        await ctx.replyWithChatAction('typing');
        const response = await geminiService.generateWithTools(
          query,
          companyId.toString(),
          user._id.toString()
        );
        await ctx.reply(response, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Error handling quick action:', error);
        await ctx.reply(`❌ Failed to process your request.`);
      }
    }
  });

  // Handle regular messages (AI conversation or chat)
  bot.on('message:text', async (ctx) => {
    if (ctx.message.text?.startsWith('/')) return; // Ignore commands
    await handleIncomingMessage(ctx);
  });

  // Handle voice messages - process with AI
  bot.on('message:voice', async (ctx) => {
    await handleVoiceMessage(ctx);
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
    const user = await User.findOne({ telegramChatId: chatId.toString() }).populate('companies.companyId');
    
    if (!user) {
      await ctx.reply(`Please link your account first using /start`);
      return;
    }

    // Show typing indicator
    await ctx.replyWithChatAction('typing');

    // Get user's company (default to first active company)
    const companyId = user.companies?.find(c => c.isActive)?.companyId || user.companyId;

    if (!companyId) {
      await ctx.reply(`❌ No active company found for your account.`);
      return;
    }

    // Process with Gemini + MCP
    try {
      const response = await geminiService.generateWithTools(
        msg.text,
        companyId.toString(),
        user._id.toString()
      );

      await ctx.reply(response, { parse_mode: 'Markdown' });
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      await ctx.reply(`Sorry, I encountered an error processing your request.`);
    }

  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
};

/**
 * Get user info and validate
 */
const getUserInfo = async (chatId) => {
  const user = await User.findOne({ telegramChatId: chatId.toString() })
    .populate('companies.companyId');
  
  if (!user) {
    return { user: null, error: 'Please link your account first using /start' };
  }

  const activeCompany = user.companies?.find(c => c.isActive);
  const companyId = activeCompany?.companyId || user.companyId;
  const role = activeCompany?.role || 'client';

  if (!companyId) {
    return { user, error: 'No active company found for your account.' };
  }

  return { user, companyId, role, error: null };
};

/**
 * Show role-based menu
 */
const showRoleBasedMenu = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  let menuText = `📋 *Your CRM Menu*\n\n`;
  let keyboard = new InlineKeyboard();

  if (role === 'company_admin' || role === 'manager') {
    menuText += `*Admin/Manager Commands:*\n` +
      `/stats - View company statistics\n` +
      `/pipeline - Check sales pipeline\n` +
      `/clients - Manage clients\n` +
      `/orders - View orders\n` +
      `/projects - Manage projects\n` +
      `/tasks - View all tasks\n\n`;
    
    keyboard
      .text('📊 Stats', 'cmd_stats').text('🎯 Pipeline', 'cmd_pipeline')
      .row()
      .text('👥 Clients', 'cmd_clients').text('📦 Orders', 'cmd_orders')
      .row();
  }

  if (role === 'employee') {
    menuText += `*Employee Commands:*\n` +
      `/tasks - View your tasks\n` +
      `/clients - View assigned clients\n` +
      `/orders - View your orders\n` +
      `/projects - View your projects\n\n`;
    
    keyboard
      .text('✅ Tasks', 'cmd_tasks').text('👥 Clients', 'cmd_clients')
      .row()
      .text('📦 Orders', 'cmd_orders').text('📁 Projects', 'cmd_projects')
      .row();
  }

  if (role === 'client') {
    menuText += `*Client Commands:*\n` +
      `/conversations - View your conversations\n` +
      `/orders - View your orders\n` +
      `/status - Account status\n\n`;
    
    keyboard
      .text('💬 Conversations', 'cmd_conversations').text('📦 Orders', 'cmd_orders')
      .row();
  }

  menuText += `*AI Assistant:*\n` +
    `Just send me any message and I'll help you!\n` +
    `Example: "Show me pending tasks" or "What's my sales this month?"`;

  keyboard.text('🤖 AI Help', 'cmd_ai_help');

  await ctx.reply(menuText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * Handle clients command
 */
const handleClientsCommand = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, companyId, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const query = role === 'employee' 
      ? `Show me my assigned clients`
      : `Show me recent clients`;

    const response = await geminiService.generateWithTools(
      query,
      companyId.toString(),
      user._id.toString()
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling clients command:', error);
    await ctx.reply(`❌ Failed to fetch clients. Please try again.`);
  }
};

/**
 * Handle orders command
 */
const handleOrdersCommand = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, companyId, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const query = role === 'client'
      ? `Show me my orders`
      : `Show me pending orders`;

    const response = await geminiService.generateWithTools(
      query,
      companyId.toString(),
      user._id.toString()
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling orders command:', error);
    await ctx.reply(`❌ Failed to fetch orders. Please try again.`);
  }
};

/**
 * Handle pipeline command (Admin/Manager only)
 */
const handlePipelineCommand = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, companyId, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  if (role !== 'company_admin' && role !== 'manager') {
    await ctx.reply(`❌ This command is only available for administrators and managers.`);
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const response = await geminiService.generateWithTools(
      `Show me the sales pipeline status with statistics`,
      companyId.toString(),
      user._id.toString()
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling pipeline command:', error);
    await ctx.reply(`❌ Failed to fetch pipeline data. Please try again.`);
  }
};

/**
 * Handle stats command (Admin/Manager only)
 */
const handleStatsCommand = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, companyId, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  if (role !== 'company_admin' && role !== 'manager') {
    await ctx.reply(`❌ This command is only available for administrators and managers.`);
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const response = await geminiService.generateWithTools(
      `Analyze company performance and show me key statistics for this month`,
      companyId.toString(),
      user._id.toString()
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling stats command:', error);
    await ctx.reply(`❌ Failed to fetch statistics. Please try again.`);
  }
};

/**
 * Handle projects command
 */
const handleProjectsCommand = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, companyId, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const query = role === 'employee'
      ? `Show me projects I'm working on`
      : `Show me active projects`;

    const response = await geminiService.generateWithTools(
      query,
      companyId.toString(),
      user._id.toString()
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling projects command:', error);
    await ctx.reply(`❌ Failed to fetch projects. Please try again.`);
  }
};

/**
 * Handle conversations command (for clients)
 */
const handleConversationsCommand = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, companyId, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const query = role === 'client'
      ? `Show me my conversations with the company`
      : `Show me my assigned conversations`;

    const response = await geminiService.generateWithTools(
      query,
      companyId.toString(),
      user._id.toString()
    );

    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling conversations command:', error);
    await ctx.reply(`❌ Failed to fetch conversations. Please try again.`);
  }
};

/**
 * Show quick actions based on role
 */
const showQuickActions = async (ctx) => {
  const chatId = ctx.chat.id;
  const { user, role, error } = await getUserInfo(chatId);

  if (error) {
    await ctx.reply(`❌ ${error}`);
    return;
  }

  let keyboard = new InlineKeyboard();
  let actionsText = `⚡ *Quick Actions*\n\nChoose an action:\n\n`;

  if (role === 'company_admin' || role === 'manager') {
    actionsText += `• View today's tasks\n• Check pipeline\n• See new leads\n• View pending orders\n• Team performance`;
    keyboard
      .text('📋 Today\'s Tasks', 'qa_today_tasks')
      .text('🎯 Pipeline', 'qa_pipeline')
      .row()
      .text('🆕 New Leads', 'qa_new_leads')
      .text('📦 Pending Orders', 'qa_pending_orders')
      .row()
      .text('👥 Team Stats', 'qa_team_stats');
  } else if (role === 'employee') {
    actionsText += `• View my tasks\n• My clients\n• My orders\n• Today's activities`;
    keyboard
      .text('✅ My Tasks', 'qa_my_tasks')
      .text('👥 My Clients', 'qa_my_clients')
      .row()
      .text('📦 My Orders', 'qa_my_orders')
      .text('📊 Today', 'qa_today');
  } else if (role === 'client') {
    actionsText += `• My orders\n• Conversations\n• Support`;
    keyboard
      .text('📦 My Orders', 'qa_my_orders')
      .text('💬 Conversations', 'qa_conversations')
      .row()
      .text('❓ Support', 'qa_support');
  }

  await ctx.reply(actionsText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
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
  const chatId = ctx.chat.id;
  const { user, role } = await getUserInfo(chatId);

  let helpText = `❓ *CRM Prime Bot Help*\n\n*Common Commands:*\n` +
    `/start - Link your account\n` +
    `/menu - Show role-based menu\n` +
    `/status - View account status\n` +
    `/help - Show this help\n` +
    `/unlink - Unlink your account\n\n`;

  if (user) {
    helpText += `*Your Role: ${role}*\n\n`;

    if (role === 'company_admin' || role === 'manager') {
      helpText += `*Admin/Manager Commands:*\n` +
        `/stats - Company statistics\n` +
        `/pipeline - Sales pipeline\n` +
        `/clients - Client management\n` +
        `/orders - Order overview\n` +
        `/projects - Project management\n` +
        `/tasks - All tasks\n` +
        `/quick - Quick actions\n\n`;
    } else if (role === 'employee') {
      helpText += `*Employee Commands:*\n` +
        `/tasks - Your tasks\n` +
        `/clients - Your clients\n` +
        `/orders - Your orders\n` +
        `/projects - Your projects\n` +
        `/quick - Quick actions\n\n`;
    } else if (role === 'client') {
      helpText += `*Client Commands:*\n` +
        `/conversations - Your conversations\n` +
        `/orders - Your orders\n` +
        `/quick - Quick actions\n\n`;
    }
  }

  helpText += `*AI Assistant:*\n` +
    `Just send me any message and I'll help!\n\n` +
    `*Examples:*\n` +
    `• "Show me pending tasks"\n` +
    `• "What's my sales pipeline status?"\n` +
    `• "List my clients"\n` +
    `• "Create a task for follow-up"\n\n` +
    `You can also send voice messages!\n\n` +
    `For support, contact your CRM administrator.`;

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
};

/**
 * Handle voice message - transcribe and process with AI
 */
const handleVoiceMessage = async (ctx) => {
  const chatId = ctx.chat.id;
  
  try {
    // Check if user is linked
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    if (!user) {
      await ctx.reply(
        `Please link your account first using /start to use voice commands.`
      );
      return;
    }

    await ctx.reply(`🎤 Processing your voice message...`);

    // Get file info
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    // For now, inform user to use text (full STT would need external API)
    // In production, you'd send the audio to a speech-to-text service like Google Cloud Speech-to-Text
    await ctx.reply(
      `🤖 *Voice Processing*\n\n` +
      `I received your voice message! For the most accurate results, ` +
      `please type your request using /ai command.\n\n` +
      `Example: \`/ai show my tasks for today\`\n\n` +
      `_Note: Full voice transcription requires additional setup. Contact your admin to enable it._`,
      { parse_mode: 'Markdown' }
    );

    // Future implementation: 
    // 1. Download the voice file
    // 2. Send to Google Cloud Speech-to-Text or OpenAI Whisper
    // 3. Get transcript
    // 4. Process with voiceAIService
    
  } catch (error) {
    console.error('Error handling voice message:', error);
    await ctx.reply(`❌ Failed to process voice message. Please try using /ai command instead.`);
  }
};

/**
 * Handle AI query from Telegram
 */
const handleAIQuery = async (ctx, query) => {
  const chatId = ctx.chat.id;
  
  try {
    // Check if user is linked
    const user = await User.findOne({ telegramChatId: chatId.toString() }).populate('companies.companyId');
    if (!user) {
      await ctx.reply(
        `Please link your account first using /start to use AI features.`
      );
      return;
    }

    // Show typing indicator
    await ctx.replyWithChatAction('typing');

    // Get user's company
    const companyId = user.companies?.find(c => c.isActive)?.companyId || user.companyId;
    
    if (!companyId) {
      await ctx.reply(`❌ No company associated with your account.`);
      return;
    }

    // Process with Gemini + MCP
    try {
      const response = await geminiService.generateWithTools(
        query,
        companyId.toString(),
        user._id.toString()
      );

      await ctx.reply(response, { parse_mode: 'Markdown' });
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      await ctx.reply(`Sorry, I encountered an error processing your request.`);
    }

  } catch (error) {
    console.error('Error handling AI query:', error);
    await ctx.reply(`❌ Failed to process your request. Please try again.`);
  }
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

import {
  generateVerificationCode,
  getBotUsername,
  sendNotification,
} from '../services/telegramService.js';
import { User } from '../models/User.js';

/**
 * Get Telegram link status
 */
export const getLinkInfo = async (req, res) => {
  try {
    const user = req.user;

    const botUsername = await getBotUsername();

    res.json({
      success: true,
      data: {
        linked: !!user.telegramChatId,
        username: user.telegramUsername || null,
        linkedAt: user.telegramLinkedAt || null,
        botUsername,
        botAvailable: !!botUsername,
      },
    });
  } catch (error) {
    console.error('Error getting link info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Telegram link status',
    });
  }
};

/**
 * Generate link code for Telegram
 */
export const generateLinkCode = async (req, res) => {
  try {
    const user = req.user;

    if (user.telegramChatId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram is already linked. Unlink first to generate a new code.',
      });
    }

    const code = generateVerificationCode(user._id);
    const botUsername = await getBotUsername();

    if (!botUsername) {
      return res.status(503).json({
        success: false,
        message: 'Telegram bot is not configured',
      });
    }

    const linkUrl = `https://t.me/${botUsername}?start=${code}`;

    res.json({
      success: true,
      data: {
        code,
        linkUrl,
        expiresIn: 600, // 10 minutes
      },
    });
  } catch (error) {
    console.error('Error generating link code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate link code',
    });
  }
};

/**
 * Unlink Telegram account
 */
export const unlinkTelegram = async (req, res) => {
  try {
    const user = req.user;

    if (!user.telegramChatId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram is not linked',
      });
    }

    user.telegramChatId = null;
    user.telegramUsername = null;
    user.telegramLinkedAt = null;
    await user.save();

    res.json({
      success: true,
      message: 'Telegram unlinked successfully',
    });
  } catch (error) {
    console.error('Error unlinking Telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink Telegram',
    });
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = async (req, res) => {
  try {
    const user = req.user;

    if (!user.telegramChatId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram is not linked',
      });
    }

    const result = await sendNotification(
      user._id,
      `🔔 *Test Notification*\n\nThis is a test notification from CRM Prime.\n\nIf you received this, your Telegram integration is working correctly!`
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Test notification sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to send notification',
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    });
  }
};

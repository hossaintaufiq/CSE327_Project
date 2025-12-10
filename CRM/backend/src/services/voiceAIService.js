/**
 * Voice AI Service
 * 
 * Integrates voice input with Gemini AI through MCP server.
 * Features:
 * - Speech-to-text using Web Speech API
 * - Text-to-speech for AI responses
 * - Real-time conversation with Gemini
 * - MCP tool execution via voice commands
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as mcpServer from './mcpServer.js';

// Initialize Gemini lazily
let genAI = null;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
}

// Conversation history per user session
const conversationHistory = new Map();

// System prompt for voice assistant
const VOICE_ASSISTANT_PROMPT = `You are a helpful CRM voice assistant. You help users manage their leads, orders, projects, and tasks through voice commands.

Available actions you can perform:
- Search for clients, orders, projects, or tasks
- Get status updates and summaries
- Create new tasks or reminders
- Move items through pipeline stages
- Generate reports and analytics
- Send messages to team members

When the user asks you to perform an action, respond with a JSON block containing the action details:
\`\`\`action
{
  "tool": "tool_name",
  "params": { ... }
}
\`\`\`

Available tools:
- search_clients: Search for clients (params: query, status)
- get_client: Get client details (params: clientId)
- search_orders: Search orders (params: query, status)
- get_order: Get order details (params: orderId)
- search_projects: Search projects (params: query, status)
- search_tasks: Search tasks (params: query, status, assignee)
- create_task: Create a new task (params: title, description, priority, dueDate)
- move_pipeline: Move entity in pipeline (params: type, entityId, targetStage)
- get_pipeline_summary: Get pipeline overview (params: type)
- send_message: Send a message (params: recipientId, content)
- generate_report: Generate a report (params: type, dateRange)

Keep responses concise and conversational since they will be spoken aloud.
If you need more information to complete a request, ask a clarifying question.
`;

/**
 * Process voice input and get AI response
 * @param {Object} params
 * @param {string} params.text - Transcribed voice input
 * @param {string} params.userId - User ID for conversation context
 * @param {string} params.companyId - Company ID for data access
 * @param {string} [params.sessionId] - Session ID for conversation continuity
 * @returns {Promise<Object>} Response with text and any executed actions
 */
export async function processVoiceInput({ text, userId, companyId, sessionId }) {
  const conversationKey = sessionId || `${userId}-${companyId}`;
  
  // Get or create conversation history
  if (!conversationHistory.has(conversationKey)) {
    conversationHistory.set(conversationKey, []);
  }
  const history = conversationHistory.get(conversationKey);

  try {
    // Build conversation context
    const messages = [
      { role: 'user', parts: [{ text: VOICE_ASSISTANT_PROMPT }] },
      { role: 'model', parts: [{ text: 'I understand. I\'m ready to help you manage your CRM through voice commands. What would you like to do?' }] },
      ...history,
      { role: 'user', parts: [{ text }] },
    ];

    // Get Gemini response
    const model = getGenAI().getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite' });
    const chat = model.startChat({
      history: messages.slice(0, -1),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(text);
    const responseText = result.response.text();

    // Check for action blocks in response
    const actionMatch = responseText.match(/```action\n([\s\S]*?)\n```/);
    let executedAction = null;
    let actionResult = null;

    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1]);
        
        // Execute the action through MCP server
        // Pass companyId as third argument for data isolation
        actionResult = await mcpServer.executeTool(
          actionData.tool,
          { ...actionData.params, userId },
          companyId
        );
        
        executedAction = {
          tool: actionData.tool,
          params: actionData.params,
          success: actionResult.success,
        };

        // If action was executed, get a follow-up response
        if (actionResult.success) {
          const followUpResult = await chat.sendMessage(
            `Action completed successfully. Results: ${JSON.stringify(actionResult.data).slice(0, 500)}. Summarize this for the user in a conversational way.`
          );
          const cleanResponse = followUpResult.response.text().replace(/```action[\s\S]*?```/g, '').trim();
          
          // Update history
          history.push({ role: 'user', parts: [{ text }] });
          history.push({ role: 'model', parts: [{ text: cleanResponse }] });
          
          // Keep history manageable
          if (history.length > 20) {
            history.splice(0, 2);
          }

          return {
            text: cleanResponse,
            action: executedAction,
            actionResult: actionResult.data,
            hasAction: true,
          };
        }
      } catch (parseError) {
        console.error('Failed to parse action:', parseError);
      }
    }

    // Clean response (remove action blocks)
    const cleanResponse = responseText.replace(/```action[\s\S]*?```/g, '').trim();

    // Update history
    history.push({ role: 'user', parts: [{ text }] });
    history.push({ role: 'model', parts: [{ text: cleanResponse }] });
    
    // Keep history manageable
    if (history.length > 20) {
      history.splice(0, 2);
    }

    return {
      text: cleanResponse,
      action: executedAction,
      actionResult,
      hasAction: !!executedAction,
    };

  } catch (error) {
    console.error('Voice AI processing error:', error);
    return {
      text: 'Sorry, I had trouble processing that. Could you please try again?',
      error: error.message,
      hasAction: false,
    };
  }
}

/**
 * Process voice command for Telegram
 * @param {Object} params
 * @param {string} params.text - Voice message text (transcribed)
 * @param {string} params.telegramUserId - Telegram user ID
 * @param {string} params.companyId - Linked company ID
 * @returns {Promise<Object>} Response for Telegram
 */
export async function processTelegramVoice({ text, telegramUserId, companyId }) {
  return processVoiceInput({
    text,
    userId: `telegram-${telegramUserId}`,
    companyId,
    sessionId: `telegram-${telegramUserId}`,
  });
}

/**
 * Clear conversation history for a session
 * @param {string} sessionId - Session ID to clear
 */
export function clearConversation(sessionId) {
  conversationHistory.delete(sessionId);
}

/**
 * Get conversation history
 * @param {string} sessionId - Session ID
 * @returns {Array} Conversation history
 */
export function getConversationHistory(sessionId) {
  return conversationHistory.get(sessionId) || [];
}

/**
 * Quick commands for common voice actions
 */
export const QUICK_COMMANDS = {
  'show my tasks': { tool: 'search_tasks', params: { assignee: 'me' } },
  'show pipeline': { tool: 'get_pipeline_summary', params: { type: 'lead' } },
  'show leads': { tool: 'search_clients', params: { status: 'active' } },
  'show orders': { tool: 'search_orders', params: {} },
  'what\'s new': { tool: 'generate_report', params: { type: 'daily_summary' } },
};

/**
 * Check if input matches a quick command
 * @param {string} text - Input text
 * @returns {Object|null} Quick command if matched
 */
export function matchQuickCommand(text) {
  const normalized = text.toLowerCase().trim();
  
  for (const [phrase, command] of Object.entries(QUICK_COMMANDS)) {
    if (normalized.includes(phrase)) {
      return command;
    }
  }
  
  return null;
}

export default {
  processVoiceInput,
  processTelegramVoice,
  clearConversation,
  getConversationHistory,
  matchQuickCommand,
  QUICK_COMMANDS,
};

# Telegram Bot Technical Documentation

## Architecture Overview

The Telegram bot is built using **grammY** (modern Telegram Bot framework) with deep integration to:
- **Google Gemini AI** (gemini-2.5-flash model)
- **MCP Server** (Model Context Protocol - 28 specialized CRM tools)
- **MongoDB** (user data, companies, tasks, orders, etc.)
- **Firebase Admin** (authentication)

## File Structure

```
backend/
  src/
    services/
      telegramService.js    # Main bot logic (1038 lines)
      geminiService.js      # Gemini AI integration
      mcpServer.js          # MCP tool server
    controllers/
      telegramController.js # API endpoints for Telegram
    routes/
      telegramRoutes.js     # Telegram-related routes
    models/
      User.js              # User model with telegramChatId
```

## Core Components

### 1. Bot Initialization (`initTelegramBot()`)
```javascript
export const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  bot = new Bot(token);
  
  // Error handling
  bot.catch((err) => { ... });
  
  // Setup all handlers
  setupBotHandlers();
  
  // Start polling
  bot.start();
}
```

**Environment Variable:**
- `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram

### 2. Bot Handlers Setup (`setupBotHandlers()`)

Registers all command handlers:

#### Common Commands (All Roles)
- `/start` - Account linking flow
- `/menu` - Role-based interactive menu
- `/status` - Account status check
- `/help` - Role-specific help
- `/unlink` - Disconnect account

#### Admin/Manager Commands
- `/stats` - Company statistics
- `/pipeline` - Sales pipeline view
- `/clients` - Client management
- `/orders` - Order management
- `/projects` - Project management
- `/tasks` - All tasks overview

#### Employee Commands
- `/tasks` - Personal tasks
- `/clients` - Assigned clients
- `/orders` - Assigned orders
- `/projects` - Assigned projects

#### Client Commands
- `/conversations` - Client conversations
- `/orders` - Client orders

#### Special Commands
- `/quick` - Quick action menu
- Voice messages → AI processing
- Text messages → AI conversation

### 3. User Session Management

```javascript
const userSessions = new Map(); // chatId -> session data
const pendingVerifications = new Map(); // code -> { userId, createdAt, expiresAt }
```

**Session Structure:**
```javascript
{
  userId: ObjectId,
  companyId: ObjectId,
  role: 'company_admin' | 'manager' | 'employee' | 'client',
  lastActivity: Date,
  context: [] // conversation history for context-aware AI
}
```

## Key Functions

### Account Linking

#### `generateVerificationCode(userId)`
```javascript
// Creates a random verification code
const code = crypto.randomBytes(16).toString('hex');
pendingVerifications.set(code, {
  userId,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min
});
return code;
```

#### `verifyTelegramCode(ctx, code)`
- Validates verification code
- Links Telegram chat ID to user account
- Updates user record with `telegramChatId`, `telegramUsername`, `telegramLinkedAt`

### Role-Based Features

#### `getUserInfo(chatId)`
Returns user info with role detection:
```javascript
{
  user: UserDocument,
  companyId: ObjectId,
  role: string,
  error: string | null
}
```

Determines role from:
1. `user.companies.find(c => c.isActive).role`
2. Fallback to `user.companyId` and default role

#### `showRoleBasedMenu(ctx)`
Displays interactive menu with InlineKeyboard buttons based on user role.

**Admin/Manager Menu:**
- 📊 Stats, 🎯 Pipeline, 👥 Clients, 📦 Orders

**Employee Menu:**
- ✅ Tasks, 👥 Clients, 📦 Orders, 📁 Projects

**Client Menu:**
- 💬 Conversations, 📦 Orders

### AI Integration

#### `handleIncomingMessage(ctx, message)`
Processes all non-command text messages:

```javascript
// 1. Get user info
const { user, companyId, role } = await getUserInfo(chatId);

// 2. Show typing indicator
await ctx.replyWithChatAction('typing');

// 3. Process with Gemini + MCP
const response = await geminiService.generateWithTools(
  message,
  companyId.toString(),
  user._id.toString()
);

// 4. Send response
await ctx.reply(response, { parse_mode: 'Markdown' });
```

**Features:**
- Natural language understanding
- Context-aware (session history)
- Access to 28 MCP tools
- Role-based data filtering

#### AI Command Handlers

All command handlers follow this pattern:

```javascript
const handleXxxCommand = async (ctx) => {
  // 1. Get user info and validate role
  const { user, companyId, role, error } = await getUserInfo(chatId);
  if (error) return await ctx.reply(`❌ ${error}`);
  
  // 2. Role-based access control
  if (role !== 'admin' && role !== 'manager') {
    return await ctx.reply(`❌ Unauthorized`);
  }
  
  // 3. Show typing indicator
  await ctx.replyWithChatAction('typing');
  
  // 4. Build appropriate query
  const query = role === 'employee' 
    ? `Show me my assigned items`
    : `Show me all items`;
  
  // 5. Process with AI + MCP
  const response = await geminiService.generateWithTools(
    query,
    companyId.toString(),
    user._id.toString()
  );
  
  // 6. Send response
  await ctx.reply(response, { parse_mode: 'Markdown' });
};
```

### Quick Actions

#### `showQuickActions(ctx)`
Displays role-based quick action buttons using InlineKeyboard.

#### Callback Query Handler
```javascript
bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data; // e.g., 'qa_my_tasks'
  
  // Map action to AI query
  const actionMap = {
    'qa_my_tasks': 'Show me my tasks',
    'qa_pipeline': 'Show me the sales pipeline',
    // ... 20+ mappings
  };
  
  const query = actionMap[action];
  // Process with AI and reply
});
```

**Supported Actions:**
- `qa_today_tasks` - Tasks due today
- `qa_pipeline` - Pipeline status
- `qa_new_leads` - Leads from last 7 days
- `qa_pending_orders` - Pending orders
- `qa_team_stats` - Team performance
- `qa_my_tasks` - Personal tasks
- `qa_my_clients` - Assigned clients
- `qa_my_orders` - Personal orders
- `qa_conversations` - Conversations
- `cmd_*` - Menu command shortcuts

### Notifications

#### `sendNotification(chatId, message)`
```javascript
export const sendNotification = async (chatId, message) => {
  if (!bot) return false;
  try {
    await bot.api.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    return true;
  } catch (error) {
    console.error('Telegram notification error:', error);
    return false;
  }
};
```

**Use Cases:**
- New task assignments
- Order updates
- New messages from clients
- System announcements
- Deadline reminders

#### `notifyTaskAssignment(userId, task)`
Specialized notification for task assignments.

#### `notifyNewMessage(userId, fromUser, messagePreview)`
Specialized notification for new chat messages.

## MCP Integration

### Available Tools (28 total)

**Client Management:**
1. `searchClients` - Search clients by query
2. `getClient` - Get client by ID
3. `createClient` - Create new client
4. `updateClient` - Update client details

**Order Management:**
5. `searchOrders` - Search orders
6. `getOrder` - Get order by ID
7. `createOrder` - Create new order
8. `updateOrder` - Update order
9. `deleteOrder` - Delete order

**Task Management:**
10. `searchTasks` - Search tasks
11. `getTask` - Get task by ID
12. `createTask` - Create task
13. `updateTask` - Update task
14. `deleteTask` - Delete task

**Project Management:**
15. `searchProjects` - Search projects
16. `getProject` - Get project by ID
17. `createProject` - Create project
18. `updateProject` - Update project

**Analytics:**
19. `generateContent` - Generate AI content
20. `analyzeData` - Analyze business data
21. `getPipelineStats` - Get pipeline statistics
22. `movePipelineStage` - Move deal to new stage
23. `calculateMetrics` - Calculate business metrics

**Communication:**
24. `sendMessage` - Send message to client
25. `searchMessages` - Search messages
26. `getConversation` - Get conversation thread

**Company:**
27. `getCompanyInfo` - Get company details
28. `updateSettings` - Update company settings

### Tool Execution Flow

```javascript
// 1. User sends message
User: "Show me pending tasks"

// 2. Gemini AI decides which tools to use
AI: [Decides to use searchTasks tool]

// 3. geminiService.generateWithTools() executes
const tools = mcpServer.getAllTools(); // Get 28 tool definitions
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  tools: tools // Gemini knows about all MCP tools
});

// 4. AI makes function call
AI: functionCall = { name: 'searchTasks', args: { status: 'pending' } }

// 5. MCP server executes tool
const result = await mcpServer.executeTool('searchTasks', args, companyId, userId);

// 6. Result fed back to AI
AI: [Synthesizes natural language response]

// 7. User receives formatted response
Bot: "📋 You have 5 pending tasks:
1. Follow up with John (Due: Tomorrow)
2. Prepare report (Due: Friday)
..."
```

## Error Handling

### Bot-Level Errors
```javascript
bot.catch((err) => {
  const ctx = err.ctx;
  const error = err.error;
  console.error(`Error for ${ctx.update.update_id}:`, error);
  ctx.reply('❌ An error occurred. Please try again.');
});
```

### Command-Level Errors
All handlers use try-catch:
```javascript
try {
  // Command logic
} catch (error) {
  console.error('Error handling X command:', error);
  await ctx.reply(`❌ Failed to execute. Please try again.`);
}
```

### AI Error Handling
```javascript
try {
  const response = await geminiService.generateWithTools(...);
  await ctx.reply(response);
} catch (aiError) {
  if (aiError.status === 429) {
    await ctx.reply(`⏳ Rate limit exceeded. Please wait ${retryDelay}s.`);
  } else if (aiError.status === 403) {
    await ctx.reply(`❌ API quota exceeded. Try again later.`);
  } else {
    await ctx.reply(`❌ AI error. Please try again.`);
  }
}
```

## Security Considerations

### Authentication
- All commands check if user is linked (`telegramChatId` must exist)
- Unlinked users can only use `/start`

### Authorization
- Role-based access control on every command
- `getUserInfo()` validates user role from database
- Company isolation (users can only access their company data)

### Data Protection
- No sensitive data in Telegram messages (use IDs only)
- Verification codes expire after 10 minutes
- Secure code generation using `crypto.randomBytes()`

### Rate Limiting
- Gemini API: 20 req/day (free tier)
- Telegram API: 30 msg/sec per chat
- graceful degradation on quota exceeded

## Database Schema Updates

### User Model Extensions
```javascript
{
  // ... existing fields
  telegramChatId: String,         // Unique Telegram chat ID
  telegramUsername: String,        // Telegram @username
  telegramLinkedAt: Date,          // When account was linked
  companies: [{
    companyId: ObjectId,
    role: String,                  // Role in this company
    isActive: Boolean              // Currently active company
  }]
}
```

## API Endpoints

### POST `/api/telegram/generate-link-code`
Generate verification code for account linking.

**Request:**
```json
{
  "userId": "user_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "code": "abc123...",
  "botUsername": "your_bot"
}
```

### POST `/api/telegram/send-notification`
Send notification to user (internal use).

**Request:**
```json
{
  "userId": "user_id",
  "message": "Your task is due tomorrow"
}
```

### POST `/api/telegram/unlink`
Unlink Telegram account.

## Performance Optimization

### 1. Session Caching
- User sessions cached in `Map` (in-memory)
- Reduces database queries
- Cleared on inactivity

### 2. Batch Processing
- Group notifications to avoid rate limits
- Queue system for high-volume notifications

### 3. Lazy Loading
- Models imported dynamically when needed
- `const Task = (await import('../models/Task.js')).Task;`

### 4. Response Streaming
- Typing indicators while AI processes
- Improves perceived performance

## Testing

### Manual Testing Checklist

**Account Linking:**
- [ ] Generate verification code
- [ ] Link account via `/start`
- [ ] Verify account with `/status`
- [ ] Unlink with `/unlink`

**Commands (Admin):**
- [ ] `/menu` shows admin menu
- [ ] `/stats` returns statistics
- [ ] `/pipeline` shows pipeline
- [ ] `/clients` lists clients
- [ ] `/orders` shows orders
- [ ] `/projects` lists projects
- [ ] `/tasks` shows all tasks

**Commands (Employee):**
- [ ] `/menu` shows employee menu
- [ ] `/tasks` shows personal tasks
- [ ] `/clients` shows assigned clients
- [ ] `/orders` shows personal orders

**Commands (Client):**
- [ ] `/menu` shows client menu
- [ ] `/conversations` shows conversations
- [ ] `/orders` shows client orders

**AI Features:**
- [ ] Send "show my tasks" → AI responds
- [ ] Send "pipeline status" → AI responds
- [ ] Send voice message → Processing message
- [ ] Click quick action button → AI responds

**Notifications:**
- [ ] Task assignment → Notification received
- [ ] New message → Notification received

### Integration Testing

```javascript
// Example test
describe('Telegram Bot', () => {
  it('should link account with valid code', async () => {
    const code = generateVerificationCode(userId);
    const result = await verifyTelegramCode(mockCtx, code);
    expect(result.success).toBe(true);
  });
  
  it('should reject expired code', async () => {
    const code = generateVerificationCode(userId);
    // Wait for expiration
    await delay(11 * 60 * 1000);
    const result = await verifyTelegramCode(mockCtx, code);
    expect(result.success).toBe(false);
  });
});
```

## Deployment

### Environment Variables
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb://...
```

### Start Bot
```javascript
// In server.js
import * as telegramService from './services/telegramService.js';

// Initialize bot
telegramService.initTelegramBot();

// Graceful shutdown
process.on('SIGINT', () => {
  telegramService.stopTelegramBot();
  process.exit();
});
```

### Monitoring
- Check bot status: `bot.isRunning()`
- Monitor error logs
- Track notification delivery rate
- Watch Gemini API quota usage

## Troubleshooting

### Bot Not Responding
1. Check `TELEGRAM_BOT_TOKEN` is set
2. Verify bot is running: check server logs
3. Ensure internet connectivity
4. Check Telegram API status

### AI Not Working
1. Check `GEMINI_API_KEY` is valid
2. Verify quota not exceeded (20/day free)
3. Check MCP server is running
4. Review error logs

### Notifications Not Sent
1. Verify user has linked account
2. Check `telegramChatId` in database
3. Ensure bot has permission to send messages
4. Check rate limits

## Future Enhancements

**Planned Features:**
- [ ] Voice message transcription (Google Speech-to-Text)
- [ ] Inline query support (search from any chat)
- [ ] Bot command autocomplete
- [ ] Rich media responses (charts, PDFs)
- [ ] Calendar integration
- [ ] Webhook mode (instead of polling)
- [ ] Multi-language support
- [ ] Custom keyboard layouts
- [ ] Group chat support
- [ ] Bot analytics dashboard

**Optimization Opportunities:**
- [ ] Redis for session caching
- [ ] Bull queue for notifications
- [ ] Webhook deployment (faster than polling)
- [ ] Message batching for bulk notifications
- [ ] AI response caching for common queries

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**Dependencies:** grammY, @google/generative-ai, MongoDB, Firebase Admin

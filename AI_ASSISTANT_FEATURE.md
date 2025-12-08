# AI Assistant Feature - Documentation

## Overview
Added an AI Assistant page for admins and employees to interact with Gemini AI using natural language. The AI has access to CRM data through MCP (Model Context Protocol) tools and can perform various operations.

## Features Implemented

### Backend
**Endpoint:** `POST /api/ai/process-request`
- **Location:** `CRM/backend/src/controllers/aiController.js` (processAIRequest function)
- **Route:** `CRM/backend/src/routes/aiRoutes.js`
- **Authentication:** Requires Firebase token + company access
- **Access:** Employees, Managers, Company Admins only

**Request Format:**
```javascript
POST /api/ai/process-request?companyId=xxx
{
  "prompt": "Show me recent clients",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response Format:**
```javascript
{
  "success": true,
  "data": {
    "response": "AI generated response with tool results",
    "timestamp": "2025-12-08T..."
  }
}
```

**Integration:**
- Uses `geminiService.generateWithTools()` for AI processing
- Leverages MCP tools for CRM operations
- Maintains conversation history for context

### Frontend
**Page:** `/dashboard/ai-assistant`
- **Location:** `CRM/Client-web/app/dashboard/ai-assistant/page.js`
- **Access:** Employees, Managers, Company Admins
- **Navigation:** Added to Sidebar with Sparkles icon

**Features:**
- ✅ Chat interface with message history
- ✅ Real-time AI responses
- ✅ Loading states and error handling
- ✅ Suggested prompts for quick start
- ✅ Clear chat functionality
- ✅ Auto-scroll to latest messages
- ✅ Context-aware conversations (remembers history)
- ✅ Beautiful gradient UI with dark theme
- ✅ Responsive design

**UI Components:**
- User messages: Blue/purple gradient (right-aligned)
- AI messages: Gray with border (left-aligned)
- Error messages: Red theme
- Icons: Bot icon for AI, User icon for human

### MCP Tools Available
The AI Assistant has access to these CRM operations:

**Client Management:**
- `searchClients` - Search clients by name, email, status
- `getClient` - Get detailed client information
- `createClient` - Create new clients/leads

**Order Management:**
- `searchOrders` - Search orders by status/client
- `getOrder` - Get order details

**Task Management:**
- `searchTasks` - Search tasks by project/status/assignee
- `createTask` - Create new tasks

**Project Management:**
- `searchProjects` - Search projects by name/status
- `getProject` - Get project details with tasks

**Content Generation:**
- `generateContent` - Generate emails, descriptions, summaries
- `analyzeData` - Analyze CRM data and provide insights

**Pipeline Operations:**
- `movePipelineStage` - Move entities through pipeline stages
- `getPipelineStats` - Get pipeline statistics

## Example Use Cases

### For Employees:
```
User: "Show me my clients from this week"
AI: [Uses searchClients with date filter]

User: "Create a follow-up task for John Doe"
AI: [Uses getClient + createTask]

User: "What are my pending orders?"
AI: [Uses searchOrders with employee filter]
```

### For Admins/Managers:
```
User: "Analyze our sales performance"
AI: [Uses analyzeData on orders]

User: "Show me all high-priority tasks"
AI: [Uses searchTasks with priority filter]

User: "Generate an email for client ABC"
AI: [Uses getClient + generateContent]

User: "What's in our pipeline?"
AI: [Uses getPipelineStats]
```

## Files Modified

### Backend
1. **`CRM/backend/src/controllers/aiController.js`**
   - Added `processAIRequest` function
   - Handles AI chat requests with MCP tools
   - Maintains conversation history

2. **`CRM/backend/src/routes/aiRoutes.js`**
   - Added `POST /api/ai/process-request` route
   - Imported `processAIRequest` controller

### Frontend
3. **`CRM/Client-web/app/dashboard/ai-assistant/page.js`** (NEW)
   - Full chat interface
   - Message management
   - API integration

4. **`CRM/Client-web/components/Sidebar.js`**
   - Added Sparkles icon import
   - Added "AI Assistant" menu item for employees and admins/managers
   - Positioned as first item after profile

## Access Control

### Who Can Access:
- ✅ Company Admins
- ✅ Managers
- ✅ Employees
- ❌ Clients (use conversation page instead)
- ❌ Unauthenticated users

### Implementation:
```javascript
// Frontend route protection
if (!["employee", "manager", "company_admin"].includes(activeCompanyRole)) {
  router.push("/dashboard");
}

// Backend middleware
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);
```

## How It Works

1. **User enters a prompt** in the chat interface
2. **Frontend sends request** to `/api/ai/process-request` with:
   - Current prompt
   - Conversation history for context
   - Company ID for data scoping
3. **Backend processes** through:
   - Authentication/authorization middleware
   - AI Controller
   - Gemini Service with MCP tools
4. **Gemini AI analyzes** the prompt and decides:
   - Which MCP tools to call
   - What parameters to use
   - How to format the response
5. **MCP tools execute** CRM operations:
   - Query database
   - Create/update records
   - Generate content
6. **AI synthesizes** tool results into natural language
7. **Response sent back** to frontend
8. **UI displays** the AI response in chat

## Technical Details

### Gemini Model
- **Model:** `gemini-2.5-flash` (configurable via env)
- **API Key:** Set in `GEMINI_API_KEY` environment variable
- **Function Calling:** Enabled for MCP tool integration

### MCP Integration
- **Service:** `CRM/backend/src/services/mcpServer.js`
- **Tool Definitions:** Structured according to MCP specification
- **Context Injection:** Company ID and User ID passed to all tools
- **Security:** All tools respect company boundaries

### State Management
- **Client-side:** React useState for messages
- **Server-side:** Stateless (conversation history sent with each request)
- **Persistence:** Not implemented (messages cleared on refresh)

## Future Enhancements

### Telegram Integration (Mentioned by User)
To use this feature in Telegram later:
1. Create Telegram bot using same backend endpoint
2. Map Telegram messages to API calls
3. Use same `processAIRequest` endpoint
4. Conversation history can be stored in bot's memory or database

```javascript
// Pseudo-code for Telegram
bot.on('message', async (msg) => {
  const response = await api.post('/ai/process-request', {
    prompt: msg.text,
    conversationHistory: getUserHistory(msg.from.id),
  });
  bot.sendMessage(msg.chat.id, response.data.data.response);
});
```

### Potential Improvements
- [ ] Persist conversation history in database
- [ ] Add voice input/output
- [ ] Export conversation as PDF
- [ ] Share conversations with team members
- [ ] Quick actions from AI suggestions (buttons)
- [ ] File upload support
- [ ] Chart/graph generation in responses
- [ ] Multi-modal support (images, documents)

## Testing

### Manual Testing Steps
1. **Login** as employee, manager, or admin
2. **Navigate** to AI Assistant (sparkle icon in sidebar)
3. **Try basic prompts:**
   - "Show me recent clients"
   - "What orders are pending?"
   - "Create a task for tomorrow"
4. **Test conversation flow:**
   - Ask follow-up questions
   - Verify context is maintained
5. **Test error handling:**
   - Send empty message (should be disabled)
   - Cause API error (check error message display)
6. **Test UI features:**
   - Clear chat button
   - Suggested prompts
   - Auto-scroll

### Expected Behavior
- ✅ Messages appear in correct order
- ✅ AI responses are relevant to prompts
- ✅ Tools are called when needed
- ✅ CRM data is accessed correctly
- ✅ Context is maintained across messages
- ✅ Errors are handled gracefully

## Environment Requirements

```env
# Required in CRM/backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash  # Optional, defaults to this
```

## API Rate Limits
- **Free Tier:** 20 requests per day (may cause 429 errors)
- **Paid Tier:** Higher limits available
- **Error Handling:** Graceful fallback with error message to user

## Security Considerations
- ✅ Authentication required (Firebase token)
- ✅ Company context enforced (verifyCompanyAccess)
- ✅ Role-based access (employees+ only)
- ✅ MCP tools respect company boundaries
- ✅ User context injected into all operations
- ⚠️ No conversation history encryption (future enhancement)
- ⚠️ AI responses not filtered for PII (future enhancement)

## Related Features
- **Client Conversations** (`/conversations`) - Clients chat with AI
- **Team Chat** (`/chat`) - Employee internal messaging
- **Customer Chats** (`/dashboard/conversations`) - Admin manages client conversations
- **AI Insights** (`/dashboard` AI Insights card) - Dashboard analytics

## Notes
- This feature reuses the existing Gemini + MCP infrastructure
- Clients already have AI chat in the conversation system
- This page gives employees/admins direct AI access for productivity
- Same backend can be used for Telegram bot integration later

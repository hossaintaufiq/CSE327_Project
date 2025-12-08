# AI Assistant - Quick Start Guide

## 🚀 Getting Started

### 1. Start Backend Server
```powershell
cd CRM\backend
npm run dev
```

Wait for:
```
✅ Gemini AI configured
🚀 Server running on http://localhost:5000
```

### 2. Start Frontend Server
```powershell
cd CRM\Client-web
npm run dev
```

Wait for:
```
Ready on http://localhost:3000
```

### 3. Access AI Assistant

1. **Login** to the application
2. **Select a company** (if you have multiple)
3. **Navigate** to sidebar → Click **"AI Assistant"** (sparkle ⭐ icon)
4. **Start chatting!**

## 💬 Example Conversations

### Example 1: Search Clients
```
You: Show me all clients from this week

AI: I found 5 clients created this week:
1. John Doe (john@example.com) - Active
2. Jane Smith (jane@example.com) - Lead
...
```

### Example 2: Create Task
```
You: Create a task to follow up with John Doe tomorrow

AI: I've created a new task:
- Title: Follow up with John Doe
- Due Date: Tomorrow
- Priority: Medium
- Status: To Do
```

### Example 3: Order Status
```
You: What orders are pending?

AI: You have 3 pending orders:
1. Order #1234 - $250 - Client ABC
2. Order #1235 - $180 - Client XYZ
...
```

### Example 4: Generate Email
```
You: Generate a professional email to welcome new client Jane Smith

AI: Subject: Welcome to [Company Name]

Dear Jane,

Welcome to our platform! We're excited to have you...
```

### Example 5: Data Analysis
```
You: Analyze my sales performance this month

AI: Sales Analysis for December:
- Total Orders: 45
- Revenue: $12,500
- Top Client: ABC Corp ($3,200)
- Average Deal Size: $278
- Trend: +15% vs last month
```

## 🛠️ Available Commands

The AI can help with:

### Client Management
- "Show me recent clients"
- "Find client by email john@example.com"
- "Create a new lead named John Doe"
- "Analyze client engagement"

### Order Processing
- "Show pending orders"
- "Get details for order #1234"
- "What's my revenue this month?"
- "List completed orders"

### Task Management
- "Show my tasks for today"
- "Create a task for next week"
- "What high-priority tasks do I have?"
- "Show tasks for project X"

### Project Tracking
- "List all active projects"
- "Show me project details for Project ABC"
- "What's the status of our projects?"

### Content Generation
- "Write a welcome email for new clients"
- "Generate a project description"
- "Summarize this client's history"
- "Draft a follow-up message"

### Pipeline & Analytics
- "Show pipeline statistics"
- "Analyze our conversion rate"
- "What's in the sales pipeline?"
- "Move client X to qualified stage"

## ✨ Tips for Best Results

### 1. Be Specific
❌ "Show me clients"
✅ "Show me clients created in the last 7 days"

### 2. Provide Context
❌ "Create a task"
✅ "Create a task to follow up with John Doe tomorrow with high priority"

### 3. Use Follow-ups
```
You: Show me recent orders
AI: [Lists orders]
You: Tell me more about order #1234
AI: [Details for that order]
```

### 4. Natural Language
You can ask in plain English:
- "What did we sell last week?"
- "Who are my best clients?"
- "Help me draft an email to apologize for a delay"

## 🔧 Troubleshooting

### Issue: "AI generation failed"
**Cause:** Gemini API key not configured or quota exceeded
**Fix:**
```powershell
# Check backend .env file has:
GEMINI_API_KEY=your_actual_key_here

# Restart backend server
cd CRM\backend
npm run dev
```

### Issue: "Not authorized"
**Cause:** User role doesn't have access
**Fix:** AI Assistant is only for employees, managers, and admins
- Clients should use the Conversations page

### Issue: "No response"
**Cause:** Backend server not running
**Fix:**
```powershell
cd CRM\backend
npm run dev
```

### Issue: Empty responses
**Cause:** MCP tools not finding data
**Fix:** Verify you have data in your CRM:
- Add some clients
- Create orders/tasks
- Then ask AI again

## 🎯 Role-Specific Access

### Company Admin
- ✅ Full access to all features
- ✅ Can query all company data
- ✅ Can create/update records
- ✅ Can analyze company-wide metrics

### Manager
- ✅ Full access to all features
- ✅ Can query all company data
- ✅ Can create/update records
- ✅ Can analyze company-wide metrics

### Employee
- ✅ Access to AI Assistant
- ⚠️ Limited to assigned data (clients, orders, tasks)
- ✅ Can create personal tasks
- ✅ Can search within permissions

### Client
- ❌ No access to AI Assistant page
- ✅ Use Conversations page instead for AI chat

## 🔐 Privacy & Security

- All conversations are scoped to your company
- AI only accesses data you have permission to see
- Conversations are not stored (cleared on page refresh)
- Authentication required for all requests

## 📱 Future: Telegram Integration

The same AI assistant will be available in Telegram:

```
/start - Activate bot
"Show my orders" - Query CRM
"Create task" - Add tasks
"Help" - Get commands
```

Same backend endpoint will be used, making it easy to integrate.

## 📊 Suggested Prompts

Click these in the UI for quick start:

1. **"Show me my recent clients"**
   - See latest client activity

2. **"What are the pending orders?"**
   - Check order status

3. **"Create a task for follow-up"**
   - Quick task creation

4. **"Analyze this week's sales"**
   - Get performance insights

5. **"Generate an email for a client"**
   - Content creation

## 🎨 UI Features

- **Chat Interface**: Clean, modern design
- **Message History**: Scrollable conversation
- **Loading States**: Shows when AI is thinking
- **Error Handling**: Clear error messages
- **Suggested Prompts**: Quick start options
- **Clear Chat**: Reset conversation anytime
- **Auto-scroll**: Always see latest messages
- **Context Cards**: Info about AI capabilities

## 📝 Notes

- Responses are generated in real-time
- AI remembers conversation context
- You can ask follow-up questions
- Clear chat to start fresh topic
- Backend must be running
- Gemini API key must be configured

## 🚨 Known Limitations

1. **API Quota**: Free tier = 20 requests/day
2. **No Persistence**: Messages cleared on refresh
3. **English Only**: Best results in English
4. **Rate Limits**: May need to wait between requests
5. **Context Length**: Very long conversations may lose early context

## 📞 Support

If you encounter issues:
1. Check backend logs for errors
2. Verify Gemini API key is set
3. Ensure you're logged in with correct role
4. Try clearing chat and starting fresh
5. Restart backend server if needed

---

**Ready to start?** Login → Sidebar → AI Assistant ⭐

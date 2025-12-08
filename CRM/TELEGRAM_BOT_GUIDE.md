# Telegram Bot User Guide

## Overview
The CRM Prime Telegram Bot provides powerful AI-assisted CRM management directly through Telegram. It features role-based access control with specialized commands and AI-powered assistance using Google Gemini and MCP server integration.

## Getting Started

### 1. Link Your Account
1. Start a chat with your CRM Telegram Bot
2. Send `/start` command
3. Click "Link Account" button
4. Go to your CRM dashboard → Settings → Integrations
5. Click "Connect Telegram" and follow the verification steps
6. Enter the verification code in Telegram

### 2. Verify Connection
Send `/status` to check your account status and active companies.

## Role-Based Features

### 🔹 Company Admin / Manager
Admins and managers have full access to company-wide data and analytics.

**Available Commands:**
- `/menu` - Show interactive menu with all features
- `/stats` - View company statistics and performance metrics
- `/pipeline` - Check sales pipeline status
- `/clients` - Manage and view all clients
- `/orders` - View and manage all orders
- `/projects` - Manage company projects
- `/tasks` - View all company tasks
- `/quick` - Access quick action shortcuts
- `/help` - Show role-specific help
- `/status` - Check account and company status
- `/unlink` - Disconnect Telegram account

**Quick Actions:**
- 📋 Today's Tasks
- 🎯 Pipeline Overview
- 🆕 New Leads (last 7 days)
- 📦 Pending Orders
- 👥 Team Performance

**AI Examples:**
- "Show me this month's sales statistics"
- "What's the current pipeline status?"
- "List high-priority pending orders"
- "Show me team performance for this week"
- "Analyze client acquisition trends"

---

### 🔸 Employee
Employees have access to their assigned work items and clients.

**Available Commands:**
- `/menu` - Show interactive menu
- `/tasks` - View your assigned tasks
- `/clients` - View your assigned clients
- `/orders` - View orders you're handling
- `/projects` - View projects you're working on
- `/quick` - Access quick action shortcuts
- `/help` - Show employee help
- `/status` - Check account status
- `/unlink` - Disconnect Telegram account

**Quick Actions:**
- ✅ My Tasks
- 👥 My Clients
- 📦 My Orders
- 📊 Today's Activities

**AI Examples:**
- "Show me my tasks for today"
- "List my high-priority tasks"
- "Who are my assigned clients?"
- "What orders am I handling?"
- "Show my project deadlines"

---

### 🔹 Client
Clients can view their orders, conversations, and get support.

**Available Commands:**
- `/menu` - Show client menu
- `/conversations` - View your conversations with the company
- `/orders` - View your orders
- `/quick` - Access quick actions
- `/help` - Show client help
- `/status` - Check account status
- `/unlink` - Disconnect Telegram account

**Quick Actions:**
- 📦 My Orders
- 💬 Conversations
- ❓ Support

**AI Examples:**
- "Show me my order status"
- "What's the status of my recent order?"
- "Show my conversations"
- "I need help with my order"

---

## AI Assistant Features

### 🤖 How to Use AI
Just send any message to the bot (don't use a command prefix) and the AI will understand and help you!

**Natural Language Processing:**
The bot understands natural language, so you can ask questions conversationally.

**Examples:**
```
✓ "What tasks are due this week?"
✓ "Show me pending orders"
✓ "List clients I haven't contacted in 30 days"
✓ "Create a task to follow up with John"
✓ "What's my team's performance?"
✓ "Analyze this month's sales"
```

### 🎤 Voice Messages
You can also send voice messages! The bot will:
1. Receive your voice message
2. Process it with AI
3. Respond with relevant information

*(Note: Full voice transcription may require additional setup)*

---

## Interactive Features

### 📋 Menu System
Use `/menu` to get an interactive menu with buttons for quick access to all features based on your role.

### ⚡ Quick Actions
Use `/quick` to access frequently used actions:
- Admins/Managers: Pipeline, stats, new leads, team performance
- Employees: Tasks, clients, orders, daily activities
- Clients: Orders, conversations, support

### 🔘 Inline Buttons
The bot provides inline buttons for quick actions:
- Click buttons in the menu to instantly execute commands
- No need to type commands manually
- Faster navigation and task execution

---

## Notifications

The bot sends real-time notifications for:
- ✅ New task assignments
- 📨 New messages from leads/clients
- 📦 Order updates
- 🔔 Important announcements
- ⏰ Task deadlines

---

## Advanced AI Capabilities

### MCP Server Integration
The bot connects to the Model Context Protocol (MCP) server with access to **28 specialized tools**:

**Client Management:**
- Search clients
- Get client details
- Create new clients
- Update client information

**Order Management:**
- Search orders
- Get order details
- Update order status
- Track order pipeline

**Task Management:**
- Search tasks
- Create tasks
- Update task status
- Assign tasks

**Project Management:**
- Search projects
- Get project details
- Update project status

**Analytics:**
- Generate reports
- Analyze performance data
- Get pipeline statistics
- Calculate metrics

**And more...**

### Contextual Understanding
The AI remembers context within your conversation, so you can have natural back-and-forth discussions:

```
You: Show me my tasks
Bot: [Lists 5 tasks]
You: Mark the first one as complete
Bot: ✅ Task "Follow up with client" marked as complete
You: What's next?
Bot: Your next priority is "Prepare quarterly report" (due tomorrow)
```

---

## Security & Privacy

### Account Linking
- Secure verification code system
- One account per Telegram user
- Easy unlinking with `/unlink` command

### Role-Based Access
- Strict permission enforcement
- Users can only access data they're authorized to see
- Company isolation (multi-tenant support)

### Data Protection
- Encrypted communication
- No sensitive data stored in Telegram
- Compliant with company security policies

---

## Troubleshooting

### Bot Not Responding
1. Check if your account is linked: `/status`
2. Verify you have an active company
3. Contact your CRM administrator

### No Access to Commands
- Ensure your role has proper permissions
- Check with your company admin
- Re-link your account if necessary

### AI Not Understanding
- Be specific in your questions
- Use clear, direct language
- Include relevant details (dates, names, etc.)
- Try rephrasing your question

---

## Best Practices

### ✅ DO:
- Link your account as soon as you get access
- Use natural language with the AI
- Leverage quick actions for common tasks
- Enable notifications for important updates
- Keep your Telegram account secure

### ❌ DON'T:
- Share your verification code
- Link multiple accounts to one Telegram
- Use the bot for sensitive personal data
- Spam commands (the AI is smart - one message is enough!)

---

## Support

### Need Help?
1. Use `/help` command for role-specific instructions
2. Contact your CRM administrator
3. Check the CRM dashboard documentation

### Feature Requests
Contact your company admin to request new features or report issues.

---

## Example Workflows

### Morning Routine (Employee)
```
1. Send: "Show me my tasks for today"
2. Review the list
3. Send: "What's my first priority?"
4. Get started on work
5. Send: "Mark [task name] as complete" when done
```

### Pipeline Check (Manager)
```
1. /menu → Click "Pipeline"
2. Review pipeline stages
3. Send: "Show me deals stuck in negotiation"
4. Send: "Who is handling the largest deal?"
5. Take appropriate action
```

### Client Order (Client)
```
1. Send: "What's the status of my order?"
2. Review the details
3. Send: "When will it be delivered?"
4. Get delivery estimate
```

---

## Updates & Changelog

**Current Version:** 2.0.0 (Comprehensive AI Update)

**New Features:**
- ✨ Complete AI integration with Gemini 2.5 Flash
- 🔧 28 MCP tools for advanced CRM operations
- 📱 Role-based interactive menus
- ⚡ Quick action buttons
- 🎯 Contextual AI conversations
- 🔔 Enhanced notifications

**Coming Soon:**
- 🎤 Full voice message transcription
- 📊 Inline charts and visualizations
- 📅 Calendar integration
- 🤝 Team collaboration features

---

## API Rate Limits

**Gemini AI:**
- Free tier: 20 requests/day per Google Cloud project
- Quota resets based on rolling window
- Contact admin to upgrade for higher limits

**Best Practice:**
- Use specific commands when possible (faster response)
- Batch questions together in one message
- Avoid redundant queries

---

*For more information, visit your CRM dashboard or contact your administrator.*

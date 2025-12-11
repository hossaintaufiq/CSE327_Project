# Telegram Bot Commands Reference

## Complete Command List by Role

### 🌐 Universal Commands (All Users)
Commands available to all users regardless of role:

| Command | Description | Access Level |
|---------|-------------|--------------|
| `/start` | Initial bot greeting and account linking | Everyone |
| `/help` | Show role-specific help menu | Everyone |
| `/menu` | Display role-based command menu with buttons | Everyone |
| `/status` | View account status and company info | Everyone |
| `/quick` | Show quick action buttons based on role | Everyone |
| `/unlink` | Disconnect Telegram from CRM account | Everyone |

---

## 👔 Company Admin / Manager Commands

**Full Access - All Features Available**

### Standard Commands
| Command | Description | Example |
|---------|-------------|---------|
| `/stats` | View company statistics and analytics | Monthly revenue, conversion rates |
| `/pipeline` | Check sales pipeline status with metrics | Deals by stage, win rates |
| `/clients` | View and manage all company clients | Recent clients, client list |
| `/orders` | View all company orders | Pending orders, order history |
| `/projects` | Manage all company projects | Active projects, project stats |
| `/tasks` | View all company tasks | All tasks, team tasks |
| `/conversations` | View assigned customer conversations | Support chats |

### Quick Actions (via `/quick` command)
- 📋 Today's Tasks
- 🎯 Pipeline Status
- 🆕 New Leads (last 7 days)
- 📦 Pending Orders
- 👥 Team Performance Stats

### AI Assistant Capabilities
Admins can ask the AI:
- "Show me company statistics for this month"
- "What's the sales pipeline status?"
- "Show me new leads from last week"
- "Analyze team performance"
- "List all pending orders"
- "Show revenue trends"
- "Create a new project"
- "Assign tasks to team members"

---

## 👨‍💼 Employee Commands

**Limited Access - Only Assigned Items**

### Standard Commands
| Command | Description | Scope |
|---------|-------------|-------|
| `/tasks` | View your assigned tasks | Only your tasks |
| `/clients` | View your assigned clients | Only your clients |
| `/orders` | View orders you're handling | Only your orders |
| `/projects` | View projects you're working on | Only your projects |
| `/conversations` | View your assigned conversations | Only your chats |

### Quick Actions (via `/quick` command)
- ✅ My Tasks
- 👥 My Clients
- 📦 My Orders
- 📊 Today's Activities

### AI Assistant Capabilities
Employees can ask:
- "Show me my tasks for today"
- "What clients am I assigned to?"
- "Show my pending orders"
- "What projects am I working on?"
- "List tasks due this week"
- "Show my conversations"

**Restrictions:**
- ❌ Cannot view `/stats` (Admin only)
- ❌ Cannot view `/pipeline` (Admin only)
- ❌ Can only see assigned/filtered data
- ❌ No company-wide analytics access

---

## 👤 Client Commands

**Customer Access - Own Data Only**

### Standard Commands
| Command | Description | Access |
|---------|-------------|--------|
| `/conversations` | View your conversations with company | Your chats |
| `/orders` | View your order history and status | Your orders |
| `/status` | Check your account status | Your account |

### Quick Actions (via `/quick` command)
- 📦 My Orders
- 💬 My Conversations
- ❓ Support

### AI Assistant Capabilities
Clients can ask:
- "Show me my orders"
- "What's the status of my order?"
- "Show my conversations"
- "I need help with..."
- "When will my order arrive?"

**Restrictions:**
- ❌ Cannot view `/stats` (Admin only)
- ❌ Cannot view `/pipeline` (Admin only)
- ❌ Cannot view `/clients` (Internal only)
- ❌ Cannot view `/projects` (Internal only)
- ❌ Cannot view company tasks
- ✅ Can only see own data (orders, conversations)

---

## 🤖 AI Assistant (All Roles)

### How to Use
Simply send any text message to the bot (without `/` prefix):

```
"Show me my pending tasks"
"What's my sales this month?"
"List my clients"
```

### Features
- ✅ Natural language processing
- ✅ Context-aware responses based on role
- ✅ Integration with Gemini AI + MCP tools
- ✅ Voice message support (placeholder - send text)
- ✅ Real-time data from CRM

### Example Queries by Role

**Admin/Manager:**
```
"Analyze company performance this month"
"Show me the sales pipeline breakdown"
"What's the team performance?"
"List new leads from last week"
"Create a task for John to follow up with ABC Corp"
```

**Employee:**
```
"Show me my tasks due today"
"What clients am I assigned to?"
"List my pending orders"
"What projects am I working on?"
```

**Client:**
```
"Show me my order history"
"What's the status of order #1234?"
"I need help with my account"
"Show my conversations"
```

---

## 📱 Inline Buttons

### Menu Buttons (via `/menu` command)

**Admin/Manager:**
- 📊 Stats → `/stats`
- 🎯 Pipeline → `/pipeline`
- 👥 Clients → `/clients`
- 📦 Orders → `/orders`
- 📁 Projects → `/projects`
- ✅ Tasks → `/tasks`
- 🤖 AI Help → Shows AI capabilities

**Employee:**
- ✅ Tasks → `/tasks`
- 👥 Clients → `/clients`
- 📦 Orders → `/orders`
- 📁 Projects → `/projects`
- 🤖 AI Help → Shows AI capabilities

**Client:**
- 💬 Conversations → `/conversations`
- 📦 Orders → `/orders`
- 🤖 AI Help → Shows AI capabilities

---

## 🔐 Security & Access Control

### Role-Based Access Control (RBAC)
- ✅ Commands are validated before execution
- ✅ Users can only access data for their role
- ✅ Clients cannot see internal data
- ✅ Employees see only assigned items
- ✅ Admins have full company access

### Permission Checks
When a user runs a restricted command:

```
Employee runs /pipeline:
❌ This command is only available for administrators and managers.

Client runs /stats:
❌ This command is only available for administrators and managers.
```

### Account Linking
1. User sends `/start` to bot
2. User goes to CRM → Settings → Integrations
3. User clicks "Connect Telegram"
4. User either:
   - Clicks generated link
   - Enters verification code
5. Account automatically linked
6. User receives role-based menu

---

## 📊 Command Availability Matrix

| Command | Admin | Manager | Employee | Client |
|---------|-------|---------|----------|--------|
| `/start` | ✅ | ✅ | ✅ | ✅ |
| `/help` | ✅ | ✅ | ✅ | ✅ |
| `/menu` | ✅ | ✅ | ✅ | ✅ |
| `/status` | ✅ | ✅ | ✅ | ✅ |
| `/quick` | ✅ | ✅ | ✅ | ✅ |
| `/unlink` | ✅ | ✅ | ✅ | ✅ |
| `/stats` | ✅ | ✅ | ❌ | ❌ |
| `/pipeline` | ✅ | ✅ | ❌ | ❌ |
| `/clients` | ✅ | ✅ | ✅* | ❌ |
| `/orders` | ✅ | ✅ | ✅* | ✅* |
| `/projects` | ✅ | ✅ | ✅* | ❌ |
| `/tasks` | ✅ | ✅ | ✅* | ❌ |
| `/conversations` | ✅ | ✅ | ✅* | ✅* |
| AI Messages | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ = Full access
- ✅* = Limited access (filtered by assignment/ownership)
- ❌ = No access

---

## 🔔 Notification System

All roles receive real-time notifications for:

### Admin/Manager Notifications:
- 📊 New orders
- 👤 New client registrations
- 📋 Task assignments
- 💬 New support conversations
- 🎯 Pipeline stage changes
- 📈 Important metrics updates

### Employee Notifications:
- ✅ New task assignments
- 💬 New messages in assigned conversations
- 📦 Order updates for assigned orders
- 👥 Client activity for assigned clients

### Client Notifications:
- 📦 Order status changes
- 💬 New messages from company
- ✅ Task completions
- 📢 Company announcements

---

## 💡 Usage Tips

### Best Practices
1. **Use `/menu`** to see available commands quickly
2. **Use `/quick`** for one-click common actions
3. **Use AI** for natural language queries
4. **Use `/help`** when you forget commands

### Example Workflow - Admin
```
1. Morning: /quick → Team Stats
2. Check: /pipeline
3. AI: "Show me new leads from yesterday"
4. Action: "Assign lead ABC to John for follow-up"
```

### Example Workflow - Employee
```
1. Morning: /quick → My Tasks
2. Check: "Show me tasks due today"
3. Update: "Mark task #123 as complete"
4. Check: /clients → View assigned clients
```

### Example Workflow - Client
```
1. Check order: /orders
2. Support: /conversations
3. AI: "What's the status of my order?"
4. Contact: "I need help with delivery"
```

---

## 🚀 Getting Started

### For New Users:
1. **Get bot link** from your CRM dashboard (Settings → Integrations)
2. **Click the link** or search for the bot in Telegram
3. **Send `/start`** to begin
4. **Account links automatically** via verification code
5. **Send `/menu`** to see your available commands
6. **Start chatting!** Send any message to the AI

### For Testing:
```bash
# In Telegram, send:
/start
/menu
/help
/status
/quick

# Then try role-specific commands
# Admin: /stats
# Employee: /tasks
# Client: /orders

# Try AI:
"Show me my pending tasks"
```

---

## 📝 Summary

### Total Commands: 13
- **Universal:** 6 commands (all roles)
- **Admin-Only:** 2 commands (`/stats`, `/pipeline`)
- **Role-Based:** 5 commands (filtered by role)

### Key Features:
✅ Role-based access control (RBAC)
✅ Natural language AI assistant
✅ Real-time notifications
✅ Quick action buttons
✅ Secure account linking
✅ Context-aware responses
✅ Voice message support (placeholder)

**Status: Fully Operational** ✅

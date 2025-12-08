# Telegram Bot - Quick Reference

## 🚀 Quick Start

### For Users
1. Find your CRM bot on Telegram
2. Send `/start`
3. Click "Link Account"
4. Go to CRM Dashboard → Settings → Integrations → Connect Telegram
5. Enter verification code
6. Start chatting!

### For Developers
```bash
# Environment setup
TELEGRAM_BOT_TOKEN=your_token_here
GEMINI_API_KEY=your_gemini_key

# Start server
cd backend
npm run dev

# Bot auto-starts with server
```

---

## 📋 Commands by Role

### 🔵 Admin/Manager
```
/menu         - Interactive menu
/stats        - Company statistics
/pipeline     - Sales pipeline
/clients      - All clients
/orders       - All orders
/projects     - All projects
/tasks        - All tasks
/quick        - Quick actions
/help         - Show help
```

### 🟢 Employee
```
/menu         - Interactive menu
/tasks        - My tasks
/clients      - My clients
/orders       - My orders
/projects     - My projects
/quick        - Quick actions
/help         - Show help
```

### 🟡 Client
```
/menu         - Client menu
/conversations - My conversations
/orders       - My orders
/quick        - Quick actions
/help         - Show help
```

### ⚪ Common (All Roles)
```
/start        - Link account
/status       - Account status
/unlink       - Disconnect account
```

---

## 🤖 AI Examples

### Natural Language Queries
Just send a message without `/` prefix:

```
"Show me my tasks"
"What's the pipeline status?"
"List pending orders"
"Who are my assigned clients?"
"Create a task for follow-up tomorrow"
"Analyze this month's sales"
```

### Quick Actions (Button Clicks)
- 📊 Stats
- 🎯 Pipeline
- 👥 Clients
- 📦 Orders
- ✅ Tasks
- 💬 Conversations

---

## 🛠️ Technical Stack

**Bot Framework:** grammY  
**AI Model:** Google Gemini 2.5 Flash  
**MCP Tools:** 28 specialized CRM functions  
**Database:** MongoDB  
**Auth:** Firebase Admin  

---

## 🔧 Key Functions (For Developers)

### Initialize Bot
```javascript
import * as telegramService from './services/telegramService.js';
telegramService.initTelegramBot();
```

### Generate Link Code
```javascript
const code = telegramService.generateVerificationCode(userId);
```

### Send Notification
```javascript
await telegramService.sendNotification(chatId, message);
```

### Get User Info
```javascript
const { user, companyId, role } = await getUserInfo(chatId);
```

---

## 🎯 MCP Tools Available

**Client:** search, get, create, update  
**Order:** search, get, create, update, delete  
**Task:** search, get, create, update, delete  
**Project:** search, get, create, update  
**Analytics:** generate, analyze, stats, metrics  
**Pipeline:** stats, move stage  
**Messages:** send, search, get conversation  
**Company:** get info, update settings  

---

## ⚡ Performance

**API Limits:**
- Gemini Free: 20 requests/day
- Telegram: 30 msg/sec per chat

**Response Time:**
- Commands: < 1 second
- AI queries: 2-5 seconds
- Notifications: < 0.5 seconds

---

## 🔒 Security

**Authentication:**
- Secure verification codes (10 min expiry)
- Account linking required for all features

**Authorization:**
- Role-based access control
- Company data isolation
- Tool-level permissions

---

## 📱 User Experience

**Interactive Menu:** Role-based buttons  
**Quick Actions:** One-tap common tasks  
**Typing Indicators:** Shows bot is working  
**Markdown Formatting:** Rich text responses  
**Voice Support:** Send voice messages  
**Notifications:** Real-time updates  

---

## 🐛 Troubleshooting

### Bot not responding?
1. Check bot token in `.env`
2. Restart server
3. Verify internet connection

### AI not working?
1. Check Gemini API key
2. Verify quota (20/day free tier)
3. Check server logs

### Can't link account?
1. Generate new code
2. Check code hasn't expired (10 min)
3. Verify user exists in database

---

## 📚 Documentation Files

- **TELEGRAM_BOT_GUIDE.md** - User guide for all roles
- **TELEGRAM_BOT_TECHNICAL.md** - Full technical documentation
- **TELEGRAM_BOT_QUICKREF.md** - This file

---

## 🎨 Example Workflows

### Morning Check (Employee)
```
1. /tasks → View tasks
2. Click "My Clients" → See clients
3. "What's my priority today?" → AI suggests
4. Start working
```

### Pipeline Review (Manager)
```
1. /pipeline → See pipeline
2. Click "Team Stats" → View performance
3. "Show deals stuck in negotiation" → AI analyzes
4. Take action
```

### Order Check (Client)
```
1. /orders → View orders
2. "What's my order status?" → AI responds
3. "When will it arrive?" → Get ETA
```

---

## 📊 Features Comparison

| Feature | Admin/Manager | Employee | Client |
|---------|--------------|----------|--------|
| Full Stats | ✅ | ❌ | ❌ |
| Pipeline View | ✅ | ❌ | ❌ |
| All Clients | ✅ | ❌ | ❌ |
| All Orders | ✅ | ❌ | ❌ |
| All Tasks | ✅ | ❌ | ❌ |
| Personal Tasks | ✅ | ✅ | ❌ |
| Assigned Clients | ✅ | ✅ | ❌ |
| Personal Orders | ✅ | ✅ | ✅ |
| Conversations | ✅ | ✅ | ✅ |
| AI Assistant | ✅ | ✅ | ✅ |
| Quick Actions | ✅ | ✅ | ✅ |

---

## 🚦 Status Codes

**Success:**
- ✅ Account linked
- ✅ Command executed
- ✅ Data retrieved

**Errors:**
- ❌ Not linked (use `/start`)
- ❌ Unauthorized role
- ❌ API error
- ⏳ Rate limit (wait and retry)

---

## 📞 Support

**Issues:** Contact your CRM administrator  
**Feature Requests:** Submit via CRM dashboard  
**Technical Issues:** Check server logs and documentation  

---

**Version:** 2.0.0  
**Updated:** 2024  
**Status:** ✅ Production Ready

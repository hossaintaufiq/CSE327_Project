# 🧪 Test Pages - Quick Access Links

## 📍 Main Test Dashboard
**🏠 Test Suite Dashboard**
```
http://localhost:5000/test-index.html
```
Central hub for accessing all test pages

---

## ✅ Active Test Pages (Ready to Use)

### 1. MCP Server Tests
```
http://localhost:5000/mcp-test.html
```
**Features:**
- 28+ MCP tools testing
- Client management tools
- Order processing tools
- Task management tools
- Analytics & reporting
- Real-time tool execution

**How to Test:**
1. Open the page (tests auto-run)
2. View green checkmarks for passing tests
3. Click "Refresh All Tests" to re-run
4. Check individual tool responses

---

### 2. AI Assistant Tests
```
http://localhost:5000/test-ai-assistant.html
```
**Features:**
- Simple AI responses (Gemini)
- MCP-powered queries
- Multi-turn conversations
- API quota monitoring

**How to Test:**
1. **Simple Test:** Enter prompt → Click "Test AI"
2. **MCP Test:** Add company ID + user ID → Use data queries
3. **Conversation:** Send messages to test context awareness
4. **Check Status:** Monitor API quota usage

**Example Prompts:**
- "Show me my pending tasks"
- "What's the pipeline status?"
- "List all clients"
- "Create a task for follow-up"

---

### 3. Authentication Tests
```
http://localhost:5000/test-auth.html
```
**Features:**
- Firebase login
- JWT token validation
- Protected route testing
- Role-based access control

**How to Test:**
1. **Login:** Enter credentials → Test
2. **Token:** Paste token (or use from login) → Validate
3. **Protected Routes:** Select route → Test with token

**Test Credentials:**
Use your CRM account credentials or create a test user

---

## 🚧 Coming Soon Test Pages

### 4. Conversation Tests
```
http://localhost:5000/test-conversations.html
```
**Status:** Under development
**Planned Features:**
- Socket.io real-time chat
- AI chat responses
- Message history
- Lead/client conversations

---

### 5. Database Tests
```
http://localhost:5000/test-database.html
```
**Status:** Under development
**Planned Features:**
- MongoDB connection
- CRUD operations
- Schema validation
- Index performance

---

### 6. API Endpoint Tests
```
http://localhost:5000/test-api.html
```
**Status:** Under development
**Planned Features:**
- All REST API routes
- Request validation
- Response format testing
- Error handling
- Rate limiting

---

### 7. Telegram Bot Tests
```
http://localhost:5000/test-telegram.html
```
**Status:** Under development
**Planned Features:**
- Bot commands
- Role-based menus
- AI integration
- Notifications
- Account linking

---

### 8. Performance Tests
```
http://localhost:5000/test-performance.html
```
**Status:** Under development
**Planned Features:**
- Response time metrics
- Load testing
- Memory usage
- API rate limits
- Concurrent users

---

### 9. Integration Tests
```
http://localhost:5000/test-integration.html
```
**Status:** Under development
**Planned Features:**
- Full user workflows
- Service integration
- Third-party APIs
- Data flow testing
- System health check

---

## 🎯 Quick Test Checklist

### Before Testing
- [ ] Backend server running (`npm run dev` in CRM/backend)
- [ ] Frontend server running (`npm run dev` in CRM/Client-web) - optional
- [ ] MongoDB connected
- [ ] Firebase credentials configured
- [ ] Gemini API key set in .env

### Test Priority Order
1. ✅ **MCP Server Tests** - Verify 28 tools working
2. ✅ **Authentication Tests** - Login and get token
3. ✅ **AI Assistant Tests** - Test with your token
4. 🚧 Wait for other pages to be completed

---

## 📊 Test Page Summary

| Test Page | URL | Status | Priority |
|-----------|-----|--------|----------|
| Test Dashboard | `/test-index.html` | ✅ Ready | High |
| MCP Server | `/mcp-test.html` | ✅ Ready | High |
| AI Assistant | `/test-ai-assistant.html` | ✅ Ready | High |
| Authentication | `/test-auth.html` | ✅ Ready | High |
| Conversations | `/test-conversations.html` | 🚧 Soon | Medium |
| Database | `/test-database.html` | 🚧 Soon | Medium |
| API Endpoints | `/test-api.html` | 🚧 Soon | Medium |
| Telegram Bot | `/test-telegram.html` | 🚧 Soon | Low |
| Performance | `/test-performance.html` | 🚧 Soon | Low |
| Integration | `/test-integration.html` | 🚧 Soon | Low |

---

## 🔗 Related Links

**Backend API Health:**
```
http://localhost:5000/api/health
```

**Frontend Dashboard:**
```
http://localhost:3000/dashboard
```

**AI Assistant (Frontend):**
```
http://localhost:3000/dashboard/ai-assistant
```

---

## 💡 Testing Tips

### For AI Tests
- Gemini free tier = 20 requests/day
- If quota exceeded, wait for daily reset
- Use specific prompts for better results
- Company ID and User ID required for MCP queries

### For Auth Tests
- Save your token after login
- Token is automatically filled after login
- Test different protected routes
- Verify role-based access

### For MCP Tests
- Tests auto-run on page load
- Green = passing, Red = failing
- Check individual tool responses
- Refresh to re-run all tests

---

## 🆘 Troubleshooting

**Tests Not Loading?**
- Check backend is running on port 5000
- Verify no CORS errors in browser console
- Clear browser cache

**Authentication Failing?**
- Check Firebase credentials
- Verify user exists in database
- Check email/password are correct

**AI Not Responding?**
- Check Gemini API key in .env
- Verify quota not exceeded
- Check backend logs for errors

**MCP Tools Failing?**
- Verify MongoDB is connected
- Check database has data
- Ensure company ID is valid

---

## 📝 Notes

- All test pages work independently
- No specific order required
- Some tests require valid data in database
- Backend must be running for all tests
- Frontend is optional (only for UI tests)

---

**Last Updated:** December 9, 2024  
**Version:** 2.0  
**Status:** ✅ 3/9 Pages Ready, 6/9 Coming Soon

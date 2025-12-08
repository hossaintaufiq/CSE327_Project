# CRM Test Suite

## 🧪 Comprehensive Testing Dashboard

Access all test pages from a centralized dashboard to verify CRM functionality.

## 📍 Access Test Suite

**Main Dashboard:** [http://localhost:5000/test-index.html](http://localhost:5000/test-index.html)

## 📋 Available Test Pages

### 1. **MCP Server Tests** 
   - **URL:** `/mcp-test.html`
   - **Features:** Test 28+ MCP tools for CRM operations
   - **Tests:** Client management, orders, tasks, analytics, real-time execution
   
### 2. **AI Assistant Tests** ✅
   - **URL:** `/test-ai-assistant.html`
   - **Features:** Google Gemini AI integration
   - **Tests:**
     - Simple AI responses
     - MCP-powered queries
     - Multi-turn conversations
     - API quota status

### 3. **Authentication Tests** ✅
   - **URL:** `/test-auth.html`
   - **Features:** Firebase auth, JWT tokens, RBAC
   - **Tests:**
     - Login functionality
     - Token validation
     - Protected routes
     - Role-based access

### 4. **Conversation Tests** 🚧
   - **URL:** `/test-conversations.html`
   - **Status:** Coming soon
   
### 5. **Database Tests** 🚧
   - **URL:** `/test-database.html`
   - **Status:** Coming soon
   
### 6. **API Endpoint Tests** 🚧
   - **URL:** `/test-api.html`
   - **Status:** Coming soon
   
### 7. **Telegram Bot Tests** 🚧
   - **URL:** `/test-telegram.html`
   - **Status:** Coming soon
   
### 8. **Performance Tests** 🚧
   - **URL:** `/test-performance.html`
   - **Status:** Coming soon
   
### 9. **Integration Tests** 🚧
   - **URL:** `/test-integration.html`
   - **Status:** Coming soon

## 🚀 Quick Start

1. **Start Backend Server:**
   ```bash
   cd CRM/backend
   npm run dev
   ```

2. **Start Frontend (optional):**
   ```bash
   cd CRM/Client-web
   npm run dev
   ```

3. **Access Test Dashboard:**
   Open browser: `http://localhost:5000/test-index.html`

## 📖 How to Use

### MCP Server Test
1. Navigate to MCP test page
2. All tests auto-run on page load
3. Green checkmarks = passing tests
4. Click "Refresh All Tests" to re-run

### AI Assistant Test
1. **Simple Test:** Enter any prompt → Click "Test AI"
2. **MCP Test:** Enter company ID and user ID → Use data queries
3. **Conversation:** Have multi-turn conversation to test context
4. **Check Quota:** Monitor Gemini API usage (20/day free tier)

### Authentication Test
1. **Login:** Enter credentials → Test login
2. **Token:** Paste token or use one from login → Validate
3. **Protected Routes:** Select route → Test with token

## ⚠️ Important Notes

### API Rate Limits
- **Gemini AI:** 20 requests/day (free tier)
- **Solutions:** 
  - Upgrade to paid plan for more quota
  - Use different API key
  - Wait for daily reset

### Prerequisites
- Backend server running on port 5000
- Valid Firebase credentials
- MongoDB connection active
- Gemini API key configured

### Test Data
Some tests require:
- Valid company ID
- Valid user ID
- Active database records
- Proper authentication

## 🔧 Troubleshooting

### Tests Failing?
1. **Backend not running:** Start backend server
2. **CORS errors:** Check if frontend is on port 3000
3. **Auth errors:** Verify Firebase config
4. **AI errors:** Check Gemini API key and quota

### No Response?
1. Check browser console for errors
2. Verify backend is running: `http://localhost:5000/api/health`
3. Check network tab for failed requests

## 📊 Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| MCP Tools | 28 | ✅ Ready |
| AI Features | 5 | ✅ Ready |
| Authentication | 3 | ✅ Ready |
| Conversations | - | 🚧 Pending |
| Database | - | 🚧 Pending |
| API Endpoints | - | 🚧 Pending |
| Telegram | - | 🚧 Pending |
| Performance | - | 🚧 Pending |
| Integration | - | 🚧 Pending |

## 🎯 Test Examples

### Example: Testing AI with MCP
```javascript
// Navigate to AI Assistant Test Page
// Enter:
Company ID: 675733480c1e9c6f87c4fb50
User ID: 67572bf48b58e2cf0c0ed12b
Prompt: "Show me my pending tasks"

// Expected: AI returns task list using searchTasks MCP tool
```

### Example: Testing Authentication
```javascript
// Navigate to Auth Test Page
// Enter credentials and login
// Token is automatically filled
// Test protected routes with the token
```

## 📁 File Structure

```
CRM/backend/public/
├── test-index.html          # Main test dashboard
├── mcp-test.html            # MCP server tests
├── test-ai-assistant.html   # AI assistant tests
├── test-auth.html           # Authentication tests
├── test-conversations.html  # (Coming soon)
├── test-database.html       # (Coming soon)
├── test-api.html            # (Coming soon)
├── test-telegram.html       # (Coming soon)
├── test-performance.html    # (Coming soon)
└── test-integration.html    # (Coming soon)
```

## 🔄 Recent Updates

### v2.0 (Latest)
- ✅ Added comprehensive test dashboard
- ✅ Created AI Assistant test page
- ✅ Created Authentication test page
- ✅ Fixed all accessibility issues
- ✅ Added test instructions and examples
- ✅ Fixed Tailwind CSS warnings

### v1.0
- Initial MCP test page
- Basic health checks

## 📞 Support

For issues or questions:
1. Check test page instructions
2. Review browser console
3. Verify backend logs
4. Check documentation files

---

**Version:** 2.0  
**Last Updated:** 2024  
**Status:** ✅ Active Development

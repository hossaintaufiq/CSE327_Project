# 🧪 Test Suite Documentation

Complete testing infrastructure for the CRM system with credential management.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Test Credentials Generator](#test-credentials-generator)
3. [Available Test Suites](#available-test-suites)
4. [Usage Examples](#usage-examples)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Generate Test Credentials

```bash
# Navigate to backend directory
cd CRM/backend

# Generate credentials with your Firebase account
node test-credentials-generator.js --login your-email@example.com your-password
```

This creates:
- `test-credentials.json` - Full credentials data
- `test-config.json` - Test configuration
- `test-api-template.js` - API test template

### Step 2: Run Tests

```bash
# Run complete API test suite
node test-complete-api.js

# Run specific tests
node test-auth.js your-email@example.com your-password
node test-gemini-tools.js
node test-mcp-server.js
node test-ai-health.js
```

---

## 🔐 Test Credentials Generator

### Backend Generator (Recommended)

**Command:**
```bash
node test-credentials-generator.js --login email@example.com password
```

**What it does:**
- ✅ Connects to MongoDB and fetches real user/company data
- ✅ Authenticates with Firebase and generates valid ID tokens
- ✅ Creates test-credentials.json with all IDs
- ✅ Generates test-config.json for automated tests
- ✅ Creates API test template

**Output Files:**

**test-credentials.json**
```json
{
  "timestamp": "2025-12-11T...",
  "users": [
    {
      "role": "client",
      "email": "client@example.com",
      "userId": "507f1f77bcf86cd799439011",
      "firebaseUid": "abc123xyz..."
    }
  ],
  "companies": [...],
  "tokens": {
    "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-12-11T15:00:00Z"
  }
}
```

**test-config.json**
```json
{
  "baseURL": "http://localhost:5000/api",
  "timeout": 10000,
  "credentials": {
    "client": {...},
    "admin": {...},
    "employee": {...}
  },
  "companies": [...],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Frontend Generator (UI Testing)

**Access:** http://localhost:3000/test-credentials

**Features:**
- 🎯 Generate sample IDs instantly (no auth required)
- 📋 Copy individual credentials to clipboard
- 💾 Download as JSON or .env file
- ⚡ Perfect for frontend UI testing

**Note:** Frontend generator creates SAMPLE credentials only. Use backend generator for real API testing.

---

## 🧪 Available Test Suites

### 1. Complete API Test Suite

**File:** `test-complete-api.js`

**Tests:**
- ✅ Server health
- ✅ Authentication
- ✅ Conversations API
- ✅ Company endpoints
- ✅ Dashboard stats
- ✅ Orders
- ✅ Projects
- ✅ Tasks
- ✅ AI services
- ✅ Notifications

**Usage:**
```bash
# Run all tests
node test-complete-api.js

# View results
cat test-results.json
```

**Output:**
```
═══════════════════════════════════════════════════════════
  📊 TEST SUMMARY
═══════════════════════════════════════════════════════════
  Total Tests: 25
  ✅ Passed: 22
  ❌ Failed: 2
  ⏭️  Skipped: 1
  📈 Success Rate: 91%
═══════════════════════════════════════════════════════════
```

### 2. Authentication Test

**File:** `test-auth.js`

**Tests:**
- ✅ Firebase initialization
- ✅ User login
- ✅ ID token generation
- ✅ Token validation

**Usage:**
```bash
# With credentials
node test-auth.js email@example.com password

# With test-config.json
node test-auth.js
```

### 3. Gemini AI Tools Test

**File:** `test-gemini-tools.js`

**Tests:**
- ✅ MongoDB connection
- ✅ Gemini API integration
- ✅ Tool function calling
- ✅ AI responses

**Usage:**
```bash
# Use credentials from test-config.json
node test-gemini-tools.js

# Or specify IDs and prompt
node test-gemini-tools.js <companyId> <userId> "Your prompt here"
```

**Example:**
```bash
node test-gemini-tools.js 507f1f77bcf86cd799439011 507f191e810c19729de860ea "Find all active clients"
```

### 4. MCP Server Test

**File:** `test-mcp-server.js`

**Tests:**
- ✅ Git operations (status, branch, log, diff)
- ✅ File system operations
- ✅ Project structure validation
- ✅ Environment variables
- ✅ Server health

**Usage:**
```bash
node test-mcp-server.js
```

### 5. AI Health Test

**File:** `test-ai-health.js`

**Tests:**
- ✅ API key configuration
- ✅ API connection
- ✅ Text generation
- ✅ Rate limiting
- ✅ Error handling

**Usage:**
```bash
node test-ai-health.js
```

### 6. Daily.co API Test

**File:** `test-daily-api.js`

**Tests:**
- ✅ API key validation
- ✅ Room creation
- ✅ Room deletion
- ✅ Authentication

**Usage:**
```bash
node test-daily-api.js
```

### 7. Email Service Test

**File:** `test-email.js`

**Tests:**
- ✅ Gmail SMTP configuration
- ✅ Connection verification
- ✅ Test email sending

**Usage:**
```bash
node test-email.js
```

---

## 📖 Usage Examples

### Example 1: Full Testing Workflow

```bash
# Step 1: Generate credentials
node test-credentials-generator.js --login admin@company.com myPassword123

# Step 2: Run complete API tests
node test-complete-api.js

# Step 3: Check results
cat test-results.json

# Step 4: Run specific tests if needed
node test-gemini-tools.js
node test-mcp-server.js
```

### Example 2: Quick Authentication Test

```bash
# Generate token and save to config
node test-auth.js myemail@example.com mypassword

# Use token in API calls
node test-complete-api.js
```

### Example 3: Frontend UI Testing

1. Open browser: http://localhost:3000/test-credentials
2. Click "Generate Sample Credentials"
3. Copy IDs as needed for UI testing
4. Download JSON or .env file

### Example 4: CI/CD Pipeline

```bash
#!/bin/bash
# test-pipeline.sh

echo "🧪 Running CRM Test Suite"

# Generate credentials
node test-credentials-generator.js --login $TEST_EMAIL $TEST_PASSWORD

# Run tests
node test-complete-api.js

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ All tests passed"
  exit 0
else
  echo "❌ Tests failed"
  exit 1
fi
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in backend directory:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/crm

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Daily.co
DAILY_API_KEY=your-daily-api-key

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Server
PORT=5000
NODE_ENV=development
```

### Test Configuration

**test-config.json** (auto-generated):
```json
{
  "baseURL": "http://localhost:5000/api",
  "timeout": 10000,
  "credentials": {
    "client": { ... },
    "admin": { ... },
    "employee": { ... }
  },
  "companies": [ ... ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🐛 Troubleshooting

### Issue: "test-config.json not found"

**Solution:**
```bash
node test-credentials-generator.js --login your-email your-password
```

### Issue: "Token expired"

**Solution:**
```bash
# Regenerate token
node test-auth.js your-email@example.com your-password

# Or regenerate all credentials
node test-credentials-generator.js --login your-email your-password
```

### Issue: "User not found in MongoDB"

**Solution:**
1. Check if user exists in database
2. Create test users in Firebase Auth
3. Ensure user is synced to MongoDB

### Issue: "Invalid Firebase credentials"

**Solution:**
1. Verify email/password are correct
2. Check Firebase Auth console
3. Ensure 2FA is configured if required

### Issue: "API tests failing with 401"

**Solution:**
1. Check if token is expired
2. Regenerate token: `node test-auth.js email password`
3. Verify token is saved in test-config.json

### Issue: "Cannot connect to server"

**Solution:**
1. Start backend server: `npm start`
2. Verify server is running on port 5000
3. Check firewall settings

---

## 📊 Test Results

### test-results.json Structure

```json
{
  "timestamp": "2025-12-11T14:30:00Z",
  "summary": {
    "total": 25,
    "passed": 22,
    "failed": 2,
    "skipped": 1,
    "successRate": 91
  },
  "tests": [
    {
      "name": "Server health check",
      "passed": true,
      "details": "Status: OK"
    },
    {
      "name": "Get conversations",
      "passed": false,
      "details": "Error: 401 Unauthorized"
    }
  ]
}
```

---

## 🎯 Best Practices

### 1. Credential Management

- ✅ Use backend generator for real API testing
- ✅ Use frontend generator for UI testing only
- ✅ Regenerate tokens before they expire (1 hour)
- ✅ Never commit test-config.json to git
- ✅ Use .env file for sensitive data

### 2. Test Organization

- ✅ Run complete suite before commits
- ✅ Use specific tests for debugging
- ✅ Check test-results.json for CI/CD
- ✅ Document test failures

### 3. CI/CD Integration

- ✅ Store credentials in CI/CD secrets
- ✅ Run tests on every PR
- ✅ Fail builds on test failures
- ✅ Archive test-results.json

### 4. Security

- ✅ Never expose real tokens in logs
- ✅ Use test accounts, not production
- ✅ Rotate credentials regularly
- ✅ Add test files to .gitignore

---

## 📁 File Structure

```
CRM/backend/
├── test-credentials-generator.js  # Main credential generator
├── test-complete-api.js           # Complete API test suite
├── test-auth.js                   # Authentication tests
├── test-gemini-tools.js           # AI/Gemini tests
├── test-mcp-server.js             # MCP server tests
├── test-ai-health.js              # AI health checks
├── test-daily-api.js              # Daily.co API tests
├── test-email.js                  # Email service tests
├── test-credentials.json          # Generated credentials (gitignored)
├── test-config.json               # Test configuration (gitignored)
├── test-results.json              # Test results (gitignored)
└── test-api-template.js           # API test template (generated)

CRM/Client-web/
├── app/test-credentials/
│   └── page.js                    # Test credentials page
└── components/
    └── TestCredentialsGenerator.js # UI component
```

---

## 🔗 Related Documentation

- [API Documentation](./API_TROUBLESHOOTING.md)
- [Audio Calling Setup](./AUDIO_CALLS_SETUP.md)
- [Gemini AI Setup](./GEMINI_SETUP_CONFIRMED.md)
- [Escalation Flow](./ESCALATION_NOTIFICATION_FLOW.md)

---

## 📞 Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review test output logs
3. Verify environment variables
4. Check server logs

---

**Last Updated:** December 11, 2025

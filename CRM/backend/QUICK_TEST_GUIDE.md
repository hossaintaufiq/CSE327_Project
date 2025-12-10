# 🚀 Quick Test Guide

## For Developers Who Want to Run Tests NOW

### Option 1: Web UI (Fastest - Sample Credentials)

1. Start the frontend:
   ```bash
   cd CRM/Client-web
   npm run dev
   ```

2. Open browser: http://localhost:3000/test-credentials

3. Click "Generate Sample Credentials" button

4. Copy any IDs you need for testing

**Good for:** Frontend UI testing, quick mockups

**Not good for:** Real API testing (these are just samples)

---

### Option 2: Backend CLI (Real Credentials)

1. Make sure backend server is running:
   ```bash
   cd CRM/backend
   npm start
   ```

2. In another terminal, generate real credentials:
   ```bash
   cd CRM/backend
   node test-credentials-generator.js --login your-email@example.com your-password
   ```

3. Run all tests:
   ```bash
   npm test
   ```

**Good for:** Real API testing, CI/CD, integration tests

---

## 🎯 Common Test Commands

```bash
# Full API test suite
npm test

# Just authentication
npm run test:auth

# AI/Gemini tests
npm run test:ai
npm run test:gemini

# Server tests
npm run test:mcp

# External services
npm run test:email
npm run test:daily

# Generate credentials
npm run test:gen-creds -- --login email password
```

---

## 📊 Reading Test Results

After running `npm test`, check:

```bash
# View summary in terminal (colored output)
# OR view detailed results:
cat test-results.json
```

Example output:
```json
{
  "summary": {
    "total": 25,
    "passed": 22,
    "failed": 2,
    "skipped": 1,
    "successRate": 91
  }
}
```

---

## 🐛 If Tests Fail

1. **Check server is running:** `http://localhost:5000/api/health`
2. **Regenerate token:** `npm run test:auth -- email password`
3. **Check .env file:** Make sure all keys are set
4. **Read the error:** Test output shows exact failure reason

---

## 📖 Full Documentation

For complete details, see: [TEST_SUITE_README.md](./TEST_SUITE_README.md)

---

## ⚡ One-Line Full Test

```bash
# Generate credentials and run all tests
node test-credentials-generator.js --login email pass && npm test
```

Done! ✅

# Fix Backend Port Issue

## Problem
Backend server can't start because port 5000 is in use by another process (PID 6864).

## Solution Options

### Option 1: Kill the Process (Run as Administrator)
1. Open PowerShell **as Administrator**
2. Run:
```powershell
taskkill /F /PID 6864
```

### Option 2: Find and Close the Application
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to Details tab
3. Find PID 6864
4. Right-click → End Task

### Option 3: Use a Different Port
1. Edit `CRM/backend/.env`:
```env
PORT=5001
```

2. Edit `CRM/Client-web/utils/api.js` baseURL:
```javascript
const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
  // ...
});
```

3. Restart both servers

## After Fixing Port

1. **Start Backend:**
```powershell
cd CRM\backend
npm run dev
```

Wait for:
```
✅ Gemini AI configured
🚀 Server running on http://localhost:5000
```

2. **Start Frontend:**
```powershell
cd CRM\Client-web
npm run dev
```

3. **Test AI Assistant:**
   - Login → Navigate to AI Assistant
   - Try a simple prompt: "Hello"
   - Should get AI response

## If Still Getting 500 Error

Check backend terminal for specific error:
- Look for "[AI Request] Error:" messages
- Common issues:
  - `GEMINI_API_KEY not configured` → Add API key to .env
  - `429 Rate Limit` → Wait for quota reset
  - `403 Forbidden` → Check API key validity

The AI Assistant will work once the backend starts successfully!

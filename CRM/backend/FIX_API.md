# 🔧 Fix: API Not Working

## ✅ Backend Code is Correct

All backend code checks passed:
- ✅ API key configured
- ✅ Gemini service working
- ✅ Controller function exists
- ✅ Route registered
- ✅ All imports correct

## 🐛 Most Likely Issues:

### 1. Backend Server Not Running
**Solution:**
```bash
cd CRM/backend
npm run dev
```

**Look for:**
```
✅ Gemini AI configured
🚀 Server running on http://localhost:5000
```

### 2. Backend Server Needs Restart
After adding new routes/controllers, you MUST restart the server.

**Solution:**
1. Stop server (Ctrl+C)
2. Start again: `npm run dev`

### 3. Wrong API Endpoint Called
**Check:** Browser console (F12) for errors

**Expected endpoint:** `GET /api/ai/company/insights`

### 4. Authentication Issue
The endpoint requires:
- Firebase authentication token
- Company access (must be logged in with active company)

**Check:**
- Are you logged in?
- Do you have an active company selected?
- Are you a company admin?

### 5. CORS Issue
**Check:** Browser console for CORS errors

**Fix:** Make sure `CLIENT_ORIGIN` in backend `.env` includes your frontend URL

## 🔍 Diagnostic Steps:

### Step 1: Check Backend is Running
Open browser: `http://localhost:5000/api/ai/health`

**Expected response:**
```json
{
  "success": true,
  "data": {
    "ai": {
      "available": true,
      "model": "gemini-2.5-flash"
    }
  }
}
```

### Step 2: Check Browser Console
1. Open dashboard in browser
2. Press F12 → Console tab
3. Look for errors related to `/ai/company/insights`
4. Copy the exact error message

### Step 3: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try loading the dashboard
4. Look for request to `/api/ai/company/insights`
5. Check:
   - Status code (should be 200)
   - Request URL (should be correct)
   - Response (what error message?)

## 📋 Quick Fix Checklist:

- [ ] Backend server is running (`npm run dev`)
- [ ] Server shows `✅ Gemini AI configured`
- [ ] Server restarted after code changes
- [ ] Logged in as Company Admin
- [ ] Active company is selected
- [ ] Browser console checked for errors
- [ ] Network tab checked for failed requests

## 🎯 What to Share:

If still not working, share:
1. **Backend console output** (startup messages)
2. **Browser console error** (F12 → Console)
3. **Network request details** (F12 → Network → click on `/ai/company/insights` request)
4. **Response status code** (from Network tab)

---

**Most Common Fix:** Just restart the backend server! 🚀


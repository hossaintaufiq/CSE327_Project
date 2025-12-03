# 🔧 AI Insights API Troubleshooting

## ✅ Backend Status: ALL CHECKS PASSED

Your backend code is **correct and ready**:
- ✅ API key configured
- ✅ Gemini service working
- ✅ Controller function exists
- ✅ Route registered at `/api/ai/company/insights`

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot connect" or "Network Error"
**Cause:** Backend server is not running

**Fix:**
```bash
cd CRM/backend
npm run dev
```

**Check for these messages:**
```
✅ Gemini AI configured
🚀 Server running on http://localhost:5000
```

---

### Issue 2: "404 Not Found" 
**Cause:** Backend server needs restart after code changes

**Fix:**
1. Stop server: Press `Ctrl+C` in backend terminal
2. Start again: `npm run dev`
3. Wait for success messages
4. Refresh dashboard

---

### Issue 3: "401 Unauthorized" or "403 Forbidden"
**Cause:** Authentication issue

**Check:**
- Are you logged in?
- Do you have an active company selected?
- Are you logged in as **Company Admin**? (AI Insights only shows for company admins)

**Fix:**
- Log out and log back in
- Select a company if prompted
- Make sure you have company_admin role

---

### Issue 4: "500 Internal Server Error"
**Cause:** Server-side error

**Check:**
- Backend console for error messages
- Look for specific error details

**Common causes:**
- Missing API key (but we verified this is set)
- Database connection issue
- Invalid company data

---

### Issue 5: "CORS Error"
**Cause:** Frontend and backend on different ports

**Check:** 
- Backend `.env` file has: `CLIENT_ORIGIN=http://localhost:3000` (or your frontend port)

**Fix:**
Add to `CRM/backend/.env`:
```env
CLIENT_ORIGIN=http://localhost:3000
```

Then restart backend server.

---

## 🔍 Diagnostic Steps

### Step 1: Test Backend Health Endpoint
Open in browser: `http://localhost:5000/api/ai/health`

**Expected:**
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

**If this fails:** Backend server is not running or has errors.

---

### Step 2: Check Browser Console
1. Open dashboard in browser
2. Press **F12** → **Console** tab
3. Look for errors related to `/ai/company/insights`

**Common errors:**
- `Network Error` → Backend not running
- `401 Unauthorized` → Not logged in
- `404 Not Found` → Route not registered (restart server)
- `500 Error` → Check backend console

---

### Step 3: Check Network Tab
1. Open DevTools (F12) → **Network** tab
2. Refresh dashboard
3. Look for request: `/api/ai/company/insights`
4. Click on it to see:
   - **Status Code** (200 = success, 4xx/5xx = error)
   - **Request URL** (should be: `http://localhost:5000/api/ai/company/insights`)
   - **Response** (error message if failed)

---

### Step 4: Check Backend Console
Look at your backend terminal for:
- ✅ Success messages
- ❌ Error messages
- 🔍 Request logs

---

## 📋 Quick Fix Checklist

Run through this checklist:

- [ ] Backend server is running (`npm run dev`)
- [ ] Backend shows: `✅ Gemini AI configured`
- [ ] Backend shows: `🚀 Server running on http://localhost:5000`
- [ ] Backend server was restarted after code changes
- [ ] You are logged in
- [ ] You have an active company selected
- [ ] You are logged in as **Company Admin**
- [ ] Browser console checked (F12)
- [ ] Network tab checked (F12)
- [ ] Health endpoint works: `http://localhost:5000/api/ai/health`

---

## 🎯 Most Common Fix

**90% of issues are fixed by:**
1. Stopping backend server (Ctrl+C)
2. Starting it again (`npm run dev`)
3. Waiting for success messages
4. Refreshing the dashboard

---

## 📞 Still Not Working?

Please share:
1. **Exact error message** from browser console
2. **Status code** from Network tab (if visible)
3. **Backend console output** (any error messages?)
4. **Response body** from Network tab (click on the request → Response tab)

This will help me identify the exact issue!

---

## ✅ Quick Test

Run this test script to verify everything:
```bash
cd CRM/backend
node test-ai-insights.js
```

If all checks pass, the backend is fine - the issue is likely:
- Server not running
- Server needs restart
- Frontend connection issue


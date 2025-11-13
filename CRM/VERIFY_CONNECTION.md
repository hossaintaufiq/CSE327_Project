# How to Verify Frontend-Backend Connection

You now have multiple ways to verify if your frontend and backend are connected!

## ✅ Method 1: Browser-Based Verification (Easiest)

Open this URL in your browser (requires both frontend and backend running):
```
http://localhost:3000/connection-test.html
```

This will show:
- ✅ Backend health status
- ✅ CORS configuration
- ✅ Port availability
- 📊 Real-time test results

---

## ✅ Method 2: Next.js Verification Page

Open this URL in your browser:
```
http://localhost:3000/verify
```

This is a Next.js component that:
- Tests backend connectivity
- Shows detailed error messages
- Provides troubleshooting steps
- Displays debug information

---

## ✅ Method 3: Direct API Testing

### Test Backend is Running
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET
```

Expected response:
```json
{
    "status": "Backend is running ✅"
}
```

### Test CORS Configuration
```powershell
$headers = @{"Origin" = "http://localhost:3000"}
Invoke-WebRequest -Uri "http://localhost:5000/api/users" -Method OPTIONS -Headers $headers
```

---

## ✅ Method 4: Port Checking

### Check if Backend is Listening on Port 5000
```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

Expected output:
```
State       LocalPort OwningProcess
-----       --------- ----
LISTEN      5000      12345
```

### Check if Frontend is Listening on Port 3000
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

---

## ✅ Method 5: Browser Console Test

Open browser DevTools (F12) and run:

```javascript
// Test backend connection
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend Connected:', data))
  .catch(err => console.error('❌ Backend Error:', err))
```

---

## 🔍 What to Look For

### ✅ Connected (Everything Working)
- Backend responds with status code 200
- CORS headers are present
- No error messages in browser console
- Both ports 3000 and 5000 are listening
- `/api/health` endpoint returns `{"status": "Backend is running ✅"}`

### ❌ Connection Issues

**Error: "Unable to connect to the remote server"**
- Backend is not running
- Solution: `npm run dev` in `/backend` folder

**Error: CORS error in browser console**
- Backend CORS not configured for frontend URL
- Check `server.js` CORS settings
- Solution: Ensure `FRONTEND_URL=http://localhost:3000` in `.env`

**Error: Port 5000/3000 not listening**
- Application not started
- Solution: Start both frontend and backend

**Error: Connection timeout**
- Firewall blocking ports
- Solution: Allow ports 3000 and 5000 in firewall

---

## 🚀 Full Setup Checklist

- [ ] Backend running: `npm run dev` in `/backend`
- [ ] Frontend running: `npm run dev` in `/Client-Web`
- [ ] Backend on port 5000
- [ ] Frontend on port 3000
- [ ] `.env.local` has `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api`
- [ ] No CORS errors in browser console
- [ ] Health endpoint returns 200 status
- [ ] Can access `/verify` page in browser

---

## 📍 URLs Reference

| Service | URL |
|---------|-----|
| Backend Health | http://localhost:5000/api/health |
| Frontend Home | http://localhost:3000 |
| Connection Test HTML | http://localhost:3000/connection-test.html |
| Connection Test React | http://localhost:3000/verify |
| API Base | http://localhost:5000/api |

---

## 🎯 Testing API Endpoints

### Register User (Test Frontend-Backend Integration)
```powershell
$body = @{
    firebaseUid = "test-uid-123"
    email = "test@example.com"
    name = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/users/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body
```

---

## ✨ All Connected? What's Next?

1. ✅ Test authentication by logging in via Firebase
2. ✅ Verify user data syncs to backend
3. ✅ Check dashboard page loads
4. ✅ Test API calls from frontend pages
5. ✅ Start building features!

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not responding | Check if `npm run dev` is running in terminal |
| CORS error | Verify `.env` has correct `FRONTEND_URL` |
| Port already in use | Kill process: `netstat -ano \| findstr :5000` |
| 404 Not Found | Verify correct API endpoint URL |
| Authentication fails | Check `FIREBASE_ADMIN_KEY` in backend `.env` |


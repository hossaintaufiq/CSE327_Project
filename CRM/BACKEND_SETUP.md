## Backend Setup Guide

The backend is now running successfully on `http://localhost:5000` 🚀

### Current Status:
- ✅ Express server running on port 5000
- ✅ MongoDB connected
- ✅ CORS configured for frontend (localhost:3000)
- ⚠️ Firebase Admin Key not configured (optional for basic testing)

### Available Endpoints:

#### Health Check
```
GET http://localhost:5000/api/health
```

#### User Routes
```
POST http://localhost:5000/api/users/register
Body: { firebaseUid, email, name, companyId?, role? }

GET http://localhost:5000/api/users/me
Headers: Authorization: Bearer <token>

GET http://localhost:5000/api/users
Headers: Authorization: Bearer <token>
(Admin only)

PUT http://localhost:5000/api/users/:id
Headers: Authorization: Bearer <token>
Body: { name?, email?, role? }
```

### To Enable Firebase Authentication:

1. Get your Firebase Admin SDK credentials:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Copy the entire JSON object

2. Add to `.env`:
```
FIREBASE_ADMIN_KEY={"type":"service_account",...}
```

3. Restart the server: Press `rs` in terminal and Enter

### Testing the API:

Using curl or Postman:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Register a user (requires valid firebaseUid from Firebase)
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "your_firebase_uid",
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

### Frontend Connection:

Your `.env.local` is already configured with:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api
```

The frontend can now call backend endpoints using the `userAPI` helper:
```javascript
import { userAPI } from "@/utils/api";

// Get user profile
const profile = await userAPI.getProfile();

// Register new user
await userAPI.register({ firebaseUid, email, name });

// Get all users
const users = await userAPI.getAll();

// Update user
await userAPI.update(userId, { name: "New Name" });
```

### Next Steps:

1. Configure Firebase Admin credentials for full authentication
2. Start the frontend: `npm run dev` in `/Client-Web`
3. Test the full flow: Login → Sync with backend → Access protected routes

### Troubleshooting:

If you see "FIREBASE_ADMIN_KEY not set" warning:
- This is expected if Firebase isn't configured yet
- Protected routes will return 500 error
- Add Firebase credentials to `.env` to enable auth

If you see "Cannot connect to backend":
- Ensure backend is running on port 5000
- Check FRONTEND_URL is correct in backend `.env`
- Verify CORS configuration in `server.js`

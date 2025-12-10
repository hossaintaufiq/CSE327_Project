# Audio/Video Call Setup Guide

## Overview
The CRM system supports real-time audio/video calls between clients and representatives using Daily.co service.

## Current Status
⚠️ **Payment Required**: Daily.co requires a paid subscription to activate the calling service.

## Features (Ready to Use After Payment)
- ✅ Audio-only calls between clients and representatives
- ✅ Real-time call notifications via Socket.IO
- ✅ Call accept/reject functionality
- ✅ Incoming call popup with ringtone
- ✅ Full call room management
- ✅ Call history and metadata tracking

## Setup Instructions

### Step 1: Get Daily.co API Key
1. Go to https://dashboard.daily.co
2. Sign up or log in
3. Navigate to **Developers** section
4. Copy your API key

### Step 2: Configure Backend
1. Open `.env` file in the `backend` directory
2. Update the `DAILY_API_KEY` value:
   ```env
   DAILY_API_KEY=your-actual-api-key-from-daily-co
   ```
3. Restart the backend server:
   ```bash
   npm run dev
   ```

### Step 3: Verify Setup
1. Run the test script to verify the API key:
   ```bash
   node test-daily-api.js
   ```
2. You should see: `✅ Daily.co API key is valid!`

## How It Works

### For Clients
1. Navigate to the conversations page
2. Select an active conversation with a representative
3. Click the phone icon to initiate a call
4. Wait for the representative to accept

### For Representatives
1. When a client calls, an incoming call notification appears
2. Click "Accept" to join the call
3. Click "Decline" to reject the call
4. Representatives can also initiate calls to clients

### Call Flow
```
Client clicks "Call" 
  → Backend creates Daily.co room
  → Socket.IO notifies representative
  → Representative gets popup with ringtone
  → Representative accepts/rejects
  → Both join the call room
  → Audio-only communication begins
```

## Technical Details

### Backend Endpoints
- `POST /api/audio-calls/:conversationId/create` - Create a new call room
- `GET /api/audio-calls/:conversationId/token` - Get token to join existing call
- `POST /api/audio-calls/:conversationId/end` - End an active call

### Frontend Components
- `AudioCallModal.js` - Main call interface
- `IncomingCallNotification.js` - Incoming call popup with ringtone

### Socket.IO Events
- `call:incoming` - Emitted when a call is initiated
- `call:rejected` - Emitted when a call is rejected

## Pricing
Daily.co offers various pricing tiers:
- **Free**: 10 minutes total (for testing only)
- **Starter**: $9/month for 1,000 minutes
- **Pro**: Custom pricing for higher usage

Visit https://www.daily.co/pricing for current pricing details.

## Troubleshooting

### Error: "Audio call service requires payment setup"
- The Daily.co API key needs to be from a paid account
- Sign up for a paid plan at https://dashboard.daily.co

### Error: "Unable to connect to call service"
- Check your internet connection
- Verify firewall settings allow connections to `c.daily.co`
- Check if Daily.co services are operational

### Error: "Authentication error"
- Refresh the page and log in again
- Clear browser cache and cookies
- Check if your session has expired

## Development Notes

### Testing Without Payment
The system gracefully handles the unavailable service:
- Shows clear error messages to users
- Logs detailed information for debugging
- All infrastructure remains in place for quick activation

### Production Deployment
1. Ensure `DAILY_API_KEY` is set in production environment variables
2. Update `CLIENT_ORIGIN` to match your production domain
3. Configure proper HTTPS for secure WebRTC connections
4. Monitor Daily.co usage via their dashboard

## Support
For Daily.co specific issues, visit:
- Documentation: https://docs.daily.co
- Support: https://help.daily.co
- Status: https://status.daily.co

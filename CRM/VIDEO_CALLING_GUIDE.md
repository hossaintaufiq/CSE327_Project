# Video Calling Feature - Implementation Guide

## Overview
Client-to-representative video calling feature using Daily.co for conversations.

## Features
- ✅ Video calls only available when representative is assigned
- ✅ Hidden when AI is handling the conversation
- ✅ Full video/audio controls (mute, camera toggle, screen share)
- ✅ Secure token-based authentication
- ✅ Auto-cleanup of call rooms

## Architecture

### Backend Components

#### 1. **Controller** (`backend/src/controllers/videoCallController.js`)
- `createCallRoom()` - Creates Daily.co room and generates tokens
- `getCallToken()` - Gets token for joining existing call
- `endCall()` - Ends call and cleans up room

#### 2. **Routes** (`backend/src/routes/videoCallRoutes.js`)
```
POST   /api/video-calls/:conversationId/create
GET    /api/video-calls/:conversationId/token
POST   /api/video-calls/:conversationId/end
```

#### 3. **Environment Variable**
```env
DAILY_API_KEY=your-daily-api-key
```

### Frontend Components

#### 1. **VideoCallModal** (`Client-web/components/VideoCallModal.js`)
React component with Daily.co iframe integration:
- Audio/video controls
- Screen sharing
- Participant management
- Connection state handling

#### 2. **Client Page** (`Client-web/app/conversations/page.js`)
- Call button only shows when representative is assigned
- Hidden when AI is active
- Shows "Talk to Human" button when AI is active

#### 3. **Dashboard Page** (`Client-web/app/dashboard/conversations/[conversationId]/page.js`)
- Representatives can start calls with clients
- Call button only shows when representative is assigned to conversation

## How It Works

### 1. Client Initiates Call
```javascript
// Client clicks video call button
handleStartCall() {
  // Check if representative is assigned
  if (!conversation.assignedRepresentative) {
    alert('Video calls only available with representative');
    return;
  }
  
  // Create Daily.co room
  POST /api/video-calls/:conversationId/create
  
  // Receive token and room URL
  // Open VideoCallModal
}
```

### 2. Representative Joins
```javascript
// Representative clicks call button
handleStartCall() {
  // Create or join existing room
  POST /api/video-calls/:conversationId/create
  
  // Receive token
  // Open VideoCallModal
}
```

### 3. Call Ends
```javascript
handleCloseCall() {
  // End call
  POST /api/video-calls/:conversationId/end
  
  // Daily.co room is deleted
  // Cleanup metadata from conversation
}
```

## Daily.co Configuration

### Room Properties
- **max_participants**: 2 (client + representative)
- **enable_screenshare**: true
- **enable_chat**: false (using CRM chat)
- **enable_knocking**: false
- **enable_prejoin_ui**: false
- **expiration**: 1 hour

### Token Properties
- **room_name**: `conversation-{conversationId}-{timestamp}`
- **user_name**: Client or Representative name
- **is_owner**: true (both participants)
- **expiration**: 1 hour

## UI/UX Flow

### Client Side
1. **AI Active (No Representative)**
   - ❌ Video call button hidden
   - ✅ "Talk to Human" button visible
   
2. **Representative Assigned**
   - ✅ Video call button visible
   - ❌ "Talk to Human" button hidden
   
3. **Conversation Resolved/Closed**
   - ❌ Video call button hidden

### Representative Side
1. **No Assignment**
   - ❌ Video call button hidden
   
2. **Assigned to Conversation**
   - ✅ Video call button visible
   
3. **Conversation Resolved/Closed**
   - ❌ Video call button hidden

## Security

### Authentication
- Firebase token required for all endpoints
- User must be part of conversation (client OR assigned representative)
- Tokens are unique per user and expire in 1 hour

### Authorization
- Clients can only call their own conversations
- Representatives can only call conversations assigned to them
- Super admins cannot join calls (privacy)

## Error Handling

### Client Errors
```javascript
// No representative assigned
"Calls are only available when talking with a representative"

// Failed to create room
"Failed to start video call"

// Connection error
"Failed to connect to call"
```

### Backend Errors
```javascript
// Conversation not found
404: "Conversation not found"

// Unauthorized
403: "You are not authorized to create a call for this conversation"

// AI active
400: "Calls are only available when talking with a representative"

// Server error
500: "Failed to create video call room"
```

## Testing

### Prerequisites
1. Get Daily.co API key from https://dashboard.daily.co/
2. Add to `.env`: `DAILY_API_KEY=your-key-here`
3. Install packages: `npm install` (frontend + backend)

### Test Flow
1. **Client Login**
   ```
   - Go to /conversations
   - Create new conversation
   - Send message
   - Should see "Talk to Human" button
   - No video call button
   ```

2. **Request Representative**
   ```
   - Click "Talk to Human"
   - Status changes to "pending_representative"
   ```

3. **Admin Assigns Representative**
   ```
   - Go to /dashboard/conversations
   - Click conversation
   - Click "Assign"
   - Select representative
   - Status changes to "with_representative"
   ```

4. **Start Video Call**
   ```
   CLIENT SIDE:
   - Video call button now visible
   - Click video button
   - Modal opens with Daily.co iframe
   
   REPRESENTATIVE SIDE:
   - Video call button visible
   - Click "Call" button
   - Modal opens
   - Both see each other
   ```

5. **Call Controls**
   ```
   - Mute/unmute microphone
   - Toggle camera on/off
   - Share screen
   - Leave call (red button)
   ```

## Troubleshooting

### Call button not showing
- ✅ Check conversation has assignedRepresentative
- ✅ Check conversation status is not 'resolved' or 'closed'
- ✅ Check conversation status is not 'active' (AI mode)

### "Failed to create video call room"
- ✅ Check DAILY_API_KEY in .env
- ✅ Check Daily.co API key is valid
- ✅ Check network connectivity

### "Failed to connect to call"
- ✅ Check browser permissions (camera/microphone)
- ✅ Check Daily.co service status
- ✅ Check token expiration (1 hour max)

### Video/audio not working
- ✅ Check browser permissions
- ✅ Check camera/microphone hardware
- ✅ Try different browser
- ✅ Check firewall settings

## Future Enhancements

1. **Call Recording**
   - Record calls for quality assurance
   - Store in cloud storage
   - Playback in conversation history

2. **Call Analytics**
   - Track call duration
   - Call quality metrics
   - Connection statistics

3. **Call Queue**
   - Multiple clients waiting
   - Representative availability status
   - Estimated wait time

4. **Call Notifications**
   - Push notifications for incoming calls
   - Email notifications
   - SMS notifications

5. **Multi-party Calls**
   - Add multiple representatives
   - Team consultations
   - Screen sharing with annotations

## Dependencies

### Frontend
```json
{
  "@daily-co/daily-js": "^0.73.0"
}
```

### Backend
```json
{
  "@daily-co/daily-js": "^0.73.0"
}
```

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/video-calls/:conversationId/create` | Required | Create new call room |
| GET | `/api/video-calls/:conversationId/token` | Required | Get token for existing room |
| POST | `/api/video-calls/:conversationId/end` | Required | End call and cleanup |

## Component Props

### VideoCallModal
```typescript
interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callToken: string | null;
  roomUrl: string | null;
  conversationId: string;
}
```

## Event Handlers

### VideoCallModal Events
- `joined-meeting` - User joined call
- `participant-joined` - Other person joined
- `participant-updated` - Participant state changed
- `participant-left` - Other person left
- `left-meeting` - User left call
- `error` - Connection error

## Best Practices

1. **Always check representative assignment** before showing call button
2. **Handle errors gracefully** with user-friendly messages
3. **Clean up rooms** after calls end (prevent quota issues)
4. **Validate tokens** server-side for security
5. **Test with real users** on different networks/devices

## Support

For issues with:
- Daily.co integration → https://docs.daily.co/
- CRM backend → Check backend logs
- Frontend issues → Check browser console

---

**Status**: ✅ Fully implemented and tested
**Version**: 1.0.0
**Last Updated**: December 10, 2025

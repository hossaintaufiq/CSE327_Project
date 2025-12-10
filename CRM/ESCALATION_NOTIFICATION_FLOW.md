# Escalation Notification Flow

## Overview
When a client requests human assistance in a conversation, the system automatically notifies all company admins and managers.

## Flow Diagram

```
Client Chat → "Request Representative" Button → Backend Escalation → Admin Notifications
```

## Step-by-Step Process

### 1. Client Action (Frontend)
**File**: `CRM/Client-web/app/conversations/page.js`

When client clicks "Request Representative" button:
```javascript
const handleRequestRepresentative = async () => {
  const res = await api.post(`/conversations/${selectedConversation._id}/escalate`);
  // Shows system message: "Your request has been escalated to a human representative"
}
```

### 2. API Endpoint (Backend)
**File**: `CRM/backend/src/routes/conversationRoutes.js`
```javascript
router.post('/:conversationId/escalate', escalateConversation);
```

### 3. Controller Layer
**File**: `CRM/backend/src/controllers/conversationController.js`
```javascript
export const escalateConversation = async (req, res, next) => {
  const { conversationId } = req.params;
  const { reason } = req.body;
  
  const conversation = await conversationService.escalateConversation(
    conversationId,
    reason || 'Client requested human assistance'
  );
}
```

### 4. Service Layer - Notification Creation
**File**: `CRM/backend/src/services/conversationService.js`

```javascript
export async function escalateConversation(conversationId, reason, representativeId = null) {
  const conversation = await Conversation.findById(conversationId);
  await conversation.escalateToRepresentative(reason, representativeId);
  
  // ✅ NOTIFY COMPANY ADMINS & MANAGERS
  if (!representativeId) {
    const companyUsers = await User.find({
      'companies.companyId': conversation.companyId,
      'companies.role': { $in: ['company_admin', 'manager'] },
      'companies.isActive': true,
    });
    
    for (const user of companyUsers) {
      await createNotification({
        userId: user._id,
        companyId: conversation.companyId,
        type: 'general',
        title: 'Conversation Needs Attention',
        message: `A customer conversation requires human assistance. Reason: ${reason}`,
        priority: 'high',
      });
    }
  }
}
```

### 5. Notification Service
**File**: `CRM/backend/src/services/notificationService.js`

Creates notification in database and can send emails:
```javascript
export const createNotification = async (notificationData) => {
  const notification = new Notification(notificationData);
  await notification.save();
  console.log(`🔔 Notification created: ${notification._id}`);
  return notification;
}
```

## Notification Details

### Recipients
- ✅ All **Company Admins**
- ✅ All **Managers** 
- ❌ Regular employees (not notified unless specifically assigned)

### Notification Properties
- **Type**: `general`
- **Title**: "Conversation Needs Attention"
- **Message**: "A customer conversation requires human assistance. Reason: {reason}"
- **Priority**: `high` (appears at top of notification list)
- **Company Context**: Includes `companyId` for multi-company filtering

### Default Reason
If no reason is provided, defaults to: `"Client requested human assistance"`

## Admin View

### Notification Page
**File**: `CRM/Client-web/app/notifications/page.js`

Admins can view notifications at: `/notifications`

The notification will show:
- 🔔 Bell icon for general notifications
- High priority badge
- "Conversation Needs Attention" title
- Escalation reason
- Timestamp

### Conversation Dashboard
**File**: `CRM/Client-web/app/dashboard/page.js`

Admins can also see escalated conversations in:
- Company conversation list
- Filtered by status: `pending_representative`
- Shows yellow/amber color indicator

## Status Changes

### Conversation Status Flow
1. **active** - AI chatbot handling
2. **pending_representative** - Client requested human help (TRIGGERS NOTIFICATION)
3. **with_representative** - Assigned to specific admin/manager/employee

### Visual Indicators
```javascript
const statusColors = {
  active: "bg-green-500/20 text-green-400",           // AI active
  pending_representative: "bg-yellow-500/20 text-yellow-400",  // Needs attention
  with_representative: "bg-green-500/20 text-green-400",       // Human assigned
  resolved: "bg-gray-500/20 text-gray-400",           // Closed
};
```

## Testing the Flow

### As a Client:
1. Go to `/conversations`
2. Start a conversation with a company
3. Chat with AI
4. Click "Request Representative" button
5. See system message confirming escalation

### As an Admin:
1. Go to `/notifications`
2. See high-priority notification: "Conversation Needs Attention"
3. Click notification to view conversation
4. Assign yourself or another representative
5. Start responding to client

## Database Schema

### Notification Model
**File**: `CRM/backend/src/models/Notification.js`

```javascript
{
  userId: ObjectId,           // Admin/Manager receiving notification
  companyId: ObjectId,        // Company context
  type: 'general',            // Notification type
  title: String,              // "Conversation Needs Attention"
  message: String,            // Escalation reason
  priority: 'high',           // Priority level
  read: false,                // Initially unread
  createdAt: Date,
  metadata: {
    conversationId: ObjectId  // Link to conversation
  }
}
```

### Conversation Model
**File**: `CRM/backend/src/models/Conversation.js`

```javascript
{
  status: 'pending_representative',  // Updated on escalation
  escalationReason: String,          // Reason provided
  escalatedAt: Date,                 // Timestamp
  assignedRepresentative: null,      // Not yet assigned
}
```

## Additional Features

### Email Notifications (Optional)
The notification service supports email notifications:
- Configurable per admin in settings
- Sends email alert when conversation escalated
- Contains link to conversation

### Real-time Updates (Socket.io)
If Socket.io is implemented:
- Real-time notification popup
- Live conversation list updates
- Instant badge count updates

## Summary

✅ **Fully Implemented**: When a client asks AI to connect to a human/representative:
1. Conversation status changes to `pending_representative`
2. All company admins and managers receive **high-priority notifications**
3. Notification includes escalation reason
4. Admins can view in notification center
5. Admins can assign themselves or others to the conversation

# Conversation Data Model Reference

## Quick Field Reference

When working with conversation data from the API, use these field names:

### Conversation Object Fields
```javascript
{
  _id: String,                    // Conversation ID
  title: String,                  // Conversation title/subject
  companyId: {                    // Company reference (populated)
    _id: String,
    name: String,
    domain: String
  },
  type: String,                   // Conversation type (see enum below)
  status: String,                 // Conversation status (see enum below)
  assignedRepresentative: {       // Assigned user (populated, optional)
    _id: String,
    name: String,
    email: String
  },
  messages: Array,                // Array of message objects
  lastActivity: Date,             // Last message timestamp
  createdAt: Date,                // Creation timestamp
  updatedAt: Date                 // Last update timestamp
}
```

## Type Enum Values
```javascript
const CONVERSATION_TYPES = [
  'inquiry',      // Customer inquiries
  'order',        // Order-related conversations
  'complaint',    // Customer complaints
  'general',      // General questions
  'support'       // Technical support
];
```

## Status Enum Values
```javascript
const CONVERSATION_STATUS = [
  'active',                    // AI is handling (blue)
  'pending_representative',    // Needs human assignment (yellow)
  'with_representative',       // Assigned to human (green)
  'resolved',                  // Issue resolved (gray)
  'closed'                     // Conversation closed (dark gray)
];
```

## Common Mistakes to Avoid

### ❌ WRONG
```javascript
conv.subject                    // Field doesn't exist
conv.company.name              // Field is 'companyId', not 'company'
conv.conversationType          // Field is 'type', not 'conversationType'
conv.representative            // Field is 'assignedRepresentative'
status === "ai_handling"       // Status value is 'active'
status === "waiting_representative"  // Status value is 'pending_representative'
```

### ✅ CORRECT
```javascript
conv.title                     // Use 'title' for subject
conv.companyId.name           // Use 'companyId' for company reference
conv.type                     // Use 'type' for conversation type
conv.assignedRepresentative   // Use 'assignedRepresentative' for assigned user
status === "active"           // Use 'active' for AI-handled conversations
status === "pending_representative"  // Use 'pending_representative' for unassigned
```

## Message Object Structure
```javascript
{
  _id: String,
  content: String,
  senderType: String,  // 'client', 'ai', 'representative', 'system'
  senderId: String,    // User ID (if applicable)
  createdAt: Date
}
```

## API Endpoints

### Get Client Conversations
```javascript
GET /api/conversations/my-conversations
Response: { conversations: [...], total: Number }
```

### Get Company Conversations (Employees/Admins)
```javascript
GET /api/conversations/company/list
Response: { conversations: [...], total: Number }
```

### Get Single Conversation
```javascript
GET /api/conversations/:conversationId
Response: { conversation: {...} }
```

## Frontend Display Examples

### Display Conversation in List
```javascript
<div>
  <h3>{conv.title}</h3>
  <p>{conv.companyId?.name}</p>
  <span className={statusColors[conv.status]}>
    {conv.status.replace(/_/g, ' ')}
  </span>
  <span>{conversationTypes[conv.type]?.label}</span>
</div>
```

### Display Message Sender Name
```javascript
const getSenderName = (message, conversation) => {
  if (message.senderType === 'ai') return 'AI Assistant';
  if (message.senderType === 'representative') {
    return conversation.assignedRepresentative?.name || 'Representative';
  }
  if (message.senderType === 'client') return 'Client';
  return 'System';
};
```

### Check if Conversation Needs Human
```javascript
const needsHuman = conv.status === 'active';
const hasRepresentative = conv.status === 'with_representative';
const isPending = conv.status === 'pending_representative';
```

## Status Color Mapping
```javascript
const statusColors = {
  active: "bg-blue-500/20 text-blue-400",
  pending_representative: "bg-yellow-500/20 text-yellow-400",
  with_representative: "bg-green-500/20 text-green-400",
  resolved: "bg-gray-500/20 text-gray-400",
  closed: "bg-gray-600/20 text-gray-500"
};
```

## Type Icon Mapping
```javascript
import { HelpCircle, Package, AlertCircle, MessageSquare, User } from 'lucide-react';

const conversationTypes = {
  inquiry: { label: "Inquiry", icon: HelpCircle, color: "blue" },
  order: { label: "Order", icon: Package, color: "green" },
  complaint: { label: "Complaint", icon: AlertCircle, color: "red" },
  general: { label: "General", icon: MessageSquare, color: "gray" },
  support: { label: "Support", icon: User, color: "purple" }
};
```

## Filtering Examples

### Filter by Status
```javascript
const activeConversations = conversations.filter(c => c.status === 'active');
const pendingConversations = conversations.filter(c => c.status === 'pending_representative');
```

### Filter by Type
```javascript
const orderConversations = conversations.filter(c => c.type === 'order');
const supportConversations = conversations.filter(c => c.type === 'support');
```

### Search by Title or Company
```javascript
const filtered = conversations.filter(conv =>
  conv.title?.toLowerCase().includes(query.toLowerCase()) ||
  conv.companyId?.name?.toLowerCase().includes(query.toLowerCase())
);
```

## Role-Based Access

### Client View
- Access: `/conversations` page
- Can see: Only their own company's conversations
- Cannot: Assign representatives, close conversations

### Employee View
- Access: `/conversations` page
- Can see: Conversations assigned to them
- Can: Respond to messages, update status

### Manager/Admin View
- Access: `/dashboard/conversations` page (admin management)
- Can see: All company conversations
- Can: Assign representatives, manage all conversations, change status

## Notes
- Always check if populated fields exist before accessing nested properties (use optional chaining: `?.`)
- Backend populates `companyId` and `assignedRepresentative` automatically
- Status transitions: `active` → `pending_representative` → `with_representative` → `resolved` → `closed`
- Type field is required and cannot be changed after creation

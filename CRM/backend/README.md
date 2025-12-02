# CRM Backend

Express.js backend for the SaaS CRM platform with MongoDB and Firebase Admin.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```
PORT=5000
MONGO_URI=mongodb+srv://hossainahmmedtaufiq22_db_user:hossainahmmed12345@user.9b6agx4.mongodb.net/?appName=User
FIREBASE_PROJECT_ID=crmprime-fcd64
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@crmprime-fcd64.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_ORIGIN=http://localhost:3000

# AI Features (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Voice Chat (Daily.co - free tier: 2000 mins/month)
DAILY_API_KEY=your_daily_api_key
```

3. Run server:
```bash
npm run dev
```

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Pipeline Management
- `GET /api/pipeline/config` - Get all pipeline configurations
- `GET /api/pipeline/dashboard` - Get dashboard summary
- `GET /api/pipeline/:type/summary` - Get pipeline summary by type
- `POST /api/pipeline/:type/:entityId/move` - Move entity to stage
- `GET /api/pipeline/approvals/pending` - Get pending approvals (admin)
- `POST /api/pipeline/approvals/:id` - Process approval (admin)

### Voice Chat (Daily.co)
- `GET /api/voice-chat/status` - Check if voice chat is enabled
- `POST /api/voice-chat/call` - Initiate a call
- `POST /api/voice-chat/group-call` - Create group call
- `POST /api/voice-chat/call/:roomName/answer` - Answer call
- `POST /api/voice-chat/call/:roomName/decline` - Decline call
- `DELETE /api/voice-chat/rooms/:roomName` - End call

### AI Features (Gemini)
- `POST /api/ai/generate` - Generate text
- `POST /api/ai/summarize` - Summarize content
- `POST /api/ai/projects/:id/suggest-tasks` - Suggest tasks for project
- `POST /api/ai/clients/:id/email-draft` - Generate email draft
- `GET /api/ai/clients/:id/analyze` - Analyze client
- `POST /api/ai/smart-search` - AI-powered search

## Super Admin

Pre-created Super Admin:
- Email: `hossainahmmedtaufiq22@gmail.com`
- Password: `Ahmmed12345!`
- Role: `super_admin`

## Features

- Firebase Admin SDK integration
- MongoDB with Mongoose
- Role-based access control
- Multi-tenant support
- JWT token verification
- **Pipeline Management** - Lead, Order, Project, Task pipelines with admin approvals
- **Voice/Video Chat** - Real-time calls using Daily.co
- **AI Features** - Smart suggestions, email drafts, client analysis using Gemini
- **Live Chat** - Real-time messaging with Socket.io
- **MCP Server** - Model Context Protocol for AI tool integration

## Getting API Keys

### Daily.co (Voice Chat)
1. Sign up at https://www.daily.co/
2. Go to Developers → API Keys
3. Copy the API key to `DAILY_API_KEY`
4. Free tier: 2,000 participant minutes/month

### Google Gemini (AI Features)
1. Go to https://aistudio.google.com/
2. Get API key from API Keys section
3. Copy to `GEMINI_API_KEY`

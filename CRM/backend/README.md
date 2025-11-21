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


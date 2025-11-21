# CRM SaaS Project Structure

## 📁 Backend (`backend/`)

### Configuration
- `server.js` - Main Express server entry point
- `src/config/db.js` - MongoDB connection
- `src/config/firebaseAdmin.js` - Firebase Admin SDK initialization

### Models
- `src/models/User.js` - User model with roles (super_admin, company_admin, employee)
- `src/models/Company.js` - Company model for multi-tenant support

### Controllers
- `src/controllers/authController.js` - Authentication logic (signup, login, getMe)

### Routes
- `src/routes/authRoutes.js` - Authentication API routes

### Middleware
- `src/middleware/auth.js` - Firebase token verification
- `src/middleware/roleCheck.js` - Role-based access control (superAdminOnly, companyAdminOnly, employeeOnly)
- `src/middleware/companyAccess.js` - Multi-tenant company access verification
- `src/middleware/errorHandler.js` - Global error handler

## 📁 Frontend (`Client-web/`)

### Configuration
- `lib/firebase.js` - Firebase JS SDK initialization
- `utils/api.js` - Axios API client with auth token injection

### Pages
- `app/page.js` - Home page (redirects to login/dashboard)
- `app/login/page.js` - Login page
- `app/signup/page.js` - Signup page
- `app/dashboard/page.js` - Dashboard with role-based content

### Middleware
- `middleware/auth.js` - Client-side auth hook

## 🔐 Authentication Flow

1. **Signup**: User signs up → Firebase Auth creates user → Backend creates DB record → Returns custom token → Frontend signs in
2. **Login**: User logs in → Firebase Auth verifies → Frontend gets ID token → Backend verifies token → Returns user data
3. **Protected Routes**: Token verified on each request → Role checked → Company access verified

## 👥 Roles

- **Super Admin**: Full platform access (pre-created: hossainahmmed22@gmail.com)
- **Company Admin**: Manages their company (created when user provides companyName)
- **Employee**: Limited access (default for users without companyName)

## 🏢 Multi-Tenant Support

- Each company has isolated data via `companyId`
- Users belong to one company (except Super Admin)
- All data queries filtered by `companyId`
- Super Admin can access all companies

## 🚀 Getting Started

### Backend
```bash
cd backend
npm install
# Create .env file with MongoDB and Firebase credentials
npm run dev
```

### Frontend
```bash
cd Client-web
npm install
# Create .env.local with API URL
npm run dev
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `CLIENT_ORIGIN` - Frontend URL

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL


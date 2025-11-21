# CRM Client Web

Next.js frontend for the SaaS CRM platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Pages

- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Dashboard (role-based content)

## Features

- Firebase Authentication
- Role-based routing
- Multi-tenant support
- Protected routes


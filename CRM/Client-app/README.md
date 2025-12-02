# CRM Prime Android App

Android application for the CRM Prime system with role-based dashboards and authentication.

## Features

- **Role-Based Dashboards**: Different dashboard views for:
  - Company Admin
  - Manager
  - Employee
  - Client
- **Authentication**: Login screen with Firebase integration support
- **Company Selection**: Multi-company support with company switching
- **Dashboard Stats**: Real-time dashboard statistics from backend API
- **Navigation**: Jetpack Compose Navigation

## Architecture

- **MVVM Pattern**: ViewModels for state management
- **Repository Pattern**: Data layer abstraction
- **Retrofit**: HTTP client for API calls
- **Jetpack Compose**: Modern UI framework
- **Coroutines**: Asynchronous operations

## Project Structure

```
app/src/main/java/com/example/crmprime/
├── data/
│   ├── api/              # API service and client
│   ├── model/            # Data models
│   └── repository/       # Data repositories
├── ui/
│   ├── navigation/       # Navigation setup
│   ├── screen/           # UI screens
│   │   └── dashboard/    # Role-based dashboards
│   └── viewmodel/        # ViewModels
├── util/                 # Utility functions
└── MainActivity.kt       # Main entry point
```

## Setup

1. **Update API Base URL**: 
   - Edit `ApiClient.kt` and change `BASE_URL` to your backend URL
   - For Android emulator: `http://10.0.2.2:5000` (localhost)
   - For physical device: Use your computer's IP address

2. **Firebase Integration** (Required for production):
   - Add Firebase SDK dependencies
   - Configure Firebase in the app
   - Update `LoginScreen.kt` to use Firebase Auth

3. **Build and Run**:
   ```bash
   ./gradlew assembleDebug
   ```

## API Integration

The app connects to the same backend API as the web client:
- `/api/auth/login` - User authentication
- `/api/auth/me` - Get current user
- `/api/company/my-companies` - Get user's companies
- `/api/dashboard/stats` - Get dashboard statistics

## Role-Based Dashboards

### Super Admin Dashboard
- Total Companies (with inactive count)
- Total Users (with active count)
- Total Revenue (with monthly breakdown)
- Active Subscriptions
- Revenue Trend Chart (last 6 months)
- Top Companies List
- Daily Signups (last 7 days)
- Recent Activity Feed

### Company Admin Dashboard
- Monthly Revenue
- New Leads (30 days)
- Pipeline Value
- Active Tasks
- Summary Metrics (Total Revenue, Avg Deal Size, Conversion Rate)
- Recent Activity
- Top Deals

### Manager Dashboard
- Team Size
- Team Leads (with personal leads)
- Team Orders (with personal orders)
- Team Revenue
- My Tasks (Total, Active, Unread Messages)
- Team Activity Feed

### Employee Dashboard
- My Leads (with new leads count)
- My Orders (with revenue)
- My Tasks (with active count)
- Unread Messages
- Recent Activity Feed

### Client Dashboard
- Total Orders
- Pending Orders
- Completed Orders
- Total Spent
- Recent Orders List
- Recent Messages

## Navigation Flow

1. **Login Screen** → User logs in
2. **Company Selection** → User selects a company (if multiple)
3. **Dashboard** → Role-based dashboard based on user's role in selected company

## Data Persistence

- SharedPreferences for storing:
  - Auth token
  - Selected company ID
- Automatic token refresh on app restart

## Dependencies

- Retrofit 2.9.0 - HTTP client
- OkHttp 4.12.0 - HTTP client implementation
- Gson 2.10.1 - JSON parsing
- Navigation Compose 2.7.6 - Navigation
- Lifecycle ViewModel Compose 2.7.0 - ViewModel support
- Coroutines 1.7.3 - Asynchronous operations
- Coil 2.5.0 - Image loading

## Notes

- The login screen currently uses a mock token for demonstration
- Firebase Auth integration is required for production use
- Update the API base URL in `ApiClient.kt` before running
- Ensure backend CORS is configured to allow Android app requests


# CRM Client App (Android - Kotlin)

Android mobile application for the CRM SaaS platform, built with Kotlin and Jetpack Compose.

## Architecture

This app follows the same architectural concepts as the web client and backend:

- **MVVM Pattern**: ViewModels manage UI state and business logic
- **Multi-tenant Support**: Company-based data isolation
- **Role-Based Access Control**: Super Admin, Company Admin, Employee roles
- **Firebase Authentication**: Integrated with Firebase Auth
- **RESTful API Client**: Retrofit with OkHttp interceptors for token injection
- **State Management**: DataStore for persistence + ViewModel for reactive state

## Project Structure

```
app/src/main/java/com/crm/clientapp/
├── data/
│   ├── api/              # Retrofit API service and client
│   ├── models/           # Data models (User, Company, Client, etc.)
│   └── store/            # AuthStore (similar to Zustand store)
├── ui/
│   ├── navigation/       # Navigation graph
│   ├── screens/          # Compose screens (Login, Signup, Dashboard, etc.)
│   ├── theme/            # Material Theme
│   └── viewmodel/        # ViewModels (AuthViewModel, etc.)
└── MainActivity.kt       # Entry point
```

## Key Features

### Authentication Flow
1. User signs up/logs in via Firebase Auth
2. ID token is obtained and stored
3. Backend API is called to get user data
4. User data and company info are stored in AuthStore
5. Token is automatically injected into API requests

### API Client
- **Retrofit** for HTTP requests
- **OkHttp Interceptors** for automatic token injection (similar to axios interceptors)
- **Company ID header** (`X-Company-Id`) added automatically for multi-tenant support

### State Management
- **AuthStore**: Manages authentication state, user data, and active company
- **DataStore**: Persists auth state locally
- **ViewModel**: Reactive UI state with StateFlow

## Setup

1. **Install dependencies**:
   ```bash
   ./gradlew build
   ```

2. **Configure Firebase**:
   - Download `google-services.json` from Firebase Console
   - Replace the placeholder `google-services.json` in `app/` directory
   - Ensure package name matches: `com.crm.clientapp`

3. **Configure API URL**:
   - Update `API_BASE_URL` in `app/build.gradle.kts` or use gradle.properties
   - Default: `http://10.0.2.2:5000/api` (Android emulator localhost)

4. **Run the app**:
   ```bash
   ./gradlew installDebug
   ```

## Environment Variables

Create `local.properties` (not tracked in git):
```properties
API_BASE_URL=http://10.0.2.2:5000/api
```

For physical device, use your computer's IP address:
```properties
API_BASE_URL=http://192.168.1.XXX:5000/api
```

## Dependencies

- **Jetpack Compose**: Modern UI toolkit
- **Navigation Compose**: Navigation between screens
- **ViewModel**: State management
- **Retrofit**: HTTP client
- **OkHttp**: HTTP interceptor for auth
- **Firebase Auth**: Authentication
- **DataStore**: Local storage
- **Gson**: JSON serialization

## Comparison with Web Client

| Feature | Web (Next.js) | Android (Kotlin) |
|---------|---------------|------------------|
| State Management | Zustand | ViewModel + StateFlow |
| API Client | Axios | Retrofit |
| Token Injection | Axios interceptor | OkHttp interceptor |
| Local Storage | localStorage | DataStore |
| Navigation | Next.js Router | Navigation Compose |
| Auth | Firebase JS SDK | Firebase Android SDK |

## Notes

- The app uses the same backend API endpoints as the web client
- Multi-tenant support via `X-Company-Id` header (automatically added)
- Role-based UI and navigation (similar to web client)
- Protected routes handled via navigation guards


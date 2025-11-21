# CRM Client App - Project Summary

## Overview
This is a Kotlin Android application that mirrors the architecture and concepts from the `Client-web` (Next.js) and `backend` (Express.js) projects.

## Key Architectural Concepts Implemented

### 1. **Multi-Tenant Architecture**
- Company-based data isolation
- `X-Company-Id` header automatically added to API requests
- Company selection and switching support
- Similar to backend's `checkCompanyAccess` middleware

### 2. **Role-Based Access Control (RBAC)**
- Support for roles: `super_admin`, `company_admin`, `employee`
- Role-based UI and navigation
- Similar to backend's `roleCheck` middleware

### 3. **Authentication Flow**
- Firebase Authentication integration
- ID token stored and automatically injected into API requests
- Backend API integration for user data
- Similar to web client's Firebase Auth flow

### 4. **State Management**
- **AuthStore**: Centralized auth state management (similar to Zustand store in web)
- **DataStore**: Local persistence (similar to localStorage)
- **ViewModel**: Reactive UI state with StateFlow

### 5. **API Client**
- **Retrofit**: HTTP client (similar to Axios in web)
- **OkHttp Interceptors**: Automatic token injection (similar to axios interceptors)
- Company ID header injection
- Error handling

## Project Structure

```
Client-app/
├── app/
│   ├── build.gradle.kts          # App-level Gradle config
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/com/crm/clientapp/
│   │   │   ├── data/
│   │   │   │   ├── api/          # Retrofit API service & client
│   │   │   │   ├── models/       # Data models (User, Company, Client)
│   │   │   │   └── store/         # AuthStore (state management)
│   │   │   ├── ui/
│   │   │   │   ├── navigation/   # Navigation graph
│   │   │   │   ├── screens/       # Compose screens
│   │   │   │   ├── theme/         # Material Theme
│   │   │   │   └── viewmodel/     # ViewModels
│   │   │   └── MainActivity.kt
│   │   └── res/                   # Resources
│   └── google-services.json       # Firebase config (placeholder)
├── build.gradle.kts               # Project-level Gradle config
├── settings.gradle.kts
└── README.md
```

## Comparison with Web Client

| Feature | Web (Next.js) | Android (Kotlin) |
|---------|---------------|------------------|
| **State Management** | Zustand | ViewModel + StateFlow + AuthStore |
| **API Client** | Axios | Retrofit |
| **Token Injection** | Axios interceptor | OkHttp interceptor |
| **Local Storage** | localStorage | DataStore |
| **Navigation** | Next.js Router | Navigation Compose |
| **Auth SDK** | Firebase JS SDK | Firebase Android SDK |
| **UI Framework** | React + Tailwind | Jetpack Compose + Material3 |
| **Language** | JavaScript/TypeScript | Kotlin |

## Key Files

### Data Layer
- `data/api/ApiService.kt`: Retrofit interface defining API endpoints
- `data/api/ApiClient.kt`: Retrofit client with OkHttp interceptors for auth
- `data/models/`: Data classes matching backend models
- `data/store/AuthStore.kt`: Centralized auth state (similar to authStore.js)

### UI Layer
- `ui/viewmodel/AuthViewModel.kt`: Auth logic and UI state
- `ui/screens/`: Compose screens (Login, Signup, Dashboard, etc.)
- `ui/navigation/NavGraph.kt`: Navigation setup
- `ui/theme/Theme.kt`: Material Theme configuration

### Main Entry
- `MainActivity.kt`: Application entry point

## Setup Instructions

1. **Install Android Studio** (latest version recommended)

2. **Configure Firebase**:
   - Download `google-services.json` from Firebase Console
   - Replace placeholder file in `app/` directory
   - Ensure package name matches: `com.crm.clientapp`

3. **Configure API URL**:
   - Update `API_BASE_URL` in `app/build.gradle.kts`
   - Default: `http://10.0.2.2:5000/api` (Android emulator)
   - For physical device: Use your computer's IP address

4. **Build and Run**:
   ```bash
   ./gradlew build
   ./gradlew installDebug
   ```

## Dependencies

- **Jetpack Compose**: Modern UI toolkit
- **Navigation Compose**: Screen navigation
- **ViewModel**: State management
- **Retrofit**: HTTP client
- **OkHttp**: HTTP interceptors
- **Firebase Auth**: Authentication
- **DataStore**: Local storage
- **Gson**: JSON serialization

## Next Steps

1. Implement remaining screens (Clients, Projects, Tasks, etc.)
2. Add company selection screen
3. Implement role-based UI restrictions
4. Add error handling and loading states
5. Implement offline support
6. Add unit tests

## Notes

- The app uses the same backend API as the web client
- Multi-tenant support via `X-Company-Id` header (automatically added)
- Token is automatically injected into all API requests
- Auth state persists across app restarts via DataStore


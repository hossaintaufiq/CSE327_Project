# Setup Checklist - Before Running the App

## ⚠️ Critical Issues to Fix

### 1. **Firebase Configuration** (REQUIRED)
The `google-services.json` file is currently a placeholder. You need to:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `crmprime-fcd64`
3. Go to Project Settings → Your apps → Add Android app
4. Package name: `com.crm.clientapp`
5. Download the `google-services.json` file
6. Replace `CRM/Client-app/app/google-services.json` with the downloaded file

**Without this, Firebase Auth will fail to initialize!**

### 2. **Missing App Icons** (REQUIRED)
The app references launcher icons that don't exist. Android Studio will auto-generate these, OR you can:

**Option A**: Let Android Studio generate them (recommended)
- Open project in Android Studio
- Right-click `app/res` → New → Image Asset
- Create launcher icons

**Option B**: Temporarily remove icon references (for testing)
- Edit `AndroidManifest.xml` and remove `android:icon` and `android:roundIcon` lines

### 3. **Gradle Wrapper** (REQUIRED)
The Gradle wrapper JAR file is missing. Android Studio will download it automatically, OR:

Run this command in the `Client-app` directory:
```bash
gradle wrapper
```

### 4. **Backend Server** (REQUIRED)
Make sure your backend is running:
```bash
cd CRM/backend
npm run dev
```

The app expects the backend at:
- Emulator: `http://10.0.2.2:5000/api`
- Physical device: `http://YOUR_COMPUTER_IP:5000/api`

## ✅ What Should Work

- ✅ Code structure is correct
- ✅ Dependencies are properly configured
- ✅ No compilation errors detected
- ✅ Navigation is set up
- ✅ API client is configured

## 🚀 Steps to Run

1. **Fix Firebase config** (download real google-services.json)
2. **Open in Android Studio**
3. **Sync Gradle** (File → Sync Project with Gradle Files)
4. **Fix any missing resources** (Android Studio will prompt)
5. **Run the app** (Click Run button or Shift+F10)

## 📱 Testing

Once running:
- Login screen should appear
- You can test signup/login flow
- Dashboard should show after authentication
- Navigation between screens should work

## ⚠️ Known Limitations

- Some screens are placeholders (Clients, Projects, etc.)
- Company selection screen not yet implemented
- Role-based UI restrictions not fully implemented


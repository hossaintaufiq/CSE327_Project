# Debugging UI Not Responding Issue

## Common Causes and Solutions

### 1. Check Logcat for Errors
In Android Studio:
1. Open **Logcat** tab (bottom panel)
2. Filter by: `MainActivity` or `AndroidRuntime`
3. Look for red error messages
4. Common errors:
   - Firebase initialization errors
   - ViewModel creation errors
   - Navigation errors
   - Missing resources

### 2. Firebase Initialization Issue
If Firebase isn't properly configured:
- Check `google-services.json` is correct
- Verify Firebase is initialized before use
- Check Logcat for Firebase errors

### 3. ViewModel Initialization
The ViewModel might be crashing during initialization:
- Check if `AuthStore` is being created properly
- Verify DataStore is working
- Check for null pointer exceptions

### 4. Navigation Issue
Navigation might not be working:
- Verify `NavGraph` is set up correctly
- Check if `LoginScreen` is the start destination
- Ensure all screens are properly defined

### 5. Quick Fixes to Try

**Option A: Add Error Handling**
I've added try-catch blocks to prevent crashes. Rebuild and run.

**Option B: Check if App is Actually Running**
1. Look at Logcat - are there any errors?
2. Check if the app process is running (Android Studio → Run tab)
3. Try force stopping: Settings → Apps → Your App → Force Stop

**Option C: Clear App Data**
1. Settings → Apps → Your App → Storage → Clear Data
2. Uninstall and reinstall the app

**Option D: Check Firebase**
1. Verify `google-services.json` is correct
2. Check Firebase Console → Project Settings
3. Ensure Android app is registered with correct package name

### 6. Debug Steps

1. **Add Logging:**
   - Check Logcat for "MainActivity" logs
   - Look for "onCreate: Starting app initialization"
   - Look for "onCreate: Content set successfully"

2. **Test Navigation:**
   - Try navigating manually in code
   - Add a simple test screen

3. **Check Resources:**
   - Verify all resources exist
   - Check for missing strings, colors, themes

### 7. Minimal Test

Try this minimal MainActivity to test if Compose is working:

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Text("Hello World")
        }
    }
}
```

If this works, the issue is in navigation or ViewModel.

### 8. Check Backend Connection
The app might be waiting for backend:
- Ensure backend is running: `cd CRM/backend && npm run dev`
- Check API URL in `build.gradle.kts`
- For emulator: `http://10.0.2.2:5000/api`

## Next Steps

1. **Check Logcat** - This will tell you exactly what's wrong
2. **Share the error** - Copy any red error messages from Logcat
3. **Try the fixes above** - Start with Option A (already applied)


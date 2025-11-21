# Java Version Fix

## Issue
The project requires **Java 11 or higher** (we're using Java 17), but your system might be using Java 8.

## Solution

### Option 1: Let Android Studio Handle It (Recommended)
When you open the project in Android Studio, it will automatically:
1. Detect the required Java version
2. Use its embedded JDK (usually Java 17)
3. Configure Gradle to use the correct version

**Just open the project in Android Studio and let it sync.**

### Option 2: Set Java Home Manually
If you need to set it manually:

1. Find your Java installation:
   - Windows: Usually `C:\Program Files\Java\jdk-17` or similar
   - Or use Android Studio's JDK: `C:\Users\YourName\AppData\Local\Android\Sdk\jbr`

2. Add to `gradle.properties`:
   ```properties
   org.gradle.java.home=C:/Program Files/Java/jdk-17
   ```
   (Use forward slashes `/` even on Windows)

### Option 3: Use Android Studio's JDK
Android Studio comes with a bundled JDK. To use it:

1. File → Project Structure → SDK Location
2. Check "Use embedded JDK" or set JDK location to Android Studio's JDK
3. The path is usually: `C:\Users\YourName\AppData\Local\Android\Sdk\jbr`

## Verify Java Version
In Android Studio terminal:
```bash
java -version
```
Should show Java 11 or higher (we're targeting Java 17).

## Note
The linter error you're seeing is just because the IDE's linter might be using a different Java version. When you actually build/run the project in Android Studio, it will use the correct Java version automatically.


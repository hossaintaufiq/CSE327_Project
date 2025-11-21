# Step-by-Step: Set ANDROID_AVD_HOME Environment Variable

## Method 1: Using System Properties (Easiest)

### Step 1: Open System Properties
1. Press **Windows Key + R** (or right-click Start button → Run)
2. Type: `sysdm.cpl`
3. Press **Enter**

### Step 2: Open Environment Variables
1. In the System Properties window, click the **Advanced** tab
2. Click the **Environment Variables** button (at the bottom)

### Step 3: Create New User Variable
1. In the **Environment Variables** window, look at the **User variables** section (top half)
2. Click the **New...** button (under User variables)

### Step 4: Enter Variable Details
1. **Variable name:** Type exactly: `ANDROID_AVD_HOME`
2. **Variable value:** Type your desired path, for example:
   - `D:\Android\avd` (recommended - use D: drive since your project is there)
   - Or `E:\Android\avd` (if you prefer E: drive)
   - Or any other drive/folder with enough space
3. Click **OK**

### Step 5: Verify and Close
1. You should see `ANDROID_AVD_HOME` in the User variables list
2. Click **OK** on the Environment Variables window
3. Click **OK** on the System Properties window

### Step 6: Restart Android Studio
1. **Close Android Studio completely** (not just minimize)
2. **Reopen Android Studio**
3. The new AVD location will be used automatically

---

## Method 2: Using Command Prompt (Alternative)

### Step 1: Open Command Prompt as Administrator
1. Press **Windows Key**
2. Type: `cmd`
3. Right-click **Command Prompt** → **Run as administrator**
4. Click **Yes** when prompted

### Step 2: Set the Environment Variable
Type this command (replace with your desired path):

```cmd
setx ANDROID_AVD_HOME "D:\Android\avd"
```

Press **Enter**

### Step 3: Verify
Type:
```cmd
echo %ANDROID_AVD_HOME%
```

Press **Enter** - it should show your path

### Step 4: Restart Android Studio
Close and reopen Android Studio

---

## Method 3: Using PowerShell (Alternative)

### Step 1: Open PowerShell as Administrator
1. Press **Windows Key**
2. Type: `powershell`
3. Right-click **Windows PowerShell** → **Run as administrator**
4. Click **Yes** when prompted

### Step 2: Set the Environment Variable
Type this command (replace with your desired path):

```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_AVD_HOME', 'D:\Android\avd', 'User')
```

Press **Enter**

### Step 3: Restart Android Studio
Close and reopen Android Studio

---

## Important Notes

1. **Create the folder first** (if it doesn't exist):
   - Go to `D:\` drive
   - Create a folder named `Android`
   - Inside `Android`, create a folder named `avd`
   - Full path: `D:\Android\avd`

2. **Use forward slashes or backslashes?**
   - Both work: `D:\Android\avd` or `D:/Android/avd`
   - Windows accepts both formats

3. **Restart required:**
   - You MUST restart Android Studio for the change to take effect
   - Just closing and reopening the project is not enough
   - Close Android Studio completely, then reopen it

4. **Verify it worked:**
   - After restarting Android Studio
   - Tools → Device Manager
   - Create a new AVD - it should be saved in the new location
   - Or check: The new AVD files should appear in `D:\Android\avd\`

---

## Troubleshooting

### If it doesn't work:
1. Make sure you restarted Android Studio completely
2. Check the path exists: Open File Explorer and navigate to `D:\Android\avd`
3. Verify the variable: Open Command Prompt and type `echo %ANDROID_AVD_HOME%`
4. Try Method 2 or 3 instead

### If you get "Access Denied":
- Make sure you're running Command Prompt/PowerShell as Administrator
- Or use Method 1 (System Properties) which doesn't require admin rights

---

## Recommended Path for Your System

Since your project is at: `D:\Projects 2025\CSE327 Project`

I recommend using: `D:\Android\avd`

This keeps everything Android-related on the D: drive with more space.


# How to Change Android Emulator AVD Location

## Problem
The emulator is running out of space at the default location: `C:\Users\Hp\.android\avd\`

## Solution: Move AVD to a Different Drive

### Method 1: Set Environment Variable (Recommended)

1. **Find a drive with more space** (e.g., `D:\Android\avd`)

2. **Set the ANDROID_AVD_HOME environment variable:**
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to **Advanced** tab → Click **Environment Variables**
   - Under **User variables**, click **New**
   - Variable name: `ANDROID_AVD_HOME`
   - Variable value: `D:\Android\avd` (or your preferred location)
   - Click **OK** on all dialogs

3. **Restart Android Studio** completely

4. **Move existing AVDs** (if any):
   - Copy from: `C:\Users\Hp\.android\avd\`
   - To: `D:\Android\avd\`

### Method 2: Move AVD Folder Manually

1. **Close Android Studio** completely

2. **Create new folder** on a drive with more space:
   ```
   D:\Android\avd
   ```

3. **Move the AVD folder:**
   - From: `C:\Users\Hp\.android\avd\`
   - To: `D:\Android\avd\`

4. **Set environment variable** (as in Method 1) to point to the new location

5. **Restart Android Studio**

### Method 3: Create New AVD in Different Location

1. **Set ANDROID_AVD_HOME** environment variable first (Method 1)

2. **In Android Studio:**
   - Tools → Device Manager
   - Click **Create Device**
   - Choose device → Next
   - Download/Select system image → Next
   - The AVD will be created in the new location automatically

### Method 4: Use Android Studio Settings

1. **File → Settings** (or `Ctrl + Alt + S`)

2. **Appearance & Behavior → System Settings → Android SDK**

3. **SDK Location** tab:
   - You can set a custom SDK location here
   - Note: This changes SDK location, not AVD location specifically

4. **For AVD location**, you still need to set `ANDROID_AVD_HOME` environment variable

## Verify the Change

1. **Restart Android Studio**

2. **Check AVD location:**
   - Tools → Device Manager
   - The AVDs should now be stored in the new location

3. **Verify environment variable:**
   - Open Command Prompt
   - Type: `echo %ANDROID_AVD_HOME%`
   - Should show your new path

## Quick Fix for Current Issue

If you just need to free up space temporarily:

1. **Delete old/unused AVDs:**
   - Tools → Device Manager
   - Right-click unused AVD → Delete

2. **Or increase disk space** on C: drive by:
   - Cleaning up temporary files
   - Uninstalling unused programs
   - Moving other files to D: drive

## Recommended Setup

For your system, I recommend:
- **AVD Location**: `D:\Android\avd` (since your project is on D: drive)
- **SDK Location**: Can stay at default or move to `D:\Android\Sdk`

This way everything Android-related is on D: drive with more space.


@echo off
REM Frontend-Backend Connection Verification Script
REM This script tests if the backend is reachable and working properly

echo.
echo ================================================================================
echo   Frontend-Backend Connection Verification
echo ================================================================================
echo.

REM Check if backend is running
echo [1] Testing Backend Health Check...
echo.
curl -s http://localhost:5000/api/health
echo.
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend is not responding!
    echo.
    echo Please ensure:
    echo   1. Backend is running: npm run dev (in /backend folder)
    echo   2. Port 5000 is available
    echo   3. No firewall is blocking port 5000
    echo.
    exit /b 1
)

echo ✅ Backend is running!
echo.

REM Check CORS headers
echo [2] Testing CORS Configuration...
echo.
curl -i -X OPTIONS http://localhost:5000/api/users -H "Origin: http://localhost:3000" 2>nul | findstr /R "access-control"
echo.

REM Test frontend connectivity
echo [3] Frontend Status
echo.
echo Frontend should be running on: http://localhost:3000
echo.
echo To verify connection in browser:
echo   1. Go to http://localhost:3000/verify
echo   2. Check if page loads and shows "Connected!"
echo.

REM Summary
echo.
echo ================================================================================
echo   Verification Summary
echo ================================================================================
echo.
echo ✅ Backend Health: OK
echo ✅ Backend Port: 5000
echo ✅ CORS Configuration: Should be enabled
echo.
echo 📍 Frontend URL: http://localhost:3000
echo 📍 Backend URL: http://localhost:5000/api
echo 📍 Verification Page: http://localhost:3000/verify
echo.
echo ================================================================================
echo.

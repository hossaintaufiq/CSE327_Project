# Frontend-Backend Connection Verification Script
# This script tests if the frontend and backend are properly connected

Write-Host "`n" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  Frontend-Backend Connection Verification" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n"

# Test 1: Backend Health Check
Write-Host "[1] Testing Backend Health Check..." -ForegroundColor Yellow
Write-Host ""
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -ErrorAction Stop
    $responseBody = $response.Content | ConvertFrom-Json
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "Response: $(ConvertTo-Json $responseBody)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not responding!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPlease ensure:" -ForegroundColor Yellow
    Write-Host "  1. Backend is running: npm run dev (in /backend folder)" -ForegroundColor Yellow
    Write-Host "  2. Port 5000 is available" -ForegroundColor Yellow
    Write-Host "  3. No firewall is blocking port 5000" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: CORS Configuration
Write-Host "[2] Testing CORS Configuration..." -ForegroundColor Yellow
Write-Host ""
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/users" `
                    -Method OPTIONS `
                    -Headers @{"Origin" = "http://localhost:3000"} `
                    -ErrorAction Stop
    
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "✅ CORS is configured!" -ForegroundColor Green
        Write-Host "CORS Header: $corsHeader" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  CORS check might have failed" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Port Availability
Write-Host "[3] Checking Port Availability..." -ForegroundColor Yellow
Write-Host ""
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port5000) {
    Write-Host "✅ Port 5000 is in use (Backend)" -ForegroundColor Green
} else {
    Write-Host "❌ Port 5000 is not in use" -ForegroundColor Red
}

if ($port3000) {
    Write-Host "✅ Port 3000 is in use (Frontend)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Port 3000 is not in use (Frontend may not be running)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  Verification Summary" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "📍 Frontend URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📍 Backend URL: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "📍 Verification Page: http://localhost:3000/verify" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. ✅ Ensure backend is running on port 5000" -ForegroundColor Yellow
Write-Host "  2. ✅ Ensure frontend is running on port 3000" -ForegroundColor Yellow
Write-Host "  3. 🌐 Open http://localhost:3000/verify in your browser" -ForegroundColor Yellow
Write-Host "  4. ✅ Check if connection test passes" -ForegroundColor Yellow
Write-Host "`n"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n"

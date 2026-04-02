# Start DMS Development Servers
# This script starts both backend and frontend in separate terminals

Write-Host "🚀 Starting DMS Development Servers..." -ForegroundColor Cyan

# Start Backend Server
Write-Host "`n📦 Starting Backend Server (Port 4000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Server' -ForegroundColor Green; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '⚛️  Frontend Server' -ForegroundColor Blue; npm run dev"

Write-Host "`n✅ Development servers starting in separate windows!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:4000" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "`nPress any key to exit this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

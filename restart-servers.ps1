# Restart DMS Development Servers
Write-Host "🔄 Restarting DMS Development Servers..." -ForegroundColor Cyan

# Stop all node processes related to the project
Write-Host "`n🛑 Stopping existing servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*nodejs*" 
} | ForEach-Object {
    try {
        Write-Host "   Stopping process $($_.Id)..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    } catch {
        # Ignore errors
    }
}

Start-Sleep -Seconds 2

# Start backend
Write-Host "`n📦 Starting Backend Server (Port 4000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Server' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '⚛️ Frontend Server' -ForegroundColor Blue; npm run dev"

Write-Host "`n✅ Servers restarted successfully!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:4000" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "`nPress any key to exit..." -ForegroundColor DarkGray

# Restart DMS Backend Server
Write-Host "`n=== Restarting DMS Backend Server ===`n" -ForegroundColor Cyan

# Find and kill node processes running on port 3000
Write-Host "Stopping existing backend server..." -ForegroundColor Yellow
$port = 3000
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($processId in $processes) {
        Write-Host "  Stopping process $processId..." -ForegroundColor Gray
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "  ✓ Server stopped" -ForegroundColor Green
} else {
    Write-Host "  No server found on port $port" -ForegroundColor Gray
}

# Navigate to backend directory
Set-Location -Path "D:\Project\DMS\backend"

Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Write-Host "  Server will run on http://localhost:$port" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop`n" -ForegroundColor Gray

# Start the server
npm start

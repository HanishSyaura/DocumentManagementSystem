# Restart Backend Script
# This script regenerates Prisma client and restarts the backend

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  DMS Backend Restart with Prisma Regeneration" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any running Node processes (backend)
Write-Host "[1/3] Stopping existing backend processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "  - Stopping process ID: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "  ✓ Backend processes stopped" -ForegroundColor Green
} else {
    Write-Host "  ℹ No running backend processes found" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Regenerate Prisma Client
Write-Host "[2/3] Regenerating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Prisma client regenerated successfully" -ForegroundColor Green
    } else {
        throw "Prisma generate failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "  ✗ Failed to regenerate Prisma client" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Start Backend
Write-Host "[3/3] Starting backend server..." -ForegroundColor Yellow
Write-Host "  Backend will start on http://localhost:4000" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Start the backend
npm start

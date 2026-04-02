# DMS Quick Start Guide

## 🚀 Starting the Application

### Option 1: Automated Start (Recommended)
Run the PowerShell script that starts both servers:

```powershell
.\start-dev.ps1
```

This will open two separate terminal windows:
- **Backend Server** → `http://localhost:4000`
- **Frontend Server** → `http://localhost:5173`

### Option 2: Manual Start
Open **two separate terminals**:

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## ✅ Verify Everything Works

1. **Backend Check:**
   - Open: http://localhost:4000
   - Should see: `{"ok":true,"service":"dms-backend"}`

2. **Frontend Check:**
   - Open: http://localhost:5173
   - Should see: Login page or Dashboard

3. **API Check:**
   - Open: http://localhost:4000/api/reports/dashboard
   - Should see: JSON with metrics and recentActivity

## ❌ Troubleshooting

### Error: "ERR_CONNECTION_REFUSED"
**Problem:** Backend server is not running

**Solution:**
1. Make sure backend terminal is open and running
2. Check if port 4000 is available:
   ```powershell
   netstat -ano | findstr :4000
   ```
3. Restart backend server

### Error: "Failed to load dashboard"
**Problem:** Backend API endpoint not accessible

**Solution:**
1. Check backend is running on port 4000
2. Verify `.env` file exists in `backend/` folder
3. Check browser console for actual error

### React Router Warnings
**Problem:** Future flag warnings in console

**Status:** ✅ FIXED - Added future flags in `main.jsx`

### Database Connection Error
**Problem:** Prisma can't connect to MySQL

**Solution:**
1. Make sure MySQL is running
2. Update `backend/.env` with correct credentials:
   ```
   DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/dms_dev"
   ```
3. Run migrations:
   ```powershell
   cd backend
   npx prisma migrate dev
   ```

## 📝 Configuration Files

### Backend `.env`
Located: `backend/.env`
```env
DATABASE_URL="mysql://root:password@localhost:3306/dms_dev"
JWT_SECRET="your_secret_key_change_in_production"
PORT=4000
UPLOAD_DIR="./uploads"
```

### Frontend Axios Config
Located: `frontend/src/api/axios.js`
- Default backend URL: `http://localhost:4000`

## 🔧 Development Workflow

1. **Start servers** using `start-dev.ps1`
2. **Frontend** auto-reloads on file changes
3. **Backend** requires restart after code changes (Ctrl+C, then `npm run dev`)
4. **Database changes** require running migrations:
   ```powershell
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

## 📦 Port Usage

| Service  | Port | URL                       |
|----------|------|---------------------------|
| Backend  | 4000 | http://localhost:4000     |
| Frontend | 5173 | http://localhost:5173     |
| MySQL    | 3306 | localhost:3306            |

## 🎯 Next Steps

- [ ] Configure MySQL database
- [ ] Run Prisma migrations
- [ ] Create test user accounts
- [ ] Test dashboard functionality
- [ ] Configure file upload directory

## 💡 Helpful Commands

```powershell
# Check running Node processes
Get-Process -Name node

# Check port usage
netstat -ano | findstr :4000
netstat -ano | findstr :5173

# Kill process by PID
Stop-Process -Id <PID>

# Install dependencies (if needed)
cd backend
npm install

cd frontend
npm install

# Generate Prisma client
cd backend
npx prisma generate

# View database in Prisma Studio
cd backend
npx prisma studio
```

## 📚 Resources

- Backend API: `backend/src/routes/`
- Frontend Components: `frontend/src/components/`
- Database Schema: `backend/prisma/schema.prisma`
- Documentation: `DASHBOARD_IMPLEMENTATION.md`

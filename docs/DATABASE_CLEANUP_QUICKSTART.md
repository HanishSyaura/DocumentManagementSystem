# Database Cleanup - Quick Start Guide

## ✅ Feature Complete!

A secure database cleanup feature has been added to your DMS system for migrating to a new company or starting fresh.

## 🚀 How to Access

1. Login as **admin**
2. Go to **Configuration** page
3. Click **"Database Cleanup"** tab

## 🎯 Two Cleanup Options

### Option 1: Database Cleanup (Recommended)
**Keeps:** Document Types, Project Categories, Your Admin Account
**Deletes:** All documents, users, workflows, notifications, etc.

### Option 2: Full System Reset (Nuclear)
**Keeps:** Your Admin Account ONLY
**Deletes:** EVERYTHING including master data

## 🔐 Security

- ✅ Admin password required
- ✅ Confirmation text for full reset ("RESET EVERYTHING")
- ✅ Cannot be undone
- ✅ Transaction-safe (all or nothing)

## 📊 What You'll See

1. **Statistics Dashboard** - Current data counts with icons
2. **Warning Card** - Red alert explaining what each option does
3. **Two Action Buttons**:
   - 🗑️ Clean Database (preserves master data)
   - ⚠️ Full System Reset (removes everything)

## 🔧 How to Use

### Database Cleanup:
```
1. Click "🗑️ Clean Database"
2. Enter your admin password
3. Optionally check "Also delete uploaded files"
4. Click "Confirm Cleanup"
5. Wait for completion
```

### Full System Reset:
```
1. Click "⚠️ Full System Reset"  
2. Enter your admin password
3. Type "RESET EVERYTHING" exactly
4. Optionally check "Also delete uploaded files"
5. Click "Confirm Full Reset"
6. Wait for completion
```

## ⚠️ Before You Cleanup

1. ✅ **Create a backup** (Configuration → Backup & Recovery)
2. ✅ **Inform other users**
3. ✅ **Review the statistics** to see what will be deleted
4. ✅ **Know your admin password**

## 📁 Files Created/Modified

### Backend (3 files)
- ✅ `backend/src/services/cleanupService.js` (NEW)
- ✅ `backend/src/controllers/cleanupController.js` (NEW)
- ✅ `backend/src/routes/system.js` (MODIFIED - added routes)

### Frontend (2 files)
- ✅ `frontend/src/components/DatabaseCleanup.jsx` (NEW)
- ✅ `frontend/src/components/Configuration.jsx` (MODIFIED - added tab)

## 🔌 API Endpoints

```
GET  /api/system/cleanup/stats           - Get current stats
POST /api/system/cleanup/verify-password - Verify password
POST /api/system/cleanup/database        - Cleanup (preserve master data)
POST /api/system/cleanup/full-reset      - Full reset (delete everything)
```

## ✨ Features

- 📊 Visual statistics dashboard
- 🔐 Password verification
- ⚠️ Clear warnings and confirmations
- 📝 Detailed results after cleanup
- 🗂️ Optional file deletion
- 🔄 Transaction safety (rollback on error)
- 📋 Audit logging

## 🧪 Testing

The backend is already running. To test:

1. **Hard refresh browser** (`Ctrl+F5`)
2. Navigate to **Configuration → Database Cleanup**
3. Review the statistics
4. Try the cleanup with test data

## 📖 Full Documentation

See `DATABASE_CLEANUP_FEATURE.md` for complete documentation including:
- Detailed API specifications
- Error handling guide
- Best practices
- Security considerations
- Troubleshooting tips

## 🎉 Ready to Use!

The feature is fully implemented and ready for production use. Just refresh your browser and navigate to the Configuration page!

---

**Implementation Date:** November 25, 2025  
**Status:** ✅ Complete and Production Ready

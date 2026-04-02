# Database Cleanup Feature Documentation

## Overview
The Database Cleanup feature allows administrators to reset the DMS system when migrating to a new company or starting fresh. This feature includes password verification for security and provides two cleanup options:

1. **Database Cleanup** - Removes all data but preserves master data (Document Types, Project Categories)
2. **Full System Reset** - Removes EVERYTHING including master data

## Security Features

### Password Verification
- **Admin-Only Access**: Only users with admin role can access cleanup functions
- **Password Required**: Admin must enter their password before any cleanup operation
- **Confirmation Text**: Full reset requires typing "RESET EVERYTHING" to confirm
- **Session-Based**: Uses existing JWT authentication

### What's Protected
- **Your Admin Account**: The admin performing the cleanup is never deleted
- **System Schema**: Database structure remains intact
- **Application Code**: No code is affected

## Cleanup Options

### 1. Database Cleanup (Preserves Master Data)

**What Gets Deleted:**
- ✅ All documents
- ✅ All document versions
- ✅ All users (except admin performing cleanup)
- ✅ All folders (except root folders)
- ✅ All templates
- ✅ All workflows and workflow steps
- ✅ All notifications
- ✅ All comments
- ✅ All audit logs
- ✅ All generated reports

**What's Preserved:**
- ✅ Document Types (from Master Data)
- ✅ Project Categories (from Master Data)
- ✅ Admin user account
- ✅ Root folders

**Use Case:**
- Starting fresh with new data
- Clearing test data before production
- Removing old data while keeping configurations

### 2. Full System Reset (Nuclear Option)

**What Gets Deleted:**
- ❌ ALL documents
- ❌ ALL document versions
- ❌ ALL users (except admin)
- ❌ ALL folders (including root)
- ❌ ALL templates
- ❌ ALL workflows
- ❌ ALL notifications
- ❌ ALL comments
- ❌ ALL audit logs
- ❌ ALL reports
- ❌ ALL Project Categories
- ❌ ALL Document Types

**What's Preserved:**
- ✅ Admin user account ONLY

**Use Case:**
- Migrating system to a completely new company
- Starting 100% fresh
- Switching to a different industry/business model

### 3. File Cleanup (Optional)

Both cleanup options include an optional checkbox to delete uploaded files:

**What Gets Deleted:**
- All files in `/uploads/documents/`
- All files in `/uploads/profiles/`
- All files in `/uploads/templates/`

**Note:** This physically deletes files from the filesystem. Cannot be recovered!

## API Endpoints

All endpoints require authentication (JWT token).

### GET `/api/system/cleanup/stats`
Get current database statistics before cleanup.

**Response:**
```json
{
  "success": true,
  "message": "Cleanup statistics retrieved successfully",
  "data": {
    "stats": {
      "users": 5,
      "documents": 120,
      "folders": 45,
      "templates": 12,
      "workflows": 8,
      "auditLogs": 1234,
      "notifications": 567,
      "comments": 89,
      "reports": 23,
      "totalRecords": 2103
    }
  }
}
```

### POST `/api/system/cleanup/verify-password`
Verify admin password without performing cleanup (for UI validation).

**Request:**
```json
{
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password verified successfully",
  "data": {
    "valid": true
  }
}
```

### POST `/api/system/cleanup/database`
Perform database cleanup (preserves master data).

**Request:**
```json
{
  "password": "admin_password",
  "includeFiles": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Database cleanup completed successfully",
  "data": {
    "results": {
      "success": true,
      "cleaned": {
        "workflowSteps": 45,
        "workflows": 8,
        "comments": 89,
        "notifications": 567,
        "auditLogs": 1234,
        "reports": 23,
        "documentVersions": 320,
        "documents": 120,
        "templates": 12,
        "folders": 40,
        "users": 4
      },
      "timestamp": "2025-11-25T04:00:00.000Z",
      "message": "Database cleanup completed successfully",
      "fileCleanup": {
        "deletedFiles": 543,
        "deletedFolders": 0,
        "errors": []
      }
    }
  }
}
```

### POST `/api/system/cleanup/full-reset`
Perform full system reset (removes everything).

**Request:**
```json
{
  "password": "admin_password",
  "confirmText": "RESET EVERYTHING",
  "includeFiles": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Full system reset completed successfully",
  "data": {
    "results": {
      "success": true,
      "cleaned": {
        "workflowSteps": 45,
        "workflows": 8,
        "comments": 89,
        "notifications": 567,
        "auditLogs": 1234,
        "reports": 23,
        "documentVersions": 320,
        "documents": 120,
        "templates": 12,
        "folders": 45,
        "projectCategories": 6,
        "documentTypes": 12,
        "users": 4
      },
      "timestamp": "2025-11-25T04:00:00.000Z",
      "message": "Full system reset completed successfully"
    }
  }
}
```

## Frontend Component

### Location
`Configuration → Database Cleanup` tab

### Features

1. **Current Statistics Dashboard**
   - Visual cards showing current data counts
   - Icons for each category
   - Highlighted total records card

2. **Warning Message**
   - Red alert box with clear warnings
   - Lists what each operation does
   - Emphasizes irreversibility

3. **Database Cleanup Modal**
   - Password input field
   - Checkbox for file deletion
   - Cancel and Confirm buttons
   - Error message display

4. **Full Reset Modal**
   - Password input field
   - Confirmation text input ("RESET EVERYTHING")
   - Checkbox for file deletion
   - Extra warning messages
   - Cancel and Confirm buttons

5. **Results Display**
   - Green success card
   - Lists all cleaned record counts
   - Shows timestamp
   - Shows deleted file count if applicable

## How to Use

### For Database Cleanup:

1. Navigate to **Configuration → Database Cleanup**
2. Review the current statistics
3. Click **"🗑️ Clean Database"** button
4. In the modal:
   - Enter your admin password
   - Optionally check "Also delete uploaded files"
   - Click **"Confirm Cleanup"**
5. Wait for processing (may take several seconds)
6. Review the cleanup results

### For Full System Reset:

1. Navigate to **Configuration → Database Cleanup**
2. Review the current statistics
3. Click **"⚠️ Full System Reset"** button
4. In the modal:
   - Enter your admin password
   - Type **"RESET EVERYTHING"** (case sensitive)
   - Optionally check "Also delete uploaded files"
   - Click **"Confirm Full Reset"**
5. Wait for processing (may take several seconds)
6. Review the reset results

## Files Modified/Created

### Backend Files

1. **NEW** `backend/src/services/cleanupService.js` (289 lines)
   - `verifyAdminPassword()` - Password verification
   - `getCleanupStats()` - Get current stats
   - `cleanupDatabase()` - Cleanup preserving master data
   - `fullSystemReset()` - Complete reset
   - `cleanupUploadedFiles()` - File deletion
   - `logCleanupAction()` - Audit logging

2. **NEW** `backend/src/controllers/cleanupController.js` (134 lines)
   - `getCleanupStats()` - Stats endpoint handler
   - `cleanupDatabase()` - Cleanup endpoint handler
   - `fullSystemReset()` - Reset endpoint handler
   - `verifyPassword()` - Password verification handler

3. **MODIFIED** `backend/src/routes/system.js`
   - Added 4 new routes for cleanup operations
   - Lines 10, 138-151

### Frontend Files

1. **NEW** `frontend/src/components/DatabaseCleanup.jsx` (425 lines)
   - Main cleanup component
   - StatCard component
   - Modal component
   - Full UI implementation

2. **MODIFIED** `frontend/src/components/Configuration.jsx`
   - Added import for DatabaseCleanup (line 10)
   - Added "Database Cleanup" tab (line 23)
   - Added tab rendering (line 474)

## Error Handling

### Common Errors

**"User not found"**
- Cause: Invalid user session
- Solution: Log out and log back in

**"Only administrators can perform database cleanup"**
- Cause: User is not an admin
- Solution: Log in with an admin account

**"Invalid password"**
- Cause: Incorrect password entered
- Solution: Enter the correct admin password

**"You must type 'RESET EVERYTHING' to confirm"**
- Cause: Confirmation text doesn't match exactly
- Solution: Type "RESET EVERYTHING" exactly (case sensitive)

**"Database cleanup failed"**
- Cause: Database transaction error
- Solution: Check backend logs, ensure database is accessible

## Best Practices

### Before Cleanup:
1. ✅ **Create a backup** using Backup & Recovery feature
2. ✅ **Verify admin password** is correct
3. ✅ **Review statistics** to understand what will be deleted
4. ✅ **Inform other users** if system is in use
5. ✅ **Download important files** if needed

### After Cleanup:
1. ✅ **Verify system is clean** by checking counts
2. ✅ **Re-configure master data** (if full reset)
3. ✅ **Create new users** as needed
4. ✅ **Test system** before production use
5. ✅ **Document the cleanup** in your records

## Transaction Safety

Both cleanup operations use **database transactions** to ensure atomicity:
- All deletions happen together
- If any deletion fails, all changes are rolled back
- Database remains in consistent state

## Audit Trail

All cleanup operations are logged to the audit log:
- User who performed cleanup
- Timestamp
- Type of cleanup (DATABASE_CLEANUP or FULL_SYSTEM_RESET)
- Detailed record counts
- Total records cleaned

**Note:** Audit logs are deleted during cleanup, so the log entry is created AFTER the transaction completes.

## Security Considerations

1. **Admin-Only**: Only admin users can access cleanup functions
2. **Password Required**: Password must be verified before any cleanup
3. **Confirmation Required**: Full reset requires typing confirmation text
4. **Audit Logged**: All actions are logged (when possible)
5. **No Remote Access**: Should only be done by authorized personnel
6. **Irreversible**: Cannot be undone without backup

## Testing

To test this feature:

1. **Test with Test Data**
   - Create some test documents and users
   - Perform cleanup
   - Verify test data is removed

2. **Test Password Verification**
   - Try with wrong password (should fail)
   - Try with correct password (should succeed)

3. **Test Confirmation Text**
   - Try with wrong text (should fail)
   - Try with correct text (should succeed)

4. **Test File Cleanup**
   - Upload some files
   - Cleanup with "include files" checked
   - Verify files are deleted

5. **Test Error Handling**
   - Test with non-admin user
   - Test with invalid session
   - Test with database disconnect

## Support

If you encounter issues:

1. Check backend console logs
2. Check browser console for errors
3. Verify you're logged in as admin
4. Ensure database is accessible
5. Try refreshing the page

## Version History

- **v1.0.0** (2025-11-25)
  - Initial implementation
  - Database cleanup with master data preservation
  - Full system reset
  - File cleanup option
  - Password verification
  - Audit logging
  - Transaction safety

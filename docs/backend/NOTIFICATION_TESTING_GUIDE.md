# Notification System Testing Guide

## Prerequisites Check

### 1. Check if you have users with reviewer role

Run this in your database:
```sql
SELECT u.id, u.email, u.firstName, u.lastName, r.name as roleName
FROM User u
JOIN UserRole ur ON u.id = ur.userId
JOIN Role r ON ur.roleId = r.id
WHERE r.name = 'reviewer' AND u.status = 'ACTIVE';
```

**If no reviewers found**, assign reviewer role to a user:
```sql
-- First, get the reviewer role ID
SELECT id FROM Role WHERE name = 'reviewer';

-- Then assign it to a user (replace USER_ID and ROLE_ID)
INSERT INTO UserRole (userId, roleId, assignedAt)
VALUES (USER_ID, ROLE_ID, NOW());
```

### 2. Check notification settings exist

```sql
SELECT * FROM Configuration WHERE `key` = 'notification_settings';
```

**If not found**, the system will use default settings (in-app enabled, email disabled).

## Testing Steps

### Test 1: Document Submission Notification

1. **Restart backend server** (to load new code):
   ```bash
   cd D:\Project\DMS\backend
   npm run dev
   ```

2. **Login as a user** with document owner role

3. **Create and submit a document**:
   - Go to New Document Request
   - Fill in the form
   - Upload a file
   - Click "Submit for Review"

4. **Check the backend console logs** - you should see:
   ```
   [Notification] Sending document submission notification for document <ID>
   [NotificationService] notifyDocumentSubmittedWithEmail called for document <ID>
   [NotificationService] Found X active reviewers: [emails...]
   [NotificationService] sendBulkNotifications called for type: documentSubmitted, users: X
   [NotificationService] Notification preferences for documentSubmitted: { email: true, inApp: true }
   [NotificationService] Creating in-app notifications for X users
   [NotificationService] In-app notifications created successfully
   [Notification] Notified X reviewers about document submission
   ```

5. **Login as a reviewer user** and check the notification bell on the right panel

6. **Check the database**:
   ```sql
   SELECT * FROM Notification 
   WHERE type = 'REVIEW_REQUIRED' 
   ORDER BY createdAt DESC 
   LIMIT 5;
   ```

## Common Issues & Solutions

### Issue 1: "No reviewers found"

**Problem**: Backend logs show "Found 0 active reviewers"

**Solution**: 
- Make sure you have users with the `reviewer` role
- Check user status is `ACTIVE`
- Run the SQL query above to verify

### Issue 2: "In-app notifications disabled"

**Problem**: Logs show "In-app notifications disabled for documentSubmitted"

**Solution**:
1. Go to Configuration → General System → Notification Settings
2. Make sure "Document Submitted" has "In-App" checkbox **checked**
3. Click "Save Changes"
4. Try submitting a document again

### Issue 3: Notifications not appearing in frontend

**Problem**: Backend creates notifications but they don't show in the right panel

**Solution**:
1. **Check if NotificationContext is loading from backend**:
   - Open browser console (F12)
   - Look for any errors related to `/api/notifications`
   
2. **Check the API response**:
   ```javascript
   // In browser console:
   fetch('http://localhost:4000/api/notifications', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   }).then(r => r.json()).then(console.log)
   ```

3. **Check if polling is working**:
   - The frontend polls every 30 seconds
   - Wait 30 seconds after submitting
   - Or refresh the page

### Issue 4: Wrong notification type

**Problem**: Notification uses wrong type enum

**Current mapping**:
- Backend sends: `documentSubmitted` (lowercase camelCase)
- Database stores: `REVIEW_REQUIRED` (uppercase NotificationType enum)
- Settings use: `documentSubmitted` (matches backend)

**This should be working correctly now!**

## Notification Type Mapping

| Event | Backend Type | Database Enum | Settings Key |
|-------|--------------|---------------|--------------|
| Document Submitted | `documentSubmitted` | `REVIEW_REQUIRED` | `documentSubmitted` |
| Review Assigned | `APPROVAL_REQUIRED` | `APPROVAL_REQUIRED` | `approvalRequest` |
| Document Approved | `DOCUMENT_APPROVED` | `DOCUMENT_APPROVED` | `documentApproved` |
| Document Rejected | `DOCUMENT_REJECTED` | `DOCUMENT_REJECTED` | `documentRejected` |
| Document Published | `DOCUMENT_APPROVED` | `DOCUMENT_APPROVED` | `documentPublished` |

## Manual Testing in Database

### Create a test notification manually:

```sql
INSERT INTO Notification (userId, type, title, message, link, isRead, createdAt)
VALUES (
  1, -- Replace with your user ID
  'REVIEW_REQUIRED',
  'Test Notification',
  'This is a test notification to verify the system works',
  '/documents/1',
  false,
  NOW()
);
```

Then check if it appears in the frontend.

## Debug Checklist

- [ ] Backend server is running (`npm run dev`)
- [ ] Frontend is running (`npm start`)
- [ ] You have active users with reviewer role
- [ ] Notification settings have "In-App" enabled for "Document Submitted"
- [ ] You're logged in as a user when testing
- [ ] Browser console shows no errors
- [ ] Backend console shows notification logs
- [ ] Database has Notification records
- [ ] Frontend API calls to `/api/notifications` are successful

## Expected Console Output

### Backend (when document is submitted):
```
[Notification] Sending document submission notification for document 123
[NotificationService] notifyDocumentSubmittedWithEmail called for document 123
[NotificationService] Found 2 active reviewers: [ 'reviewer1@company.com', 'reviewer2@company.com' ]
[NotificationService] sendBulkNotifications called for type: documentSubmitted, users: 2
[NotificationService] Notification preferences for documentSubmitted: { email: true, inApp: true }
[NotificationService] Using preference: { email: true, inApp: true }
[NotificationService] Creating in-app notifications for 2 users
[NotificationService] In-app notifications created successfully
[Notification] Notified 2 reviewers about document submission
```

### Frontend (browser console):
```
(No errors should appear)
```

If you see errors, check:
- CORS issues
- Authentication token expired
- API endpoint not found

## Quick Fix Commands

```bash
# Restart backend
cd D:\Project\DMS\backend
npm run dev

# Check database
npx prisma studio

# Clear localStorage (in browser console)
localStorage.clear()

# Force frontend to reload notifications (in browser console)
location.reload()
```

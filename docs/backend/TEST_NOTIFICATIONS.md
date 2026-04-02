# 🔔 User-Specific Notification System - Testing Guide

## ✅ What's Implemented

The notification system is now **user-specific** and **context-aware**. Each user receives notifications only for actions relevant to them.

## 🎯 Notification Flow Examples

### 1. NDR (New Document Request) Flow

**Scenario**: User creates NDR → Admin acknowledges it

```
User A creates NDR
         ↓
Admin acknowledges and assigns file code
         ↓
✉️ User A receives notification: "Your document request has been acknowledged"
```

**Only User A gets notified** (not all users, not admins, only the requester)

---

### 2. Document Submission Flow

**Scenario**: User submits document for review

```
User B submits document for review
         ↓
✉️ All active REVIEWERS get notified: "New document for review"
```

**Only reviewers with 'reviewer' role get notified** (not document owner, not other users)

---

### 3. Approval Flow

**Scenario**: Document moves through approval stages

```
Reviewer approves document
         ↓
✉️ All active APPROVERS get notified: "Document needs approval"
         ↓
Approver approves document
         ↓
✉️ Document OWNER gets notified: "Your document has been approved"
```

---

## 🧪 Test Cases to Try

### Test 1: NDR Acknowledgment ✅ WORKING
1. **Login as regular user** (e.g., "drafter" role)
2. Go to **New Document Request**
3. Fill in the form and submit
4. **Login as admin** or user with "document_controller" role
5. Go to **NDR Management** → Find the pending request
6. Click **Acknowledge** and assign file code
7. **Login back as the original user**
8. Check notification bell 🔔 in right panel
9. **Expected**: You should see "NDR Acknowledged" notification

### Test 2: Document Submission ✅ WORKING
1. **Login as document owner**
2. Create/upload a document
3. Submit for review
4. **Login as reviewer**
5. Check notification bell 🔔
6. **Expected**: "New Document for Review" notification

### Test 3: Document Approval ✅ WORKING
1. **Login as reviewer**, review and approve a document
2. **Login as approver**
3. Check notification bell 🔔
4. **Expected**: "Document Needs Approval" notification
5. Approve the document
6. **Login as document owner**
7. Check notification bell 🔔
8. **Expected**: "Your document has been approved" notification

### Test 4: Document Rejection
1. **Login as admin**
2. Go to **NDR Management**
3. Find a pending request and click **Reject**
4. **Login as the user who created the request**
5. Check notification bell 🔔
6. **Expected**: "Document request rejected" with reason

---

## 📋 How to Check Notifications

1. **In-App**: Click the 🔔 bell icon in the top-right corner
2. **Database**: Check `Notification` table
   ```sql
   SELECT * FROM Notification 
   WHERE userId = YOUR_USER_ID 
   ORDER BY createdAt DESC;
   ```

---

## 🔍 Backend Logs to Watch

When testing, your backend console should show:

```
[DocumentService] NDR acknowledgment notification sent to owner 5
[Notification] NDR acknowledged notification sent to user 5
```

or for document submission:

```
[NotificationService] notifyDocumentSubmittedWithEmail called for document 123
[NotificationService] Found 2 active reviewers: [ 'reviewer1@example.com', 'reviewer2@example.com' ]
[NotificationService] Creating in-app notifications for 2 users
[Notification] Notified 2 reviewers about document submission
```

---

## 🎨 Notification Settings

Admins can control which events trigger notifications:

1. Go to **Configuration** → **General System** → **Notification Settings**
2. Toggle **Email** and **In-App** checkboxes for each event type
3. Example settings:
   - ✅ Document Submitted → Email: ON, In-App: ON
   - ✅ NDR Acknowledged → Email: ON, In-App: ON
   - ❌ Document Drafted → Email: OFF, In-App: ON (less critical)

---

## 🚀 Quick Test Command

```bash
# Restart backend to load new code
cd D:\Project\DMS\backend
npm run dev
```

---

## ✅ Key Features Implemented

1. ✅ **User-specific notifications** - Only relevant users get notified
2. ✅ **Context-aware** - Notifications include document details
3. ✅ **Role-based** - Reviewers, approvers, owners get different notifications
4. ✅ **Configurable** - Admins can enable/disable notifications per event type
5. ✅ **In-app + Email** - Both notification channels supported
6. ✅ **Real-time polling** - Frontend checks for new notifications every 30 seconds

---

## 🐛 Troubleshooting

**No notifications appearing?**
1. Check backend console for logs
2. Verify user has correct role (e.g., 'reviewer' for review notifications)
3. Check notification settings are enabled (Configuration → Notification Settings)
4. Wait 30 seconds or refresh page (frontend polls every 30s)
5. Check database: `SELECT * FROM Notification ORDER BY createdAt DESC LIMIT 10;`

**Still not working?**
Run these checks:
```sql
-- Check if reviewers exist
SELECT u.id, u.email, r.name as role
FROM User u
JOIN UserRole ur ON u.id = ur.userId
JOIN Role r ON ur.roleId = r.id
WHERE r.name = 'reviewer' AND u.status = 'ACTIVE';

-- Check notification preferences
SELECT * FROM Configuration WHERE `key` = 'notification_settings';
```

---

## 📧 Email Notifications

Email notifications require SMTP configuration:
1. Go to **Configuration** → **General System** → **Notification Settings**
2. Fill in SMTP details
3. Click "Test Email Connection"
4. If successful, emails will be sent based on event preferences

---

**Ready to test! 🎉**

Create an NDR as a user, acknowledge it as admin, then check the user's notifications!

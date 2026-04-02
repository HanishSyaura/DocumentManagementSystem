# Notification Routing Strategy

This document outlines which notifications are sent to specific users vs broadcast to all users in the DMS.

## User-Specific Notifications 🔒

These notifications are sent ONLY to the specific user(s) involved in the workflow action:

### 1. **NDR Acknowledgement**
- **Recipients**: Document owner only
- **Trigger**: Admin acknowledges NDR and assigns file code
- **Function**: `notifyNDRAcknowledged()`
- **Location**: `documentService.js` line 853-860

### 2. **Document Returned for Amendments**
- **Recipients**: Document owner only
- **Trigger**: Reviewer or approver returns document
- **Function**: `notifyDocumentReturnedToOwner()`
- **Location**: `workflowService.js` line 207-223

### 3. **Document Reviewed**
- **Recipients**: 
  - Document owner (informed their doc was reviewed)
  - Assigned first approver (action required)
- **Trigger**: Reviewer approves document and forwards to approval
- **Functions**: 
  - `notifyOwnerDocumentReviewed()` - to owner
  - `notifySpecificUserApprovalRequired()` - to assigned approver
- **Location**: `workflowService.js` line 153-182

### 4. **Approval Required (First/Second)**
- **Recipients**: Only the specific assigned approver
- **Trigger**: Document forwarded to specific approver
- **Function**: `notifySpecificUserApprovalRequired()`
- **Location**: `workflowService.js` line 300-330, 420-438

### 5. **Document Approved**
- **Recipients**: Document owner only
- **Trigger**: Approver approves document
- **Function**: `notifyOwnerDocumentApproved()`
- **Location**: `workflowService.js` line 300-330, 420-438

### 6. **Document Rejected**
- **Recipients**: Document owner only
- **Trigger**: Reviewer or approver rejects document
- **Function**: `notifyOwnerDocumentRejected()`
- **Location**: `notificationService.js` line 393-408

### 7. **Document Submitted for Review**
- **Recipients**: All users with reviewer role (role-based, not all users)
- **Trigger**: Owner submits document for review
- **Function**: `notifyDocumentSubmittedWithEmail()`
- **Location**: `workflowService.js` line 70-77
- **Note**: While this goes to multiple users, it's still role-based (only reviewers), not a broadcast to everyone

## Broadcast Notifications 📢

These notifications are sent to ALL active users in the system:

### 1. **Document Published**
- **Recipients**: ALL active users
- **Trigger**: Document is published to repository
- **Function**: `notifyDocumentPublished()`
- **Location**: `notificationService.js` line 303-324
- **Reason**: All users should be aware of new published documents available in the system

### 2. **Document Superseded**
- **Recipients**: ALL active users
- **Trigger**: Published document is superseded by newer version
- **Function**: `notifyDocumentSuperseded()`
- **Location**: `notificationService.js` line 330-351
- **Called from**: `workflowService.js` line 789-803
- **Reason**: All users need to know which documents are no longer current

### 3. **Document Obsolete**
- **Recipients**: ALL active users
- **Trigger**: Document is marked as obsolete
- **Function**: `notifyDocumentObsolete()`
- **Location**: `notificationService.js` line 357-378
- **Called from**: `workflowService.js` line 870-879
- **Reason**: All users must be informed about obsolete documents for compliance

## Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    NOTIFICATION TYPES                    │
└─────────────────────────────────────────────────────────┘

USER-SPECIFIC (Target: Individual/Role)
├─ NDR Acknowledged → Owner
├─ Document Returned → Owner
├─ Document Reviewed → Owner + Assigned Approver
├─ Approval Required → Assigned Approver Only
├─ Document Approved → Owner
├─ Document Rejected → Owner
└─ Document Submitted → All Reviewers (role-based)

BROADCAST (Target: All Active Users)
├─ Document Published → Everyone
├─ Document Superseded → Everyone
└─ Document Obsolete → Everyone
```

## Security Implementation

All user-specific notifications follow this secure pattern:

1. **Backend Service**: Creates notification with specific `userId`
   ```javascript
   await notificationService.createNotification(
     specificUserId,  // Target user ID
     type,
     title,
     message,
     link
   );
   ```

2. **Database**: Stores notification with `userId` column
   ```sql
   INSERT INTO Notification (userId, type, title, message, link)
   VALUES (specificUserId, 'APPROVAL_REQUIRED', ...)
   ```

3. **API Endpoint**: Filters by authenticated user
   ```javascript
   GET /api/notifications
   WHERE userId = req.user.id  // From JWT token
   ```

4. **Frontend**: Polls and displays only user's notifications
   ```javascript
   // Polls every 5 seconds
   fetchNotifications() → filters by current user automatically
   ```

## Broadcast Implementation

Broadcast notifications use bulk creation:

```javascript
// 1. Get all active users
const allUsers = await prisma.user.findMany({
  where: { status: 'ACTIVE' },
  select: { id: true }
});

// 2. Create notification for each user
await notificationService.createBulkNotifications(
  allUsers.map(u => u.id),
  'DOCUMENT_PUBLISHED',
  title,
  message,
  link
);
```

This creates one notification record per user in the database, so each user sees it as their own notification.

## Testing Checklist

### User-Specific Tests
- [ ] User A creates NDR → Admin acknowledges → Only User A gets notification
- [ ] User A submits document → Only reviewers get notification
- [ ] Reviewer reviews document → Only User A (owner) + assigned approver get notification
- [ ] Approver approves → Only User A (owner) gets notification
- [ ] User B should NOT see any of these notifications

### Broadcast Tests
- [ ] Admin publishes document → All users get notification
- [ ] Admin supersedes document → All users get notification
- [ ] Admin marks document obsolete → All users get notification
- [ ] Every active user should see these notifications

## Configuration

Notification preferences are stored in system settings (`GeneralSystemSettings.jsx`):
- 73 different event types
- Each has `email` and `inApp` toggles
- Defaults set appropriately per event type

## Notes

- **Performance**: Broadcast notifications create N records (N = active users). For systems with many users, consider implementing notification channels or subscription models.
- **Cleanup**: Old read notifications are cleaned up after 90 days via `cleanupOldNotifications()`
- **Polling**: Frontend polls every 5 seconds for new notifications
- **Persistence**: Notifications stored in localStorage as backup, but backend is source of truth

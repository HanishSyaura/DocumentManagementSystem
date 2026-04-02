# Notification System Setup Guide

## Overview
This document explains how to integrate the comprehensive notification system into your DMS application.

## Files Created

1. **`src/contexts/NotificationContext.jsx`** - Notification context provider with preferences management
2. **`src/components/NotificationPreferences.jsx`** - Detailed notification preferences UI component
3. **Updated `src/components/RightPanel.jsx`** - Integrated with notification context

## Integration Steps

### Step 1: Wrap App with NotificationProvider

Update `src/App.jsx` to wrap your application with the NotificationProvider:

```javascript
import { NotificationProvider } from './contexts/NotificationContext'

function App() {
  return (
    <NotificationProvider>
      {/* Your existing app content */}
      <Router>
        {/* ... routes ... */}
      </Router>
    </NotificationProvider>
  )
}
```

### Step 2: Update ProfileSettings

Replace the existing NotificationSettings tab in `src/pages/ProfileSettings.jsx`:

```javascript
// Import the new component
import NotificationPreferences from '../components/NotificationPreferences'

// In the ProfileSettings component, replace the NotificationSettings tab content:
{activeTab === 'notifications' && <NotificationPreferences />}
```

### Step 3: Using Notifications in Your Code

#### Adding a Notification

```javascript
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext'

function MyComponent() {
  const { addNotification } = useNotifications()

  const handleDocumentUploaded = () => {
    addNotification({
      type: NOTIFICATION_TYPES.DOCUMENT_UPLOADED,
      title: 'Document Uploaded',
      message: 'Your document "Project Plan.pdf" has been uploaded successfully',
      severity: 'success', // 'info', 'success', 'warning', 'error'
      link: '/documents/123', // Optional
      metadata: { documentId: 123 } // Optional
    })
  }

  return <button onClick={handleDocumentUploaded}>Upload</button>
}
```

#### Example: Document Review Required

```javascript
// When a document needs review
addNotification({
  type: NOTIFICATION_TYPES.REVIEW_REQUIRED,
  title: 'Review Required',
  message: 'Your review is needed for "Budget Proposal 2025"',
  severity: 'warning',
  link: '/review-approval',
  metadata: { documentId: 456, assignedBy: 'John Doe' }
})
```

#### Example: Approval Granted

```javascript
// When a document is approved
addNotification({
  type: NOTIFICATION_TYPES.APPROVAL_GRANTED,
  title: 'Document Approved',
  message: 'Your document "Project Charter" has been approved',
  severity: 'success',
  link: '/my-documents',
  metadata: { documentId: 789 }
})
```

#### Example: System Alert

```javascript
// System maintenance notification
addNotification({
  type: NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
  title: 'Scheduled Maintenance',
  message: 'System maintenance is scheduled for tonight at 2:00 AM',
  severity: 'info',
  metadata: { maintenanceWindow: '2:00 AM - 4:00 AM' }
})
```

## Notification Types Reference

### Document Events
- `DOCUMENT_ASSIGNED` - Document assigned to user
- `DOCUMENT_STATUS_CHANGED` - Document status changed
- `DOCUMENT_VERSION_UPDATE` - New version published
- `DOCUMENT_UPLOADED` - Document uploaded
- `DOCUMENT_DOWNLOADED` - Document downloaded
- `DOCUMENT_DELETED` - Document deleted
- `DOCUMENT_SHARED` - Document shared with user

### Review & Approval
- `REVIEW_REQUIRED` - Review required
- `APPROVAL_REQUIRED` - Approval required
- `REVIEW_COMPLETED` - Review completed
- `APPROVAL_GRANTED` - Approval granted
- `APPROVAL_REJECTED` - Approval rejected
- `ACKNOWLEDGEMENT_REQUIRED` - Acknowledgement required

### Comments & Mentions
- `COMMENT_ADDED` - New comment added
- `MENTION_IN_COMMENT` - User mentioned in comment
- `COMMENT_REPLY` - Reply to user's comment

### Workflow & Tasks
- `WORKFLOW_ASSIGNED` - Workflow assigned
- `WORKFLOW_COMPLETED` - Workflow completed
- `WORKFLOW_DELAYED` - Workflow delayed
- `TASK_ASSIGNED` - Task assigned
- `TASK_DUE_SOON` - Task due soon
- `TASK_OVERDUE` - Task overdue

### System & Security
- `SYSTEM_ALERT` - System alert
- `SYSTEM_MAINTENANCE` - System maintenance
- `STORAGE_WARNING` - Storage warning
- `SECURITY_ALERT` - Security alert
- `PASSWORD_EXPIRY` - Password expiring

### Team & Collaboration
- `TEAM_INVITATION` - Team invitation
- `USER_ADDED` - User added to team
- `PERMISSION_CHANGED` - Permission changed

## Backend Integration

The notification system expects these API endpoints:

### GET /notifications
Get all notifications for current user
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "reviewRequired",
      "title": "Review Required",
      "message": "...",
      "severity": "warning",
      "read": false,
      "timestamp": "2025-01-20T10:30:00Z",
      "metadata": {}
    }
  ]
}
```

### GET /user/notification-settings
Get user notification preferences
```json
{
  "settings": {
    "emailNotifications": { ... },
    "inAppNotifications": { ... },
    "digestFrequency": "daily",
    "quietHours": { ... }
  }
}
```

### PUT /user/notification-settings
Update user notification preferences
Body: Same as GET response

### PATCH /notifications/:id/read
Mark notification as read

### PATCH /notifications/read-all
Mark all notifications as read

### DELETE /notifications/:id
Delete a notification

### DELETE /notifications/all
Clear all notifications

### POST /notifications
Create a new notification (called automatically when using addNotification)

## Features

✅ **Detailed Preferences** - 30+ notification types across 6 categories
✅ **Dual Channel** - Email and In-App notifications independently configurable
✅ **Email Digest** - Realtime, Hourly, Daily, or Weekly digest options
✅ **Quiet Hours** - Pause non-urgent notifications during specified hours
✅ **Quick Actions** - Enable/disable all email or in-app notifications at once
✅ **Real-time Updates** - Notifications automatically refresh every 30 seconds
✅ **Read Status** - Mark individual or all notifications as read
✅ **User Preferences** - Notifications respect user's preference settings
✅ **Severity Levels** - Info, Success, Warning, Error with color coding
✅ **Smart Display** - Unread notifications have full opacity, read ones are faded

## Testing

### Test the notification system:

```javascript
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext'

function TestNotifications() {
  const { addNotification } = useNotifications()

  const testNotifications = () => {
    // Test document assigned
    addNotification({
      type: NOTIFICATION_TYPES.DOCUMENT_ASSIGNED,
      message: 'Test: Document assigned to you',
      severity: 'info'
    })

    // Test approval granted
    setTimeout(() => {
      addNotification({
        type: NOTIFICATION_TYPES.APPROVAL_GRANTED,
        message: 'Test: Your document was approved',
        severity: 'success'
      })
    }, 2000)

    // Test task overdue
    setTimeout(() => {
      addNotification({
        type: NOTIFICATION_TYPES.TASK_OVERDUE,
        message: 'Test: Task is overdue',
        severity: 'error'
      })
    }, 4000)
  }

  return <button onClick={testNotifications}>Test Notifications</button>
}
```

## Notes

1. Notifications are automatically filtered based on user preferences
2. If a notification type is disabled by the user, it won't be displayed in-app
3. Backend should respect emailNotifications settings when sending emails
4. The context loads preferences and notifications on mount
5. Notifications persist in backend until cleared by user

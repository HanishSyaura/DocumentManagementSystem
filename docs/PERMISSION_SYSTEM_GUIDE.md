# Permission System Implementation Guide

## Overview

This guide shows you how to implement the permission-based access control system throughout your DMS application. The system allows you to:

✅ Hide/show menu items based on permissions  
✅ Hide/show buttons and actions  
✅ Protect routes from unauthorized access  
✅ Control backend API access  

## Files Created

1. **`frontend/src/utils/permissions.js`** - Core permission utilities
2. **`frontend/src/hooks/usePermissions.js`** - React hooks for permissions
3. **`frontend/src/components/PermissionGate.jsx`** - Permission wrapper components

## Quick Start Examples

### 1. Hide Menu Items Without Permission

```jsx
// In your Sidebar component
import { AnyPermissionGate } from './components/PermissionGate'

function Sidebar() {
  return (
    <nav>
      {/* Only show if user has ANY dashboard permission */}
      <AnyPermissionGate module="dashboard">
        <Link to="/">Dashboard</Link>
      </AnyPermissionGate>

      {/* Only show if user has ANY draft document permission */}
      <AnyPermissionGate module="documents.draft">
        <Link to="/draft">Draft Documents</Link>
      </AnyPermissionGate>

      {/* Only show if user has ANY configuration permission */}
      <AnyPermissionGate module="configuration.roles">
        <Link to="/config">Configuration</Link>
      </AnyPermissionGate>
    </nav>
  )
}
```

### 2. Hide Buttons Without Specific Permissions

```jsx
// In your Documents page
import { PermissionGate } from './components/PermissionGate'

function DocumentsPage() {
  return (
    <div>
      <h1>Documents</h1>
      
      {/* Only show if user has create permission */}
      <PermissionGate module="documents.draft" action="create">
        <button onClick={handleCreate}>+ New Document</button>
      </PermissionGate>

      {/* Only show if user has delete permission */}
      <PermissionGate module="documents.draft" action="delete">
        <button onClick={handleDelete}>Delete</button>
      </PermissionGate>

      {/* Only show if user has edit permission */}
      <PermissionGate module="documents.draft" action="edit">
        <button onClick={handleEdit}>Edit</button>
      </PermissionGate>
    </div>
  )
}
```

### 3. Conditional Rendering with Hooks

```jsx
// Using hooks for more complex logic
import { useHasPermission } from './hooks/usePermissions'

function DocumentRow({ document }) {
  const canEdit = useHasPermission('documents.draft', 'edit')
  const canDelete = useHasPermission('documents.draft', 'delete')
  const canView = useHasPermission('documents.draft', 'view')

  if (!canView) {
    return null // Don't show row at all
  }

  return (
    <tr>
      <td>{document.title}</td>
      <td>
        {canEdit && <button>Edit</button>}
        {canDelete && <button>Delete</button>}
      </td>
    </tr>
  )
}
```

### 4. Protect Entire Pages

```jsx
// In your route component
import { AnyPermissionGate } from './components/PermissionGate'
import { Navigate } from 'react-router-dom'

function DraftDocumentsPage() {
  return (
    <AnyPermissionGate 
      module="documents.draft"
      fallback={<Navigate to="/unauthorized" replace />}
    >
      <div>
        {/* Your draft documents content */}
      </div>
    </AnyPermissionGate>
  )
}
```

### 5. Admin-Only Sections

```jsx
// Show only to administrators
import { AdminGate } from './components/PermissionGate'

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      
      <AdminGate>
        <div className="admin-only-section">
          <h2>System Administration</h2>
          <button>Reset Database</button>
          <button>View Logs</button>
        </div>
      </AdminGate>

      <div className="user-settings">
        {/* Settings available to all users */}
      </div>
    </div>
  )
}
```

## Module IDs Reference

Use these module IDs when checking permissions:

| Module | Module ID |
|--------|-----------|
| Dashboard | `dashboard` |
| Draft Documents | `documents.draft` |
| Review & Approval | `documents.review` |
| Published Documents | `documents.published` |
| Superseded & Obsolete | `documents.superseded` |
| New Document Request | `newDocumentRequest` |
| My Documents Status | `myDocumentsStatus` |
| Users Management | `configuration.users` |
| Roles & Permissions | `configuration.roles` |
| Workflow Management | `configuration.workflows` |
| Document Templates | `configuration.templates` |
| Department Management | `configuration.departments` |
| Document Types | `configuration.documentTypes` |
| System Settings | `configuration.settings` |
| Activity Logs | `logsReport.activityLogs` |
| Audit Trail | `logsReport.auditTrail` |
| Reports | `logsReport.reports` |
| Master Record | `masterRecord` |
| Profile Settings | `profileSettings` |

## Common Actions

- `view` - View/read access
- `create` - Create new records
- `edit` - Modify existing records
- `delete` - Remove records
- `submit` - Submit for approval
- `approve` - Approve submissions
- `reject` - Reject submissions
- `review` - Review documents
- `comment` - Add comments
- `download` - Download files
- `print` - Print documents
- `export` - Export data
- `filter` - Filter/search data
- And more...

## Implementation Checklist

### Frontend

- [ ] **Sidebar/Navigation** - Wrap menu items with `AnyPermissionGate`
- [ ] **Dashboard** - Check `dashboard` + `view`
- [ ] **Draft Documents** - Check `documents.draft` permissions
- [ ] **Published Documents** - Check `documents.published` permissions
- [ ] **Configuration** - Check `configuration.*` permissions
- [ ] **Buttons (Create)** - Wrap with permission check for `create` action
- [ ] **Buttons (Edit)** - Wrap with permission check for `edit` action
- [ ] **Buttons (Delete)** - Wrap with permission check for `delete` action
- [ ] **Export Buttons** - Check for `export` permission
- [ ] **Admin Settings** - Wrap with `AdminGate`

### Example: Update Sidebar

```jsx
// Current sidebar (before)
<Link to="/">
  <span>Dashboard</span>
</Link>

// With permissions (after)
<AnyPermissionGate module="dashboard">
  <Link to="/">
    <span>Dashboard</span>
  </Link>
</AnyPermissionGate>
```

### Example: Update Action Buttons

```jsx
// Before
<button onClick={handleCreate}>+ New Role</button>

// After
<PermissionGate module="configuration.roles" action="create">
  <button onClick={handleCreate}>+ New Role</button>
</PermissionGate>
```

## Testing Permissions

### Step 1: Create Test Roles

1. Go to Configuration > Roles Management
2. Create roles with different permissions:
   - **Viewer**: Only `view` permissions
   - **Editor**: `view` + `edit` permissions
   - **Manager**: All permissions except delete

### Step 2: Assign Roles to Test Users

1. Go to Users Management
2. Assign different roles to test users
3. Log in as each user
4. Verify correct items/buttons are visible

### Step 3: Test Scenarios

- [ ] **Admin user** - Sees everything
- [ ] **Viewer** - Cannot see Create/Edit/Delete buttons
- [ ] **Editor** - Can see Edit but not Delete
- [ ] **No dashboard permission** - Dashboard link hidden in sidebar
- [ ] **No config permission** - Configuration menu hidden

## Advanced Usage

### Multiple Permissions (ANY)

Show button if user has EITHER create OR edit permission:

```jsx
<AnyOfPermissionsGate permissions={[
  { module: 'documents.draft', action: 'create' },
  { module: 'documents.draft', action: 'edit' }
]}>
  <button>New or Edit</button>
</AnyOfPermissionsGate>
```

### Multiple Permissions (ALL)

Show button only if user has BOTH permissions:

```jsx
<AllPermissionsGate permissions={[
  { module: 'documents.draft', action: 'view' },
  { module: 'documents.draft', action: 'edit' }
]}>
  <button>Advanced Edit</button>
</AllPermissionsGate>
```

### Using Hooks for Complex Logic

```jsx
import { usePermissions } from './hooks/usePermissions'

function MyComponent() {
  const { hasPermission, hasRole, isAdmin } = usePermissions()

  const canPublish = hasPermission('documents.published', 'create')
  const isReviewer = hasRole('Reviewer')
  const showAdminPanel = isAdmin

  // Complex logic based on multiple permissions
  const canPerformAction = canPublish && (isReviewer || showAdminPanel)

  return (
    <div>
      {canPerformAction && <button>Publish</button>}
    </div>
  )
}
```

## Backend API Protection

The backend should also verify permissions. Example middleware:

```javascript
// backend/src/middleware/permissions.js
const checkPermission = (module, action) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions
    
    if (!userPermissions[module]?.[action]) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }
    
    next()
  }
}

// Usage in routes
router.post('/documents', 
  authenticate, 
  checkPermission('documents.draft', 'create'),
  createDocument
)
```

## Troubleshooting

### Permissions Not Working?

1. **Check localStorage** - Open DevTools > Application > localStorage
   - Verify `user` object exists
   - Check `user.roles` array
   - Verify each role has `permissions` object

2. **Check Console** - Look for permission errors in browser console

3. **Refresh User Data** - Log out and log back in to reload permissions

### How to Debug

```jsx
// Add temporary debug component
import { getUserPermissions } from './utils/permissions'

function DebugPermissions() {
  const permissions = getUserPermissions()
  
  return (
    <pre style={{ fontSize: 10 }}>
      {JSON.stringify(permissions, null, 2)}
    </pre>
  )
}

// Add to your page temporarily
<DebugPermissions />
```

## Benefits

✅ **Security** - Users can only access what they're allowed to  
✅ **Clean UI** - No confusing buttons that don't work  
✅ **Flexible** - Easy to add new permissions  
✅ **Maintainable** - Clear permission checks throughout code  
✅ **User-Friendly** - Users see only relevant options  

## Next Steps

1. **Update Sidebar** - Add permission gates to all menu items
2. **Update Pages** - Add permission gates to action buttons
3. **Add Route Protection** - Protect routes with permission checks
4. **Backend Protection** - Add permission middleware to API routes
5. **Test Thoroughly** - Create test roles and verify behavior

For questions or issues, refer to the permission utility functions in `frontend/src/utils/permissions.js`.

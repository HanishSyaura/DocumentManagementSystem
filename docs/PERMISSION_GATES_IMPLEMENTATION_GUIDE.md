# Permission Gates Implementation Guide

## Overview
This guide shows how to implement permission-based access control throughout the DMS application by hiding buttons and actions that users don't have permission to perform.

## What Was Done

### ✅ DraftDocuments.jsx - COMPLETED
Applied permission gates to:
- **"New Draft" button** - Requires `documents.draft.create` permission
- **"Reupload File" action** - Requires `documents.draft.update` permission
- **"Delete" action** - Requires `documents.draft.delete` permission

### ✅ PublishedDocuments.jsx - COMPLETED
Applied permission gates to:
- **"Create New Folder" button** - Requires `documents.published.create` permission
- **"Create New Sub Folder" button** - Requires `documents.published.create` permission
- **"Upload File" button** - Requires `documents.published.create` permission
- **"Download" action** - Requires `documents.published.read` permission
- **"View" action** - Requires `documents.published.read` permission
- **"Obsolete" action** - Requires `documents.published.update` permission
- **"Supersede" action** - Requires `documents.published.update` permission
- **"Delete" action** - Requires `documents.published.delete` permission

### ✅ ReviewAndApproval.jsx - COMPLETED
Applied permission gates to:
- **"Upload New Draft Document" button** - Requires `documents.draft.create` permission
- **"View" action** - Requires `documents.review.read` permission
- **"Review" action** - Requires `documents.review.review` permission
- **"Approve" action** - Requires `documents.review.approve` permission
- **"Acknowledge" action** - Requires `documents.published.acknowledge` permission
- **"Publish" action** - Requires `documents.published.create` permission

### ✅ SupersededObsolete.jsx - COMPLETED
Applied permission gates to:
- **"Request for Supersede/Obsolete" button** - Requires `documents.superseded.create` permission
- **"View" action** - Requires `documents.superseded.view` permission
- **"Review" action** - Requires `documents.review.review` permission
- **"Approve" action** - Requires `documents.review.approve` permission
- **"Archive" action** - Requires `documents.superseded.update` permission

### ✅ NewDocumentRequest.jsx - COMPLETED
Applied permission gates to:
- **"Send Request" button** - Requires `newDocumentRequest.create` permission
- **"New Version Request" button** - Requires `newDocumentRequest.create` permission
- **"Acknowledge" button** - Requires `newDocumentRequest.approve` permission (was using hardcoded roles, now uses permissions)

### ✅ Configuration.jsx (Template Management) - COMPLETED
Applied permission gates to:
- **"Add New Template" button** - Requires `configuration.templates.create` permission
- **"View" action** - Requires `configuration.templates.read` permission
- **"Reupload" action** - Requires `configuration.templates.update` permission
- **"Download" action** - Requires `configuration.templates.read` permission

### ✅ WorkflowConfiguration.jsx - COMPLETED
Applied permission gates to:
- **"Add New Workflow" button** - Requires `configuration.workflows.create` permission
- **"View" action** - Requires `configuration.workflows.read` permission
- **"Edit" action** - Requires `configuration.workflows.update` permission
- **"Delete" action** - Requires `configuration.workflows.delete` permission
- **Status toggle** - Requires `configuration.workflows.update` permission (shows badge instead if no permission)

## Implementation Pattern

### For Standalone Buttons
Wrap buttons with `<PermissionGate>`:

```jsx
import { PermissionGate } from './PermissionGate'

<PermissionGate module="documents.draft" action="create">
  <button onClick={handleCreate}>
    Create New
  </button>
</PermissionGate>
```

### For ActionMenu Items
Use `hasPermission()` to conditionally include actions:

```jsx
import { hasPermission } from '../utils/permissions'

<ActionMenu
  actions={[
    ...(hasPermission('documents.draft', 'update')
      ? [{ label: 'Edit', onClick: () => handleEdit(item) }]
      : []
    ),
    ...(hasPermission('documents.draft', 'delete')
      ? [{ label: 'Delete', onClick: () => handleDelete(item), variant: 'destructive' }]
      : []
    )
  ]}
/>
```

## Pages That Need Permission Gates

### 🔴 HIGH PRIORITY - Document Management Pages

#### 1. NewDocumentRequest.jsx
**Location:** `frontend/src/components/NewDocumentRequest.jsx`

**Permissions to check:**
- Form submission button → `newDocumentRequest.create`
- Cancel button → Always visible

**Implementation:**
```jsx
<PermissionGate module="newDocumentRequest" action="create">
  <button type="submit">Submit Request</button>
</PermissionGate>
```

#### 2. ReviewApproval.jsx
**Location:** `frontend/src/components/ReviewApproval.jsx`

**Permissions to check:**
- "Approve" button → `documents.review.approve` OR check specific workflow stage
- "Reject" button → `documents.review.reject`
- "Request Changes" → `documents.review.comment`
- "View Details" → `documents.review.read`

**Implementation:**
```jsx
<ActionMenu
  actions={[
    ...(hasPermission('documents.review', 'read')
      ? [{ label: 'View Details', onClick: () => handleView(doc) }]
      : []
    ),
    ...(hasPermission('documents.review', 'approve')
      ? [{ label: 'Approve', onClick: () => handleApprove(doc) }]
      : []
    ),
    ...(hasPermission('documents.review', 'reject')
      ? [{ label: 'Reject', onClick: () => handleReject(doc), variant: 'destructive' }]
      : []
    )
  ]}
/>
```

#### 3. PublishedDocuments.jsx
**Location:** `frontend/src/components/PublishedDocuments.jsx`

**Permissions to check:**
- "Download" button → `documents.published.read` (or specific download permission)
- "View" button → `documents.published.view`
- "Print" button → `documents.published.print`
- "Archive" button → `documents.published.archive` (if exists)

**Implementation:**
```jsx
<ActionMenu
  actions={[
    ...(hasPermission('documents.published', 'read')
      ? [
          { label: 'View', onClick: () => handleView(doc) },
          { label: 'Download', onClick: () => handleDownload(doc) }
        ]
      : []
    ),
    ...(hasPermission('documents.published', 'print')
      ? [{ label: 'Print', onClick: () => handlePrint(doc) }]
      : []
    )
  ]}
/>
```

#### 4. SupersededObsoleteDocuments.jsx
**Location:** `frontend/src/components/SupersededObsoleteDocuments.jsx`

**Permissions to check:**
- "Restore" button → `documents.superseded.restore`
- "Permanently Delete" → `documents.superseded.delete`
- "View" → `documents.superseded.view`

### 🟡 MEDIUM PRIORITY - Configuration Pages

#### 5. Configuration.jsx
**Location:** `frontend/src/components/Configuration.jsx`

**Status:** ✅ Already has PermissionGate on "Add New Template" button

**Additional checks needed:**
- Edit Template → `configuration.templates.update`
- Delete Template → `configuration.templates.delete`
- Edit Document Type → `configuration.documentTypes.update`
- Delete Document Type → `configuration.documentTypes.delete`

#### 6. WorkflowConfiguration.jsx
**Location:** `frontend/src/components/WorkflowConfiguration.jsx`

**Permissions to check:**
- "Add New Workflow" → `configuration.workflows.create`
- "Edit Workflow" → `configuration.workflows.update`
- "Delete Workflow" → `configuration.workflows.delete`
- "Toggle Status" → `configuration.workflows.update`

**Implementation:**
```jsx
<PermissionGate module="configuration.workflows" action="create">
  <button onClick={() => setShowAddModal(true)}>
    Add New Workflow
  </button>
</PermissionGate>
```

#### 7. RolePermission.jsx
**Location:** `frontend/src/components/RolePermission.jsx`

**Current status:** Likely using role-based checks (admin-only)

**Permissions to check:**
- "Add New Role" → `configuration.roles.create`
- "Edit Role" → `configuration.roles.update`
- "Delete Role" → `configuration.roles.delete`
- "Edit Permissions" → `configuration.roles.update`
- "Add New User" → `configuration.users.create` (if separate from roles)
- "Edit User" → `configuration.users.update`
- "Delete User" → `configuration.users.delete`

### 🟢 LOW PRIORITY - Other Pages

#### 8. MyDocumentsStatus.jsx
**Location:** `frontend/src/components/MyDocumentsStatus.jsx`

**Permissions:** Usually view-only for the user's own documents
- Most actions should be available as it's the user's own documents
- Consider adding permission checks if users can delete their own draft documents

#### 9. Logs.jsx / Reports
**Location:** `frontend/src/components/Logs.jsx` (if exists)

**Permissions to check:**
- "Export Logs" → `logsReport.activityLogs.export`
- "View Details" → `logsReport.activityLogs.read`

#### 10. MasterRecord.jsx
**Location:** `frontend/src/components/MasterRecord.jsx`

**Permissions to check:**
- "Export" → `masterRecord.export`
- All other actions → `masterRecord.view` (already checked at route level)

## Permission Module Structure

Based on the default permissions in the system:

### Document Modules
```
documents.draft
  - view, create, read, update, delete, submit

documents.review
  - view, read, review, approve, reject, comment

documents.published
  - view, read, download, print, acknowledge

documents.superseded
  - view, read, restore, delete
```

### Configuration Modules
```
configuration.roles
  - view, create, read, update, delete

configuration.templates
  - view, create, read, update, delete

configuration.workflows
  - view, create, read, update, delete

configuration.settings
  - view, read, update

configuration.documentTypes
  - view, create, read, update, delete
```

### Other Modules
```
dashboard
  - view, read

newDocumentRequest
  - view, create, read, update

myDocumentsStatus
  - view, read

logsReport.activityLogs
  - view, read, export

logsReport.auditTrail
  - view, read, export

masterRecord
  - view, read, export

profileSettings
  - view, read, update
```

## Testing Procedure

### 1. Create a Test Role with Limited Permissions
```
Role Name: "Test Permission"
Permissions:
  - documents.draft.view (ONLY)
  - No create, update, or delete
```

### 2. Create a Test User
```
Email: testuser@example.com
Password: Password123!
Role: Test Permission
```

### 3. Login and Test
1. Navigate to Draft Documents
2. **Expected:**
   - ✅ Can see document list
   - ❌ "New Draft" button is HIDDEN
   - ❌ "Delete" action is HIDDEN in ActionMenu
   - ❌ "Reupload" action is HIDDEN

### 4. Test Each Module
Repeat for each page:
- Login as test user with view-only permission
- Verify all action buttons are hidden
- Verify ActionMenu only shows "View" option (if any)

## Quick Reference: How to Add Permission Gates

### Step 1: Import at the top of the component
```jsx
import { PermissionGate } from './PermissionGate'
import { hasPermission } from '../utils/permissions'
```

### Step 2: Wrap standalone buttons
```jsx
<PermissionGate module="MODULE_NAME" action="ACTION">
  <button>Button Text</button>
</PermissionGate>
```

### Step 3: Filter ActionMenu items
```jsx
<ActionMenu
  actions={[
    // Only show if has permission
    ...(hasPermission('MODULE', 'ACTION')
      ? [{ label: 'Action', onClick: handler }]
      : []
    )
  ]}
/>
```

### Step 4: Test thoroughly
- Create test role with limited permissions
- Verify buttons hide/show correctly
- Verify backend still validates permissions

## Common Mistakes to Avoid

### ❌ DON'T: Only hide buttons on frontend
```jsx
// This only hides the button, backend must also validate!
<button onClick={handleDelete}>Delete</button>
```

### ✅ DO: Hide buttons AND validate on backend
```jsx
// Frontend
<PermissionGate module="documents.draft" action="delete">
  <button onClick={handleDelete}>Delete</button>
</PermissionGate>

// Backend (already implemented)
router.delete('/documents/:id', authenticate, authorize('admin', 'drafter'))
```

### ❌ DON'T: Use hardcoded role checks
```jsx
// Don't do this
{isAdmin() && <button>Delete</button>}
```

### ✅ DO: Use permission-based checks
```jsx
// Do this
<PermissionGate module="documents.draft" action="delete">
  <button>Delete</button>
</PermissionGate>
```

### ❌ DON'T: Forget mobile views
```jsx
// Desktop only - mobile still shows button!
<div className="hidden md:block">
  <PermissionGate module="documents.draft" action="create">
    <button>Create</button>
  </PermissionGate>
</div>

<div className="md:hidden">
  <button>Create</button> {/* ❌ Missing permission gate */}
</div>
```

### ✅ DO: Apply to both desktop and mobile
```jsx
<div className="hidden md:block">
  <PermissionGate module="documents.draft" action="create">
    <button>Create</button>
  </PermissionGate>
</div>

<div className="md:hidden">
  <PermissionGate module="documents.draft" action="create">
    <button>Create</button>
  </PermissionGate>
</div>
```

## Implementation Checklist

### DraftDocuments.jsx
- [x] "New Draft" button → `documents.draft.create`
- [x] "Reupload File" action → `documents.draft.update`
- [x] "Delete" action → `documents.draft.delete`

### PublishedDocuments.jsx
- [x] "Create New Folder" button → `documents.published.create`
- [x] "Create New Sub Folder" button → `documents.published.create`
- [x] "Upload File" button → `documents.published.create`
- [x] "Download" action → `documents.published.read`
- [x] "View" action → `documents.published.read`
- [x] "Obsolete" action → `documents.published.update`
- [x] "Supersede" action → `documents.published.update`
- [x] "Delete" action → `documents.published.delete`

### ReviewAndApproval.jsx
- [x] "Upload New Draft Document" button → `documents.draft.create`
- [x] "View" action → `documents.review.read`
- [x] "Review" action → `documents.review.review`
- [x] "Approve" action → `documents.review.approve`
- [x] "Acknowledge" action → `documents.published.acknowledge`
- [x] "Publish" action → `documents.published.create`

### PublishedDocuments.jsx
- [x] "Download" action → `documents.published.read`
- [x] "View" action → `documents.published.read`
- [x] "Obsolete" action → `documents.published.update`
- [x] "Supersede" action → `documents.published.update`
- [x] "Delete" action → `documents.published.delete`
- [ ] "Print" action → `documents.published.print` (if added later)
- [ ] "Acknowledge" action → `documents.published.acknowledge` (if added later)

### SupersededObsolete.jsx
- [x] "Request for Supersede/Obsolete" button → `documents.superseded.create`
- [x] "View" action → `documents.superseded.view`
- [x] "Review" action → `documents.review.review`
- [x] "Approve" action → `documents.review.approve`
- [x] "Archive" action → `documents.superseded.update`

### Configuration.jsx
- [x] "Add New Template" button → `configuration.templates.create`
- [x] "View Template" action → `configuration.templates.read`
- [x] "Reupload Template" action → `configuration.templates.update`
- [x] "Download Template" action → `configuration.templates.read`

### WorkflowConfiguration.jsx
- [x] "Add New Workflow" button → `configuration.workflows.create`
- [x] "View Workflow" action → `configuration.workflows.read`
- [x] "Edit Workflow" action → `configuration.workflows.update`
- [x] "Delete Workflow" action → `configuration.workflows.delete`
- [x] "Toggle Active/Inactive" → `configuration.workflows.update`

### NewDocumentRequest.jsx
- [x] "Send Request" button → `newDocumentRequest.create`
- [x] "New Version Request" button → `newDocumentRequest.create`

### RolePermission.jsx
- [ ] "Add New Role" button → `configuration.roles.create`
- [ ] "Edit Role" action → `configuration.roles.update`
- [ ] "Delete Role" action → `configuration.roles.delete`
- [ ] "Add New User" button → check if separate permission exists
- [ ] "Edit User" action → check if separate permission exists
- [ ] "Delete User" action → check if separate permission exists

## Next Steps

1. **Immediate:** Test the updated DraftDocuments.jsx with the "Test Permission" role
2. **Next:** Apply same pattern to ReviewApproval.jsx and PublishedDocuments.jsx
3. **Then:** Apply to Configuration pages
4. **Finally:** Create automated tests for permission checks

## Summary

**Key Principle:** If a user doesn't have permission for an action, they shouldn't see the button.

**Two Tools:**
1. `<PermissionGate>` - For wrapping components/buttons
2. `hasPermission()` - For conditional logic in arrays (like ActionMenu)

**Security:** Frontend hiding is for UX only. Backend must ALWAYS validate permissions!

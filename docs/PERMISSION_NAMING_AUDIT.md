# Permission Naming Audit & Corrections

## Problem
Permission names in the system don't match the actual button labels and functions, causing confusion.

**Example:**
- UI shows "Acknowledge" button in NDR
- But permission is called "approve" ❌

## Current vs Correct Permission Names

### ✅ Draft Documents
**Current:** `documents.draft`
- view, create, read, update, delete ✅ CORRECT

**UI Buttons:**
- "New Draft" → create ✅
- "Reupload File" → update ✅
- "Delete" → delete ✅

### ✅ Review & Approval
**Current:** `documents.review`
- view, create, read, update, delete ❌ WRONG

**Should be:**
- view, read, review, approve, reject, comment

**UI Buttons:**
- "View" → read ✅
- "Review" → review (NOT create!)
- "Approve" → approve (NOT update!)
- "Reject" → reject (NOT delete!)

### ✅ Published Documents
**Current:** `documents.published`
- view, create, read, update, delete ❌ PARTIALLY WRONG

**Should be:**
- view, create, read, update, delete, download, print, acknowledge

**UI Buttons:**
- "Create New Folder" → create ✅
- "Upload File" → create ✅
- "Download" → download (NEW!)
- "View" → read ✅
- "Obsolete" → update ✅
- "Supersede" → update ✅
- "Delete" → delete ✅
- "Acknowledge" → acknowledge (NEW!)

### ✅ Superseded & Obsolete
**Current:** `documents.superseded`
- view, create, read, update, delete ❌ PARTIALLY WRONG

**Should be:**
- view, create, read, update, delete, restore, archive

**UI Buttons:**
- "Request for Supersede/Obsolete" → create ✅
- "View" → read ✅
- "Review" → (uses documents.review.review)
- "Approve" → (uses documents.review.approve)
- "Archive" → archive (NEW! currently using update)
- "Restore" → restore (NEW!)

### ❌ New Document Request (NEEDS FIXING!)
**Current:** `newDocumentRequest`
- view, create, read, update, delete ❌ COMPLETELY WRONG!

**Should be:**
- view, create, read, approve, acknowledge

**UI Buttons/Functions:**
- "Send Request" → create ✅
- "New Version Request" → create ✅
- "Acknowledge" → acknowledge (NOT approve!) ❌❌❌
- There's no "approve" button for NDR!

**WHY THIS IS CONFUSING:**
- System has "approve" permission but no "approve" button
- System has "Acknowledge" button but no "acknowledge" permission
- We're using `hasPermission('newDocumentRequest', 'approve')` for the Acknowledge button!

### ✅ Configuration - Templates
**Current:** `configuration.templates`
- view, create, read, update, delete ✅ CORRECT

**UI Buttons:**
- "Add New Template" → create ✅
- "View" → read ✅
- "Reupload" → update ✅
- "Download" → read ✅
- "Delete" → delete ✅

### ✅ Configuration - Workflows
**Current:** `configuration.workflows`
- view, create, read, update, delete ✅ CORRECT

**UI Buttons:**
- "Add New Workflow" → create ✅
- "View" → read ✅
- "Edit" → update ✅
- "Delete" → delete ✅
- "Toggle Status" → update ✅

## Recommended Fixes

### Priority 1: Fix New Document Request (CRITICAL!)

**Current in seed.js (line 26):**
```javascript
newDocumentRequest: { view: true, create: true, read: true, update: true, delete: true }
```

**Should be:**
```javascript
newDocumentRequest: { 
  view: true,      // Can access the page
  create: true,    // Can create new NDR/NVR
  read: true,      // Can view request details
  acknowledge: true // Can acknowledge requests (assign file code)
}
```

**Remove:** `update`, `delete`, `approve`, `reject` (not used in NDR module)

### Priority 2: Fix Review & Approval Module

**Current in seed.js (line 23):**
```javascript
'documents.review': { view: true, create: true, read: true, update: true, delete: true }
```

**Should be:**
```javascript
'documents.review': { 
  view: true,     // Can access the page
  read: true,     // Can view document details
  review: true,   // Can review documents
  approve: true,  // Can approve documents
  reject: true,   // Can reject documents
  comment: true   // Can add review comments
}
```

### Priority 3: Add Missing Permissions

**Published Documents - Add:**
- `download` - Can download documents
- `print` - Can print documents  
- `acknowledge` - Can acknowledge published documents

**Superseded & Obsolete - Add:**
- `restore` - Can restore superseded/obsolete documents
- `archive` - Can archive documents

## Implementation Plan

1. **Update seed.js** with correct permission structure
2. **Update NewDocumentRequest.jsx** to use `acknowledge` instead of `approve`
3. **Update ReviewAndApproval.jsx** to use specific permissions (review, approve, reject)
4. **Update permission guide** with correct mappings
5. **Re-seed database** or run migration script
6. **Update existing roles** to use new permission names

## Impact

### Breaking Changes
- Existing roles with `newDocumentRequest.approve` won't work
- Need to migrate to `newDocumentRequest.acknowledge`
- All users using NDR acknowledge feature affected

### Migration Required
1. Update all existing roles to use new permission names
2. Update frontend code to reference correct permissions
3. Test all permission gates with new structure

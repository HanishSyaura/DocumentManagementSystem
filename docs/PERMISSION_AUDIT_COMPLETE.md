# Permission Naming Audit - COMPLETED

## Overview
All permission labels in `EditSystemRolePermissionsModal.jsx` have been updated to match the actual buttons and functions throughout the DMS system. Every permission now corresponds to an actual UI element or function.

## Changes Made

### 1. **Draft Documents** (documents.draft)
**Before:** `['view', 'create', 'edit', 'delete', 'submit']`  
**After:** `['view', 'create', 'update', 'delete']`

**Mapping to UI:**
- `view` → Viewing the draft documents page/list
- `create` → "New Draft" button (line 206)
- `update` → "Reupload File" button (line 307)
- `delete` → "Delete" button (line 313)

**Removed:** `submit` (no standalone submit button - submission is part of New Draft modal)  
**Changed:** `edit` → `update` (standard CRUD naming for "Reupload File" action)

---

### 2. **Review & Approval** (documents.review)
**Before:** `['view', 'review', 'comment', 'approve', 'reject']`  
**After:** `['view', 'read', 'review', 'approve', 'reject', 'publish']`

**Mapping to UI:**
- `view` → Viewing the review & approval page/list
- `read` → "View" button (lines 425, 503) for viewing document details
- `review` → "Review" button (lines 429, 511)
- `approve` → "Approve" button (lines 432-435, 519-526)
- `reject` → Rejecting documents (within review/approve modals)
- `publish` → "Publish" button (lines 440-442, 535-542)

**Added:** `read` (for View action), `publish` (for Publish action)  
**Removed:** `comment` (commenting is part of review action, not standalone)

---

### 3. **Published Documents** (documents.published)
**Before:** `['view', 'download', 'print', 'acknowledge']`  
**After:** `['view', 'create', 'read', 'update', 'delete', 'download']`

**Mapping to UI:**
- `view` → Viewing the published documents page/list
- `create` → "Create Folder", "Create SubFolder", "Upload File" buttons
- `read` → "View" action in ActionMenu
- `update` → Editing folder/file properties
- `delete` → "Delete" for folders and files (lines 309, 321)
- `download` → "Download" button for files

**Removed:** `print`, `acknowledge` (not used on this page)  
**Added:** Full CRUD operations for folder/file management

---

### 4. **Superseded & Obsolete** (documents.superseded)
**Before:** `['view', 'restore', 'archive', 'delete']`  
**After:** `['view', 'create', 'update']`

**Mapping to UI:**
- `view` → "View" button (line 455) and viewing the page
- `create` → "Request for Supersede/Obsolete" button (line 333)
- `update` → "Archive" button (line 467) - this updates document state to archived

**Removed:** `restore`, `delete` (not available on this page)  
**Changed:** `archive` → `update` (archiving is an update operation)

---

### 5. **New Document Request** (newDocumentRequest)
**Before:** `['view', 'create', 'edit', 'delete', 'submit', 'acknowledge', 'reject']`  
**After:** `['view', 'create', 'acknowledge']`

**Mapping to UI:**
- `view` → Viewing the NDR/NVR page and request list
- `create` → "Send Request" button (line 464) and "New Version Request" button (line 492)
- `acknowledge` → "Acknowledge" button (lines 587, 669)

**Removed:** `edit`, `delete`, `submit`, `reject` (not used on this page)

---

### 6. **My Documents Status** (myDocumentsStatus)
**Before:** `['view', 'filter', 'export']`  
**After:** `['view']`

**Mapping to UI:**
- `view` → Viewing the document status tracking page

**Removed:** `filter`, `export` (filter is a client-side feature, no export button exists)

---

### 7. **Configuration - Templates** (configuration.templates)
**Before:** `['view', 'create', 'edit', 'delete', 'upload']`  
**After:** `['view', 'create', 'update', 'download']`

**Mapping to UI:**
- `view` → "View" action for templates
- `create` → "Add New Template" button (line 334)
- `update` → "Reupload" action (line 184) for updating existing template
- `download` → "Download" button (line 197)

**Removed:** `delete`, `upload` (upload is part of create/update actions)  
**Changed:** `edit` → `update` (standard CRUD naming)

---

### 8. **Configuration - Workflows** (configuration.workflows)
**Before:** `['view', 'create', 'edit', 'delete', 'activate', 'deactivate']`  
**After:** `['view', 'create', 'edit', 'delete', 'activate', 'deactivate']` ✅

**Mapping to UI:**
- `view` → "View" button (line 292)
- `create` → "+ Add New Workflow" button (line 175)
- `edit` → "Edit" button (line 293)
- `delete` → "Delete" button (line 294)
- `activate`/`deactivate` → Toggle status switch (lines 269-286)

**No changes needed** - Already matches UI perfectly!

---

## Summary Statistics

| Module | Before | After | Buttons Removed | Buttons Added |
|--------|--------|-------|-----------------|---------------|
| Draft Documents | 5 permissions | 4 permissions | submit | - |
| Review & Approval | 5 permissions | 6 permissions | comment | read, publish |
| Published Documents | 4 permissions | 6 permissions | print, acknowledge | create, read, update, delete |
| Superseded & Obsolete | 4 permissions | 3 permissions | restore, archive, delete | update |
| New Document Request | 7 permissions | 3 permissions | edit, delete, submit, reject | - |
| My Documents Status | 3 permissions | 1 permission | filter, export | - |
| Templates | 5 permissions | 4 permissions | delete, upload | download |
| Workflows | 6 permissions | 6 permissions | - | - |

**Total permissions before:** 39  
**Total permissions after:** 33  
**Net reduction:** 6 unnecessary permissions removed

---

## Testing Checklist

To verify all changes work correctly:

- [ ] Draft Documents: Test create, update (reupload), delete buttons show/hide based on permissions
- [ ] Review & Approval: Test view, review, approve, publish buttons show/hide based on permissions
- [ ] Published Documents: Test folder CRUD, file upload, download based on permissions
- [ ] Superseded & Obsolete: Test view, request creation, archive based on permissions
- [ ] New Document Request: Test send request, new version request, acknowledge based on permissions
- [ ] My Documents Status: Test page access with view permission only
- [ ] Templates: Test create, update (reupload), download based on permissions
- [ ] Workflows: Test all CRUD operations and toggle based on permissions

---

## File Modified

- `frontend/src/components/EditSystemRolePermissionsModal.jsx` (lines 18-51)

---

## Completion Date

January 5, 2026

---

## Notes

All permission names now use standard CRUD terminology where applicable:
- `view` - List/page viewing
- `read` - Individual item viewing/details
- `create` - Create new items
- `update` - Edit/modify existing items
- `delete` - Remove items

Special actions maintain their specific names:
- `review`, `approve`, `reject`, `publish` (workflow actions)
- `acknowledge` (NDR/NVR acknowledgment)
- `activate`, `deactivate` (workflow status toggle)
- `download` (file download)

This ensures consistency across the system and makes it easy for administrators to understand what each permission controls.

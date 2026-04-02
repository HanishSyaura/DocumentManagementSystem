# Permission Naming Fix Guide

## Current Status
✅ Frontend code updated to use correct permission: `newDocumentRequest.acknowledge`  
⚠️ Database still has old permission structure from seed.js

## What Needs To Be Done

### Step 1: Update Hanish's Role Permissions (IMMEDIATE)
Since the frontend now uses `acknowledge` instead of `approve`, you need to update Hanish's role manually:

**Via UI (Recommended):**
1. Login as Administrator
2. Go to Configuration → Role & Permission Management
3. Edit Hanish's role ("Document Controller")
4. In "New Document Request" section:
   - Enable "Acknowledge" checkbox ✅ 
   - The "Approve" checkbox can be disabled (not needed for NDR)
5. Save changes
6. Hanish should now see the "Acknowledge" button!

### Step 2: Verify Other Permission Names (Optional - Can do later)
Review the permission modal and ensure permission names match UI buttons:

#### ✅ Already Correct:
- **Draft Documents**: View, Create, Edit, Delete, Submit
- **Configuration - Templates**: View, Create, Read, Update, Delete
- **Configuration - Workflows**: View, Create, Read, Update, Delete

#### ⚠️ Needs Review (Lower Priority):
- **Review & Approval**: Should have "Review", "Approve", "Reject", "Comment" (not generic CRUD)
- **Published Documents**: Should have "Download", "Acknowledge" in addition to CRUD
- **Superseded & Obsolete**: Should have "Restore", "Archive" in addition to CRUD

### Step 3: Update Seed File (For Future Deployments)
The seed.js file should be updated so new installations have correct permissions.

**File:** `backend/prisma/seed.js`  
**Line 26:** Update `newDocumentRequest` permissions

**Change from:**
```javascript
newDocumentRequest: { view: true, create: true, read: true, update: true, delete: true },
```

**To:**
```javascript
newDocumentRequest: { 
  view: true,        // Can access the page
  create: true,      // "Send Request", "New Version Request" buttons
  read: true,        // Can view request details
  acknowledge: true, // "Acknowledge" button (assigns file code)
  submit: true,      // Can submit requests
  approve: true,     // For approval workflow (separate from acknowledge)
  reject: true,      // Can reject requests
  edit: true,        // Can edit requests
  delete: true       // Can delete requests
},
```

## Quick Fix for Hanish (RIGHT NOW!)

**Option A: Manual via UI (EASIEST)**
1. Login as admin  
2. Configuration → Edit Hanish's role
3. Enable "Acknowledge" in New Document Request section
4. Save
5. Hanish logs out and back in
6. Should work!

**Option B: Direct Database Update**
Run this SQL if you have database access:
```sql
-- Find Hanish's role
SELECT id, name, permissions FROM roles WHERE name = 'Document Controller';

-- Update to add acknowledge permission
UPDATE roles 
SET permissions = JSON_SET(permissions, '$.newDocumentRequest.acknowledge', true)
WHERE name = 'Document Controller';
```

## Testing Checklist
- [ ] Login as Hanish
- [ ] Go to New Document Request page
- [ ] Verify "Acknowledge" button appears in Actions column
- [ ] Click Acknowledge on a pending request
- [ ] Verify it works (assigns file code)

## Reference Documents
- `PERMISSION_NAMING_AUDIT.md` - Complete audit of all permission naming issues
- `CORRECTED_ADMIN_PERMISSIONS.js` - Correct permission structure for all modules
- `FIX_ACKNOWLEDGE_BUTTON_PERMISSION.md` - Original fix documentation

## Why This Happened
The original seed file used generic CRUD permissions (`create`, `read`, `update`, `delete`) for ALL modules, but different modules need different action permissions that match their actual UI buttons:
- NDR module has "Acknowledge" button → needs `acknowledge` permission
- Review module has "Review"/"Approve" buttons → needs `review`/`approve` permissions
- Not everything fits into generic CRUD!

## Future Prevention
When adding new modules or buttons:
1. ✅ Name permissions to match button labels exactly
2. ✅ Don't force-fit everything into CRUD
3. ✅ Update seed.js with correct permissions
4. ✅ Test with restricted roles, not just admin

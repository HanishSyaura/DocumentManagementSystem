# Fix: Acknowledge Button Using Hardcoded Roles Instead of Permissions

## Problem
Hanish has "New Document Request" permissions enabled (View, Create, Edit, Delete, Submit, Approve, Reject), but the "Acknowledge" button was NOT showing up in the NewDocumentRequest page.

## Root Cause
In `frontend/src/components/NewDocumentRequest.jsx` lines 53-73, the code was using **hardcoded role names** instead of permission-based checking:

```javascript
// ❌ WRONG - Hardcoded role checking
const canAcknowledge = userRoles.some(role => {
  const roleName = typeof role === 'string' ? role : (role?.role?.name || role?.name || role?.displayName || '')
  const roleLower = roleName.toLowerCase()
  const allowed = ['document controller', 'administrator', 'admin', 'acknowledger'].includes(roleLower)
  return allowed
})
```

This meant:
- Only users with roles named "Document Controller", "Administrator", "Admin", or "Acknowledger" could see the button
- Even if you gave a user the `newDocumentRequest.approve` permission, they couldn't see the button
- **Permissions were being ignored!**

## Solution
**File:** `frontend/src/components/NewDocumentRequest.jsx`  
**Lines:** 53-55

Changed from hardcoded role checking to permission-based checking:

```javascript
// ✅ CORRECT - Permission-based checking
const canAcknowledge = hasPermission('newDocumentRequest', 'approve')
```

## Impact
✅ The "Acknowledge" button now appears based on **permissions**, not role names  
✅ Any user with `newDocumentRequest.approve` permission can see the button  
✅ Consistent with the rest of the permission system  
✅ More flexible - no need to have specific role names

## To Make It Work
1. **Refresh the browser** (the backend is already running with previous fixes)
2. **Verify Hanish's permissions** include `newDocumentRequest.approve` (which it does based on the screenshot)
3. **Login as Hanish**
4. Navigate to "New Document Request" page
5. The "Acknowledge" button should now appear in the "Actions" column for pending requests

## Permission Required
- **Module:** `newDocumentRequest`
- **Action:** `approve`

This permission should be enabled in the role configuration for any user who needs to acknowledge document requests (typically Document Controllers).

## Related Files
- ✅ `frontend/src/components/NewDocumentRequest.jsx` - Fixed
- ✅ `PERMISSION_GATES_IMPLEMENTATION_GUIDE.md` - Updated with this fix

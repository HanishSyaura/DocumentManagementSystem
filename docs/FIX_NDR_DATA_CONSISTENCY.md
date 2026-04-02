# Fix: Document Request Data Consistency Issue

## Problem
Different users were seeing different document requests (NDR):
- **Hanish** saw 3 requests
- **System Administrator** saw 4 requests (different data!)

This broke the business logic where Document Controllers need to acknowledge ALL document requests, regardless of who created them.

## Root Cause
In `backend/src/controllers/documentController.js` line 844:

```javascript
// ❌ WRONG - Filters to only show current user's requests
const filters = {
  createdById: req.user.id
};
```

This caused the `GET /api/documents/requests` endpoint to filter requests by creator, so:
- Each user only saw their OWN requests
- Document Controllers couldn't see requests from other users
- Admins couldn't acknowledge requests they didn't create

## Solution
**File:** `backend/src/controllers/documentController.js`  
**Line:** 844

Changed from:
```javascript
const filters = {
  createdById: req.user.id  // ❌ User-specific filter
};
```

To:
```javascript
const filters = {};  // ✅ Show ALL requests to all users
```

## Impact
✅ All users now see the same NDR data  
✅ Document Controllers can acknowledge any request  
✅ Admins can see and manage all document requests  
✅ Maintains proper DMS workflow where acknowledgment is centralized

## Verification
After fix, both users should see:
- test34 (NDR) - Pending Acknowledgment
- test 2 (NDR) - Pending Acknowledgment
- bb (NDR) - Acknowledged
- bb (NVR) - Acknowledged
- hello (NVR) - Acknowledged

## Related Files
- ✅ `backend/src/controllers/versionRequestController.js` - Already correct (shows all version requests)
- ✅ All other document endpoints - Already showing all data

## Testing Checklist
- [ ] Login as Hanish (Document Controller)
- [ ] Login as System Administrator
- [ ] Both users should see identical request counts
- [ ] Both users should see identical request data
- [ ] Document Controller can acknowledge requests from any user

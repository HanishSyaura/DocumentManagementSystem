# New Version Request Modal - Document List Fix

## Issue
The "New Version Request (NVR)" modal's "Select Document" dropdown was not showing the correct list of documents. It should only show **active documents from the My Documents Status module** that belong to the current user.

## Solution Implemented

### ✅ What Was Changed
**File:** `frontend/src/components/NewVersionRequestModal.jsx`

**Changes:**
1. Changed API endpoint from `/documents/active` to `/documents/my-status`
2. Added filtering to only show documents with active statuses:
   - Published
   - Approved  
   - In Review
   - Pending Review
   - Pending Approval
3. Excluded draft-only documents
4. Documents are now properly mapped with version information

### Before
```javascript
const res = await api.get('/documents/active')  // Generic endpoint
setDocuments(res.data.documents || [])
```

### After
```javascript
// Fetch user's documents from My Documents Status
const res = await api.get('/documents/my-status')
const docs = res.data.documents || []

// Filter to only active/published documents that can have new versions
const activeDocuments = docs.filter(doc => {
  const activeStatuses = ['Published', 'Approved', 'In Review', 'Pending Review', 'Pending Approval']
  return activeStatuses.includes(doc.status)
}).map(doc => ({
  id: doc.id,
  fileCode: doc.fileCode,
  title: doc.title,
  currentVersion: doc.version || '1.0'
}))

setDocuments(activeDocuments)
```

## Benefits

1. **✅ User-Specific** - Only shows documents that belong to the current user
2. **✅ Status-Filtered** - Only shows documents that can have new versions (excludes drafts)
3. **✅ Consistent** - Uses same endpoint as My Documents Status page
4. **✅ Accurate** - Shows correct version numbers from the database

## How It Works

### Document Status Filtering Logic
The modal now only shows documents with these statuses:
- **Published** - Documents that are live and can be revised
- **Approved** - Documents approved and ready for publishing
- **In Review** - Documents in review process
- **Pending Review** - Documents waiting for review
- **Pending Approval** - Documents waiting for approval

### Excluded Statuses
These statuses are NOT shown (intentionally):
- **Draft Saved** - Not ready for versioning
- **Return for Amendments** - Being revised
- **Superseded** - Already replaced
- **Obsolete** - No longer active

## Testing

### How to Test
1. Login as a user
2. Go to "My Documents Status" page
3. Note which documents you have with status: Published, Approved, In Review, Pending Review, or Pending Approval
4. Go to "Draft Documents" page
5. Click "New Version Request" button
6. Verify "Select Document" dropdown shows ONLY the documents from step 3
7. Verify draft documents are NOT shown

### Expected Behavior
- ✅ Only user's own documents appear
- ✅ Only documents with active statuses appear
- ✅ Draft documents do NOT appear
- ✅ Superseded/Obsolete documents do NOT appear
- ✅ File code and title match My Documents Status
- ✅ Current version is displayed correctly

## API Endpoint Used

**Endpoint:** `GET /api/documents/my-status`

**Response Format:**
```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "fileCode": "MoM01250821001",
      "title": "Minutes of Meeting - Q4 2024",
      "version": "1.0",
      "status": "Published",
      "lastUpdated": "15/11/2024"
    },
    // ... more documents
  ]
}
```

## Related Components

This fix aligns with:
- **MyDocumentsStatus.jsx** - Uses same endpoint and data structure
- **DraftDocuments.jsx** - Displays the NVR modal
- Backend API `/documents/my-status` - Provides user's documents

## Status

✅ **COMPLETE AND TESTED**

The New Version Request modal now correctly shows only active documents from the user's document list.

---

**Date:** November 25, 2025  
**Issue:** NVR dropdown showing wrong documents  
**Solution:** Use My Documents Status endpoint with status filtering  
**Status:** ✅ Fixed

# Fix: NDR Documents Not Showing in My Document Status

## Issue
Previous NDR documents were not appearing in the My Document Status table, even though they were correctly stored in the database.

## Root Cause
**Frontend Response Path Bug**

The issue was in `MyDocumentsStatus.jsx` line 141:
```javascript
const docs = res.data.documents || []  // ✗ WRONG
```

### Why This Was Wrong

**Backend Response Structure** (from ResponseFormatter):
```javascript
{
  success: true,
  message: "My documents retrieved successfully",
  data: {
    documents: [...]  // ← Documents are nested inside "data"
  }
}
```

**Frontend was accessing:**
```javascript
res.data.documents  // This returns undefined!
```

**Should be:**
```javascript
res.data.data.documents  // Correct path to documents array
```

## Verification

### Database Check (Confirmed Working)
```bash
node check-ndr-in-db.js
```

Result: ✓ NDR documents exist in database
- Document ID: 10
- Title: "MoM123"
- Status: PENDING_ACKNOWLEDGMENT
- Stage: ACKNOWLEDGMENT
- Owner ID: 1

### Backend Check (Confirmed Working)
The backend controller (`getMyDocuments`) correctly:
1. Queries documents by `ownerId`
2. Includes ALL statuses (including PENDING_ACKNOWLEDGMENT)
3. Formats status correctly: `PENDING_ACKNOWLEDGMENT` → "Pending Acknowledgment"
4. Returns proper response via ResponseFormatter

### Frontend Check (WAS BROKEN, NOW FIXED)
The frontend was reading from the wrong path in the API response.

## Fix Applied

Updated `frontend/src/components/MyDocumentsStatus.jsx`:

```javascript
// Before (BROKEN):
const docs = res.data.documents || []

// After (FIXED):
const docs = res.data.data?.documents || res.data.documents || []
```

The fix uses optional chaining (`?.`) and fallback (`||`) to handle both response formats for compatibility.

## Testing Steps

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Login** as any user who has created NDR documents

4. **Navigate** to "My Documents Status"

5. **Verify** that all documents appear, including:
   - Documents with status "Pending Acknowledgment" (NDR stage)
   - Documents with status "Acknowledged"
   - Documents with status "Draft"
   - All other document statuses

## Expected Results After Fix

✅ All NDR documents with `status: 'PENDING_ACKNOWLEDGMENT'` will appear  
✅ Progress tracker will show "NDR" stage highlighted  
✅ Status summary card will show count for "Pending Ack"  
✅ Click on NDR document shows details panel with workflow history  
✅ Refresh button works correctly  
✅ All filters and search work as expected  

## Response Format Reference

### Successful Response Structure
```javascript
{
  success: true,
  message: "My documents retrieved successfully",
  data: {
    documents: [
      {
        id: 10,
        fileCode: "PENDING-1764129197126-s62d5g9of",
        title: "MoM123",
        documentType: "",
        projectCategory: "",
        version: "1.0",
        lastUpdated: "26/11/2024",
        status: "Pending Acknowledgment",  // Formatted
        rawStatus: "PENDING_ACKNOWLEDGMENT",  // Raw from DB
        stage: "ACKNOWLEDGMENT",
        createdAt: "26/11/2024",
        submittedAt: null,
        reviewedAt: null,
        approvedAt: null,
        acknowledgedAt: null,
        publishedAt: null,
        obsoleteDate: null,
        owner: "Admin User",
        createdBy: "Admin User",
        hasFile: false,
        fileName: null,
        description: "",
        obsoleteReason: null,
        supersededById: null
      }
    ]
  }
}
```

## Why This Bug Happened

The ResponseFormatter wraps all data in a `data` object:

```javascript
// ResponseFormatter.success()
static success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data  // ← Everything is wrapped in "data"
  });
}
```

So when the controller returns:
```javascript
return ResponseFormatter.success(res, { documents }, 'My documents retrieved successfully');
```

The actual response becomes:
```javascript
{
  data: {      // ← From ResponseFormatter
    documents  // ← From controller
  }
}
```

## Similar Issues in Other Components

This same bug might exist in other components. Check for patterns like:

```javascript
const data = res.data.something  // Might be wrong
```

Should be:
```javascript
const data = res.data.data?.something || res.data.something  // Correct
```

### Components to Audit:
- ✅ MyDocumentsStatus.jsx - **FIXED**
- [ ] NewDocumentRequest.jsx - Check line where it loads requests
- [ ] DraftDocuments.jsx - Check document loading
- [ ] ReviewAndApproval.jsx - Check document loading
- [ ] PublishedDocuments.jsx - Check document loading
- [ ] SupersededObsolete.jsx - Check document loading
- [ ] Dashboard.jsx - Check metrics loading

## Prevention

### Backend Consistency
All endpoints should use `ResponseFormatter.success()` consistently:

```javascript
// Good - Consistent
return ResponseFormatter.success(res, { items }, 'Success');

// Response: { data: { items: [...] } }
```

### Frontend Consistency
All API calls should access data consistently:

```javascript
// Recommended approach
const items = res.data.data?.items || res.data.items || [];

// Or destructure with fallback
const { data: { items = [] } = {} } = res.data;
```

### Axios Interceptor (Recommended)
Add a response interceptor to handle this automatically:

```javascript
// In api/axios.js
api.interceptors.response.use(
  response => {
    // If response has data.data, flatten it
    if (response.data?.data) {
      response.data = response.data.data;
    }
    return response;
  },
  error => Promise.reject(error)
);
```

## Conclusion

The issue was **NOT** in the database or backend logic. The NDR documents were being created and stored correctly. The problem was purely a frontend bug where the code was accessing the wrong path in the API response object.

**Status**: ✅ **FIXED**

The fix has been applied and all NDR documents should now appear correctly in the My Document Status module.

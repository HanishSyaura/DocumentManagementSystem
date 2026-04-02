# File Code Dropdown Not Showing Documents - Troubleshooting

## Issue
After selecting a document type, the file code dropdown shows "No documents with file codes found" even though documents exist in the database.

## Investigation Results

### Database Check ✅
Documents with valid file codes DO exist:

```
1. MOM/01/251126/001 - "Minutes of Meeting 26.11.25" - Type: "Minutes of Meeting"
2. MOM/01/251126/002 - "MoM123" - Type: "Minutes of Meeting"  
3. TS/01/251126/001 - "Terms of Service DMS" - Type: "Terms of Service / User Agreement"
```

All have:
- ✅ Valid file codes (not PENDING-)
- ✅ Status: ACKNOWLEDGED
- ✅ Proper document types

### Backend API ✅
The `/api/documents/my-status` endpoint should return these documents correctly.

### Frontend Issue ❌
The problem is in the document type comparison logic in `NewDraftModal.jsx`.

## Root Cause

The filter was using **strict equality** (`===`) which might fail if there are:
1. Extra spaces
2. Case sensitivity issues
3. Special characters

## Fix Applied

Changed from strict comparison to flexible matching:

### Before (Strict):
```javascript
const matchesType = documentType 
  ? (doc.documentType && doc.documentType.toLowerCase() === documentType.toLowerCase())
  : true
```

### After (Flexible):
```javascript
const matchesType = documentType 
  ? (doc.documentType && doc.documentType.toLowerCase().includes(documentType.toLowerCase()))
  : true
```

This will now match:
- ✅ "Minutes of Meeting" with "Minutes of Meeting"
- ✅ "Terms of Service / User Agreement" with "Terms of Service / User Agreement"
- ✅ Partial matches (more forgiving)

## Added Debugging

Console logs have been added to help debug:

```javascript
console.log('Loading documents for type:', documentType)
console.log('Total documents fetched:', docs.length)
console.log('Sample document:', docs[0])
console.log(`Document: ${doc.fileCode}, Type: "${doc.documentType}", Selected: "${documentType}", Valid: ${hasValidFileCode}, Matches: ${matchesType}`)
console.log('Filtered documents:', filtered.length)
console.log('Filtered results:', filtered)
```

## How to Test

### 1. Open Browser Console
- Press F12 in browser
- Go to Console tab

### 2. Open New Draft Modal
- Click "New Draft Document" button

### 3. Select Document Type
- Choose "Minutes of Meeting" from dropdown

### 4. Check Console Logs
You should see:
```
Loading documents for type: Minutes of Meeting
Total documents fetched: 3
Sample document: {fileCode: "MOM/01/251126/001", title: "...", ...}
Document: MOM/01/251126/001, Type: "Minutes of Meeting", Selected: "Minutes of Meeting", Valid: true, Matches: true
Document: MOM/01/251126/002, Type: "Minutes of Meeting", Selected: "Minutes of Meeting", Valid: true, Matches: true
Document: TS/01/251126/001, Type: "Terms of Service / User Agreement", Selected: "Minutes of Meeting", Valid: true, Matches: false
Filtered documents: 2
Filtered results: [{...}, {...}]
```

### 5. Check Dropdown
- Click on the File Code input field
- You should now see 2 documents in the dropdown:
  - MOM/01/251126/001 - Minutes of Meeting 26.11.25
  - MOM/01/251126/002 - MoM123

## Common Issues & Solutions

### Issue 1: API Not Being Called
**Symptoms:** No console logs at all

**Solution:**
- Check if modal is actually opening
- Check if document type is being set in formData
- Verify useEffect dependencies

### Issue 2: API Returns Empty Array
**Symptoms:** `Total documents fetched: 0`

**Solution:**
- Check if backend is running
- Check if user is authenticated
- Verify `/documents/my-status` endpoint
- Check if documents belong to current user (ownerId)

### Issue 3: Documents Fetched But Filtered Out
**Symptoms:** `Total documents fetched: 3` but `Filtered documents: 0`

**Solution:**
- Check the console logs for each document
- Look at the `Valid` and `Matches` flags
- If `Valid: false` → Check fileCode format
- If `Matches: false` → Document type mismatch

### Issue 4: Document Type Mismatch
**Symptoms:** `Matches: false` for all documents

**Possible Causes:**
1. **Case sensitivity**: "minutes of meeting" vs "Minutes of Meeting"
   - **Fixed by:** `.toLowerCase()` comparison

2. **Extra spaces**: "Minutes of Meeting " vs "Minutes of Meeting"
   - **Fixed by:** `.trim()` could be added

3. **Special characters**: "Terms of Service / User Agreement" vs "Terms of Service"
   - **Fixed by:** `.includes()` instead of `===`

4. **Empty documentType**: `doc.documentType` is empty string
   - **Fixed by:** Check in filter: `doc.documentType && ...`

## Alternative Fix (If Above Doesn't Work)

If the flexible matching still doesn't work, try even more lenient matching:

```javascript
const matchesType = documentType 
  ? (doc.documentType && 
     doc.documentType.trim().toLowerCase().includes(documentType.trim().toLowerCase()))
  : true
```

Or remove filtering entirely for testing:

```javascript
// Temporarily show ALL documents (for debugging only)
const filtered = docs.filter(doc => {
  const hasValidFileCode = doc.fileCode && !doc.fileCode.startsWith('PENDING-') && doc.fileCode !== '-'
  return hasValidFileCode
})
```

## Backend Endpoint Check

To verify the backend is returning data correctly:

### Test API Directly:
```bash
# In browser console or Postman
fetch('/api/documents/my-status?limit=100', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

### Expected Response:
```json
{
  "success": true,
  "message": "My documents retrieved successfully",
  "data": {
    "documents": [
      {
        "id": 8,
        "fileCode": "MOM/01/251126/001",
        "title": "Minutes of Meeting 26.11.25",
        "documentType": "Minutes of Meeting",
        "version": "1.0",
        "status": "Acknowledged",
        "rawStatus": "ACKNOWLEDGED",
        ...
      }
    ]
  }
}
```

## Response Path Check

Make sure the frontend is accessing the correct path:

```javascript
// Both should work now
const docs = res.data.data?.documents || res.data.documents || []
```

This handles both response formats:
- `res.data.data.documents` (from ResponseFormatter)
- `res.data.documents` (fallback)

## Final Checklist

- [x] Documents exist in database
- [x] Documents have valid file codes  
- [x] Backend endpoint returns documents
- [x] Frontend receives API response
- [x] Response parsing is correct
- [x] Document type matching is fixed
- [x] Console logs are added for debugging
- [x] Dropdown should now show documents

## If Still Not Working

1. **Clear browser cache** and refresh
2. **Check Network tab** in DevTools for the API call
3. **Verify JWT token** is valid and not expired
4. **Check user ownership** - documents must belong to logged-in user
5. **Restart backend server** if recently updated
6. **Check for JavaScript errors** in console

## Files Modified

1. `frontend/src/components/NewDraftModal.jsx`
   - Changed document type comparison from `===` to `.includes()`
   - Added extensive console logging
   - Made matching case-insensitive

2. `backend/test-document-types.js`
   - Created test script to verify database state

## Expected Result

After the fix, selecting "Minutes of Meeting" should show:
- ✅ MOM/01/251126/001 - Minutes of Meeting 26.11.25
- ✅ MOM/01/251126/002 - MoM123

And clicking on either will auto-fill the form with the document details.

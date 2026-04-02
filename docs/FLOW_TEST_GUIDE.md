# DMS Document Flow Testing Guide

## Flow: Draft Documents → Review and Approval

### Current Status
✅ **Backend Fix Applied**: Added `lastUpdated` field to `/api/documents/review-approval` endpoint
✅ **Database Verified**: 3 documents are currently in REVIEW stage (IDs: 9, 10, 11)
✅ **Frontend Logic**: ReviewAndApproval component correctly fetches and displays documents

### Testing Steps

#### 1. Restart Backend Server
```powershell
cd D:\Project\DMS\backend
npm run dev
```

#### 2. Refresh Frontend
- Open browser and navigate to Review and Approval page
- Press Ctrl+Shift+R (hard refresh) to clear cache
- You should now see the 3 pending documents

#### 3. Test the Complete Flow

**Option A: Submit Existing Draft for Review**
1. Go to Draft Documents page
2. Click on a draft document (status: "Draft Saved" or "Acknowledged")
3. Upload a file (if not already uploaded)
4. Assign reviewers
5. Click "Submit for Review"
6. Navigate to Review and Approval page
7. ✅ Document should appear in the list with status "Pending Review"

**Option B: Create New Draft and Submit Directly**
1. Go to Draft Documents page
2. Click "+ New Draft" button
3. Fill in the form:
   - Select File Code (from acknowledged documents)
   - Enter Title
   - Select Document Type
   - Upload File
   - Assign Reviewers
4. Click "Submit for Review" button (not "Save as Draft")
5. Navigate to Review and Approval page
6. ✅ Document should appear immediately with status "Pending Review"

### Expected Results in Review and Approval

The table should show:
- **File Code**: e.g., "TS/01/251126/001"
- **Document Title**: e.g., "Terms of Service DMS"
- **Version**: "1.0"
- **Stage**: "Review"
- **Submitted By**: "System Administrator"
- **Last Updated**: "26/11/2025"
- **Status**: Badge showing "Pending Review"
- **Action**: Dropdown menu with "View" and "Review" options

### Current Documents in Database

According to the database check:
1. **ID 9**: TS/01/251126/001 - "Terms of Service DMS"
2. **ID 10**: MOM/01/251126/002 - "MoM123"
3. **ID 11**: TS/01/251126/002 - "TSDMS"

All are in REVIEW stage with status PENDING_REVIEW.

### Troubleshooting

If documents still don't appear:

1. **Check Backend Console**
   - Look for the API call: `GET /api/documents/review-approval`
   - Verify it returns 3 documents

2. **Check Browser Console**
   - Look for console.log messages:
     - "Fetching review-approval documents..."
     - "API Response:" (should show documents array)
     - "Documents loaded: 3" (should show 3 documents)

3. **Check Network Tab**
   - Find the `review-approval` request
   - Click on it and check the Response tab
   - Should see: `{ success: true, documents: [...] }`

4. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R
   - Or clear all cache in browser settings

### API Endpoint Details

**GET** `/api/documents/review-approval`

**Response Format:**
```json
{
  "success": true,
  "message": "Review and approval documents retrieved successfully",
  "documents": [
    {
      "id": 9,
      "fileCode": "TS/01/251126/001",
      "title": "Terms of Service DMS",
      "documentType": "Terms of Service / User Agreement",
      "version": "1.0",
      "submittedDate": "26/11/2025",
      "submittedBy": "System Administrator",
      "lastUpdated": "26/11/2025",
      "stage": "Review",
      "currentStage": "Review",
      "status": "Pending Review"
    }
  ]
}
```

### Next Steps After Verification

Once the Review and Approval page displays documents correctly:

1. **Test Review Actions**
   - Click "Review" button on a document
   - Fill in the review form
   - Submit review

2. **Test Approval Flow**
   - After review, document should move to APPROVAL stage
   - Should appear in Review and Approval with stage "Approval"

3. **Test the Complete Workflow**
   - Draft → Review → Approval → Published

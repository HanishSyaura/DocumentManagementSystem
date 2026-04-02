# Testing Guide: Supersede/Obsolete Request Workflow

## ✅ Implementation Complete!

The supersede/obsolete workflow system has been fully implemented. Documents now go through a proper review and approval process before being marked as obsolete or superseded.

## Prerequisites

1. **Restart Backend Server** (to load new Prisma Client):
   ```bash
   cd backend
   npm start
   ```

2. **Ensure Frontend is Running**:
   ```bash
   cd frontend
   npm start
   ```

3. **Test Users Needed**:
   - **Requester**: Any user who can create requests
   - **Reviewer**: User with review permissions
   - **Approver**: User with approval permissions
   - **Admin**: For full access

## Workflow Overview

```
1. CREATE REQUEST (Requester)
   ↓
2. PENDING REVIEW (Status visible in list)
   ↓
3. REVIEW (Reviewer approves/rejects)
   ↓
4. PENDING APPROVAL (If approved by reviewer)
   ↓
5. APPROVE (Approver makes final decision)
   ↓
6. DOCUMENT MARKED AS OBSOLETE/SUPERSEDED (Only after approval)
```

---

## Test Case 1: Create Supersede/Obsolete Request

### Steps:
1. Navigate to **"Superseded & Obsolete Documents"** page
2. Click **"Request for Supersede/Obsolete"** button
3. Click **"Click to select a published document"**
4. Select a published document from the list
5. Choose action type: **"Supersede"** or **"Obsolete"**
6. If Supersede:
   - Type in the search box to find a superseding document
   - Select the new document that replaces the old one
7. Enter a reason (e.g., "Document is outdated")
8. Click **"Submit"**

### Expected Result:
✅ Success message: "Supersede/Obsolete request submitted successfully!"
✅ Request appears in the list with status **"Pending Review"**
✅ Document itself is still **"Published"** (not yet obsolete)

---

## Test Case 2: Review Request (Reviewer Role)

### Steps:
1. In **"Superseded & Obsolete Documents"** page
2. Find request with status **"Pending Review"**
3. Click **"Review"** in the Actions column
4. Review the document details
5. Enter review comments
6. Choose action:
   - **Option A**: Click **"Proceed"** to approve
   - **Option B**: Click **"Reject"** to reject

### Expected Result (Option A - Approve):
✅ Success message: "Request approved and forwarded for final approval!"
✅ Request status changes to **"Pending Approval"**

### Expected Result (Option B - Reject):
✅ Success message: "Request rejected successfully!"
✅ Request status changes to **"Rejected"**
✅ Document remains **"Published"**

---

## Test Case 3: Final Approval (Approver Role)

### Steps:
1. In **"Superseded & Obsolete Documents"** page
2. Find request with status **"Pending Approval"**
3. Click **"Approve"** in the Actions column
4. Review the document details and previous comments
5. Enter approval comments (optional)
6. Choose action:
   - **Option A**: Click **"Approve"** for final approval
   - **Option B**: Click **"Reject"** to reject

### Expected Result (Option A - Approve):
✅ Success message: "Request approved successfully! Document has been marked as obsolete/superseded."
✅ Request status changes to **"Approved"**
✅ **IMPORTANT**: Document status now changes to **"OBSOLETE"** or **"SUPERSEDED"**

### Expected Result (Option B - Reject):
✅ Success message: "Request rejected successfully!"
✅ Request status changes to **"Rejected"**
✅ Document remains **"Published"**

---

## Test Case 4: Verify Document Status Changed

### Steps:
1. Navigate to **"My Documents Status"** page
2. Find the document that was approved for obsolete/supersede
3. Check the document status

### Expected Result:
✅ Document status shows **"Obsolete"** or **"Superseded"**
✅ Document appears in the **"Archived"** count card

---

## Test Case 5: View Request History

### Steps:
1. In **"Superseded & Obsolete Documents"** page
2. Click on any request to view details

### Expected Result:
✅ Shows complete request information:
   - Document details (file code, title, version)
   - Action type (Supersede/Obsolete)
   - Reason for request
   - Requested by (name)
   - Review status and comments
   - Approval status and comments
   - Created/Updated timestamps

---

## Test Case 6: Filter and Search Requests

### Steps:
1. In **"Superseded & Obsolete Documents"** page
2. Use the search box to search by:
   - File code
   - Document title
   - Requester name
3. Use dropdown filters:
   - **Action Type**: All / Supersede / Obsolete
   - **Status**: All / Pending Review / Pending Approval / Approved / Rejected

### Expected Result:
✅ List filters correctly based on search and filter criteria
✅ Results update in real-time

---

## Test Case 7: Create Request from Published Documents

### Steps:
1. Navigate to **"Published Documents"** page
2. Select a folder with published documents
3. Click **"Actions"** menu (⋮) on any published document
4. Click **"Obsolete"** or **"Supersede"**
5. Complete the modal form
6. Submit

### Expected Result:
✅ Success message: "Supersede/Obsolete request submitted successfully!"
✅ Request created and visible in "Superseded & Obsolete Documents" page

---

## API Endpoints for Manual Testing

### Create Request
```bash
POST /api/supersede-requests
Body: {
  "documentId": 1,
  "actionType": "OBSOLETE",
  "reason": "Document is outdated"
}
```

### List All Requests
```bash
GET /api/supersede-requests
```

### Review Request
```bash
POST /api/supersede-requests/:id/review
Body: {
  "action": "approve",
  "comments": "Looks good"
}
```

### Approve Request
```bash
POST /api/supersede-requests/:id/approve
Body: {
  "comments": "Approved for obsoleting"
}
```

### Reject Request
```bash
POST /api/supersede-requests/:id/reject
Body: {
  "reason": "Not ready yet"
}
```

---

## Database Verification

### Check Requests Table
```sql
SELECT * FROM SupersedeObsoleteRequest ORDER BY createdAt DESC;
```

### Check Document Status
```sql
SELECT id, fileCode, title, status FROM Document WHERE status IN ('OBSOLETE', 'SUPERSEDED');
```

### Check Request with Full Details
```sql
SELECT 
  sor.*,
  d.fileCode,
  d.title,
  u.email as requester
FROM SupersedeObsoleteRequest sor
JOIN Document d ON sor.documentId = d.id
JOIN User u ON sor.requestedById = u.id;
```

---

## Common Issues & Troubleshooting

### Issue: "Prisma Client could not be generated"
**Solution**: Restart your backend server
```bash
cd backend
npm start
```

### Issue: "Table SupersedeObsoleteRequest doesn't exist"
**Solution**: Schema was pushed but might need migration
```bash
cd backend
npx prisma db push
npx prisma generate
```

### Issue: Requests not showing up
**Solution**: Check console logs and verify API call
- Open browser DevTools (F12)
- Go to Network tab
- Look for `/supersede-requests` call
- Check response data

### Issue: "Cannot read property 'id' of null"
**Solution**: The document ID might not be passed correctly
- Check that `selectedDoc` is set before submission
- Verify form data includes `documentId`

---

## Success Criteria

✅ Requests can be created from both modules
✅ Requests appear with correct status in the list
✅ Reviewers can approve or reject requests
✅ Approvers can make final approval
✅ Documents only become obsolete AFTER final approval
✅ Rejected requests don't affect document status
✅ Request history is tracked and visible
✅ Search and filters work correctly

---

## Next Steps (Optional Enhancements)

1. **Email Notifications**: Notify reviewers/approvers when requests are created
2. **SLA Tracking**: Track how long requests stay in each stage
3. **Bulk Actions**: Allow bulk approve/reject
4. **Audit Trail**: Enhanced history view with all actions
5. **Dashboard Widget**: Show pending request count on dashboard
6. **Role-Based Access**: Restrict who can review/approve based on document type

---

## Implementation Summary

### Backend Files Created/Modified:
- ✅ `prisma/schema.prisma` - Added SupersedeObsoleteRequest model
- ✅ `src/services/supersedeRequestService.js` - Business logic
- ✅ `src/controllers/supersedeRequestController.js` - API handlers
- ✅ `src/routes/supersedeRequests.js` - Route definitions
- ✅ `src/app.js` - Registered new routes

### Frontend Files Modified:
- ✅ `components/SupersededObsolete.jsx` - Lists requests from new API
- ✅ `components/RequestSupersedeModal.jsx` - Creates requests
- ✅ `components/ReviewSupersedeModal.jsx` - Review workflow
- ✅ `components/ApproveSupersedeModal.jsx` - Approval workflow
- ✅ `components/PublishedDocuments.jsx` - Updated handler messages

### Database Changes:
- ✅ New table: `SupersedeObsoleteRequest`
- ✅ New enums: `SupersedeAction`, `RequestStatus`, `RequestWorkflowStage`
- ✅ Relations added to `Document` and `User` models

---

**Ready to test!** 🚀

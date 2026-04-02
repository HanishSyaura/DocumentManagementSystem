# New Draft Workflow Implementation

## Overview
Implemented a new workflow for draft documents where:
1. NDR (New Document Request) → Status: `PENDING_ACKNOWLEDGMENT`
2. After Acknowledgement → Status: `DRAFTING` (moves to Draft Documents module)
3. User uploads file + assigns reviewers in Draft module
4. After both actions complete → Status: `WAITING_FOR_REVIEW` (moves to Review module)

## Changes Made

### Backend Changes

#### 1. Updated Document Status Flow (`documentService.js`)
- **File**: `backend/src/services/documentService.js`
- **Changes**:
  - Line 641: Changed acknowledgement status from `ACKNOWLEDGED` to `DRAFTING`
  - Line 684: Updated document register status to `DRAFTING`
  - Lines 698-778: Added new `submitDraftForReview()` method that:
    - Validates file upload
    - Validates reviewer assignment
    - Changes status to `PENDING_REVIEW` and stage to `REVIEW`
    - Creates approval history records for reviewers
    - Updates document register

#### 2. Added DRAFTING Status Label (`documentController.js`)
- **File**: `backend/src/controllers/documentController.js`
- **Changes**:
  - Line 368: Added `'DRAFTING': 'Drafting'` to status map
  - Lines 770-792: Added `submitDraftForReview()` controller method

#### 3. Fixed getUserDrafts Filter (`documentService.js`)
- **File**: `backend/src/services/documentService.js`
- **Changes**:
  - Line 341: Changed filter from `status: 'DRAFT'` to `stage: 'DRAFT'`
  - This ensures documents with status `DRAFTING` and stage `DRAFT` are returned

#### 4. Added New Route (`documents.js`)
- **File**: `backend/src/routes/documents.js`
- **Changes**:
  - Line 17: Added route `POST /:id/submit-for-review`

### Frontend Changes

#### 1. Updated Draft Documents Component (`DraftDocuments.jsx`)
- **File**: `frontend/src/components/DraftDocuments.jsx`
- **Changes**:
  - Lines 5-6: Added imports for `UploadFileModal` and `AssignReviewerModal`
  - Lines 20-22: Added state for selected document and modal visibility
  - Lines 124-134: Added `handleUploadFile()` and `handleAssignReviewer()` handlers
  - Lines 136-156: Updated `handleSubmit()` to validate file upload and reviewer assignment
  - Lines 194-206: Added modal components to JSX
  - Lines 325-346: Added Upload and Reviewer buttons to desktop table
  - Lines 380-408: Added Upload and Reviewer buttons to mobile cards

#### 2. Created Assign Reviewer Modal (`AssignReviewerModal.jsx`)
- **File**: `frontend/src/components/AssignReviewerModal.jsx`
- **Features**:
  - Loads active users from `/api/users` endpoint
  - Displays checkboxes for reviewer selection
  - Submits to `/api/documents/:id/submit-for-review` with `reviewerIds`
  - Shows count of selected reviewers
  - Calls `onSuccess` callback to reload documents after submission

#### 3. Upload File Modal (Already Exists)
- **File**: `frontend/src/components/UploadFileModal.jsx`
- **Usage**: Used for uploading document files to `/api/documents/:id/upload`

## Workflow Summary

### Old Flow
```
NDR → Pending Acknowledgement
  ↓
Acknowledge → Status: ACKNOWLEDGED, Stage: DRAFT
  ↓
Upload file & assign reviewers together
```

### New Flow
```
NDR → Status: PENDING_ACKNOWLEDGMENT
  ↓
Acknowledge → Status: DRAFTING, Stage: DRAFT (shows in Draft Documents)
  ↓
Upload File (button in Draft Documents)
  ↓
Assign Reviewers (button in Draft Documents)
  ↓
Submit for Review → Status: PENDING_REVIEW, Stage: REVIEW
```

## API Endpoints

### New Endpoint
- **POST** `/api/documents/:id/submit-for-review`
  - **Body**: `{ reviewerIds: [1, 2, 3] }`
  - **Validates**:
    - Document is in DRAFTING status
    - File has been uploaded
    - At least one reviewer is assigned
  - **Actions**:
    - Changes status to `PENDING_REVIEW`
    - Changes stage to `REVIEW`
    - Creates approval history records
    - Updates document register

### Modified Endpoints
- **GET** `/api/documents/drafts`
  - Now filters by `stage: 'DRAFT'` instead of `status: 'DRAFT'`
  - Returns documents with status `DRAFTING`

## Status Values

### Document Statuses
- `PENDING_ACKNOWLEDGMENT` - NDR waiting for acknowledgement
- `DRAFTING` - After acknowledgement, before file upload + reviewer assignment  
- `PENDING_REVIEW` - After file upload + reviewers assigned, waiting for review
- `IN_REVIEW` - Being reviewed
- `PENDING_APPROVAL` - Waiting for approval
- etc.

### Document Stages
- `ACKNOWLEDGMENT` - In NDR module
- `DRAFT` - In Draft Documents module
- `REVIEW` - In Review module
- `APPROVAL` - In Approval module

## Testing Steps

1. **Create NDR**
   - Go to NDR module
   - Create new document request
   - Verify status is `PENDING_ACKNOWLEDGMENT`

2. **Acknowledge NDR**
   - Acknowledge the request
   - Verify file code is assigned
   - Verify status changes to `DRAFTING`
   - Verify document appears in Draft Documents module

3. **Upload File**
   - Go to Draft Documents
   - Click "Upload" button
   - Upload a .docx or .pdf file
   - Verify file is uploaded successfully

4. **Assign Reviewers**
   - Click "Reviewer" button
   - Select one or more reviewers
   - Click "Assign & Submit for Review"
   - Verify submission is successful

5. **Verify Review Stage**
   - Verify document disappears from Draft Documents
   - Verify status is `PENDING_REVIEW`
   - Verify document appears in Review module
   - Verify reviewers receive notification (if implemented)

## Files Modified

### Backend
- `backend/src/services/documentService.js`
- `backend/src/controllers/documentController.js`
- `backend/src/routes/documents.js`

### Frontend
- `frontend/src/components/DraftDocuments.jsx`
- `frontend/src/components/AssignReviewerModal.jsx` (new file)

## Notes

- The "New Draft" button in Draft Documents still exists for directly creating drafts (bypassing NDR flow)
- Documents can only be submitted for review after BOTH file upload AND reviewer assignment
- The workflow ensures all documents in Draft module have proper file codes assigned
- My Document Status module will automatically show the correct status for documents at each stage

# DMS UAT Testing Guide

## Overview
This document provides a comprehensive guide for executing User Acceptance Testing (UAT) on the Document Management System (DMS).

## Test Environment Setup

### Prerequisites
1. **Backend Server**: Running on http://localhost:5000
2. **Frontend Server**: Running on http://localhost:5173
3. **Database**: MySQL with all migrations applied
4. **Test Users**: At least 4 users with different roles:
   - Drafter (creates documents)
   - Reviewer (reviews documents)
   - Approver (approves documents)
   - Document Controller/Acknowledger (publishes documents)

### Setup Commands
```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Test Execution Strategy

### Phase 1: Module-by-Module Testing
Test each module independently before integration testing.

### Phase 2: End-to-End Workflow Testing
Test complete document lifecycle from NDR to Published.

### Phase 3: Negative Testing
Test error handling and validation.

---

## 1. New Document Request (NDR) Module

### TC-NDR-01: Create New Document Request

**Pre-conditions:**
- User logged in with Drafter role
- At least one Document Type exists in database
- At least one Project Category exists in database

**Test Steps:**
1. Navigate to "New Document Request" module
2. Fill in the following fields:
   - **Document Title**: "Test Document TC-NDR-01"
   - **Document Type**: Select "Project Plan"
   - **Project Category**: Select "Internal"
   - **Document Date**: Select today's date
   - **Remarks**: "This is a test document for UAT"
3. Click "Submit NDR" button

**Expected Results:**
- Success message displayed: "Document request created successfully"
- Auto-generated file code appears in the response
- Navigate to "Document Request List" and verify:
  - New entry exists with correct title
  - File code is displayed (format: PREFIX/VERSION/YYMMDD/RunningNumber)
  - Status shows "Draft Saved"
- Navigate to "Master Record" and verify:
  - Document is registered with all metadata
  - File code, title, type, and date are correct

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-NDR-02: File Code Generation Logic

**Pre-conditions:**
- User logged in
- At least one document already exists with same prefix

**Test Steps:**
1. Create first NDR with:
   - Document Type: "Project Plan" (prefix: PP)
   - Project Category: "Internal"
2. Note the generated file code (e.g., PP/1.0/251125/001)
3. Create second NDR with same settings
4. Note the second file code (e.g., PP/1.0/251125/002)
5. Create third NDR with different Document Type: "MoM"
6. Note the third file code (should have different prefix)

**Expected Results:**
- File code format follows: Prefix/Version/YYMMDD/RunningNumber
- Running number increments correctly:
  - First document: 001
  - Second document: 002
- Different document types use different prefixes:
  - Project Plan: PP
  - MoM: MOM
- Same date in YYMMDD format for documents created on same day

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-NDR-03: Retrieve Template

**Pre-conditions:**
- At least one template uploaded for a document type
- User has access to templates

**Test Steps:**
1. Navigate to "Document Request List" or "Templates" section
2. Locate a document type with template
3. Click "Download Template" button

**Expected Results:**
- Template file downloads successfully
- Downloaded file can be opened
- File name matches expected template name
- File is not corrupted

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-NDR-04: NDR Recorded in Master Module

**Pre-conditions:**
- Complete TC-NDR-01 successfully

**Test Steps:**
1. Create a new document request
2. Note the file code generated
3. Navigate to "Master Record" module
4. Search for the file code or filter by today's date

**Expected Results:**
- Master Module displays new record
- All metadata is present:
  - File Code
  - Document Title
  - Document Type
  - Version (1.0)
  - Registered Date
  - Owner (your name)
  - Status (Draft)

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

## 2. Draft Documents Module

### TC-DRAFT-01: Auto Fill Based on File Code

**Pre-conditions:**
- Valid file code exists from previous NDR
- User has Drafter role

**Test Steps:**
1. Navigate to "Draft Documents" module
2. Click "Upload Draft" or "New Draft"
3. Enter or select existing file code
4. Observe form fields

**Expected Results:**
- All metadata fields auto-populate:
  - Document Title
  - Document Type
  - Project Category
  - Version
  - Owner
- No manual entry required for pre-existing data

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-DRAFT-02: Upload Draft Document

**Pre-conditions:**
- Valid NDR exists (file code available)
- Have a draft document file (PDF/DOCX)

**Test Steps:**
1. Navigate to "Draft Documents"
2. Select the NDR/document
3. Click "Upload File" or "Upload Draft"
4. Select file from local machine (max 50MB)
5. Click "Upload"

**Expected Results:**
- File uploads successfully
- Progress indicator shown during upload
- Success message: "Document uploaded successfully"
- File appears in document versions
- Draft item created/updated with file information

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-DRAFT-03: Assign Reviewer

**Pre-conditions:**
- Draft document uploaded
- At least one user with Reviewer role exists

**Test Steps:**
1. Open draft document details
2. Click "Assign Reviewer" or similar button
3. Select reviewer from dropdown/modal
4. Click "Assign" or "Save"

**Expected Results:**
- Reviewer successfully assigned
- Notification sent to reviewer (check notifications)
- Document shows reviewer name
- Reviewer can see document in their pending tasks

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-DRAFT-04: Save as Draft

**Pre-conditions:**
- User in draft editing mode

**Test Steps:**
1. Create or edit a draft document
2. Make some changes (title, description, etc.)
3. Click "Save as Draft" button (not "Submit for Review")

**Expected Results:**
- Document saved successfully
- Success message displayed
- Status remains "DRAFT"
- No notifications sent to reviewers
- Can continue editing later

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-DRAFT-05: Submit for Review

**Pre-conditions:**
- Draft document complete with file uploaded
- Reviewer assigned (or workflow auto-assigns)

**Test Steps:**
1. Open complete draft document
2. Click "Submit for Review" button
3. Confirm submission if prompted

**Expected Results:**
- Status changes to "Pending Review" or "IN_REVIEW"
- Stage changes to "REVIEW"
- Reviewer receives notification
- Document appears in reviewer's pending tasks
- Drafter cannot edit document anymore
- Success message: "Document submitted for review successfully"

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

## 3. Review & Approval Module

### TC-REV-01: Reviewer Receives Notification

**Pre-conditions:**
- Document submitted for review (TC-DRAFT-05 complete)
- Logged in as Reviewer

**Test Steps:**
1. Login as reviewer user
2. Check notification bell icon (top right)
3. Check "Review & Approval" module

**Expected Results:**
- System notification appears for new review task
- Notification shows:
  - Document title
  - File code
  - Submitted by (drafter name)
  - Action required: Review
- Document appears in "Pending Review" list

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-REV-02: Reviewer Returns for Correction

**Pre-conditions:**
- Document in review stage
- Logged in as Reviewer

**Test Steps:**
1. Navigate to "Review & Approval" module
2. Open document pending review
3. Click "Review" or "Take Action"
4. Select "Return for Amendments" or "Reject"
5. Enter comments: "Please update section 3.2"
6. Click "Submit"

**Expected Results:**
- Document returns to "Draft Documents" module
- Status changes to "RETURNED"
- Stage returns to "DRAFT"
- Uploader (drafter) receives notification
- Comments visible to drafter
- Drafter can edit and resubmit

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-REV-03: Reviewer Proceeds to Approval

**Pre-conditions:**
- Document in review stage
- At least one Approver user exists

**Test Steps:**
1. Login as Reviewer
2. Open document pending review
3. Click "Review" button
4. Select "Approve" or "Proceed to Approval"
5. Select/assign approver from list
6. Add optional comments
7. Click "Submit"

**Expected Results:**
- Reviewer assigns approver successfully
- Approver receives notification
- Status changes to "PENDING_APPROVAL"
- Stage changes to "APPROVAL"
- Document moves to approver's pending tasks
- Reviewer's action recorded in approval history

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-REV-04: Approver Returns for Amendment

**Pre-conditions:**
- Document in approval stage
- Logged in as Approver

**Test Steps:**
1. Navigate to "Review & Approval" module
2. Open document pending approval
3. Click "Approve/Reject" button
4. Select "Return for Amendments"
5. Enter reason: "Financial figures need verification"
6. Click "Submit"

**Expected Results:**
- Document returns to drafter
- Status changes to "RETURNED"
- Stage returns to "DRAFT"
- Drafter receives notification
- Comments visible to drafter
- Complete workflow history maintained

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-REV-05: Multi-level Approval

**Pre-conditions:**
- Workflow configured with multiple approval levels
- Document passed first approval

**Test Steps:**
1. First approver approves document
2. First approver assigns second approver
3. Login as second approver
4. Review document
5. Second approver approves

**Expected Results:**
- Both approval stages work correctly
- Each approver receives notification at appropriate time
- Status updates accurately:
  - After first approval: "IN_APPROVAL" (Level 1 Complete)
  - After second approval: "APPROVED"
- Approval history shows both approvers
- Final approval moves to acknowledgment stage

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-REV-06: Final Approval Completed

**Pre-conditions:**
- All required approvals completed
- Document Controller role exists

**Test Steps:**
1. Complete all approval levels
2. Check final approver's action
3. Login as Document Controller
4. Check notifications

**Expected Results:**
- System notifies Document Controller
- Status changes to "APPROVED" or "PENDING_ACKNOWLEDGMENT"
- Stage changes to "ACKNOWLEDGMENT"
- Document appears in Document Controller's pending tasks
- Ready to be published
- Complete approval history visible

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

## 4. Document Publishing (Document Controller)

### TC-PUB-01: Acknowledge Document

**Pre-conditions:**
- Document approved by all approvers
- Logged in as Document Controller

**Test Steps:**
1. Navigate to "Review & Approval" or dedicated acknowledgment section
2. Open approved document
3. Click "Acknowledge" button

**Expected Results:**
- Document Controller can open document
- Acknowledge button is active
- Document details visible

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-PUB-02: Upload Final PDF

**Pre-conditions:**
- Document in acknowledgment stage
- Have final PDF version ready

**Test Steps:**
1. Open document for acknowledgment
2. Click "Upload Final PDF" or similar
3. Select final PDF file
4. Click "Upload"

**Expected Results:**
- Final PDF uploaded successfully
- New version created
- isPublished flag set appropriately
- File stored in correct location

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-PUB-03: Assign Folder

**Pre-conditions:**
- Document ready for publishing
- Folder structure exists

**Test Steps:**
1. In publish workflow
2. Select "Assign Folder" or see folder dropdown
3. Browse folder tree or select from list
4. Select target folder
5. Click "Assign" or "Save"

**Expected Results:**
- Folder selection successful
- Document associated with selected folder
- Folder path displayed in document details

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-PUB-04: Publish Document

**Pre-conditions:**
- Final PDF uploaded
- Folder assigned
- All acknowledgment steps complete

**Test Steps:**
1. Review all document details
2. Click "Publish" button
3. Confirm publication if prompted

**Expected Results:**
- Document status changes to "PUBLISHED"
- Stage changes to "PUBLISHED"
- Document appears in "Published Documents" module
- File stored in assigned folder
- Document accessible to all authorized users
- Original drafter receives notification
- Master Record updated with published status

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

## 5. Supersede & Obsolete Module

### TC-SO-01: Raise Supersede Request

**Pre-conditions:**
- At least one published document exists
- User has permission to raise supersede

**Test Steps:**
1. Navigate to "Published Documents" or "Supersede & Obsolete"
2. Select document to supersede
3. Click "Request Supersede" or similar
4. Fill in:
   - New document file code (or create new)
   - Reason for superseding
5. Click "Submit Request"

**Expected Results:**
- Request recorded successfully
- Document Controller notified
- Request appears in pending supersede requests
- Master Module shows request status
- Original document still active until approval

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-SO-02: Raise Obsolete Request

**Pre-conditions:**
- Published document exists
- User has permission to obsolete

**Test Steps:**
1. Navigate to document to be obsoleted
2. Click "Request Obsolete" or similar
3. Fill in:
   - Reason for obsoleting
   - Effective date (optional)
4. Click "Submit"

**Expected Results:**
- Obsolete request created successfully
- Document Controller/Approver notified
- Request pending approval
- Master Module updated with obsolete request
- Document still active until approved

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-SO-03: Review & Approve Supersede/Obsolete

**Pre-conditions:**
- Supersede/Obsolete request exists
- Logged in as approver/Document Controller

**Test Steps:**
1. Review supersede/obsolete request
2. Verify reason and details
3. Click "Approve" or "Reject"
4. Add comments if needed
5. Submit decision

**Expected Results:**
- Request follows same approval workflow as draft documents
- Notifications sent at each stage
- Status updated correctly:
  - Approved: Original becomes SUPERSEDED/OBSOLETE
  - Rejected: Request cancelled, original remains active
- Master Module reflects new status:
  - Old version marked as superseded/obsolete
  - New version registered (for supersede)
  - Version history maintained
- Obsolete documents moved to archive

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

## 6. Master Module

### TC-MASTER-01: NDR Registration

**Pre-conditions:**
- NDRs created in previous tests

**Test Steps:**
1. Navigate to "Master Record" module
2. View "New Document Register" tab/section
3. Filter by date range (today)

**Expected Results:**
- All NDRs appear in register
- Correct metadata for each:
  - File Code
  - Document Title
  - Document Type
  - Version (1.0)
  - Registered Date
  - Owner
  - Department (if applicable)
  - Status

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-MASTER-02: Version Update Registration

**Pre-conditions:**
- Document with multiple versions exists

**Test Steps:**
1. Navigate to "Master Record"
2. View "Version Register" tab
3. Search for document with multiple versions

**Expected Results:**
- New versions recorded correctly
- Version register shows:
  - File Code
  - Document Title
  - Previous Version
  - New Version
  - Version Date
  - Updated By
  - Change Summary (if provided)
- Old versions archived but accessible
- Clear version history timeline

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-MASTER-03: Superseded & Obsolete Status

**Pre-conditions:**
- Documents with SUPERSEDED and OBSOLETE status exist

**Test Steps:**
1. Navigate to "Master Record"
2. View "Obsolete Register" tab
3. Filter or search for superseded/obsolete documents

**Expected Results:**
- Master Module reflects correct statuses:
  - Active: Current published documents
  - Superseded: Old versions replaced by new
  - Obsolete: No longer in use
- Each entry shows:
  - File Code
  - Status
  - Obsolete Date
  - Reason
  - Replaced By (for superseded)
- Historical data preserved

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-MASTER-04: End-to-End Lifecycle Tracking

**Pre-conditions:**
- Complete document lifecycle from NDR to Obsolete

**Test Steps:**
1. Select a document with complete lifecycle
2. View document history in Master Record
3. Check approval history
4. Check version history

**Expected Results:**
- Complete lifecycle history visible:
  1. NDR → Document Request Created
  2. Draft → File Uploaded
  3. Review → Submitted, Reviewed
  4. Approval → Approved
  5. Publish → Acknowledged & Published
  6. Supersede/Obsolete → Status changed
- All timestamps accurate
- All actors recorded (who did what when)
- Comments/reasons preserved
- Complete audit trail

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

## 7. Negative Test Cases (Very Important)

### TC-NEG-01: Missing Required Fields

**Test Scenarios:**

#### Scenario A: NDR without Title
1. Navigate to New Document Request
2. Leave "Document Title" empty
3. Fill other required fields
4. Click Submit

**Expected:** Error message "Title is required", form not submitted

#### Scenario B: NDR without Document Type
1. Fill title but leave document type empty
2. Try to submit

**Expected:** Error message "Document type is required"

#### Scenario C: Draft without File Upload
1. Try to submit draft for review without uploading file
2. Click Submit for Review

**Expected:** Error message "File is required before submission"

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-NEG-02: Upload Wrong File Type

**Pre-conditions:**
- Draft document open for file upload

**Test Steps:**
1. Click "Upload File"
2. Select an executable file (.exe, .bat, .sh)
3. Try to upload

**Expected Results:**
- System rejects invalid file format
- Error message: "Invalid file type. Only PDF, DOCX, XLSX allowed"
- No file uploaded
- System remains secure (no code execution)

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-NEG-03: Reviewer/Approver Not Assigned

**Test Steps:**
1. Create draft document
2. Try to submit for review without assigning reviewer
3. Or reviewer tries to proceed to approval without assigning approver

**Expected Results:**
- System prevents submission
- Error message: "Please assign a reviewer before submitting"
- Or: "Please assign an approver to proceed"
- Workflow cannot progress without required assignments

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

### TC-NEG-04: Invalid File Code

**Test Steps:**
1. Navigate to draft upload
2. Enter invalid/non-existent file code: "INVALID-999"
3. Try to proceed

**Expected Results:**
- System does not allow upload
- Error message: "Invalid file code" or "Document not found"
- No data corruption
- User cannot bypass validation

**Pass/Fail:** [ ]

**Notes:**
_______________________________________________________________________

---

## Additional Negative Test Cases

### TC-NEG-05: File Size Limit Exceeded
**Test:** Upload file > 50MB
**Expected:** Error "File size exceeds maximum limit of 50MB"

### TC-NEG-06: Unauthorized Access
**Test:** Drafter tries to approve document
**Expected:** Error "You do not have permission to perform this action"

### TC-NEG-07: Duplicate File Code
**Test:** Manually create document with existing file code
**Expected:** Error "File code already exists"

### TC-NEG-08: Edit Published Document
**Test:** Try to edit a published document
**Expected:** Error "Cannot edit published documents. Create a new version instead."

### TC-NEG-09: Delete Document in Review
**Test:** Try to delete document currently in review
**Expected:** Error "Cannot delete document in review/approval workflow"

### TC-NEG-10: Invalid Date Range
**Test:** Search with start date after end date
**Expected:** Error "Start date cannot be after end date"

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] All servers running
- [ ] Database seeded with test data
- [ ] Test users created with correct roles
- [ ] Sample documents and templates uploaded
- [ ] Backup database before testing

### During Testing
- [ ] Document all failures with screenshots
- [ ] Note unexpected behaviors
- [ ] Record error messages exactly as displayed
- [ ] Test on different browsers if web-based
- [ ] Test with different user roles

### Post-Test
- [ ] Compile test results
- [ ] Categorize issues by severity:
  - Critical: System crash, data loss
  - High: Feature not working
  - Medium: Incorrect behavior
  - Low: UI/UX issues
- [ ] Create bug reports for failures
- [ ] Verify all pass/fail criteria met

---

## Bug Report Template

**Bug ID:** [AUTO-GENERATED]
**Test Case:** [TC-XXX-XX]
**Title:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Status:** Open / In Progress / Fixed / Closed

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach screenshots]

**Environment:**
- OS: 
- Browser: 
- Server Version: 

**Notes:**
[Additional information]

---

## Sign-Off

### Test Summary
- Total Test Cases: 35
- Passed: ___
- Failed: ___
- Blocked: ___
- Not Executed: ___

### Tester Sign-Off
**Name:** ________________________
**Role:** ________________________
**Date:** ________________________
**Signature:** ________________________

### Stakeholder Approval
**Name:** ________________________
**Role:** ________________________
**Date:** ________________________
**Signature:** ________________________

---

## Appendix: Quick Reference

### Test User Accounts
| Username | Role | Password |
|----------|------|----------|
| drafter@test.com | Drafter | Test@123 |
| reviewer@test.com | Reviewer | Test@123 |
| approver@test.com | Approver | Test@123 |
| controller@test.com | Document Controller | Test@123 |

### Document Types & Prefixes
| Type | Prefix |
|------|--------|
| Minutes of Meeting | MOM |
| Project Plan | PP |
| Requirement Analysis | PRA |
| Design Document | DD |
| SOP | SOP |
| Policy | POL |

### Project Categories
- Internal (INT)
- External (EXT)
- Client (CLI)
- R&D (RND)

### Common API Endpoints for Testing
- POST `/api/documents/requests` - Create NDR
- POST `/api/documents/:id/upload` - Upload file
- POST `/api/workflow/submit/:documentId` - Submit for review
- POST `/api/workflow/review/:documentId` - Review document
- POST `/api/workflow/approve/:documentId` - Approve document
- POST `/api/workflow/acknowledge/:documentId` - Acknowledge & publish

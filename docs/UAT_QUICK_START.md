# DMS UAT Quick Start Guide

## 🚀 Fast Track to UAT Testing

This guide gets you from zero to testing in minutes.

---

## Step 1: Environment Setup (5 minutes)

### Backend Setup
```bash
# Navigate to backend
cd D:\Project\DMS\backend

# Install dependencies (if not already done)
npm install

# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Seed test data
node prisma/seed-uat.js

# Start backend server
npm run dev
```

**Expected Output:**
```
✅ Roles created successfully
✅ Test users created successfully
✅ Document types created successfully
✅ Project categories created successfully
✅ Sample folders created successfully
✅ Basic workflows created successfully
✅ System configuration created successfully
🎉 UAT test data seeding completed successfully!

Server running on http://localhost:5000
```

### Frontend Setup (New Terminal)
```bash
# Navigate to frontend
cd D:\Project\DMS\frontend

# Install dependencies (if not already done)
npm install

# Start frontend server
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## Step 2: Verify System (2 minutes)

### Quick System Check

1. **Open browser:** http://localhost:5173
2. **Login as Drafter:**
   - Email: `drafter@test.com`
   - Password: `Test@123`
3. **Verify you see:**
   - Dashboard loads
   - Sidebar menu appears
   - No console errors

✅ If successful, proceed to Step 3

---

## Step 3: Begin UAT Testing

### Test Sequence Overview

```
┌──────────────────────────────────────────────────────────┐
│                    UAT Test Flow                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. New Document Request (NDR)                          │
│     ↓                                                    │
│  2. Draft Documents (Upload File)                       │
│     ↓                                                    │
│  3. Submit for Review                                   │
│     ↓                                                    │
│  4. Review Document (as Reviewer)                       │
│     ↓                                                    │
│  5. Approve Document (as Approver)                      │
│     ↓                                                    │
│  6. Acknowledge & Publish (as Controller)               │
│     ↓                                                    │
│  7. View Published Document                             │
│     ↓                                                    │
│  8. Supersede/Obsolete (Optional)                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Test Case Execution

### 📋 TC-NDR-01: Create New Document Request

**Login:** drafter@test.com / Test@123

**Steps:**
1. Click **"New Document Request"** in sidebar
2. Fill form:
   - Title: `Test Document - UAT TC-NDR-01`
   - Document Type: `Project Plan`
   - Project Category: `Internal`
   - Document Date: `[Today's date]`
   - Remarks: `UAT testing document`
3. Click **"Submit NDR"**

**Expected Result:**
- ✅ Success message: "Document request created successfully"
- ✅ File code displayed (e.g., PP/1.0/251125/001)
- ✅ Redirected to document list or can navigate to "My Documents Status"

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-DRAFT-02: Upload Draft Document

**Login:** drafter@test.com / Test@123

**Steps:**
1. Navigate to **"Draft Documents"**
2. Find your created document (file code: PP/1.0/YYMMDD/001)
3. Click **"Upload File"** or **"Upload"** button
4. Select a test PDF file (< 50MB)
5. Click **"Upload"** or **"Confirm"**

**Expected Result:**
- ✅ File uploads successfully
- ✅ Success message displayed
- ✅ File appears in document versions
- ✅ Document ready for submission

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-DRAFT-05: Submit for Review

**Login:** drafter@test.com / Test@123

**Steps:**
1. In **"Draft Documents"**, open your document
2. Click **"Submit for Review"** button
3. Confirm submission if prompted

**Expected Result:**
- ✅ Status changes to "Pending Review"
- ✅ Success message displayed
- ✅ Document no longer editable by drafter
- ✅ Notification sent to reviewer

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-REV-01: Reviewer Receives Notification

**Logout and Login as:** reviewer@test.com / Test@123

**Steps:**
1. Check notification bell icon (top right)
2. Navigate to **"Review & Approval"** module
3. Look for your document in pending list

**Expected Result:**
- ✅ Notification appears for review task
- ✅ Document shows in "Pending Review" list
- ✅ Can open document for review

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-REV-03: Reviewer Proceeds to Approval

**Login:** reviewer@test.com / Test@123

**Steps:**
1. In **"Review & Approval"**, open the document
2. Click **"Review"** or **"Take Action"**
3. Select **"Approve"** or **"Proceed to Approval"**
4. Add comment (optional): `Reviewed - looks good`
5. Click **"Submit"**

**Expected Result:**
- ✅ Document moves to approval stage
- ✅ Status changes to "Pending Approval"
- ✅ Approver receives notification
- ✅ Action recorded in approval history

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-REV-04: Approver Approves Document

**Logout and Login as:** approver@test.com / Test@123

**Steps:**
1. Check notifications
2. Navigate to **"Review & Approval"**
3. Open document pending approval
4. Click **"Approve"** button
5. Add comment (optional): `Approved by management`
6. Click **"Submit"**

**Expected Result:**
- ✅ Document status changes to "Approved"
- ✅ Document Controller receives notification
- ✅ Ready for acknowledgment/publishing
- ✅ Approval recorded in history

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-PUB-04: Acknowledge & Publish Document

**Logout and Login as:** controller@test.com / Test@123

**Steps:**
1. Navigate to **"Review & Approval"** or pending acknowledgments
2. Open approved document
3. Click **"Acknowledge"** button
4. Select folder (if required): `Policies` or `Projects`
5. Click **"Publish"** button
6. Confirm publication

**Expected Result:**
- ✅ Document status changes to "Published"
- ✅ Document appears in "Published Documents" module
- ✅ File stored in selected folder
- ✅ Drafter receives notification
- ✅ Master Record updated

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-MASTER-04: Verify End-to-End Lifecycle

**Login:** Any user with access to Master Record

**Steps:**
1. Navigate to **"Master Record"** module
2. Search for your document by file code
3. View document details
4. Check approval history
5. Check version history

**Expected Result:**
- ✅ Complete lifecycle visible:
  - NDR created
  - Draft uploaded
  - Submitted for review
  - Reviewed
  - Approved
  - Published
- ✅ All timestamps present
- ✅ All actors recorded (drafter, reviewer, approver, controller)
- ✅ Complete audit trail

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## Negative Testing (Important!)

### 📋 TC-NEG-01: Missing Required Fields

**Login:** drafter@test.com / Test@123

**Steps:**
1. Navigate to **"New Document Request"**
2. Leave **Title** field empty
3. Fill other fields
4. Click **"Submit NDR"**

**Expected Result:**
- ✅ Error message: "Title is required"
- ✅ Form not submitted
- ✅ User remains on form page

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 📋 TC-NEG-02: Upload Wrong File Type

**Login:** drafter@test.com / Test@123

**Steps:**
1. Navigate to **"Draft Documents"**
2. Select a draft document
3. Click **"Upload File"**
4. Try to upload a .exe or .zip file

**Expected Result:**
- ✅ System rejects file
- ✅ Error message: "Invalid file type. Only PDF, DOCX, XLSX allowed"
- ✅ No file uploaded

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## Test Users Reference

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| drafter@test.com | Test@123 | Drafter | Create and edit documents |
| reviewer@test.com | Test@123 | Reviewer | Review documents |
| approver@test.com | Test@123 | Approver | Approve documents |
| controller@test.com | Test@123 | Document Controller | Acknowledge & publish |
| admin@test.com | Test@123 | Administrator | Full system access |
| viewer@test.com | Test@123 | Viewer | View published documents only |

---

## Document Types & Prefixes

| Document Type | Prefix | Example File Code |
|---------------|--------|-------------------|
| Minutes of Meeting | MOM | MOM/1.0/251125/001 |
| Project Plan | PP | PP/1.0/251125/001 |
| Requirement Analysis | PRA | PRA/1.0/251125/001 |
| Design Document | DD | DD/1.0/251125/001 |
| SOP | SOP | SOP/1.0/251125/001 |
| Policy | POL | POL/1.0/251125/001 |

---

## Project Categories

- Internal (INT)
- External (EXT)
- Client (CLI)
- R&D (RND)

---

## Common Issues & Quick Fixes

### Issue: Can't login
**Fix:** 
- Verify test users created (check seed-uat.js ran successfully)
- Check backend console for errors
- Clear browser cache/localStorage

### Issue: Document types dropdown empty
**Fix:**
- Check backend API: http://localhost:5000/api/config/document-types
- Re-run seed script: `node prisma/seed-uat.js`

### Issue: File upload fails
**Fix:**
- Check `backend/uploads/` directory exists
- Verify file size < 50MB
- Check file type is PDF, DOCX, or XLSX

### Issue: Notifications not appearing
**Fix:**
- Check browser console for errors
- Verify NotificationContext is working
- Check backend logs

---

## Recording Test Results

### For Each Test Case:

1. **Execute the test** following the steps
2. **Compare actual result** with expected result
3. **Mark Pass or Fail**
4. **If Fail:**
   - Take screenshot
   - Note exact error message
   - Document steps to reproduce
   - Record in bug tracker

### Bug Report Format:

```
Bug ID: BUG-001
Test Case: TC-NDR-01
Title: Document creation fails with valid data
Severity: High
Status: Open

Steps to Reproduce:
1. Login as drafter
2. Fill all required fields in NDR form
3. Click Submit

Expected: Document created successfully
Actual: Error 500 - Internal Server Error

Screenshot: [attach]
Browser: Chrome 120
Date: 2024-11-25
```

---

## Test Completion Checklist

- [ ] All positive test cases executed
- [ ] All negative test cases executed
- [ ] Complete document lifecycle tested
- [ ] All user roles tested
- [ ] All modules accessed and verified
- [ ] Bug reports created for failures
- [ ] Test results documented
- [ ] UAT sign-off obtained

---

## Final Notes

### After Testing:
1. Compile all test results
2. Calculate pass rate: (Passed / Total) × 100%
3. Categorize bugs by severity
4. Schedule fix timeline with dev team
5. Plan retest for critical bugs

### UAT Success Criteria:
- **Minimum Pass Rate:** 90%
- **No Critical Bugs:** 0
- **High Bugs:** < 3
- **All core workflows functional**

---

## Support & Documentation

- **Full UAT Guide:** UAT_TESTING_GUIDE.md
- **Readiness Checklist:** UAT_READINESS_CHECKLIST.md
- **Database Schema:** backend/prisma/schema.prisma
- **API Documentation:** (Generate with Swagger if available)

---

## Quick Command Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Reseed database
cd backend && node prisma/seed-uat.js

# Check Prisma client
cd backend && npx prisma studio

# Database backup
mysqldump -u root -p dms_db > backup_$(date +%Y%m%d).sql

# View logs
# Backend: Check terminal running npm run dev
# Frontend: Check browser console (F12)
```

---

## Need Help?

1. **Check troubleshooting** section in UAT_READINESS_CHECKLIST.md
2. **Review error messages** carefully
3. **Check backend logs** in terminal
4. **Check frontend console** in browser (F12)
5. **Verify database** using Prisma Studio: `npx prisma studio`

---

**Happy Testing! 🎉**

Remember: The goal of UAT is to ensure the system meets business requirements and works as expected in real-world scenarios.

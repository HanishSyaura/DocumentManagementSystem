# DMS UAT Readiness Checklist

## Overview
This checklist ensures your DMS system is ready for UAT testing. Complete all items before starting UAT.

---

## 1. Database Setup

### Database Schema
- [ ] All Prisma migrations applied successfully
  ```bash
  cd backend
  npx prisma migrate deploy
  ```
- [ ] Database schema matches latest schema.prisma
- [ ] All required tables exist:
  - [ ] User, Role, UserRole
  - [ ] Document, DocumentType, ProjectCategory
  - [ ] DocumentVersion, DocumentMetadata
  - [ ] Workflow, WorkflowStep, ApprovalHistory
  - [ ] Folder, Template
  - [ ] Notification
  - [ ] DocumentRegister, VersionRegister, ObsoleteRegister, ArchiveRegister
  - [ ] AuditLog, Configuration

### Test Data
- [ ] UAT seed script executed successfully
  ```bash
  cd backend
  node prisma/seed-uat.js
  ```
- [ ] 6 test users created (admin, drafter, reviewer, approver, controller, viewer)
- [ ] All users can log in successfully
- [ ] 10 document types created with correct prefixes
- [ ] 4 project categories created
- [ ] Sample folders created
- [ ] At least one workflow configured

---

## 2. Backend API

### Server Status
- [ ] Backend server starts without errors
  ```bash
  cd backend
  npm run dev
  ```
- [ ] Server running on http://localhost:5000
- [ ] No console errors on startup
- [ ] Database connection successful

### API Endpoints Testing
Test using Postman, curl, or similar tool:

#### Authentication
- [ ] POST `/api/auth/register` - User registration works
- [ ] POST `/api/auth/login` - Login returns JWT token
- [ ] GET `/api/auth/me` - Returns current user info with valid token

#### Documents
- [ ] POST `/api/documents/requests` - Create NDR
- [ ] GET `/api/documents/requests` - List document requests
- [ ] POST `/api/documents/:id/upload` - Upload document file
- [ ] GET `/api/documents/:id` - Get document details
- [ ] GET `/api/documents/drafts` - List draft documents
- [ ] GET `/api/documents/my-status` - Get user's documents

#### Workflow
- [ ] POST `/api/workflow/submit/:documentId` - Submit for review
- [ ] POST `/api/workflow/review/:documentId` - Review document
- [ ] POST `/api/workflow/approve/:documentId` - Approve document
- [ ] POST `/api/workflow/acknowledge/:documentId` - Acknowledge & publish
- [ ] GET `/api/workflow/pending-tasks` - Get pending tasks
- [ ] GET `/api/workflow/history/:documentId` - Get approval history

#### Configuration
- [ ] GET `/api/config/document-types` - List document types
- [ ] GET `/api/config/project-categories` - List project categories
- [ ] GET `/api/config/roles` - List roles
- [ ] GET `/api/folders` - List folders

#### Notifications
- [ ] GET `/api/notifications` - Get user notifications
- [ ] PUT `/api/notifications/:id/read` - Mark notification as read

---

## 3. Frontend Application

### Server Status
- [ ] Frontend server starts without errors
  ```bash
  cd frontend
  npm run dev
  ```
- [ ] Application accessible at http://localhost:5173
- [ ] No console errors in browser
- [ ] API connection configured correctly (check .env or config)

### UI Components Verification

#### Login Page
- [ ] Login page loads correctly
- [ ] Can login with test users
- [ ] Invalid credentials show error
- [ ] JWT token stored in localStorage/sessionStorage

#### Dashboard
- [ ] Dashboard loads after login
- [ ] Shows statistics (total documents, pending reviews, etc.)
- [ ] Recent activity displayed
- [ ] Navigation menu visible

#### Sidebar Navigation
- [ ] All menu items visible:
  - [ ] Dashboard
  - [ ] New Document Request
  - [ ] My Documents Status
  - [ ] Draft Documents
  - [ ] Review & Approval
  - [ ] Published Documents
  - [ ] Superseded/Obsolete (Archived)
  - [ ] Master Record
  - [ ] Logs & Reports
  - [ ] Configuration
  - [ ] Profile Settings

#### New Document Request Module
- [ ] Form displays all required fields
- [ ] Document Type dropdown populated from backend
- [ ] Project Category dropdown populated from backend
- [ ] Date picker working
- [ ] Submit button functional
- [ ] Success/error messages display
- [ ] Can view document request list

#### Draft Documents Module
- [ ] Can create new draft
- [ ] File upload working (PDF, DOCX)
- [ ] Can view list of drafts
- [ ] Can edit draft
- [ ] Can delete draft
- [ ] Can submit for review
- [ ] Pagination working

#### Review & Approval Module
- [ ] Pending reviews list displays
- [ ] Can open document for review
- [ ] Can approve/return document
- [ ] Comment field working
- [ ] Notifications sent after action

#### Published Documents Module
- [ ] Published documents list displays
- [ ] Can search/filter documents
- [ ] Can download documents
- [ ] Pagination working

#### Master Record Module
- [ ] New Document Register tab working
- [ ] Version Register tab working
- [ ] Obsolete Register tab working
- [ ] Archive Register tab working
- [ ] Export functionality working

---

## 4. File Storage

### Upload Directory
- [ ] Upload directory exists: `backend/uploads/`
- [ ] Sub-directories created:
  - [ ] `backend/uploads/documents/`
  - [ ] `backend/uploads/profiles/`
  - [ ] `backend/uploads/templates/`
- [ ] Directory has write permissions
- [ ] File uploads save successfully
- [ ] Files retrievable by API

---

## 5. Workflow Configuration

### Basic Workflow Setup
- [ ] At least one workflow configured in database
- [ ] Workflow has review step with reviewer role
- [ ] Workflow has approval step with approver role
- [ ] Workflow has acknowledgment step with acknowledger role
- [ ] Workflow active and assigned to document type

### Workflow Testing
- [ ] Document progresses through workflow stages correctly
- [ ] Status updates at each stage
- [ ] Notifications sent to correct users
- [ ] Approval history recorded

---

## 6. Notifications System

### Notification Configuration
- [ ] Notification table exists in database
- [ ] Notification creation working via API
- [ ] Frontend displays notifications
- [ ] Notification bell icon shows count
- [ ] Can mark notifications as read
- [ ] Can view notification list

### Notification Types
- [ ] DOCUMENT_ASSIGNED notifications working
- [ ] REVIEW_REQUIRED notifications working
- [ ] APPROVAL_REQUIRED notifications working
- [ ] ACKNOWLEDGMENT_REQUIRED notifications working
- [ ] STATUS_CHANGED notifications working

---

## 7. Validation & Error Handling

### Frontend Validation
- [ ] Required field validation working
- [ ] Email format validation
- [ ] File type validation
- [ ] File size validation (max 50MB)
- [ ] Date validation
- [ ] Error messages display correctly

### Backend Validation
- [ ] API validates required fields
- [ ] Returns appropriate HTTP status codes:
  - 200 for success
  - 201 for created
  - 400 for validation errors
  - 401 for unauthorized
  - 403 for forbidden
  - 404 for not found
  - 500 for server errors
- [ ] Error messages are clear and helpful

---

## 8. Security & Permissions

### Authentication
- [ ] JWT token required for protected routes
- [ ] Token expiry working
- [ ] Refresh token mechanism working (if implemented)
- [ ] Logout clears session

### Authorization
- [ ] Role-based access control working
- [ ] Drafter can only create/edit drafts
- [ ] Reviewer can only review documents
- [ ] Approver can only approve documents
- [ ] Admin has full access
- [ ] Unauthorized actions blocked with error message

---

## 9. Data Integrity

### File Code Generation
- [ ] File codes generated correctly
- [ ] Format: PREFIX/VERSION/YYMMDD/RunningNumber
- [ ] Running number increments correctly
- [ ] No duplicate file codes
- [ ] Different prefixes for different document types

### Document Lifecycle
- [ ] Document status updates correctly through workflow
- [ ] Stage transitions follow business rules
- [ ] Cannot skip workflow stages
- [ ] Cannot edit documents in review/approval
- [ ] Published documents immutable

### Audit Trail
- [ ] All actions logged in AuditLog table
- [ ] Logs include userId, action, timestamp, metadata
- [ ] Logs viewable in Logs & Reports module

---

## 10. Performance & Reliability

### Response Times
- [ ] API responses < 500ms for simple queries
- [ ] File uploads complete within reasonable time
- [ ] No timeout errors
- [ ] Pagination works for large datasets

### Error Recovery
- [ ] Backend handles errors gracefully (no crashes)
- [ ] Frontend handles API errors gracefully
- [ ] User-friendly error messages
- [ ] No data loss on error

---

## 11. Browser Compatibility

Test on multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

Features to verify:
- [ ] UI renders correctly
- [ ] File upload works
- [ ] Date pickers work
- [ ] Dropdowns work
- [ ] Modals display correctly

---

## 12. Test Data Scenarios

### Prepare Test Documents
- [ ] Create sample PDF documents for testing (3-5 files)
- [ ] Create sample DOCX documents for testing (2-3 files)
- [ ] Prepare documents with different sizes:
  - Small (< 1MB)
  - Medium (1-10MB)
  - Large (10-50MB)
- [ ] Have invalid file types ready for negative testing (.exe, .zip)

---

## 13. Documentation

### User Documentation
- [ ] UAT Testing Guide reviewed and understood
- [ ] Test case format understood
- [ ] Bug report template available
- [ ] Test user credentials documented

### Technical Documentation
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Installation guide available
- [ ] Troubleshooting guide available

---

## 14. Backup & Recovery

### Backup Plan
- [ ] Database backup taken before UAT
  ```bash
  # MySQL backup example
  mysqldump -u root -p dms_db > backup_pre_uat_$(date +%Y%m%d).sql
  ```
- [ ] Backup stored safely
- [ ] Recovery procedure tested and documented

---

## 15. UAT Environment

### Environment Variables
- [ ] Backend .env file configured:
  ```
  DATABASE_URL=mysql://user:password@localhost:3306/dms_db
  JWT_SECRET=your-secret-key
  JWT_EXPIRES_IN=24h
  PORT=5000
  NODE_ENV=development
  ```
- [ ] Frontend API URL configured correctly

### Network
- [ ] Backend accessible from frontend
- [ ] CORS configured if needed
- [ ] No firewall blocking ports

---

## 16. Communication Plan

### Stakeholders
- [ ] UAT team members identified
- [ ] Test schedule created
- [ ] Communication channels established (email, Slack, etc.)
- [ ] Issue tracking system set up (Excel, Jira, GitHub Issues, etc.)

---

## Pre-UAT Execution Steps

### 1. Final System Check
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed-uat.js
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 2. Verify Test Users
Login with each test user to ensure all accounts work:
- admin@test.com
- drafter@test.com
- reviewer@test.com
- approver@test.com
- controller@test.com
- viewer@test.com

Password for all: **Test@123**

### 3. Create Sample Data
- Create 2-3 NDRs as drafter
- Upload files to 1-2 drafts
- Submit 1 draft for review
- Review 1 document as reviewer

### 4. Final Checks
- [ ] No console errors in backend
- [ ] No console errors in frontend browser
- [ ] All critical APIs responding
- [ ] File uploads working
- [ ] Notifications appearing

---

## Sign-Off

**System Ready for UAT:** [ ] YES  [ ] NO

**Prepared By:** ___________________________

**Date:** ___________________________

**Notes/Issues:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## Quick Start UAT

Once all checklist items are complete:

1. **Start servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. **Open browser** to http://localhost:5173

3. **Begin testing** with TC-NDR-01 in UAT_TESTING_GUIDE.md

4. **Document results** in the test case document

5. **Report issues** using the bug report template

---

## Troubleshooting Common Issues

### Issue: Database connection failed
**Solution:** 
- Check MySQL is running
- Verify DATABASE_URL in .env
- Check user credentials and permissions

### Issue: File upload fails
**Solution:**
- Verify uploads directory exists and has write permissions
- Check multer configuration in backend
- Verify file size under 50MB

### Issue: Frontend can't connect to backend
**Solution:**
- Check backend server is running
- Verify CORS configuration
- Check API URL in frontend config

### Issue: Login fails
**Solution:**
- Verify user exists in database
- Check password hashing matches
- Verify JWT secret is configured

### Issue: Notifications not appearing
**Solution:**
- Check NotificationContext in frontend
- Verify notification API endpoints
- Check database for notification records

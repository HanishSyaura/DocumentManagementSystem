# DMS Complete UAT Test Cases
## Comprehensive Test Coverage for All Modules

**Version:** 2.0  
**Last Updated:** November 25, 2024  
**Total Test Cases:** 100+

---

## Table of Contents
1. [Dashboard Module](#1-dashboard-module)
2. [New Document Request](#2-new-document-request)
3. [My Document Status](#3-my-document-status)
4. [Draft Documents](#4-draft-documents)
5. [Review & Approval](#5-review--approval)
6. [Published Documents](#6-published-documents)
7. [Superseded & Obsolete](#7-superseded--obsolete)
8. [Configuration Module](#8-configuration-module)
9. [Logs & Reports](#9-logs--reports)
10. [Master Record](#10-master-record)
11. [Profile Settings](#11-profile-settings)

---

## 1. DASHBOARD MODULE

### TC-DASH-001: View Dashboard Overview

**Objective:** Verify dashboard loads with correct statistics

**Pre-conditions:**
- User logged in
- Some documents exist in various states

**Test Steps:**
1. Login to DMS
2. Navigate to Dashboard (default landing page)
3. Observe displayed statistics

**Expected Results:**
- ✅ Dashboard loads within 2 seconds
- ✅ Statistics cards display:
  - Total Drafts count
  - Pending Review count
  - Approved count
  - Superseded/Obsolete count
- ✅ Numbers are accurate (verify against database)
- ✅ No console errors

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-DASH-002: Recent Activity

**Objective:** Verify recent activity feed shows user actions

**Pre-conditions:**
- User logged in

**Test Steps:**
1. Perform the following actions:
   - Upload a draft document
   - Submit document for review
   - Approve a document (if role permits)
2. Navigate back to Dashboard
3. Check "Recent Activity" section

**Expected Results:**
- ✅ Recent actions appear in activity feed
- ✅ Each entry shows:
  - Action type (e.g., "Document Uploaded", "Submitted for Review")
  - Timestamp (accurate and formatted correctly)
  - User name/email
  - Document title/file code
- ✅ Activities sorted by newest first
- ✅ Pagination if more than 10 items

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-DASH-003: Notifications Trigger

**Objective:** Verify notifications appear correctly on dashboard

**Pre-conditions:**
- Logged in as Drafter
- Have a draft document ready

**Test Steps:**
1. As Drafter: Submit document for review
2. Logout
3. Login as Reviewer
4. Check dashboard notifications area

**Expected Results:**
- ✅ Reviewer sees notification on dashboard
- ✅ Notification badge shows count (e.g., "1")
- ✅ Activity feed shows new review task entry
- ✅ Clicking notification opens document details
- ✅ Notification includes:
  - Document title
  - Action required
  - Time submitted

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 2. NEW DOCUMENT REQUEST

### TC-NDR-001: Create New Document Request

**Objective:** Verify NDR creation generates file code and saves correctly

**Pre-conditions:**
- User logged in as Drafter
- Document Types and Project Categories exist in database

**Test Steps:**
1. Navigate to "New Document Request" module
2. Fill in form:
   - **Title:** "UAT Test Document NDR-001"
   - **Document Type:** Select "Project Plan"
   - **Project Category:** Select "Internal"
   - **Document Date:** Select today's date
   - **Remarks:** "UAT testing document"
3. Click "Submit NDR" button

**Expected Results:**
- ✅ Success message: "Document request created successfully"
- ✅ Auto-generated file code displayed (format: PREFIX/VERSION/YYMMDD/001)
- ✅ File code follows pattern based on document type prefix
- ✅ Document added to document request list
- ✅ Master Record updated with new entry
- ✅ User redirected to appropriate page or shown confirmation

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-NDR-002: View Document Request List

**Objective:** Verify document request list displays all NDRs

**Pre-conditions:**
- At least 3 NDRs created
- User logged in

**Test Steps:**
1. Navigate to "New Document Request" module
2. View document request list/table

**Expected Results:**
- ✅ All created NDRs appear in list
- ✅ Table columns show:
  - File Code
  - Title
  - Document Type
  - Project Category
  - Date Created
  - Status
  - Actions (View/Edit/Delete)
- ✅ Correct metadata displayed for each NDR
- ✅ Pagination works if more than page limit
- ✅ Search/filter functionality works

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 3. MY DOCUMENT STATUS

### TC-MDS-001: View Document Progress

**Objective:** Verify document progress timeline displays correctly

**Pre-conditions:**
- User has documents in various stages
- User logged in

**Test Steps:**
1. Navigate to "My Documents Status" module
2. Select a document that has progressed through workflow
3. View progress timeline

**Expected Results:**
- ✅ Timeline shows all stages:
  - Draft
  - Review
  - Approval
  - Published
- ✅ Completed stages marked/highlighted
- ✅ Current stage clearly indicated
- ✅ Each stage shows:
  - Timestamp when completed
  - User who performed action
  - Comments (if any)
- ✅ Visual progress indicator (e.g., progress bar)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-MDS-002: Current Status Validation

**Objective:** Verify status updates immediately when document workflow progresses

**Pre-conditions:**
- User has a document in Draft stage
- Open "My Documents Status" page

**Test Steps:**
1. Note current status of document
2. In another tab/session, progress the document (e.g., submit for review)
3. Return to "My Documents Status" page
4. Refresh or wait for real-time update

**Expected Results:**
- ✅ Status updates immediately or on refresh
- ✅ New status displays correctly (e.g., "Waiting for Review")
- ✅ Timeline updated with new stage
- ✅ Timestamp accurate
- ✅ No stale data displayed

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 4. DRAFT DOCUMENTS

### TC-DRAFT-001: Upload New Draft

**Objective:** Verify new draft upload with file and metadata

**Pre-conditions:**
- User logged in as Drafter
- Have a test PDF/DOCX file ready

**Test Steps:**
1. Navigate to "Draft Documents" module
2. Click "Upload New Draft" or "New Draft" button
3. Fill in form:
   - Select file (PDF or DOCX)
   - Fill metadata fields
4. Click "Submit" or "Upload"

**Expected Results:**
- ✅ Draft saved successfully
- ✅ File uploaded to server
- ✅ Success message displayed
- ✅ Notification sent to assigned reviewer (if auto-assigned)
- ✅ Draft appears in draft documents list
- ✅ File is downloadable
- ✅ Metadata correctly stored

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-DRAFT-002: New Version Request

**Objective:** Verify requesting new version of published document

**Pre-conditions:**
- At least one published document exists
- User has permission to request new version

**Test Steps:**
1. Navigate to "Published Documents"
2. Select a published document
3. Click "Request New Version" or similar action
4. Fill in reason/description for new version
5. Submit request

**Expected Results:**
- ✅ System creates new version record
- ✅ New version has incremented version number (e.g., 1.0 → 2.0)
- ✅ Original document remains published
- ✅ New version starts in Draft stage
- ✅ Request recorded in system
- ✅ User can edit new version
- ✅ Version history links to original

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-DRAFT-003: Draft Documents List

**Objective:** Verify draft documents list shows all drafts with filters

**Pre-conditions:**
- Multiple draft documents exist
- User logged in

**Test Steps:**
1. Navigate to "Draft Documents" module
2. View list of draft documents
3. Test filtering by document type
4. Test sorting by date, title
5. Test search functionality

**Expected Results:**
- ✅ List displays all user's draft documents
- ✅ Columns show:
  - File Code
  - Title
  - Document Type
  - Last Modified
  - Status
  - Actions (Edit/Delete/Submit)
- ✅ Filtering works correctly
- ✅ Sorting works correctly
- ✅ Search finds documents by title/file code
- ✅ Pagination functional
- ✅ Empty state shown if no drafts

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 5. REVIEW & APPROVAL

### TC-REV-001: Reviewer Acknowledgement

**Objective:** Verify reviewer can acknowledge receipt of document

**Pre-conditions:**
- Document submitted for review
- Logged in as Reviewer

**Test Steps:**
1. Navigate to "Review & Approval" module
2. Open document pending review
3. Click "Acknowledge" button

**Expected Results:**
- ✅ Status changes to "In Review"
- ✅ Timestamp recorded
- ✅ Reviewer name associated with document
- ✅ Notification sent to drafter (optional)
- ✅ Approval history updated

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-REV-002: Reviewer Upload Revised Draft

**Objective:** Verify reviewer can upload revised version during review

**Pre-conditions:**
- Document in review stage
- Logged in as Reviewer
- Have revised file ready

**Test Steps:**
1. Open document under review
2. Click "Upload Revised Draft" or similar
3. Select revised file
4. Upload

**Expected Results:**
- ✅ Old draft replaced with new one
- ✅ Version number incremented (e.g., 1.0 → 1.1)
- ✅ Old version archived but accessible
- ✅ Revision timestamp recorded
- ✅ Document remains in review stage
- ✅ Drafter notified of revision

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-REV-003: Approval Workflow

**Objective:** Verify approver can approve document

**Pre-conditions:**
- Document reviewed and sent to approval
- Logged in as Approver

**Test Steps:**
1. Navigate to "Review & Approval" module
2. Open document pending approval
3. Review document details
4. Click "Approve" button
5. Add comments (optional)
6. Submit approval

**Expected Results:**
- ✅ Document status changes to "Approved"
- ✅ Document moves to "Ready to Publish" stage
- ✅ Approval timestamp recorded
- ✅ Approver name recorded
- ✅ Document Controller notified
- ✅ Approval history updated
- ✅ Comments saved

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-REV-004: Review & Approval List

**Objective:** Verify only assigned documents appear in user's list

**Pre-conditions:**
- Multiple documents in review/approval stages
- Some assigned to current user, some not
- User logged in

**Test Steps:**
1. Navigate to "Review & Approval" module
2. View list of pending tasks

**Expected Results:**
- ✅ Only documents assigned to current user appear
- ✅ Documents assigned to others NOT visible
- ✅ List shows:
  - File Code
  - Title
  - Document Type
  - Submitted By
  - Date Submitted
  - Current Stage (Review/Approval)
  - Actions
- ✅ Separate tabs/sections for "Pending Review" and "Pending Approval"
- ✅ Empty state if no tasks

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 6. PUBLISHED DOCUMENTS

### TC-PUB-001: Create New Folder

**Objective:** Verify folder creation in published documents

**Pre-conditions:**
- User has permission to manage folders
- User logged in

**Test Steps:**
1. Navigate to "Published Documents" module
2. Click "Create New Folder" or "Add Folder"
3. Enter folder name: "Test Policies"
4. Click "Create" or "Save"

**Expected Results:**
- ✅ Folder created successfully
- ✅ Folder appears in folder tree structure
- ✅ Folder listed at root level (or under selected parent)
- ✅ Success message displayed
- ✅ Folder can be selected/opened

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PUB-002: Create Sub Folder

**Objective:** Verify subfolder creation under parent folder

**Pre-conditions:**
- At least one parent folder exists
- User logged in with folder management permission

**Test Steps:**
1. Navigate to "Published Documents"
2. Select parent folder (e.g., "Policies")
3. Click "Create Subfolder" or similar
4. Enter subfolder name: "HR Policies"
5. Save

**Expected Results:**
- ✅ Subfolder created under parent
- ✅ Subfolder appears indented in tree view
- ✅ Expand/collapse functionality works
- ✅ Hierarchy correctly displayed
- ✅ Subfolder can contain documents

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PUB-003: Upload Published File

**Objective:** Verify published document appears in correct folder

**Pre-conditions:**
- Document approved and ready to publish
- Folders exist
- Logged in as Document Controller

**Test Steps:**
1. Acknowledge and publish document
2. Assign document to specific folder during publish
3. Navigate to "Published Documents"
4. Browse to assigned folder

**Expected Results:**
- ✅ Document appears in correct folder
- ✅ Document displays with metadata:
  - File name
  - File type (PDF/DOCX icon)
  - Size
  - Last modified date
  - Status: Published
- ✅ Document downloadable
- ✅ Document viewable (preview if supported)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PUB-004: Folder Tree Navigation

**Objective:** Verify folder tree expands/collapses correctly

**Pre-conditions:**
- Folder structure with parent and subfolders exists
- User logged in

**Test Steps:**
1. Navigate to "Published Documents"
2. Click expand icon on parent folder
3. Observe subfolders appear
4. Click collapse icon
5. Navigate into subfolder
6. Navigate back to parent

**Expected Results:**
- ✅ All directories expand/collapse correctly
- ✅ Expand/collapse icons animate smoothly
- ✅ Folder hierarchy visible
- ✅ Breadcrumb navigation shows current path
- ✅ Can navigate back to parent folders
- ✅ Folder contents load when selected
- ✅ No broken links or missing folders

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 7. SUPERSEDED & OBSOLETE

### TC-SO-001: Request Supersede

**Objective:** Verify supersede request workflow

**Pre-conditions:**
- Published document exists
- User has permission to request supersede
- User logged in

**Test Steps:**
1. Navigate to "Published Documents" or "Superseded/Obsolete"
2. Select document to supersede
3. Click "Request Supersede" button
4. Fill in form:
   - Select or create new document (that will replace this one)
   - Enter reason: "Updated regulations require new version"
5. Submit request

**Expected Results:**
- ✅ Request submitted successfully
- ✅ Request appears in "Pending Supersede Requests" list
- ✅ Document Controller/Admin notified for approval
- ✅ Original document remains published until approved
- ✅ Request shows status: "Pending Approval"
- ✅ Reason recorded in system

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-SO-002: Request Obsolete

**Objective:** Verify obsolete request workflow

**Pre-conditions:**
- Published document exists
- User has permission to request obsolete

**Test Steps:**
1. Select published document
2. Click "Request Obsolete"
3. Enter reason: "No longer applicable to current operations"
4. Enter effective date (optional)
5. Submit

**Expected Results:**
- ✅ Obsolete request created successfully
- ✅ Request sent for approval
- ✅ Document Controller/Approver notified
- ✅ Request appears in pending list with status
- ✅ Document remains active until approval
- ✅ Once approved:
  - Document marked as Obsolete
  - Moved to Obsolete Register
  - No longer appears in Published Documents
  - Still accessible in archives/obsolete section

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-SO-003: Supersede/Obsolete List

**Objective:** Verify supersede and obsolete requests list

**Pre-conditions:**
- Some supersede/obsolete requests exist
- User logged in with appropriate role

**Test Steps:**
1. Navigate to "Superseded & Obsolete" module
2. View list of requests

**Expected Results:**
- ✅ List displays all supersede/obsolete requests
- ✅ Columns show:
  - File Code
  - Title
  - Request Type (Supersede/Obsolete)
  - Requested By
  - Date Requested
  - Reason
  - Status (Pending/Approved/Rejected)
  - Actions
- ✅ Filtering by status works
- ✅ Search functionality works
- ✅ Can view request details
- ✅ Can approve/reject if authorized

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 8. CONFIGURATION MODULE

### 8.1 Template Management

### TC-CONF-TMP-001: Add New Template

**Objective:** Verify template upload and association with document type

**Pre-conditions:**
- User logged in as Admin
- Have template file ready (DOCX/PDF)

**Test Steps:**
1. Navigate to Configuration → Template Management
2. Click "Add New Template"
3. Fill in form:
   - Template Name: "Project Plan Template v1.0"
   - Document Type: Select "Project Plan"
   - Version: "1.0"
   - Upload file
4. Click "Save"

**Expected Results:**
- ✅ Template saved successfully
- ✅ Template appears in template list
- ✅ Associated with correct document type
- ✅ File stored on server
- ✅ Template downloadable
- ✅ Version tracked

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-TMP-002: Template List

**Objective:** Verify template list with search and filter

**Pre-conditions:**
- Multiple templates exist
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Template Management
2. View template list
3. Test search by template name
4. Test filter by document type
5. Test sort by date/name

**Expected Results:**
- ✅ All templates displayed
- ✅ Search functionality works
- ✅ Filter by document type works
- ✅ Sorting works correctly
- ✅ Pagination functional
- ✅ Can download any template
- ✅ Can edit/delete templates
- ✅ Empty state shown if no templates

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 8.2 Workflow Configuration

### TC-CONF-WF-001: Create New Workflow

**Objective:** Verify workflow creation with steps and routing

**Pre-conditions:**
- User logged in as Admin
- Document types and roles exist

**Test Steps:**
1. Navigate to Configuration → Workflow Configuration
2. Click "Create New Workflow"
3. Fill in form:
   - Workflow Name: "Standard Document Approval"
   - Description: "Standard 3-step approval process"
   - Select Document Type: "Policy"
4. Add workflow steps:
   - Step 1: Review (Role: Reviewer, Required: Yes, Due: 3 days)
   - Step 2: Approval (Role: Approver, Required: Yes, Due: 2 days)
   - Step 3: Acknowledgment (Role: Document Controller, Required: Yes, Due: 1 day)
5. Save workflow

**Expected Results:**
- ✅ Workflow saved successfully
- ✅ All steps saved with correct sequence
- ✅ Steps show order (1, 2, 3)
- ✅ Roles assigned correctly
- ✅ SLA (due days) recorded
- ✅ Workflow appears in workflow list
- ✅ Workflow active and ready to use
- ✅ Can assign to document type

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-WF-002: Workflow List

**Objective:** Verify workflow list displays all workflows

**Pre-conditions:**
- Multiple workflows exist

**Test Steps:**
1. Navigate to Configuration → Workflow Configuration
2. View workflow list

**Expected Results:**
- ✅ All workflows displayed
- ✅ Columns show:
  - Workflow Name
  - Document Type
  - Number of Steps
  - Active Status
  - Created Date
  - Actions (View/Edit/Delete)
- ✅ Can view workflow steps
- ✅ Can edit workflow
- ✅ Can activate/deactivate workflow
- ✅ Can delete workflow (if not in use)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 8.3 Roles & Permissions

### TC-CONF-ROLE-001: Add New Role

**Objective:** Verify role creation

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Role & Permission
2. Click "Add New Role"
3. Fill in:
   - Role Name: "Quality Auditor"
   - Display Name: "Quality Auditor"
   - Description: "Can view and audit all documents"
4. Save

**Expected Results:**
- ✅ Role created successfully
- ✅ Role appears in role list
- ✅ Can assign permissions to role
- ✅ Role can be assigned to users
- ✅ Role ID generated

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-ROLE-002: Edit Permission Matrix

**Objective:** Verify permission changes apply immediately

**Pre-conditions:**
- Role exists
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Role & Permission
2. Select a role (e.g., "Reviewer")
3. Edit permissions:
   - Enable "View Documents" ✓
   - Enable "Review Documents" ✓
   - Disable "Delete Documents" ✗
4. Save changes
5. Login as user with Reviewer role
6. Test permissions

**Expected Results:**
- ✅ Permission changes saved successfully
- ✅ Changes applied immediately (or on next login)
- ✅ User can perform allowed actions
- ✅ User cannot perform disallowed actions
- ✅ Permission matrix updates correctly
- ✅ Audit log records permission change

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-USER-001: Add New User

**Objective:** Verify user creation with role assignment

**Pre-conditions:**
- User logged in as Admin
- Roles exist

**Test Steps:**
1. Navigate to Configuration → Users
2. Click "Add New User"
3. Fill in form:
   - Email: testuser@company.com
   - First Name: Test
   - Last Name: User
   - Department: IT
   - Position: Developer
   - Employee ID: EMP999
   - Assign Role: Drafter
4. Save

**Expected Results:**
- ✅ User created successfully
- ✅ User appears in user list
- ✅ Role assigned correctly
- ✅ Temporary password generated (or user receives email)
- ✅ User can login with credentials
- ✅ User has permissions from assigned role
- ✅ User profile accessible

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 8.4 Master Data

### TC-CONF-DT-001: Add Document Type

**Objective:** Verify document type creation with prefix

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Master Data → Document Types
2. Click "Add Document Type"
3. Fill in:
   - Name: "Safety Procedure"
   - Prefix: "SP"
   - Description: "Safety procedures and guidelines"
4. Save

**Expected Results:**
- ✅ Document type created successfully
- ✅ Prefix unique and validated
- ✅ Appears in document type dropdown across system
- ✅ Available when creating NDR
- ✅ Can associate with templates
- ✅ Can associate with workflows

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-DT-002: Validate Document Type List

**Objective:** Verify document type list shows all types

**Pre-conditions:**
- Multiple document types exist

**Test Steps:**
1. Navigate to Configuration → Master Data → Document Types
2. View list

**Expected Results:**
- ✅ All document types displayed
- ✅ Columns show:
  - Name
  - Prefix
  - Description
  - Active Status
  - Actions
- ✅ Can edit document type
- ✅ Can deactivate (soft delete)
- ✅ Search and filter work
- ✅ Inactive types not shown in dropdowns

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-PC-001: Add Project Category

**Objective:** Verify project category creation

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Master Data → Project Categories
2. Click "Add Project Category"
3. Fill in:
   - Name: "Customer Projects"
   - Code: "CUST"
   - Description: "Customer-related projects"
4. Save

**Expected Results:**
- ✅ Project category created successfully
- ✅ Code unique and validated
- ✅ Appears in project category dropdown
- ✅ Available in NDR form
- ✅ Available in document filters

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-PC-002: List Shows All Categories

**Objective:** Verify project category list

**Pre-conditions:**
- Multiple project categories exist

**Test Steps:**
1. Navigate to Configuration → Master Data → Project Categories
2. View list

**Expected Results:**
- ✅ All categories displayed
- ✅ Columns show: Name, Code, Description, Status, Actions
- ✅ Can edit category
- ✅ Can deactivate category
- ✅ Search works
- ✅ Inactive categories not in dropdowns

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 8.5 General System Settings

### TC-CONF-COMP-001: Update Company Profile

**Objective:** Verify company information update

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → General Settings → Company Info
2. Update fields:
   - Company Name
   - Address
   - Phone
   - Email
   - Logo (upload)
3. Save

**Expected Results:**
- ✅ Changes saved successfully
- ✅ Logo uploaded and displayed
- ✅ Company info reflected in:
  - Login page
  - Header/footer
  - Generated reports
  - Email templates
- ✅ Old logo replaced

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-LP-001: Edit Landing Page

**Objective:** Verify landing page customization

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → General Settings → Landing Page
2. Edit content:
   - Welcome message
   - Banner image
   - Quick links
3. Save changes
4. Logout and view landing page

**Expected Results:**
- ✅ Changes saved successfully
- ✅ Landing page reflects updates
- ✅ Images display correctly
- ✅ Links functional
- ✅ Responsive design maintained

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-TB-001: Change Theme

**Objective:** Verify theme/branding change applies system-wide

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → General Settings → Theme & Branding
2. Select different color scheme
3. Upload custom logo
4. Change primary/secondary colors
5. Apply changes
6. Navigate through different modules

**Expected Results:**
- ✅ Theme changes applied immediately
- ✅ Colors consistent across all pages
- ✅ Logo appears in header
- ✅ No UI breaking
- ✅ Contrast sufficient for readability
- ✅ Changes persist after logout/login

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-DS-001: Save Document Management Preferences

**Objective:** Verify document settings update

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → General Settings → Document Settings
2. Update settings:
   - Max file size: 50 MB
   - Allowed file types: PDF, DOCX, XLSX
   - Auto-versioning: Enabled
   - Document retention period: 5 years
3. Save

**Expected Results:**
- ✅ Settings saved successfully
- ✅ File upload respects new size limit
- ✅ Only allowed file types can be uploaded
- ✅ Auto-versioning works as configured
- ✅ Retention policy applied
- ✅ Settings reflected in upload forms

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-NS-001: Change Email Notification Preference

**Objective:** Verify notification settings update

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → General Settings → Notification Settings
2. Configure:
   - Enable email notifications: Yes
   - Email digest: Daily
   - Notification types to send
   - SMTP settings (if applicable)
3. Save
4. Trigger a notification event
5. Check email

**Expected Results:**
- ✅ Settings saved successfully
- ✅ Email notifications sent based on configuration
- ✅ Digest frequency respected
- ✅ SMTP connection successful
- ✅ Email format correct
- ✅ Users can override with personal preferences

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-SEC-001: Update Security Rules

**Objective:** Verify security settings enforcement

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → General Settings → Security
2. Update:
   - Password minimum length: 8
   - Require uppercase: Yes
   - Require numbers: Yes
   - Session timeout: 30 minutes
   - Max login attempts: 5
3. Save
4. Test with user account

**Expected Results:**
- ✅ Settings saved successfully
- ✅ Password requirements enforced on change
- ✅ Session expires after timeout
- ✅ Account locked after max attempts
- ✅ Error messages guide user
- ✅ Security logs updated

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 8.6 Audit & Log Settings

### TC-CONF-AUD-001: Configure Audit Logging

**Objective:** Verify audit configuration changes

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Audit & Log Settings
2. Configure:
   - Enable audit logging: Yes
   - Log level: Info
   - Log retention: 90 days
   - Actions to log: All
3. Save
4. Perform various actions
5. Check audit logs

**Expected Results:**
- ✅ Configuration saved
- ✅ Actions logged per configuration
- ✅ Logs include: user, action, timestamp, IP, details
- ✅ Old logs purged per retention policy
- ✅ Logs tamper-proof
- ✅ Changes reflected in activity logs module

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 8.7 Backup & Recovery

### TC-CONF-BACKUP-001: Create New Backup

**Objective:** Verify manual backup creation

**Pre-conditions:**
- User logged in as Admin
- Sufficient disk space

**Test Steps:**
1. Navigate to Configuration → Backup & Recovery
2. Click "Create Backup Now"
3. Enter backup name/description
4. Select backup type (Full/Incremental)
5. Start backup

**Expected Results:**
- ✅ Backup process starts
- ✅ Progress indicator shown
- ✅ Backup file created successfully
- ✅ Backup appears in available backups list
- ✅ Backup includes:
  - Database
  - Uploaded files
  - Configuration
- ✅ Backup downloadable
- ✅ Backup size displayed

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-BACKUP-002: View Available Backups

**Objective:** Verify backup list displays all backups

**Pre-conditions:**
- Some backups exist
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Backup & Recovery
2. View backup list

**Expected Results:**
- ✅ All backups displayed
- ✅ Columns show:
  - Backup Name
  - Date Created
  - Size
  - Type (Full/Incremental)
  - Status
  - Actions (Download/Restore/Delete)
- ✅ Can download backup
- ✅ Can delete old backups
- ✅ Restore function available (with warning)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 8.8 Database Cleanup

### TC-CONF-DBC-001: View DB Stats

**Objective:** Verify database statistics display

**Pre-conditions:**
- User logged in as Admin

**Test Steps:**
1. Navigate to Configuration → Database Cleanup
2. View statistics

**Expected Results:**
- ✅ Statistics displayed:
  - Total documents
  - Total users
  - Database size
  - Obsolete records
  - Orphaned files
  - Last cleanup date
- ✅ Stats accurate
- ✅ Visual charts/graphs (optional)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-DBC-002: Perform Cleanup

**Objective:** Verify database cleanup removes obsolete data

**Pre-conditions:**
- User logged in as Admin
- Some obsolete data exists

**Test Steps:**
1. Navigate to Configuration → Database Cleanup
2. Select cleanup options:
   - Remove old audit logs (> 2 years)
   - Remove orphaned files
   - Optimize database
3. Click "Run Cleanup"
4. Confirm action

**Expected Results:**
- ✅ Cleanup confirmation prompt shown
- ✅ Cleanup runs successfully
- ✅ Progress indicator displayed
- ✅ Summary report shown:
  - Records removed
  - Space freed
  - Errors (if any)
- ✅ Database size reduced
- ✅ No data corruption
- ✅ Active data intact

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-CONF-DBC-003: Full System Reset (Admin Only)

**Objective:** Verify system reset with proper safeguards

**⚠️ WARNING: Destructive operation - test in dev environment only**

**Pre-conditions:**
- User logged in as Admin
- Development/test environment only

**Test Steps:**
1. Navigate to Configuration → Database Cleanup
2. Locate "Full System Reset" option
3. Click "Reset System"
4. Enter confirmation phrase or password
5. Confirm action

**Expected Results:**
- ✅ Multiple confirmation prompts shown
- ✅ Warning message clearly explains consequences
- ✅ Requires admin password or special phrase
- ✅ Backup created automatically before reset
- ✅ System prompts confirmation
- ✅ After reset:
  - All documents deleted
  - All users deleted (except admin)
  - Database schema intact
  - System configurable from scratch
- ✅ Action logged in audit log
- ✅ Admin receives email confirmation

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 9. LOGS & REPORTS

### TC-LOG-001: Activity Logs List

**Objective:** Verify activity logs display all user actions

**Pre-conditions:**
- Various user activities performed
- User logged in with appropriate permissions

**Test Steps:**
1. Navigate to Logs & Reports → Activity Logs
2. View activity list

**Expected Results:**
- ✅ All activities displayed
- ✅ Columns show:
  - Timestamp
  - User
  - Action (e.g., "Document Created", "User Logged In")
  - Entity (e.g., Document ID)
  - Details
  - IP Address
- ✅ Sorted by newest first
- ✅ Pagination functional
- ✅ No sensitive data exposed

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-LOG-002: Export Activity Logs (CSV)

**Objective:** Verify activity logs can be exported

**Pre-conditions:**
- Activity logs exist
- User logged in

**Test Steps:**
1. Navigate to Logs & Reports → Activity Logs
2. Apply filters (date range, user, action type)
3. Click "Export to CSV" or "Download"

**Expected Results:**
- ✅ CSV file downloads successfully
- ✅ File contains filtered data
- ✅ All columns included
- ✅ Data formatted correctly
- ✅ No data loss
- ✅ Can open in Excel/spreadsheet software
- ✅ File named appropriately (e.g., activity_logs_20241125.csv)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-LOG-003: Filter Activity Logs

**Objective:** Verify activity log filtering works correctly

**Pre-conditions:**
- Multiple activity logs exist
- User logged in

**Test Steps:**
1. Navigate to Logs & Reports → Activity Logs
2. Apply filters:
   - Date range: Last 7 days
   - User: Select specific user
   - Action type: "Document Created"
3. Click "Apply" or "Filter"

**Expected Results:**
- ✅ Only matching logs displayed
- ✅ Count updates correctly
- ✅ Can clear filters
- ✅ Multiple filters work together (AND logic)
- ✅ Date range respected
- ✅ User filter accurate
- ✅ Action type filter accurate

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-LOG-004: User Activity List

**Objective:** Verify user-specific activity tracking

**Pre-conditions:**
- User logged in

**Test Steps:**
1. Navigate to Logs & Reports → User Activity
2. Select a user from list
3. View user's activity

**Expected Results:**
- ✅ All user actions displayed
- ✅ Shows:
  - Login/logout times
  - Documents created/edited
  - Approvals/reviews performed
  - Settings changed
- ✅ Timeline view (optional)
- ✅ Can filter by date range
- ✅ Activity count per day/week

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-LOG-005: Export User Activity

**Objective:** Verify user activity export

**Pre-conditions:**
- User activity logs exist

**Test Steps:**
1. Navigate to Logs & Reports → User Activity
2. Select user
3. Select date range
4. Click "Export"

**Expected Results:**
- ✅ Export file downloads
- ✅ Contains all user actions in range
- ✅ Format correct (CSV/Excel/PDF)
- ✅ Usable for audits/compliance

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-LOG-006: System Reports - View All Reports

**Objective:** Verify system reports module displays available reports

**Pre-conditions:**
- User logged in with report access

**Test Steps:**
1. Navigate to Logs & Reports → System Reports
2. View available reports

**Expected Results:**
- ✅ List of available reports shown:
  - Document Statistics
  - User Activity Summary
  - Workflow Performance
  - Document Lifecycle Report
  - Approval Timeline
  - Obsolete Documents Report
- ✅ Each report shows:
  - Report name
  - Description
  - Last generated
  - Actions (Generate/Download)
- ✅ Can generate report on demand
- ✅ Can schedule report generation

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-LOG-007: Analytics Dashboard

**Objective:** Verify analytics dashboard displays charts and metrics

**Pre-conditions:**
- Sufficient data exists for analytics
- User logged in

**Test Steps:**
1. Navigate to Logs & Reports → Analytics Dashboard
2. View dashboard
3. Change time period filter (Last 7 days, Last 30 days, Last 3 months)

**Expected Results:**
- ✅ Charts displayed:
  - Documents created over time (line chart)
  - Documents by status (pie chart)
  - Documents by type (bar chart)
  - User activity (line chart)
  - Workflow efficiency (metrics)
- ✅ Charts validate correctly
- ✅ Time period filter updates all charts
- ✅ Charts interactive (hover shows details)
- ✅ Export chart as image (optional)
- ✅ Data accurate and matches database

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 10. MASTER RECORD

### TC-MR-001: New Document Register

**Objective:** Verify new document register displays all NDRs

**Pre-conditions:**
- NDRs created
- User logged in

**Test Steps:**
1. Navigate to Master Record → New Document Register
2. View register
3. Test filtering by:
   - Date range
   - Document type
   - Owner
4. Test export to Excel

**Expected Results:**
- ✅ All NDRs displayed
- ✅ Columns show:
  - File Code
  - Document Title
  - Document Type
  - Version
  - Registered Date
  - Owner
  - Department
  - Status
- ✅ Filtering works correctly
- ✅ Export to Excel successful
- ✅ Excel file formatted properly
- ✅ All data included in export

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-MR-002: New Version Register

**Objective:** Verify version register tracks all version updates

**Pre-conditions:**
- Documents with multiple versions exist
- User logged in

**Test Steps:**
1. Navigate to Master Record → New Version Register
2. View register
3. Test filtering by:
   - File Code
   - Date range
   - Updated By
4. Export to Excel

**Expected Results:**
- ✅ All version updates displayed
- ✅ Columns show:
  - File Code
  - Document Title
  - Previous Version
  - New Version
  - Version Date
  - Updated By
  - Change Summary
- ✅ Filtering works
- ✅ Export successful
- ✅ Version history complete

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-MR-003: Obsolete Register

**Objective:** Verify obsolete register shows all obsolete documents

**Pre-conditions:**
- Some obsolete documents exist
- User logged in

**Test Steps:**
1. Navigate to Master Record → Obsolete Register
2. View register
3. Test filtering by:
   - Date range
   - Document type
   - Reason
4. Export to Excel

**Expected Results:**
- ✅ All obsolete documents displayed
- ✅ Columns show:
  - File Code
  - Document Title
  - Document Type
  - Obsolete Date
  - Reason
  - Replaced By (if superseded)
  - Last Owner
- ✅ Filtering works
- ✅ Export successful
- ✅ Can view obsolete document (read-only)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-MR-004: Old Version Register (Archive Register)

**Objective:** Verify archive register shows all old document versions

**Pre-conditions:**
- Documents with archived old versions exist
- User logged in

**Test Steps:**
1. Navigate to Master Record → Old Version Register
2. View register
3. Test filtering by:
   - File Code
   - Date range
   - Archived By
4. Export to Excel

**Expected Results:**
- ✅ All archived versions displayed
- ✅ Columns show:
  - File Code
  - Document Title
  - Version
  - Archived Date
  - Archived By
  - Current Version
  - Retention Until
  - File Path
- ✅ Filtering works
- ✅ Export successful
- ✅ Can download archived version
- ✅ Retention policy visible

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## 11. PROFILE SETTINGS

### 11.1 Profile Information

### TC-PS-001: Update Profile Picture

**Objective:** Verify profile picture upload

**Pre-conditions:**
- User logged in
- Have image file ready (JPG/PNG, < 2MB)

**Test Steps:**
1. Navigate to Profile Settings → Profile Information
2. Click "Change Picture" or profile image
3. Select image file
4. Crop/adjust if needed
5. Save

**Expected Results:**
- ✅ Image uploads successfully
- ✅ Preview shown before save
- ✅ Image appears in header/topbar
- ✅ Image persists after logout/login
- ✅ Old image replaced
- ✅ Image properly sized/cropped

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PS-002: Edit Personal & Work Info

**Objective:** Verify profile information update

**Pre-conditions:**
- User logged in

**Test Steps:**
1. Navigate to Profile Settings → Profile Information
2. Edit fields:
   - First Name
   - Last Name
   - Phone
   - Department
   - Position
3. Save

**Expected Results:**
- ✅ Changes saved successfully
- ✅ Success message displayed
- ✅ Updated info shown immediately
- ✅ Info reflected in:
  - User profile
  - Document ownership
  - Activity logs
  - Header/topbar
- ✅ Validation works (e.g., phone format)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 11.2 Security

### TC-PS-003: Change Password

**Objective:** Verify password change functionality

**Pre-conditions:**
- User logged in
- Know current password

**Test Steps:**
1. Navigate to Profile Settings → Security
2. Click "Change Password"
3. Enter:
   - Current Password
   - New Password: "NewPass@123"
   - Confirm New Password: "NewPass@123"
4. Submit
5. Logout and login with new password

**Expected Results:**
- ✅ Password changed successfully
- ✅ Password requirements validated
- ✅ Current password verified before change
- ✅ Confirmation password must match
- ✅ Can login with new password
- ✅ Cannot login with old password
- ✅ Password change logged in audit
- ✅ Email notification sent (optional)

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PS-004: Enable 2FA

**Objective:** Verify two-factor authentication setup

**Pre-conditions:**
- User logged in
- 2FA not yet enabled

**Test Steps:**
1. Navigate to Profile Settings → Security
2. Click "Enable Two-Factor Authentication"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes
6. Logout and login again

**Expected Results:**
- ✅ QR code displayed for scanning
- ✅ Backup codes generated and shown
- ✅ 2FA enabled successfully
- ✅ On next login, system requests 2FA code
- ✅ Cannot login without valid code
- ✅ Backup codes work for login
- ✅ 2FA badge shown in profile
- ✅ Can disable 2FA if needed

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PS-005: End Active Sessions

**Objective:** Verify session management and termination

**Pre-conditions:**
- User logged in from multiple devices/browsers

**Test Steps:**
1. Login from multiple browsers/devices
2. Navigate to Profile Settings → Security → Active Sessions
3. View list of active sessions
4. Click "End Session" on one session
5. Check if that session logged out

**Expected Results:**
- ✅ All active sessions listed
- ✅ Each session shows:
  - Device/Browser
  - IP Address
  - Location (optional)
  - Last Active
  - Current Session indicator
- ✅ Can end individual session
- ✅ Can end all sessions except current
- ✅ Ended session forced to logout
- ✅ Success message shown

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 11.3 Notifications

### TC-PS-006: Update Notification Preferences

**Objective:** Verify user can customize notification settings

**Pre-conditions:**
- User logged in

**Test Steps:**
1. Navigate to Profile Settings → Notifications
2. Toggle preferences:
   - Email notifications: On/Off
   - In-app notifications: On/Off
   - Document assigned: Enabled
   - Review required: Enabled
   - Approval required: Enabled
   - Status changed: Disabled
   - Email digest: Daily
3. Save

**Expected Results:**
- ✅ Preferences saved successfully
- ✅ Notifications respect user preferences
- ✅ Disabled notification types not sent
- ✅ Email digest sent at configured frequency
- ✅ In-app notifications show/hide per setting
- ✅ Changes effective immediately

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### 11.4 Preferences

### TC-PS-007: Change Localization

**Objective:** Verify language and region settings

**Pre-conditions:**
- User logged in
- Multiple languages supported

**Test Steps:**
1. Navigate to Profile Settings → Preferences
2. Change settings:
   - Language: English (or other available)
   - Timezone: Asia/Kuala_Lumpur
   - Date Format: DD/MM/YYYY
   - Time Format: 24-hour
3. Save
4. Navigate through application

**Expected Results:**
- ✅ Settings saved successfully
- ✅ UI language changes immediately
- ✅ Dates formatted per preference
- ✅ Times formatted per preference
- ✅ Timezone applied to all timestamps
- ✅ Settings persist across sessions
- ✅ No UI breaking

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PS-008: Display Settings

**Objective:** Verify display customization options

**Pre-conditions:**
- User logged in

**Test Steps:**
1. Navigate to Profile Settings → Preferences
2. Adjust:
   - Items per page: 25
   - Default view: List (vs Grid)
   - Theme: Light/Dark
   - Compact mode: On/Off
3. Save
4. Navigate to various list pages

**Expected Results:**
- ✅ Settings saved successfully
- ✅ Lists show configured items per page
- ✅ Default view applied to all lists
- ✅ Theme changes reflected
- ✅ Compact mode adjusts spacing
- ✅ Settings consistent across modules

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

### TC-PS-009: Danger Zone (Delete Account / Deactivate)

**Objective:** Verify account deletion/deactivation safeguards

**⚠️ WARNING: Test in dev environment only**

**Pre-conditions:**
- User logged in
- Test environment only

**Test Steps:**
1. Navigate to Profile Settings → Preferences → Danger Zone
2. Click "Deactivate Account" or "Delete Account"
3. Read warnings
4. Enter password confirmation
5. Confirm action

**Expected Results:**
- ✅ Warning messages clear and prominent
- ✅ Multiple confirmation steps required
- ✅ Must enter password to confirm
- ✅ Confirmation phrase required (optional)
- ✅ For Deactivate:
  - Account disabled but data retained
  - Cannot login
  - Can be reactivated by admin
- ✅ For Delete:
  - Warning about permanent deletion
  - Data deletion scheduled
  - Account immediately inaccessible
  - Admin notified
  - Audit log entry created
- ✅ Email confirmation sent

**Pass:** [ ] &nbsp;&nbsp; **Fail:** [ ]

---

## Test Execution Summary

### Statistics
- **Total Modules:** 11
- **Total Test Cases:** 100+
- **Estimated Execution Time:** 20-30 hours
- **Required Test Users:** 6 (Admin, Drafter, Reviewer, Approver, Controller, Viewer)

### Pass/Fail Summary
| Module | Total Tests | Passed | Failed | Blocked | Not Executed |
|--------|-------------|--------|--------|---------|--------------|
| Dashboard | 3 | ___ | ___ | ___ | ___ |
| New Document Request | 2 | ___ | ___ | ___ | ___ |
| My Document Status | 2 | ___ | ___ | ___ | ___ |
| Draft Documents | 3 | ___ | ___ | ___ | ___ |
| Review & Approval | 4 | ___ | ___ | ___ | ___ |
| Published Documents | 4 | ___ | ___ | ___ | ___ |
| Superseded & Obsolete | 3 | ___ | ___ | ___ | ___ |
| Configuration | 25+ | ___ | ___ | ___ | ___ |
| Logs & Reports | 7 | ___ | ___ | ___ | ___ |
| Master Record | 4 | ___ | ___ | ___ | ___ |
| Profile Settings | 9 | ___ | ___ | ___ | ___ |
| **TOTAL** | **100+** | ___ | ___ | ___ | ___ |

### Overall Pass Rate: ______%

---

## Appendix: Test Data Requirements

### Users Needed
1. Admin User - Full access
2. Drafter - Can create documents
3. Reviewer - Can review documents
4. Approver - Can approve documents
5. Document Controller - Can publish documents
6. Viewer - Read-only access

### Documents Needed
- 5+ Draft documents
- 3+ Documents in review
- 2+ Documents in approval
- 5+ Published documents
- 2+ Superseded documents
- 1+ Obsolete document

### Master Data Needed
- 10+ Document types
- 4+ Project categories
- 5+ Folders
- 3+ Templates
- 2+ Workflows

---

## Sign-Off

**Tested By:** _______________________  
**Date:** _______________________  
**Sign:** _______________________

**Reviewed By:** _______________________  
**Date:** _______________________  
**Sign:** _______________________

**Approved By:** _______________________  
**Date:** _______________________  
**Sign:** _______________________

---

**End of UAT Complete Test Cases**

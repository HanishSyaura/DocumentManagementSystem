# EPC Document Movement Module

## Purpose

This document defines the proposed replacement for the current standalone `RFID EPC Encoder` utility with a proper DMS module that:

- generates and assigns EPC tags to documents,
- tracks physical document movement in and out,
- keeps custody history,
- integrates with existing document workflow, permissions, and audit logging.

This is a flow and implementation proposal only. No production code is changed by this document.

## Current State

The current RFID implementation is a frontend-only utility:

- route: `/rfid-epc-encoder`
- page: `frontend/src/components/RfidLedEpcEncoder.jsx`
- wrapper: `frontend/src/components/RfidLedEpcEncoderRoute.jsx`
- encoder logic: `frontend/src/utils/epcEncoder.js`

Current limitations:

- no backend persistence,
- no link to `Document`,
- no movement tracking,
- no role-based permission gate,
- no audit trail for EPC actions,
- behaves like a separate tool instead of a DMS module.

## Target Outcome

Replace the standalone encoder with a new DMS module:

`EPC Document Movement`

The module should allow users to:

1. generate an EPC for a controlled document,
2. register the EPC against a DMS document record,
3. check a document out to a user or location,
4. check the document back in,
5. view current custody and full movement history,
6. report movement exceptions such as overdue, missing, damaged, or voided tag.

## Business Goal

The new module should treat EPC as part of document control, not as a separate utility.

This means:

- EPC belongs to a document record,
- movement events belong to document custody,
- all actions are searchable and auditable,
- users can see where a physical document is now and who last handled it.

## Scope

### In Scope

- EPC generation and assignment
- EPC registration for documents
- document in/out movement tracking
- custody state tracking
- movement history timeline
- audit logging
- permissions for EPC movement actions
- dashboard/status widgets for movement overview

### Out of Scope For Phase 1

- direct RFID reader hardware integration
- live antenna scan streams
- warehouse-grade bulk scanning workflows
- mobile app workflows
- automatic geolocation tracking

Phase 1 should support manual entry first, with RFID scanner input treated as keyboard input if needed later.

## Recommended Business Model

### Primary Recommendation

Each controlled physical document copy gets one EPC tag.

This is better than storing only one EPC on the document because:

- one document can eventually have more than one controlled copy,
- one copy can be retired without affecting the document master,
- movement is tracked per tagged copy, not only per logical document.

### Practical Rule For Initial Rollout

For initial rollout, the system can start with:

- one EPC tag per published document copy,
- one active custody state per EPC tag,
- manual check-out and check-in by authorized staff.

## Proposed Functional Flow

## 1. EPC Registration Flow

### Trigger

Document is ready for physical control, usually after approval or publication.

### Steps

1. User opens document details.
2. User clicks `Generate EPC`.
3. System generates EPC value from approved business rules.
4. System creates an EPC tag record and links it to the document.
5. System sets the tag status to `AVAILABLE`.
6. System logs the registration in audit and movement history.

### Output

- EPC code
- tag status
- assigned document
- creation timestamp
- created by

## 2. Check-Out Flow

### Trigger

A physical document is released to a staff member, department, or external controlled recipient.

### Steps

1. User searches document by file code, title, or EPC.
2. User opens the EPC record.
3. User selects `Check Out`.
4. User enters:
   - recipient type,
   - recipient user or external party,
   - from location,
   - to location,
   - due back date,
   - remarks.
5. System validates the EPC is not already checked out.
6. System records a movement event with type `CHECK_OUT`.
7. System updates current custody state to `OUT`.
8. System writes audit log entry.

### Output

- movement transaction number
- updated custody owner
- due date
- current status `OUT`

## 3. Check-In Flow

### Trigger

Physical document is returned to document control or designated custody location.

### Steps

1. User searches by EPC or document.
2. User selects `Check In`.
3. User confirms return location, receiver, condition, and remarks.
4. System records a movement event with type `CHECK_IN`.
5. System updates custody state to `AVAILABLE`.
6. System closes any open active checkout state.
7. System writes audit log entry.

### Output

- return timestamp
- received by
- condition on return
- current status `AVAILABLE`

## 4. Transfer Flow

### Trigger

Physical document moves from one controlled custodian or location to another without first returning to central document control.

### Steps

1. User opens active EPC custody record.
2. User selects `Transfer`.
3. User enters new holder or location.
4. System records `TRANSFER_OUT` and `TRANSFER_IN` or one `TRANSFER` event based on implementation choice.
5. System updates current custody state.

### Recommendation

For Phase 1, support a single `TRANSFER` event with `from` and `to` fields to keep implementation simple.

## 5. Exception Flow

### Supported Exceptions

- overdue return,
- lost document,
- damaged tag,
- tag voided,
- movement discrepancy,
- document found after reported missing.

### Recommendation

Model these as movement events instead of separate workflows first. This keeps reporting and audit consistent.

## Proposed Status Model

### EPC Tag Status

- `AVAILABLE`
- `OUT`
- `IN_TRANSIT`
- `LOST`
- `DAMAGED`
- `VOID`

### Movement Type

- `REGISTER`
- `CHECK_OUT`
- `CHECK_IN`
- `TRANSFER`
- `VERIFY_SCAN`
- `MARK_LOST`
- `MARK_DAMAGED`
- `VOID_TAG`
- `REACTIVATE`

### Document Control State

This module should not replace the existing document workflow statuses such as `DRAFT`, `PUBLISHED`, or `ARCHIVED`.

Instead:

- workflow status stays on `Document`,
- custody status stays on EPC tag,
- movement events represent the physical lifecycle.

## Proposed Data Model

## 1. Extend `Document`

Recommended additional fields on `Document`:

- `hasEpcControl` boolean
- `epcControlRequired` boolean
- `lastMovementAt` datetime

These fields are optional but helpful for search, reporting, and UI badges.

## 2. New Model: `DocumentEpcTag`

Suggested fields:

- `id`
- `documentId`
- `epcCode`
- `epcScheme`
- `tagStatus`
- `copyNumber`
- `isPrimary`
- `issuedAt`
- `issuedById`
- `lastVerifiedAt`
- `currentHolderUserId`
- `currentHolderName`
- `currentLocation`
- `notes`
- `isActive`
- `createdAt`
- `updatedAt`

Purpose:

- stores the active EPC identity of a controlled document copy,
- stores the latest custody snapshot for quick lookup,
- supports multiple copies later if required.

## 3. New Model: `DocumentMovement`

Suggested fields:

- `id`
- `documentId`
- `epcTagId`
- `movementType`
- `referenceNo`
- `fromLocation`
- `toLocation`
- `fromUserId`
- `toUserId`
- `externalPartyName`
- `performedById`
- `receivedById`
- `conditionAtMovement`
- `remarks`
- `movementAt`
- `dueBackAt`
- `returnedAt`
- `isOpen`
- `createdAt`

Purpose:

- keeps the immutable movement ledger,
- powers timeline and reporting,
- supports overdue detection.

## 4. Audit Logging

Reuse existing audit log service for actions such as:

- EPC generated,
- EPC assigned,
- document checked out,
- document checked in,
- tag voided,
- movement corrected.

## Recommended Permission Model

Create a dedicated permission group for the new module.

### Suggested Permissions

- `documents.epc.view`
- `documents.epc.generate`
- `documents.epc.checkOut`
- `documents.epc.checkIn`
- `documents.epc.transfer`
- `documents.epc.manage`
- `documents.epc.report`

### Suggested Role Access

- Document Controller: full access
- Department Custodian: view, check-out, check-in, transfer
- Auditor/Admin: view and report
- General user: view only if allowed by document access rules

## Proposed Frontend Module Structure

Replace the current menu item:

- from `RFID EPC Encoder`
- to `EPC Document Movement`

### Suggested Pages

#### 1. EPC Movement Dashboard

Purpose:

- show counts for available, checked out, overdue, lost, and recently moved documents.

#### 2. EPC Registry

Purpose:

- search by EPC, file code, title, holder, location, or status,
- generate EPC for eligible documents,
- open document and movement details.

#### 3. Movement Transaction Page

Purpose:

- perform check-out,
- check-in,
- transfer,
- report loss or damage.

#### 4. Document EPC Timeline Panel

Purpose:

- show all movement events for one document or one EPC tag.

## Proposed Backend Structure

Add a dedicated module in backend following current DMS conventions:

- `backend/src/routes/epc.js`
- `backend/src/controllers/epcController.js`
- `backend/src/services/epcService.js`

### Suggested Endpoints

- `GET /api/epc/tags`
- `POST /api/epc/tags/generate`
- `GET /api/epc/tags/:id`
- `POST /api/epc/tags/:id/check-out`
- `POST /api/epc/tags/:id/check-in`
- `POST /api/epc/tags/:id/transfer`
- `POST /api/epc/tags/:id/report-exception`
- `GET /api/epc/tags/:id/movements`
- `GET /api/epc/reports/overdue`

## EPC Generation Strategy

## Recommendation For Phase 1

Keep EPC generation server-side.

Reasons:

- prevents duplicate generation logic across clients,
- allows uniqueness validation,
- supports audit logging,
- easier to enforce business rules and reserved ranges.

### Suggested EPC Inputs

- document id
- file code
- version
- copy number
- company prefix or internal prefix

### Important Decision

There are two valid paths:

1. `GS1-compliant EPC`
2. `internal EPC format`

### Recommended Approach

Start with an internal format that is deterministic and unique, unless a compliance requirement already exists.

If GS1 compliance is mandatory, reuse the current encoder logic conceptually but move it into backend service and persist the generated result.

## Eligibility Rules

The system should not allow EPC generation for every record by default.

Recommended rule:

- only documents in `APPROVED`, `READY_TO_PUBLISH`, or `PUBLISHED` state can receive EPC tags,
- archived, obsolete, or superseded documents cannot receive new active tags,
- lost or void tags cannot be used for movement until reactivated or replaced.

## Screen Flow

## A. Generate EPC From Document

1. Open document details
2. Click `Generate EPC`
3. Confirm copy number and location
4. Save EPC tag
5. Open EPC timeline

## B. Check-Out

1. Search document or EPC
2. Open tag details
3. Click `Check Out`
4. Fill movement form
5. Save transaction
6. Status changes to `OUT`

## C. Check-In

1. Search active checked-out tag
2. Click `Check In`
3. Confirm return details
4. Save transaction
5. Status changes to `AVAILABLE`

## D. View History

1. Search by file code or EPC
2. Open details
3. View movement timeline
4. Export if needed in later phase

## Integration With Existing DMS Modules

### Document Module

- EPC records must link to `Document.id`
- document details should display EPC summary
- my document status can later show custody state badge

### Audit Module

- all EPC actions must be logged through the current audit log service

### Reports Module

- overdue list,
- current out list,
- lost or damaged list,
- movement history by date range

### Permissions

- reuse existing permission gate pattern in frontend and backend

## Replacement Plan For Current RFID Module

### Remove

- public route `/rfid-epc-encoder`
- `RfidLedEpcEncoder.jsx`
- `RfidLedEpcEncoderRoute.jsx`
- `epcEncoder.js`
- sidebar menu item `RFID EPC Encoder`

### Replace With

- protected route for EPC module
- sidebar item under document control permissions
- backend-persisted generation and movement tracking
- document-linked EPC registry and movement ledger

## Recommended Implementation Phases

## Phase 1: Data And API Foundation

- add Prisma models for EPC tag and movement
- add backend routes, controller, and service
- add audit logging integration
- add permission definitions

## Phase 2: Frontend Registry And Transactions

- replace sidebar and route
- build EPC registry page
- build generate, check-out, and check-in actions
- show movement history on detail panel

## Phase 3: Reporting And Exception Handling

- overdue report
- lost and damaged flow
- dashboard counters
- export features if needed

## Acceptance Criteria

The module is acceptable when:

- user can generate EPC from eligible document,
- generated EPC is unique,
- user can check document out,
- user can check document back in,
- current holder and location are always visible,
- full movement history is preserved,
- all actions are permission-controlled,
- all actions are audit logged,
- current standalone RFID encoder is no longer exposed in navigation.

## Key Assumptions

- the user wants document custody tracking, not raw RFID hardware control,
- one document copy can be represented by one EPC tag,
- physical movement can be captured manually first,
- existing DMS document workflow remains unchanged,
- RFID scanner integration can come later without redesigning the module.

## Open Decisions Before Implementation

The following should be confirmed before coding:

1. whether EPC format must be GS1-compliant or internal,
2. whether EPC tagging starts only after publish or also after approval,
3. whether one document can have multiple controlled copies in Phase 1,
4. whether external recipients are allowed in check-out flow,
5. whether overdue reminders should send notifications in Phase 1.

## Recommended Next Step

After document approval, implementation should proceed in this order:

1. create Prisma schema and migration,
2. add backend EPC module,
3. replace frontend RFID route and menu,
4. connect EPC summary into document detail views,
5. add movement reporting.

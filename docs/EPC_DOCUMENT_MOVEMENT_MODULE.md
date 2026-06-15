# EPC RFID Registry Module (Optional)

## Purpose

This document defines an optional RFID module for customers who use LED RFID labels. The module automatically generates RFID-compliant EPC (SGTIN-96) in hexadecimal from the DMS file code when a draft file is uploaded, then stores every generated EPC in a registry for management and export.

This module:

- keeps the existing DMS workflow unchanged,
- runs EPC generation automatically during the normal draft upload flow,
- provides one registry page to view, filter, and export EPC generated records,
- is feature-gated so only RFID customers enable it.

## Current State

The current RFID implementation is a frontend-only encoder utility:

- route: `/rfid-epc-encoder`
- page: `frontend/src/components/RfidLedEpcEncoder.jsx`
- encoder logic: `frontend/src/utils/epcEncoder.js` (SGTIN-96)

Limitations:

- no backend persistence,
- no reliable link to document and uploaded file,
- no central registry list and export,
- exposed as a standalone tool instead of an optional module.

## Target Outcome

Replace the standalone encoder with:

`RFID EPC Registry`

Capabilities:

1. auto-generate EPC hex (SGTIN-96) after a draft file upload,
2. store a registry record with `fileCode`, `epcHex`, `fileName`, and document details,
3. filter by date range and file code,
4. export the filtered list.

## Vendor Compliance

RFID tags shall be EPC Gen2 UHF compliant and encoded using SGTIN-96 EPC format.

Handheld devices scan:

- `epcHex` (the EPC value stored on the tag).

## Scope

### In Scope (Phase 1)

- auto EPC generation on draft upload
- EPC registry table (document + uploaded version linkage)
- registry page (list + filters + export)
- audit log entry for EPC auto-generation
- feature toggle + permission gate for RFID customers only

### Out of Scope (Phase 1)

- check-in/check-out movement tracking
- handheld transaction workflows (handheld scans EPC but DMS does not manage movements)
- direct RFID reader SDK integration

## Module Enablement (RFID Customers Only)

Recommended approach:

- a configuration flag (example: `rfid_epc_registry_enabled`) controls whether the module menu and endpoints are available,
- permissions control which users can view/export/manage inside an enabled environment.

## End-to-End Flow

### 1) Document Register (Existing)

No change. The system continues generating `fileCode` using existing numbering rules.

### 2) Draft Upload (Existing, Trigger Point)

Trigger point:

- after `POST /api/documents/:id/upload` succeeds.

### 3) Auto EPC Generation (New, Runs in Backend)

Steps:

1. After upload completes, backend checks `rfid_epc_registry_enabled`.
2. Backend checks if an EPC record already exists for this `documentVersionId`.
3. Backend derives SGTIN-96 input fields (mapping rules below).
4. Backend runs the existing SGTIN-96 encoder logic server-side to produce:
   - `epcHex`
   - `tagUri`, `pureIdentityUri`
5. Backend stores a registry record containing:
   - `epcHex`
   - `fileCode`
   - `fileName` (from uploaded file)
   - other document details for display
6. Backend writes an audit log entry (example action: `EPC_GENERATE`).

Output:

- `epcHex` is available for LED RFID encoding/printing,
- the registry list is the single source of truth for all EPC generated records.

### 4) Registry Management (New)

Registry page shows records and supports:

- filter by date range (`generatedAt`)
- filter by file code (contains/exact)
- export of filtered records

## Mapping Rule (File Code → SGTIN-96)

SGTIN-96 requires numeric GS1 components. Since DMS `fileCode` contains separators and non-numeric prefixes, the EPC must be generated using a deterministic mapping that still preserves `fileCode` for traceability.

### Inputs

- `companyPrefixDigits` + `companyPrefix` (GS1, configuration)
- `itemReference` (GS1 numeric, configuration per `DocumentType`)
- `filter` (configuration)
- `serial` (deterministic numeric derived from the current file code definition)

### Recommended Serial Derivation (Aligned to Current File Code Definition)

Use the existing document numbering definition to parse `fileCode` and derive a stable serial:

1. parse `fileCode` to extract:
   - `datePart` in `YYMMDD`
   - `sequence` (counter)
2. compute:
   - `serial = datePart * (10 ^ counterDigits) + sequence`
3. validate:
   - `serial` must fit SGTIN-96 38-bit serial limit

Notes:

- `fileCode` is stored in registry for human reference.
- RFID scanning uses `epcHex`, not `fileCode`.

## Proposed Data Model

### Model: `DocumentEpcRegistryRecord`

Suggested fields:

- `id`
- `documentId`
- `documentVersionId`
- `fileCode`
- `fileName`
- `documentTitle` (optional denormalized for fast list)
- `documentTypeName` (optional denormalized for fast list)
- `version`
- `epcScheme` (fixed: `SGTIN-96`)
- `epcHex`
- `filter`
- `companyPrefixDigits`
- `companyPrefix`
- `itemReference`
- `serial`
- `tagUri`
- `pureIdentityUri`
- `generatedAt`
- `generatedById` (nullable; system-generated on upload)
- `createdAt`

Recommended constraints/indexes:

- unique: `epcHex`
- unique: `documentVersionId` (one EPC per uploaded version)
- index: `generatedAt`
- index: `fileCode`
- index: `documentId`

## Permissions

Suggested permissions:

- `documents.rfidEpcRegistry.view`
- `documents.rfidEpcRegistry.export`
- `documents.rfidEpcRegistry.manage` (optional: regenerate/delete)

## Frontend Module

### Menu

- label: `RFID EPC Registry`
- visibility: only when feature flag enabled + user has view permission

### Registry Page (Single Page)

Table columns (minimum):

- generatedAt
- fileCode
- fileName
- epcHex
- document title
- document type
- version

Filters:

- date range
- file code

Actions:

- export CSV (uses same filters)

## Backend Module

Recommended structure:

- `backend/src/routes/epcRegistry.js`
- `backend/src/controllers/epcRegistryController.js`
- `backend/src/services/epcRegistryService.js`

Suggested endpoints:

- `GET /api/epc-registry`
  - query: `from`, `to`, `fileCode`, `page`, `limit`
- `GET /api/epc-registry/export`
  - query: same filters as list, returns CSV

Hook point:

- after successful draft upload in the existing document upload flow, call EPC generation when feature is enabled.

## Development Plan

### Phase 1: Backend + Auto Generation

- add feature flag config
- add GS1 config + itemReference per DocumentType
- add Prisma model + migration for registry
- add service to generate EPC after upload
- add list + export endpoints
- audit logging integration

### Phase 2: Frontend Registry

- remove/hide old standalone RFID encoder route/menu
- add new menu item for RFID registry (feature + permission gated)
- build registry list page with filters + export

### Phase 3 (Optional): Admin Configuration UI

- UI to manage GS1 parameters
- UI to manage itemReference per DocumentType

## Acceptance Criteria

- on draft upload, system auto-generates an SGTIN-96 `epcHex` when module is enabled
- registry record saved with `fileCode`, `fileName`, and required EPC fields
- registry page filters by date and file code correctly
- export returns only the filtered results
- module can be disabled completely for non-RFID customers

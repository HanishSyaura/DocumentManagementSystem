# DMS — Dokumentasi Utama (Single Entry)

Fail ini dijadikan rujukan utama untuk projek DMS dalam repo ini. Ia ringkaskan apa yang penting dan bagi pautan terus ke dokumen-dokumen detail yang sedia ada.

## Ringkasan sistem

- Backend: Node.js + Express + Prisma (MySQL), default `PORT=4000`, API prefix `/api`, uploads `/uploads`
- Frontend: Vite, build output `dist`, frontend default call API ke `/api`

## Start di sini

- Deploy + upload code (PM2 + Nginx): [DEPLOY_VM_PM2_NGINX_GUIDE.md](docs/DEPLOY_VM_PM2_NGINX_GUIDE.md)
- Quick start dev/local: [QUICK_START.md](docs/QUICK_START.md)
- Migration notes: [MIGRATION_INSTRUCTIONS.md](docs/MIGRATION_INSTRUCTIONS.md)

## Deployment & Operasi

- Deploy VM + cara upload code: [DEPLOY_VM_PM2_NGINX_GUIDE.md](docs/DEPLOY_VM_PM2_NGINX_GUIDE.md)
- Setup Published Documents module: [PUBLISHED_DOCUMENTS_SETUP.md](docs/PUBLISHED_DOCUMENTS_SETUP.md)
- System health / laporan: [SYSTEM_HEALTH_REPORT.md](docs/backend/SYSTEM_HEALTH_REPORT.md)

## Roles, Permission, Session

- Guide permission sistem: [PERMISSION_SYSTEM_GUIDE.md](docs/PERMISSION_SYSTEM_GUIDE.md)
- Verification permission: [PERMISSION_SYSTEM_VERIFICATION.md](docs/PERMISSION_SYSTEM_VERIFICATION.md)
- Permission gates (frontend): [PERMISSION_GATES_IMPLEMENTATION_GUIDE.md](docs/PERMISSION_GATES_IMPLEMENTATION_GUIDE.md)
- Permission audit & fix notes:
  - [PERMISSION_AUDIT_COMPLETE.md](docs/PERMISSION_AUDIT_COMPLETE.md)
  - [PERMISSION_NAMING_AUDIT.md](docs/PERMISSION_NAMING_AUDIT.md)
  - [PERMISSION_NAMING_FIX_GUIDE.md](docs/PERMISSION_NAMING_FIX_GUIDE.md)
- Multiple roles: [MULTIPLE_ROLES_GUIDE.md](docs/backend/MULTIPLE_ROLES_GUIDE.md)
- Session management: [SESSION_MANAGEMENT_GUIDE.md](docs/SESSION_MANAGEMENT_GUIDE.md)
- Default password (testing sahaja): [DEFAULT_PASSWORD_FOR_TESTING.md](docs/DEFAULT_PASSWORD_FOR_TESTING.md)

## Workflow, Review, Supersede

- Dynamic workflow sistem: [DYNAMIC_WORKFLOW_SYSTEM.md](docs/DYNAMIC_WORKFLOW_SYSTEM.md)
- Review & approval module: [REVIEW_AND_APPROVAL_IMPLEMENTATION.md](docs/REVIEW_AND_APPROVAL_IMPLEMENTATION.md)
- New draft workflow: [NEW_DRAFT_WORKFLOW_IMPLEMENTATION.md](docs/NEW_DRAFT_WORKFLOW_IMPLEMENTATION.md)
- Supersede testing: [TESTING_SUPERSEDE_WORKFLOW.md](docs/TESTING_SUPERSEDE_WORKFLOW.md)

## Notifications

- Backend routing & fixes:
  - [NOTIFICATION_ROUTING.md](docs/backend/NOTIFICATION_ROUTING.md)
  - [NOTIFICATION_FIXES.md](docs/backend/NOTIFICATION_FIXES.md)
  - [NOTIFICATION_TESTING_GUIDE.md](docs/backend/NOTIFICATION_TESTING_GUIDE.md)
  - [TEST_NOTIFICATIONS.md](docs/backend/TEST_NOTIFICATIONS.md)
- Backend settings guide: [NOTIFICATION_SETTINGS_GUIDE.md](docs/backend/docs/NOTIFICATION_SETTINGS_GUIDE.md)
- Frontend setup: [NOTIFICATION_SYSTEM_SETUP.md](docs/frontend/NOTIFICATION_SYSTEM_SETUP.md)

## Master Data, Reports, Dashboard

- Master data quick start: [MASTER_DATA_QUICKSTART.md](docs/MASTER_DATA_QUICKSTART.md)
- Master data management: [MASTER_DATA_MANAGEMENT.md](docs/MASTER_DATA_MANAGEMENT.md)
- Dashboard implementation: [DASHBOARD_IMPLEMENTATION.md](docs/DASHBOARD_IMPLEMENTATION.md)
- Dashboard profile image fix: [DASHBOARD_PROFILE_IMAGE_FIX.md](docs/DASHBOARD_PROFILE_IMAGE_FIX.md)

## NDR / My Documents Status

- NDR implementation: [NDR_IMPLEMENTATION.md](docs/NDR_IMPLEMENTATION.md)
- NDR fixes:
  - [FIX_NDR_DATA_CONSISTENCY.md](docs/FIX_NDR_DATA_CONSISTENCY.md)
  - [NDR_FIX_RESPONSE_PATH.md](docs/NDR_FIX_RESPONSE_PATH.md)
  - [NDR_STATUS_TRACKING_FIX.md](docs/NDR_STATUS_TRACKING_FIX.md)
- My documents status:
  - [MY_DOCUMENT_STATUS_MODULE.md](docs/MY_DOCUMENT_STATUS_MODULE.md)
  - [MY_DOCUMENTS_STATUS_IMPLEMENTATION.md](docs/MY_DOCUMENTS_STATUS_IMPLEMENTATION.md)

## Database cleanup

- Quickstart: [DATABASE_CLEANUP_QUICKSTART.md](docs/DATABASE_CLEANUP_QUICKSTART.md)
- Feature details: [DATABASE_CLEANUP_FEATURE.md](docs/DATABASE_CLEANUP_FEATURE.md)

## Theme / UI / CMS

- Theme branding quick guide: [THEME_BRANDING_ENHANCEMENT_QUICK_GUIDE.md](docs/THEME_BRANDING_ENHANCEMENT_QUICK_GUIDE.md)
- Theme persistence fix: [THEME_PERSISTENCE_FIX.md](docs/THEME_PERSISTENCE_FIX.md)
- Enhanced UI sections: [ENHANCED_THEME_UI_SECTIONS.md](docs/ENHANCED_THEME_UI_SECTIONS.md)
- CMS customization system: [COMPLETE_CMS_CUSTOMIZATION_SYSTEM.md](docs/COMPLETE_CMS_CUSTOMIZATION_SYSTEM.md)

## UAT

- UAT quick start: [UAT_QUICK_START.md](docs/UAT_QUICK_START.md)
- UAT testing guide: [UAT_TESTING_GUIDE.md](docs/UAT_TESTING_GUIDE.md)
- UAT readiness checklist/status:
  - [UAT_READINESS_CHECKLIST.md](docs/UAT_READINESS_CHECKLIST.md)
  - [UAT_READINESS_STATUS.md](docs/UAT_READINESS_STATUS.md)
- Test cases lengkap: [UAT_COMPLETE_TEST_CASES.md](docs/UAT_COMPLETE_TEST_CASES.md)

## Debug & Misc

- Navigation map: [NAVIGATION_MAP.md](docs/NAVIGATION_MAP.md)
- Flow test guide: [FLOW_TEST_GUIDE.md](docs/FLOW_TEST_GUIDE.md)
- Debug permissions: [DEBUG_PERMISSIONS.md](docs/DEBUG_PERMISSIONS.md)
- File code dropdown debug: [FILE_CODE_DROPDOWN_DEBUG.md](docs/FILE_CODE_DROPDOWN_DEBUG.md)
- Undefined documentType fix: [UNDEFINED_DOCUMENTTYPE_FIX.md](docs/UNDEFINED_DOCUMENTTYPE_FIX.md)
- Smart login redirect: [SMART_LOGIN_REDIRECT.md](docs/SMART_LOGIN_REDIRECT.md)
- WARP notes: [WARP.md](docs/WARP.md)

## Repo READMEs

- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

// CORRECTED ADMIN PERMISSIONS STRUCTURE
// This matches actual UI buttons and functions

const correctedAdminPermissions = {
  // Dashboard
  dashboard: {
    view: true,
    read: true
  },

  // Draft Documents
  'documents.draft': {
    view: true,      // Can access Draft Documents page
    create: true,    // "New Draft" button
    read: true,      // Can view draft details
    update: true,    // "Reupload File" button
    delete: true,    // "Delete" button
    submit: true     // Can submit for review
  },

  // Review & Approval
  'documents.review': {
    view: true,      // Can access Review & Approval page
    read: true,      // "View" action
    review: true,    // "Review" button
    approve: true,   // "Approve" button
    reject: true,    // Can reject documents
    comment: true    // Can add comments during review
  },

  // Published Documents
  'documents.published': {
    view: true,       // Can access Published Documents page
    create: true,     // "Create New Folder", "Upload File" buttons
    read: true,       // "View" action
    update: true,     // "Obsolete", "Supersede" buttons
    delete: true,     // "Delete" button
    download: true,   // "Download" action
    print: true,      // "Print" action (if implemented)
    acknowledge: true // "Acknowledge" button for published docs
  },

  // Superseded & Obsolete Documents
  'documents.superseded': {
    view: true,      // Can access Superseded & Obsolete page
    create: true,    // "Request for Supersede/Obsolete" button
    read: true,      // "View" action
    update: true,    // General update permission
    delete: true,    // Can delete
    restore: true,   // Can restore documents
    archive: true    // "Archive" button
  },

  // New Document Request (NDR/NVR)
  newDocumentRequest: {
    view: true,        // Can access New Document Request page
    create: true,      // "Send Request", "New Version Request" buttons
    read: true,        // Can view request details
    acknowledge: true, // "Acknowledge" button (assigns file code)
    edit: true,        // Can edit requests (if implemented)
    delete: true,      // Can delete requests (if implemented)
    submit: true,      // Can submit requests
    approve: true,     // For approval workflow (if separate from acknowledge)
    reject: true       // Can reject requests (if implemented)
  },

  // My Documents Status
  myDocumentsStatus: {
    view: true,      // Can access My Documents Status page
    read: true       // Can view own document status
  },

  // Configuration - Users
  'configuration.users': {
    view: true,      // Can access Users Management
    create: true,    // "Add New User" button
    read: true,      // Can view user details
    update: true,    // "Edit User" action
    delete: true     // "Delete User" action
  },

  // Configuration - Roles
  'configuration.roles': {
    view: true,      // Can access Role Management
    create: true,    // "Add New Role" button
    read: true,      // Can view role details
    update: true,    // "Edit Role", "Edit Permissions" actions
    delete: true     // "Delete Role" action
  },

  // Configuration - Workflows
  'configuration.workflows': {
    view: true,      // Can access Workflow Configuration
    create: true,    // "Add New Workflow" button
    read: true,      // "View" action
    update: true,    // "Edit" button, "Toggle Status"
    delete: true     // "Delete" action
  },

  // Configuration - Templates
  'configuration.templates': {
    view: true,      // Can access Template Management
    create: true,    // "Add New Template" button
    read: true,      // "View", "Download" actions
    update: true,    // "Reupload" action
    delete: true     // "Delete" action (if implemented)
  },

  // Configuration - Departments
  'configuration.departments': {
    view: true,
    create: true,
    read: true,
    update: true,
    delete: true
  },

  // Configuration - Document Types
  'configuration.documentTypes': {
    view: true,
    create: true,
    read: true,
    update: true,
    delete: true
  },

  // Configuration - Settings
  'configuration.settings': {
    view: true,
    read: true,
    update: true
  },

  // Logs & Reports - Activity Logs
  'logsReport.activityLogs': {
    view: true,
    read: true,
    export: true
  },

  // Logs & Reports - Audit Trail
  'logsReport.auditTrail': {
    view: true,
    read: true,
    export: true
  },

  // Logs & Reports - Reports
  'logsReport.reports': {
    view: true,
    read: true,
    export: true
  },

  // Master Record
  masterRecord: {
    view: true,
    read: true,
    export: true
  },

  // Profile Settings
  profileSettings: {
    view: true,
    read: true,
    update: true
  }
};

module.exports = correctedAdminPermissions;

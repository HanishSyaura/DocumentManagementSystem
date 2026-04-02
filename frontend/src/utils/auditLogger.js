/**
 * Audit Logging Utility Functions
 * 
 * This module provides centralized logging functions for tracking all actions
 * across the Document Management System (DMS).
 * 
 * Usage:
 * import { logDocumentAction, logUserAction, logAuthAction } from '@/utils/auditLogger'
 * 
 * await logDocumentAction('CREATE', documentId, documentData)
 */

import api from '../api/axios'

// ============================================================================
// CORE LOGGING FUNCTION
// ============================================================================

/**
 * Core function to create an audit log entry
 * @param {Object} logData - The log data to record
 * @returns {Promise<void>}
 */
async function createAuditLog(logData) {
  try {
    // Get user info from localStorage or auth context
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    // Get IP address and user agent
    const userAgent = navigator.userAgent
    
    const payload = {
      timestamp: new Date().toISOString(),
      userId: user.id || 'unknown',
      userName: user.name || user.email || 'Unknown User',
      userRole: user.role || 'N/A',
      ipAddress: 'Client-Side', // Will be filled by backend
      userAgent,
      status: 'SUCCESS',
      ...logData
    }

    // Send to backend
    await api.post('/audit/logs', payload)
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - logging should not break app functionality
  }
}

/**
 * Log a failed action
 * @param {Object} logData - The log data
 * @param {Error} error - The error that occurred
 */
async function createFailedAuditLog(logData, error) {
  await createAuditLog({
    ...logData,
    status: 'FAILED',
    errorMessage: error.message || 'Unknown error'
  })
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

/**
 * Log document-related actions
 * @param {string} action - The action performed (CREATE, UPDATE, DELETE, etc.)
 * @param {string} entityId - Document ID
 * @param {string} entityName - Document title/name
 * @param {Object} options - Additional options
 */
export async function logDocumentAction(action, entityId, entityName, options = {}) {
  const { previousValue, newValue, metadata } = options
  
  await createAuditLog({
    module: 'Document',
    action,
    entityType: 'Document',
    entityId,
    entityName,
    previousValue,
    newValue,
    metadata
  })
}

/**
 * Log document request creation
 */
export async function logDocumentRequestCreated(requestId, requestData) {
  await logDocumentAction('CREATE', requestId, requestData.title, {
    newValue: {
      documentType: requestData.documentType,
      projectCategory: requestData.projectCategory,
      dateOfDocument: requestData.dateOfDocument,
      remarks: requestData.remarks
    },
    metadata: {
      source: 'Document Request Form'
    }
  })
}

/**
 * Log document upload
 */
export async function logDocumentUpload(documentId, documentName, fileData) {
  await logDocumentAction('UPLOAD', documentId, documentName, {
    newValue: {
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      fileType: fileData.fileType,
      version: fileData.version
    },
    metadata: {
      uploadMethod: 'Web Interface',
      fileFormat: fileData.fileType
    }
  })
}

/**
 * Log document download
 */
export async function logDocumentDownload(documentId, documentName, version) {
  await logDocumentAction('DOWNLOAD', documentId, documentName, {
    metadata: {
      version,
      downloadTime: new Date().toISOString()
    }
  })
}

/**
 * Log document view
 */
export async function logDocumentView(documentId, documentName) {
  await logDocumentAction('VIEW', documentId, documentName, {
    metadata: {
      viewTime: new Date().toISOString()
    }
  })
}

/**
 * Log document update/edit
 */
export async function logDocumentUpdate(documentId, documentName, previousData, newData) {
  await logDocumentAction('UPDATE', documentId, documentName, {
    previousValue: previousData,
    newValue: newData,
    metadata: {
      fieldsChanged: Object.keys(newData).filter(key => previousData[key] !== newData[key])
    }
  })
}

/**
 * Log document deletion
 */
export async function logDocumentDelete(documentId, documentName, documentData) {
  await logDocumentAction('DELETE', documentId, documentName, {
    previousValue: documentData,
    metadata: {
      deletionTime: new Date().toISOString()
    }
  })
}

/**
 * Log document version upload
 */
export async function logDocumentVersionUpload(documentId, documentName, versionNumber, fileData) {
  await logDocumentAction('VERSION_UPLOAD', documentId, `${documentName} v${versionNumber}`, {
    newValue: {
      version: versionNumber,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize
    },
    metadata: {
      versionNumber,
      previousVersion: versionNumber - 0.1
    }
  })
}

// ============================================================================
// WORKFLOW & APPROVAL OPERATIONS
// ============================================================================

/**
 * Log workflow-related actions
 */
export async function logWorkflowAction(action, entityId, entityName, options = {}) {
  await createAuditLog({
    module: 'Workflow',
    action,
    entityType: 'Workflow',
    entityId,
    entityName,
    ...options
  })
}

/**
 * Log document submission for review
 */
export async function logDocumentSubmitForReview(documentId, documentName, reviewerInfo) {
  await logDocumentAction('SUBMIT_REVIEW', documentId, documentName, {
    newValue: {
      status: 'Pending Review',
      submittedTo: reviewerInfo.reviewerName,
      submittedAt: new Date().toISOString()
    },
    metadata: {
      reviewerId: reviewerInfo.reviewerId,
      reviewerRole: reviewerInfo.reviewerRole
    }
  })
}

/**
 * Log document approval
 */
export async function logDocumentApprove(documentId, documentName, comments) {
  await logDocumentAction('APPROVE', documentId, documentName, {
    previousValue: { status: 'Pending Approval' },
    newValue: { 
      status: 'Approved',
      approvalComments: comments,
      approvedAt: new Date().toISOString()
    }
  })
}

/**
 * Log document rejection
 */
export async function logDocumentReject(documentId, documentName, reason) {
  await logDocumentAction('REJECT', documentId, documentName, {
    previousValue: { status: 'Pending Approval' },
    newValue: { 
      status: 'Rejected',
      rejectionReason: reason,
      rejectedAt: new Date().toISOString()
    }
  })
}

/**
 * Log document returned for amendments
 */
export async function logDocumentReturnForAmendments(documentId, documentName, comments) {
  await logDocumentAction('RETURN_AMENDMENTS', documentId, documentName, {
    previousValue: { status: 'Pending Review' },
    newValue: { 
      status: 'Return for Amendments',
      returnComments: comments,
      returnedAt: new Date().toISOString()
    }
  })
}

/**
 * Log document published
 */
export async function logDocumentPublish(documentId, documentName, publishData) {
  await logDocumentAction('PUBLISH', documentId, documentName, {
    previousValue: { status: 'Approved' },
    newValue: { 
      status: 'Published',
      publishedAt: new Date().toISOString(),
      fileCode: publishData.fileCode
    }
  })
}

// ============================================================================
// USER MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Log user management actions
 */
export async function logUserAction(action, entityId, entityName, options = {}) {
  await createAuditLog({
    module: 'User Management',
    action,
    entityType: 'User',
    entityId,
    entityName,
    ...options
  })
}

/**
 * Log user creation
 */
export async function logUserCreate(userId, userData) {
  await logUserAction('CREATE', userId, userData.name || userData.email, {
    newValue: {
      email: userData.email,
      role: userData.role,
      department: userData.department,
      status: 'Active'
    },
    metadata: {
      creationMethod: 'Admin Panel'
    }
  })
}

/**
 * Log user update
 */
export async function logUserUpdate(userId, userName, previousData, newData) {
  await logUserAction('UPDATE', userId, userName, {
    previousValue: previousData,
    newValue: newData,
    metadata: {
      fieldsChanged: Object.keys(newData).filter(key => previousData[key] !== newData[key])
    }
  })
}

/**
 * Log user deletion/deactivation
 */
export async function logUserDelete(userId, userName, userData) {
  await logUserAction('DELETE', userId, userName, {
    previousValue: userData,
    metadata: {
      deletionTime: new Date().toISOString()
    }
  })
}

/**
 * Log role assignment
 */
export async function logRoleAssignment(userId, userName, previousRole, newRole) {
  await logUserAction('ROLE_ASSIGN', userId, userName, {
    previousValue: { role: previousRole },
    newValue: { role: newRole },
    metadata: {
      roleChangeTime: new Date().toISOString()
    }
  })
}

/**
 * Log permission changes
 */
export async function logPermissionChange(entityId, entityName, previousPermissions, newPermissions) {
  await createAuditLog({
    module: 'User Management',
    action: 'PERMISSION_CHANGE',
    entityType: 'Permission',
    entityId,
    entityName,
    previousValue: previousPermissions,
    newValue: newPermissions,
    metadata: {
      permissionsAdded: newPermissions.filter(p => !previousPermissions.includes(p)),
      permissionsRemoved: previousPermissions.filter(p => !newPermissions.includes(p))
    }
  })
}

// ============================================================================
// AUTHENTICATION OPERATIONS
// ============================================================================

/**
 * Log authentication actions
 */
export async function logAuthAction(action, entityName, options = {}) {
  await createAuditLog({
    module: 'Authentication',
    action,
    entityType: 'User Session',
    entityId: options.userId || 'unknown',
    entityName,
    ...options
  })
}

/**
 * Log successful login
 */
export async function logLoginSuccess(userId, userName, loginMethod = 'Password') {
  await logAuthAction('LOGIN', userName, {
    userId,
    newValue: {
      loginMethod,
      loginTime: new Date().toISOString(),
      sessionId: Date.now().toString()
    },
    metadata: {
      loginMethod
    }
  })
}

/**
 * Log failed login attempt
 */
export async function logLoginFailure(email, reason) {
  await createFailedAuditLog({
    module: 'Authentication',
    action: 'LOGIN',
    entityType: 'User Session',
    entityId: 'unknown',
    entityName: email || 'Unknown User',
    metadata: {
      attemptTime: new Date().toISOString(),
      failureReason: reason
    }
  }, new Error(reason))
}

/**
 * Log logout
 */
export async function logLogout(userId, userName, sessionDuration) {
  await logAuthAction('LOGOUT', userName, {
    userId,
    newValue: {
      logoutTime: new Date().toISOString(),
      sessionDuration: `${Math.round(sessionDuration / 60000)} minutes`
    }
  })
}

/**
 * Log password change
 */
export async function logPasswordChange(userId, userName, method = 'User Initiated') {
  await logAuthAction('PASSWORD_CHANGE', userName, {
    userId,
    newValue: {
      changeTime: new Date().toISOString(),
      method
    },
    metadata: {
      changeMethod: method
    }
  })
}

/**
 * Log password reset request
 */
export async function logPasswordResetRequest(email) {
  await logAuthAction('PASSWORD_RESET_REQUEST', email, {
    entityId: 'pending',
    newValue: {
      requestTime: new Date().toISOString(),
      email
    }
  })
}

// ============================================================================
// CONFIGURATION OPERATIONS
// ============================================================================

/**
 * Log configuration changes
 */
export async function logConfigAction(action, entityId, entityName, options = {}) {
  await createAuditLog({
    module: 'Configuration',
    action,
    entityType: 'Configuration',
    entityId,
    entityName,
    ...options
  })
}

/**
 * Log system settings update
 */
export async function logSystemSettingsUpdate(settingName, previousValue, newValue) {
  await logConfigAction('UPDATE', `setting_${settingName}`, settingName, {
    previousValue: { value: previousValue },
    newValue: { value: newValue },
    metadata: {
      settingType: 'System Setting',
      changeTime: new Date().toISOString()
    }
  })
}

/**
 * Log theme changes
 */
export async function logThemeChange(previousTheme, newTheme) {
  await logConfigAction('UPDATE', 'theme_settings', 'System Theme Settings', {
    previousValue: previousTheme,
    newValue: newTheme,
    metadata: {
      changedFields: Object.keys(newTheme).filter(key => 
        JSON.stringify(previousTheme[key]) !== JSON.stringify(newTheme[key])
      )
    }
  })
}

/**
 * Log logo/branding update
 */
export async function logBrandingUpdate(type, fileName) {
  await logConfigAction('UPDATE', `branding_${type}`, `${type} Update`, {
    newValue: {
      type,
      fileName,
      uploadTime: new Date().toISOString()
    },
    metadata: {
      brandingType: type
    }
  })
}

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

/**
 * Log template actions
 */
export async function logTemplateAction(action, entityId, entityName, options = {}) {
  await createAuditLog({
    module: 'Template',
    action,
    entityType: 'Template',
    entityId,
    entityName,
    ...options
  })
}

/**
 * Log template upload
 */
export async function logTemplateUpload(templateId, templateData) {
  await logTemplateAction('UPLOAD', templateId, templateData.templateName, {
    newValue: {
      documentType: templateData.documentType,
      version: templateData.version,
      prefixCode: templateData.prefixCode,
      uploadTime: new Date().toISOString()
    },
    metadata: {
      fileSize: templateData.fileSize,
      fileType: templateData.fileType
    }
  })
}

/**
 * Log template re-upload/update
 */
export async function logTemplateReupload(templateId, templateName, previousVersion, newVersion) {
  await logTemplateAction('REUPLOAD', templateId, templateName, {
    previousValue: { version: previousVersion },
    newValue: { version: newVersion },
    metadata: {
      updateTime: new Date().toISOString()
    }
  })
}

/**
 * Log template download
 */
export async function logTemplateDownload(templateId, templateName) {
  await logTemplateAction('DOWNLOAD', templateId, templateName, {
    metadata: {
      downloadTime: new Date().toISOString()
    }
  })
}

/**
 * Log template view
 */
export async function logTemplateView(templateId, templateName) {
  await logTemplateAction('VIEW', templateId, templateName, {
    metadata: {
      viewTime: new Date().toISOString()
    }
  })
}

/**
 * Log template deletion
 */
export async function logTemplateDelete(templateId, templateName, templateData) {
  await logTemplateAction('DELETE', templateId, templateName, {
    previousValue: templateData,
    metadata: {
      deletionTime: new Date().toISOString()
    }
  })
}

// ============================================================================
// WORKFLOW CONFIGURATION OPERATIONS
// ============================================================================

/**
 * Log workflow configuration create
 */
export async function logWorkflowCreate(workflowId, workflowData) {
  await logWorkflowAction('CREATE', workflowId, workflowData.name, {
    newValue: {
      documentType: workflowData.documentType,
      steps: workflowData.steps,
      enabled: workflowData.enabled
    },
    metadata: {
      stepCount: workflowData.steps?.length || 0
    }
  })
}

/**
 * Log workflow configuration update
 */
export async function logWorkflowUpdate(workflowId, workflowName, previousData, newData) {
  await logWorkflowAction('UPDATE', workflowId, workflowName, {
    previousValue: previousData,
    newValue: newData,
    metadata: {
      fieldsChanged: Object.keys(newData).filter(key => 
        JSON.stringify(previousData[key]) !== JSON.stringify(newData[key])
      )
    }
  })
}

/**
 * Log workflow deletion
 */
export async function logWorkflowDelete(workflowId, workflowName, workflowData) {
  await logWorkflowAction('DELETE', workflowId, workflowName, {
    previousValue: workflowData,
    metadata: {
      deletionTime: new Date().toISOString()
    }
  })
}

// ============================================================================
// ROLE & PERMISSION OPERATIONS
// ============================================================================

/**
 * Log role creation
 */
export async function logRoleCreate(roleId, roleData) {
  await createAuditLog({
    module: 'User Management',
    action: 'CREATE',
    entityType: 'Role',
    entityId: roleId,
    entityName: roleData.name,
    newValue: {
      roleName: roleData.name,
      permissions: roleData.permissions,
      description: roleData.description
    },
    metadata: {
      permissionCount: roleData.permissions?.length || 0
    }
  })
}

/**
 * Log role update
 */
export async function logRoleUpdate(roleId, roleName, previousData, newData) {
  await createAuditLog({
    module: 'User Management',
    action: 'UPDATE',
    entityType: 'Role',
    entityId: roleId,
    entityName: roleName,
    previousValue: previousData,
    newValue: newData,
    metadata: {
      fieldsChanged: Object.keys(newData).filter(key => 
        JSON.stringify(previousData[key]) !== JSON.stringify(newData[key])
      )
    }
  })
}

/**
 * Log role deletion
 */
export async function logRoleDelete(roleId, roleName, roleData) {
  await createAuditLog({
    module: 'User Management',
    action: 'DELETE',
    entityType: 'Role',
    entityId: roleId,
    entityName: roleName,
    previousValue: roleData,
    metadata: {
      deletionTime: new Date().toISOString(),
      affectedUsers: roleData.userCount || 0
    }
  })
}

// ============================================================================
// EXPORT OPERATIONS
// ============================================================================

/**
 * Log bulk export
 */
export async function logBulkExport(module, recordCount, exportFormat) {
  await createAuditLog({
    module,
    action: 'BULK_EXPORT',
    entityType: 'Export',
    entityId: `export_${Date.now()}`,
    entityName: `Bulk Export (${recordCount} records)`,
    newValue: {
      recordCount,
      exportFormat,
      exportTime: new Date().toISOString()
    },
    metadata: {
      exportFormat,
      recordCount
    }
  })
}

// ============================================================================
// ERROR/FAILURE LOGGING
// ============================================================================

/**
 * Log any failed action
 */
export async function logFailedAction(module, action, entityName, error) {
  await createFailedAuditLog({
    module,
    action,
    entityType: 'Error',
    entityId: 'error',
    entityName,
    metadata: {
      errorName: error.name,
      errorStack: error.stack?.substring(0, 500) // Limit stack trace length
    }
  }, error)
}

// Export all functions
export default {
  // Document operations
  logDocumentAction,
  logDocumentRequestCreated,
  logDocumentUpload,
  logDocumentDownload,
  logDocumentView,
  logDocumentUpdate,
  logDocumentDelete,
  logDocumentVersionUpload,
  
  // Workflow operations
  logDocumentSubmitForReview,
  logDocumentApprove,
  logDocumentReject,
  logDocumentReturnForAmendments,
  logDocumentPublish,
  
  // User management
  logUserCreate,
  logUserUpdate,
  logUserDelete,
  logRoleAssignment,
  logPermissionChange,
  
  // Authentication
  logLoginSuccess,
  logLoginFailure,
  logLogout,
  logPasswordChange,
  logPasswordResetRequest,
  
  // Configuration
  logSystemSettingsUpdate,
  logThemeChange,
  logBrandingUpdate,
  
  // Templates
  logTemplateUpload,
  logTemplateReupload,
  logTemplateDownload,
  logTemplateView,
  logTemplateDelete,
  
  // Workflow configuration
  logWorkflowCreate,
  logWorkflowUpdate,
  logWorkflowDelete,
  
  // Roles
  logRoleCreate,
  logRoleUpdate,
  logRoleDelete,
  
  // Export
  logBulkExport,
  
  // Errors
  logFailedAction
}

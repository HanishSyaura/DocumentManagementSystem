# Audit Logger Usage Guide

This guide shows how to implement audit logging across all modules in the DMS.

## Import the Functions

```javascript
import { 
  logDocumentUpload, 
  logDocumentDownload,
  logUserCreate,
  logLoginSuccess,
  logThemeChange,
  // ... other functions
} from '@/utils/auditLogger'
```

## Usage Examples

### 1. Document Operations

#### Document Upload
```javascript
// In your document upload handler
const handleDocumentUpload = async (file) => {
  try {
    const response = await api.post('/documents/upload', formData)
    const document = response.data
    
    // Log the upload
    await logDocumentUpload(
      document.id,
      document.title,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        version: '1.0'
      }
    )
    
    // Continue with success handling
  } catch (error) {
    // Log the failed action
    await logFailedAction('Document', 'UPLOAD', file.name, error)
  }
}
```

#### Document Download
```javascript
const handleDownload = async (documentId, documentName, version) => {
  try {
    await api.get(`/documents/${documentId}/download`)
    
    // Log the download
    await logDocumentDownload(documentId, documentName, version)
  } catch (error) {
    console.error('Download failed:', error)
  }
}
```

#### Document View
```javascript
useEffect(() => {
  if (documentId) {
    loadDocument(documentId)
    
    // Log document view
    logDocumentView(documentId, documentTitle)
  }
}, [documentId])
```

#### Document Update
```javascript
const handleDocumentUpdate = async (documentId, updates) => {
  const previousData = { ...currentDocument }
  
  try {
    await api.put(`/documents/${documentId}`, updates)
    
    // Log the update
    await logDocumentUpdate(
      documentId,
      currentDocument.title,
      previousData,
      updates
    )
  } catch (error) {
    await logFailedAction('Document', 'UPDATE', currentDocument.title, error)
  }
}
```

### 2. Document Request Creation

```javascript
// In NewDocumentRequest.jsx
const handleSubmit = async (formData) => {
  try {
    const response = await api.post('/documents/requests', formData)
    const request = response.data.request
    
    // Log document request creation
    await logDocumentRequestCreated(request.id, formData)
    
    alert('Document request submitted successfully!')
  } catch (error) {
    console.error('Failed to submit request:', error)
  }
}
```

### 3. Workflow & Approval Actions

#### Submit for Review
```javascript
const handleSubmitForReview = async (documentId, documentName, reviewerId) => {
  try {
    await api.post(`/documents/${documentId}/submit-review`, { reviewerId })
    
    // Log submission
    await logDocumentSubmitForReview(documentId, documentName, {
      reviewerId: reviewerId,
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role
    })
  } catch (error) {
    console.error('Submit failed:', error)
  }
}
```

#### Approve Document
```javascript
const handleApprove = async (documentId, documentName, comments) => {
  try {
    await api.post(`/documents/${documentId}/approve`, { comments })
    
    // Log approval
    await logDocumentApprove(documentId, documentName, comments)
    
    alert('Document approved successfully!')
  } catch (error) {
    console.error('Approval failed:', error)
  }
}
```

#### Reject Document
```javascript
const handleReject = async (documentId, documentName, reason) => {
  try {
    await api.post(`/documents/${documentId}/reject`, { reason })
    
    // Log rejection
    await logDocumentReject(documentId, documentName, reason)
    
    alert('Document rejected.')
  } catch (error) {
    console.error('Rejection failed:', error)
  }
}
```

### 4. User Management

#### Create User
```javascript
// In user management component
const handleCreateUser = async (userData) => {
  try {
    const response = await api.post('/users', userData)
    const newUser = response.data.user
    
    // Log user creation
    await logUserCreate(newUser.id, userData)
    
    alert('User created successfully!')
  } catch (error) {
    await logFailedAction('User Management', 'CREATE', userData.email, error)
  }
}
```

#### Update User
```javascript
const handleUpdateUser = async (userId, updates) => {
  const previousData = { ...currentUser }
  
  try {
    await api.put(`/users/${userId}`, updates)
    
    // Log user update
    await logUserUpdate(userId, currentUser.name, previousData, updates)
  } catch (error) {
    console.error('Update failed:', error)
  }
}
```

#### Assign Role
```javascript
const handleRoleChange = async (userId, userName, newRole) => {
  const previousRole = currentUser.role
  
  try {
    await api.put(`/users/${userId}/role`, { role: newRole })
    
    // Log role assignment
    await logRoleAssignment(userId, userName, previousRole, newRole)
  } catch (error) {
    console.error('Role assignment failed:', error)
  }
}
```

### 5. Authentication

#### Login Success
```javascript
// In login component
const handleLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials)
    const user = response.data.user
    
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('loginTime', Date.now().toString())
    
    // Log successful login
    await logLoginSuccess(user.id, user.name, 'Password')
    
    navigate('/dashboard')
  } catch (error) {
    // Log failed login
    await logLoginFailure(credentials.email, error.message)
    alert('Login failed')
  }
}
```

#### Logout
```javascript
const handleLogout = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const loginTime = parseInt(localStorage.getItem('loginTime') || '0')
  const sessionDuration = Date.now() - loginTime
  
  try {
    await api.post('/auth/logout')
    
    // Log logout
    await logLogout(user.id, user.name, sessionDuration)
    
    localStorage.clear()
    navigate('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
```

#### Password Change
```javascript
const handlePasswordChange = async (userId, userName, oldPassword, newPassword) => {
  try {
    await api.put('/auth/password', { oldPassword, newPassword })
    
    // Log password change
    await logPasswordChange(userId, userName, 'User Initiated')
    
    alert('Password changed successfully!')
  } catch (error) {
    console.error('Password change failed:', error)
  }
}
```

### 6. Configuration Changes

#### Theme Update
```javascript
// In GeneralSystemSettings.jsx
const handleThemeChange = async (field, value) => {
  const previousTheme = { ...theme }
  const newTheme = { ...theme, [field]: value }
  
  setTheme(newTheme)
  applyTheme(newTheme)
  
  // Show confirmation modal, then on save:
  localStorage.setItem('dms_theme_settings', JSON.stringify(newTheme))
  
  // Log theme change
  await logThemeChange(previousTheme, newTheme)
}
```

#### Logo/Branding Update
```javascript
const handleLogoUpload = async (file, type) => {
  try {
    const base64 = await convertToBase64(file)
    
    // Save to localStorage
    const settings = JSON.parse(localStorage.getItem('dms_theme_settings') || '{}')
    settings[type] = base64
    localStorage.setItem('dms_theme_settings', JSON.stringify(settings))
    
    // Log branding update
    await logBrandingUpdate(type, file.name)
  } catch (error) {
    console.error('Logo upload failed:', error)
  }
}
```

### 7. Template Operations

#### Template Upload
```javascript
// In template management
const handleTemplateUpload = async (templateData, file) => {
  try {
    const response = await api.post('/templates', formData)
    const template = response.data.template
    
    // Log template upload
    await logTemplateUpload(template.id, {
      templateName: templateData.templateName,
      documentType: templateData.documentType,
      version: templateData.version,
      prefixCode: templateData.prefixCode,
      fileSize: file.size,
      fileType: file.type
    })
    
    alert('Template uploaded successfully!')
  } catch (error) {
    console.error('Template upload failed:', error)
  }
}
```

#### Template Download
```javascript
const handleTemplateDownload = async (templateId, templateName) => {
  try {
    await api.get(`/templates/${templateId}/download`)
    
    // Log template download
    await logTemplateDownload(templateId, templateName)
  } catch (error) {
    console.error('Download failed:', error)
  }
}
```

### 8. Workflow Configuration

#### Create Workflow
```javascript
const handleCreateWorkflow = async (workflowData) => {
  try {
    const response = await api.post('/workflows', workflowData)
    const workflow = response.data.workflow
    
    // Log workflow creation
    await logWorkflowCreate(workflow.id, workflowData)
    
    alert('Workflow created successfully!')
  } catch (error) {
    console.error('Workflow creation failed:', error)
  }
}
```

### 9. Bulk Export

```javascript
const handleExportCSV = async () => {
  try {
    const response = await api.get('/documents/export', { responseType: 'blob' })
    
    // Log bulk export
    await logBulkExport('Document', filteredDocuments.length, 'CSV')
    
    // Download the file
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'documents.csv')
    link.click()
  } catch (error) {
    console.error('Export failed:', error)
  }
}
```

## Best Practices

1. **Always log after successful operations** - Don't log before the operation completes
2. **Use try-catch blocks** - Wrap logging in error handling to prevent app crashes
3. **Log failures too** - Use `logFailedAction` or specific failure logs
4. **Include meaningful context** - Add metadata that helps understand what happened
5. **Don't log sensitive data** - Never log passwords, tokens, or sensitive personal info
6. **Be consistent** - Use the same logging approach across similar operations

## Testing Audit Logs

You can view audit logs in the Configuration page under "Audit & Log Settings" tab:

1. Navigate to Configuration
2. Click "Audit & Log Settings" tab
3. Go to "Activity Logs" sub-tab
4. Use filters to find specific logs
5. Click "View" to see full log details

## Automatic Logging

Some actions are automatically logged by the utility:
- Includes timestamp
- Captures user info from localStorage
- Records user agent and IP (backend fills real IP)
- Sets status (SUCCESS/FAILED)
- Stores before/after values for updates

## Backend Integration

The frontend sends logs to `/audit/logs` endpoint. Ensure your backend:
1. Has the endpoint implemented
2. Stores logs in database
3. Enriches logs with server-side data (real IP address)
4. Implements log retention policies

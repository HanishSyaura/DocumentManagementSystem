import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { usePreferences } from '../contexts/PreferencesContext'

export default function ReviewDocumentModal({ document, onClose, onSubmit }) {
  const { t } = usePreferences()
  const [formData, setFormData] = useState({
    fileCode: document?.fileCode || '',
    documentTitle: document?.title || '',
    versionNo: document?.version || '',
    documentType: document?.documentType || document?.type || '',
    comments: '',
    reviewedFile: null,
    reviewDecision: '', // 'reviewed' or 'amendments'
    assignedApprover: null // Only ONE approver can be assigned
  })

  const [isDragging, setIsDragging] = useState(false)
  const [approversList, setApproversList] = useState([])
  const [loadingApprovers, setLoadingApprovers] = useState(true)

  // Fetch list of approvers from the API
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoadingApprovers(true)
        const res = await api.get('/users')
        const users = res.data.data?.users || res.data.users || []
        
        // Get document owner ID to exclude from approvers
        const documentOwnerId = document?.submittedById || document?.createdById || document?.userId || document?.ownerId
        
        // Get current user ID (the reviewer) to exclude from approvers
        let currentUserId = null
        try {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const currentUser = JSON.parse(userStr)
            currentUserId = currentUser.id
          }
        } catch (error) {
          console.error('Error getting current user:', error)
        }
        
        // Filter users who have roles with Review/Approval permissions
        const approvers = users.filter(user => {
          // Exclude document owner from approvers list
          if (documentOwnerId && user.id === documentOwnerId) {
            console.log('[ReviewModal] Excluding document owner:', user.firstName, user.lastName)
            return false
          }
          
          // Exclude current reviewer from approvers list (same person cannot review AND approve)
          if (currentUserId && user.id === currentUserId) {
            console.log('[ReviewModal] Excluding current reviewer:', user.firstName, user.lastName)
            return false
          }
          
          const userRoles = user.roles || []
          
          console.log('[ReviewModal] Checking user:', user.firstName, user.lastName, 'roles:', userRoles)
          
          return userRoles.some(userRole => {
            // Handle nested structure: roles: [{ role: { name: 'Approver', permissions: {...} } }]
            const role = userRole.role || {}
            const roleName = role.name || role.displayName || role.roleName || userRole.name || ''
            const permissions = role.permissions || {}
            
            console.log('[ReviewModal]  - Role name:', roleName, 'Permissions:', permissions)
            
            // Check if role name matches - ONLY Approver or Administrator roles can approve
            const roleNameLower = roleName.toLowerCase()
            const isApproverRole = [
              'approver', 'administrator', 'admin'
            ].includes(roleNameLower)
            
            // Check if permissions object has reviewApproval with approve permission
            const hasApprovePermission = 
              permissions?.reviewApproval?.approve ||
              permissions?.['documents.reviewApproval']?.approve
            
            const matched = isApproverRole || hasApprovePermission
            console.log('[ReviewModal]  - Matched:', matched, 'isApproverRole:', isApproverRole, 'hasApprovePermission:', hasApprovePermission)
            
            return matched
          })
        })
        
        console.log('[ReviewModal] Filtered approvers:', approvers)
        
        // Format for dropdown
        const formattedApprovers = approvers.map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        }))
        
        setApproversList(formattedApprovers)
      } catch (error) {
        console.error('Failed to fetch approvers:', error)
        // Fallback to empty list
        setApproversList([])
      } finally {
        setLoadingApprovers(false)
      }
    }
    
    fetchApprovers()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      reviewDecision: checked ? value : ''
    }))
  }

  const handleApproverSelect = (approverId) => {
    setFormData(prev => ({
      ...prev,
      assignedApprover: approverId ? parseInt(approverId) : null
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, reviewedFile: file }))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, reviewedFile: file }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.reviewDecision) {
      alert('Please select a review decision')
      return
    }

    // Require comments when returning for amendments
    if (formData.reviewDecision === 'amendments' && !formData.comments.trim()) {
      alert('Please provide comments explaining why the document needs amendments')
      return
    }

    // Require approver assignment when document is reviewed
    if (formData.reviewDecision === 'reviewed' && !formData.assignedApprover) {
      alert('Please assign an approver for the reviewed document')
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">{t('review_document')}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('modal_draft_desc')}
            </p>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-4 space-y-4">
            {/* File Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('file_code')}
              </label>
              <input
                type="text"
                name="fileCode"
                value={formData.fileCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                readOnly
              />
            </div>

            {/* Document Title & Version */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('document_title_col')}
                </label>
                <input
                  type="text"
                  name="documentTitle"
                  value={formData.documentTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('version_revision')}
                </label>
                <input
                  type="text"
                  name="versionNo"
                  value={formData.versionNo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  readOnly
                />
              </div>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('doc_type')}
              </label>
              <input
                type="text"
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                readOnly
              />
            </div>

            {/* Upload Reviewed Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('upload_reviewed_doc')}
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-gray-700 font-medium mb-1">{t('drop_files_here')}</p>
                  <p className="text-xs text-gray-500 mb-3">{t('supported_format_docx')}</p>
                  <p className="text-xs text-gray-400 mb-2">{t('or_text')}</p>
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      {t('browse_files')}
                    </span>
                    <input
                      type="file"
                      accept=".docx,.doc,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {formData.reviewedFile && (
                    <div className="mt-3 text-sm text-gray-700">
                      {t('selected_colon')} <span className="font-medium">{formData.reviewedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review Decision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('review_decision')} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="reviewed"
                    checked={formData.reviewDecision === 'reviewed'}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('document_reviewed')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="amendments"
                    checked={formData.reviewDecision === 'amendments'}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('return_amendments')}</span>
                </label>
              </div>
            </div>

            {/* Comments / Review Notes - Always visible, but required for amendments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('comments_review_notes')}
                {formData.reviewDecision === 'amendments' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder={formData.reviewDecision === 'amendments' ? t('provide_reasons') : t('add_comments_optional')}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
              />
            </div>

            {/* Assign Approver */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('assign_approver_label')}
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none text-gray-700"
                  value={formData.assignedApprover || ''}
                  onChange={(e) => handleApproverSelect(e.target.value)}
                  disabled={loadingApprovers}
                >
                  <option value="">
                    {loadingApprovers ? t('loading_approvers') : t('select_approver')}
                  </option>
                  {approversList.map((approver) => (
                    <option key={approver.id} value={approver.id}>
                      {approver.name}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {approversList.length === 0 && !loadingApprovers && (
                <p className="text-sm text-amber-600 mt-1">
                  {t('no_approvers_found')}
                </p>
              )}
            </div>

          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

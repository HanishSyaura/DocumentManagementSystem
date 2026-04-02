import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { usePreferences } from '../contexts/PreferencesContext'

export default function ApproveDocumentModal({ document, onClose, onSubmit }) {
  const { t } = usePreferences()
  // Determine if this is first or second approval based on document status and stage
  const isFirstApproval = 
    document?.status === 'PENDING_FIRST_APPROVAL' || 
    document?.status === 'IN_FIRST_APPROVAL' ||
    document?.status === 'Pending Approval' ||
    document?.stage === 'FIRST_APPROVAL' ||
    document?.stage === 'Approval'
  const isSecondApproval = 
    document?.status === 'PENDING_SECOND_APPROVAL' || 
    document?.status === 'IN_SECOND_APPROVAL' ||
    document?.stage === 'SECOND_APPROVAL'
  
  const [formData, setFormData] = useState({
    fileCode: document?.fileCode || '',
    documentTitle: document?.title || '',
    versionNo: document?.version || '',
    documentType: document?.documentType || document?.type || '',
    comments: '',
    approvedFile: null,
    approvalDecision: '', // 'approved' or 'amendments'
    assignedSecondApprover: null // Optional: Only if second approval is needed (first approval only)
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
        
        // Get current user ID (the first approver) to exclude from second approver list
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
        
        // Filter users who have roles with Approval permissions
        const approvers = users.filter(user => {
          // Exclude document owner from approvers list
          if (documentOwnerId && user.id === documentOwnerId) {
            return false
          }
          
          // Exclude current user (first approver) from second approver list
          if (currentUserId && user.id === currentUserId) {
            return false
          }
          
          const userRoles = user.roles || []
          
          return userRoles.some(userRole => {
            const role = userRole.role || {}
            const roleName = (role.name || userRole.name || '').toLowerCase()
            const permissions = role.permissions || {}
            
            // Only include users with Approver or Administrator roles
            const isApproverRole = ['approver', 'administrator', 'admin'].includes(roleName)
            const hasApprovalPermission = 
              permissions?.reviewApproval?.approve ||
              permissions?.['documents.reviewApproval']?.approve
            
            return isApproverRole || hasApprovalPermission
          })
        })
        
        const formattedApprovers = approvers.map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        }))
        
        setApproversList(formattedApprovers)
      } catch (error) {
        console.error('Failed to fetch approvers:', error)
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
      approvalDecision: checked ? value : ''
    }))
  }

  const handleSecondApproverSelect = (approverId) => {
    setFormData(prev => ({
      ...prev,
      assignedSecondApprover: approverId ? parseInt(approverId) : null
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, approvedFile: file }))
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
      setFormData(prev => ({ ...prev, approvedFile: file }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.approvalDecision) {
      alert('Please select an approval decision')
      return
    }

    // Require comments when returning for amendments
    if (formData.approvalDecision === 'amendments' && !formData.comments.trim()) {
      alert('Please provide comments explaining why the document needs amendments')
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
            <h2 className="text-xl font-bold text-gray-900">
              {isFirstApproval ? t('first_approval') : isSecondApproval ? t('second_approval_title') : t('approve_document')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isFirstApproval ? t('first_approval_desc') : 
               isSecondApproval ? t('second_approval_desc') :
               t('approve_pub_desc')}
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

            {/* Upload Approved Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('upload_approved_doc')}
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
                  {formData.approvedFile && (
                    <div className="mt-3 text-sm text-gray-700">
                      {t('selected_colon')} <span className="font-medium">{formData.approvedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Approval Decision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('approval_decision')} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="approved"
                    checked={formData.approvalDecision === 'approved'}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('approve_document')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="amendments"
                    checked={formData.approvalDecision === 'amendments'}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('return_amendments')}</span>
                </label>
              </div>
            </div>

            {/* Comments / Approval Notes - Always visible, but required for amendments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('comments_approval_notes')}
                {formData.approvalDecision === 'amendments' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder={formData.approvalDecision === 'amendments' ? t('provide_reasons') : t('add_comments_optional')}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
              />
            </div>

            {/* Assign Second Approver (Optional) - Only show for first approval */}
            {isFirstApproval && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('assign_second_approver')}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t('second_approver_note')}
                </p>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none text-gray-700"
                    value={formData.assignedSecondApprover || ''}
                    onChange={(e) => handleSecondApproverSelect(e.target.value)}
                    disabled={loadingApprovers}
                  >
                    <option value="">
                      {loadingApprovers ? t('loading_approvers') : t('no_second_approver')}
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
              </div>
            )}
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

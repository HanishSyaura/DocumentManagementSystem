import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import useFileUploadSettings from '../hooks/useFileUploadSettings'
import { usePreferences } from '../contexts/PreferencesContext'

export default function NewDraftModal({ isOpen, onClose, onSubmit }) {
  // Use dynamic file upload settings
  const { validateFile, getAcceptString, getAllowedTypesDisplay } = useFileUploadSettings()
  const { t } = usePreferences()
  const [formData, setFormData] = useState({
    fileCode: '',
    title: '',
    versionNo: '',
    documentType: '',
    comments: '',
    reviewerId: null // Single reviewer instead of array
  })
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [documentTypes, setDocumentTypes] = useState([])
  const [loadingDocTypes, setLoadingDocTypes] = useState(true)
  const [acknowledgedDocs, setAcknowledgedDocs] = useState([])
  const [loadingAcknowledgedDocs, setLoadingAcknowledgedDocs] = useState(false)
  const [availableReviewers, setAvailableReviewers] = useState([])
  const [loadingReviewers, setLoadingReviewers] = useState(true)
  const [searchFileCode, setSearchFileCode] = useState('')
  const [showFileCodeDropdown, setShowFileCodeDropdown] = useState(false)

  // Load document types and reviewers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDocumentTypes()
      loadReviewers()
    }
  }, [isOpen])

  // Load acknowledged documents when document type changes
  useEffect(() => {
    console.log('Document Type Changed:', formData.documentType)
    if (formData.documentType) {
      loadAcknowledgedDocuments(formData.documentType)
    } else {
      console.log('No document type selected, clearing acknowledged docs')
      setAcknowledgedDocs([])
    }
  }, [formData.documentType])

  const loadDocumentTypes = async () => {
    setLoadingDocTypes(true)
    try {
      const res = await api.get('/system/config/document-types')
      setDocumentTypes(res.data.data.documentTypes || [])
    } catch (error) {
      console.error('Failed to load document types:', error)
    } finally {
      setLoadingDocTypes(false)
    }
  }

  const loadAcknowledgedDocuments = async (documentType) => {
    setLoadingAcknowledgedDocs(true)
    try {
      console.log('=== LOADING DOCUMENTS ===')
      console.log('Selected document type:', documentType)
      
      // Fetch ACKNOWLEDGED documents (displayed as "Drafting")
      const res = await api.get('/documents/drafts', {
        params: {
          limit: 100
        }
      })
      
      console.log('API Response:', res.data)
      const docs = res.data.data || res.data.documents || []
      console.log('Total documents from API:', docs.length)
      console.log('All documents:', docs)
      
      // Filter by document type and valid file code
      const filtered = docs.filter(doc => {
        const hasValidFileCode = doc.fileCode && 
                                 !doc.fileCode.startsWith('PENDING-') && 
                                 doc.fileCode !== '-'
        
        // Match by document type name (backend returns documentType as string)
        const matchesType = doc.documentType === documentType
        
        console.log(`Checking doc: ${doc.fileCode}, docType: "${doc.documentType}", selected: "${documentType}", validCode: ${hasValidFileCode}, matchesType: ${matchesType}`)
        
        return hasValidFileCode && matchesType
      })
      
      console.log('Filtered documents:', filtered.length)
      console.log('Filtered result:', filtered)
      
      setAcknowledgedDocs(filtered)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setAcknowledgedDocs([])
    } finally {
      setLoadingAcknowledgedDocs(false)
    }
  }

  const loadReviewers = async () => {
    setLoadingReviewers(true)
    try {
      const res = await api.get('/users')
      const users = res.data.data?.users || res.data.users || []
      
      // Get current user ID
      const currentUserId = getCurrentUserId()
      
      // Filter only active users and exclude current user (document owner)
      const activeUsers = users.filter(user => 
        user.status === 'ACTIVE' && user.id !== currentUserId
      )
      setAvailableReviewers(activeUsers)
    } catch (error) {
      console.error('Failed to load reviewers:', error)
      setAvailableReviewers([])
    } finally {
      setLoadingReviewers(false)
    }
  }

  // Get current user ID
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.id
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
    return null
  }

  const handleFileCodeSelect = (doc) => {
    setFormData({
      ...formData,
      fileCode: doc.fileCode,
      title: doc.title,
      versionNo: doc.version || '1.0',
      documentType: doc.documentType
    })
    setSearchFileCode(doc.fileCode)
    setShowFileCodeDropdown(false)
  }

  const handleReviewerSelect = (userId) => {
    setFormData({ ...formData, reviewerId: userId })
  }

  const filteredAcknowledgedDocs = acknowledgedDocs.filter(doc =>
    doc.fileCode.toLowerCase().includes(searchFileCode.toLowerCase()) ||
    doc.title.toLowerCase().includes(searchFileCode.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFileCodeDropdown && !event.target.closest('.file-code-search')) {
        setShowFileCodeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFileCodeDropdown])

  if (!isOpen) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    // Validate file using dynamic settings
    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setSelectedFile(file)
  }

  const handleSaveAsDraft = async () => {
    setLoading(true)
    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('fileCode', formData.fileCode)
      formDataToSubmit.append('title', formData.title)
      formDataToSubmit.append('versionNo', formData.versionNo)
      formDataToSubmit.append('documentType', formData.documentType)
      formDataToSubmit.append('comments', formData.comments)
      formDataToSubmit.append('status', 'Draft')
      if (selectedFile) {
        formDataToSubmit.append('file', selectedFile)
      }

      await onSubmit(formDataToSubmit, 'draft')
      handleClose()
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!selectedFile) {
      alert('Please upload a document file')
      return
    }

    setLoading(true)
    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('fileCode', formData.fileCode)
      formDataToSubmit.append('title', formData.title)
      formDataToSubmit.append('versionNo', formData.versionNo)
      formDataToSubmit.append('documentType', formData.documentType)
      formDataToSubmit.append('comments', formData.comments)
      formDataToSubmit.append('reviewers', JSON.stringify([formData.reviewerId]))
      formDataToSubmit.append('status', 'Ready for Review')
      formDataToSubmit.append('file', selectedFile)

      await onSubmit(formDataToSubmit, 'review')
      handleClose()
    } catch (error) {
      console.error('Error submitting for review:', error)
      alert('Failed to submit for review')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      fileCode: '',
      title: '',
      versionNo: '',
      documentType: '',
      comments: '',
      reviewerId: null
    })
    setSelectedFile(null)
    setSearchFileCode('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-tour-id="new-draft-modal">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('new_draft_doc')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('modal_draft_desc')}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* File Code */}
            <div className="relative file-code-search">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('file_code')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={searchFileCode}
                onChange={(e) => {
                  setSearchFileCode(e.target.value)
                  setShowFileCodeDropdown(true)
                  if (!e.target.value) {
                    setFormData({ ...formData, fileCode: '', title: '', versionNo: '' })
                  }
                }}
                onFocus={() => setShowFileCodeDropdown(true)}
                placeholder={t('search_file_codes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={!formData.documentType}
              />
              {!formData.documentType && (
                <p className="text-xs text-amber-600 mt-1">{t('select_doc_type_first')}</p>
              )}
              
              {/* Dropdown for available documents */}
              {showFileCodeDropdown && formData.documentType && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingAcknowledgedDocs ? (
                    <div className="px-3 py-2 text-sm text-gray-500">{t('loading_ellipsis')}</div>
                  ) : filteredAcknowledgedDocs.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">{t('no_file_codes_found')}</div>
                  ) : (
                    filteredAcknowledgedDocs.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleFileCodeSelect(doc)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900">{doc.fileCode}</div>
                        <div className="text-xs text-gray-600">{doc.title}</div>
                        {doc.projectCategory && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            {t('project_cat_label')} {doc.projectCategory.name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">{t('version_label')} {doc.version}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Document Title & Version */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('document_title_col')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('input_text')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('version_revision')}
                </label>
                <input
                  type="text"
                  value={formData.versionNo}
                  onChange={(e) => setFormData({ ...formData, versionNo: e.target.value })}
                  placeholder={t('input_text')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Document Type & Comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('doc_type')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  data-tour-id="new-draft-doc-type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  disabled={loadingDocTypes}
                >
                  <option value="">{loadingDocTypes ? t('loading_ellipsis') : t('select_doc_type')}</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('comments_notes')}
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder={t('input_text')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Upload Draft Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('upload_draft_doc')}
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
                data-tour-id="new-draft-upload"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      {t('remove_file')}
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 mb-1">{t('drop_files_here')}</p>
                    <p className="text-xs text-gray-500 mb-4">{t('supported_formats')} {getAllowedTypesDisplay()}</p>
                    <p className="text-xs text-gray-400 mb-4">{t('or_text')}</p>
                    <label className="cursor-pointer">
                      <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        {t('browse_files')}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept={getAcceptString()}
                        onChange={handleFileInput}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Assign Reviewer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('assign_reviewer_label')} <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto" data-tour-id="new-draft-assign-reviewer">
                {loadingReviewers ? (
                  <div className="text-sm text-gray-500">{t('loading_reviewers')}</div>
                ) : availableReviewers.length === 0 ? (
                  <div className="text-sm text-gray-500">{t('no_reviewers')}</div>
                ) : (
                  <div className="space-y-2">
                    {availableReviewers.map((reviewer) => (
                      <label
                        key={reviewer.id}
                        className={`flex items-start space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          formData.reviewerId === reviewer.id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reviewer"
                          checked={formData.reviewerId === reviewer.id}
                          onChange={() => handleReviewerSelect(reviewer.id)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {reviewer.firstName && reviewer.lastName
                              ? `${reviewer.firstName} ${reviewer.lastName}`
                              : reviewer.email}
                          </div>
                          {reviewer.position && (
                            <div className="text-xs text-gray-500">{reviewer.position}</div>
                          )}
                          {reviewer.department && (
                            <div className="text-xs text-gray-500">{reviewer.department}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.reviewerId ? t('reviewer_selected') : t('select_reviewer')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={loading || !formData.fileCode || !formData.title || !formData.documentType}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('save_as_draft')}
            </button>
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={loading || !formData.fileCode || !formData.title || !formData.documentType || !selectedFile || !formData.reviewerId}
              data-tour-id="new-draft-submit-review"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('submitting') : t('submit_for_review')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

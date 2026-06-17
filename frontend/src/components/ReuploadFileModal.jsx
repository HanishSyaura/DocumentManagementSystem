import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { AlertModal } from './ConfirmModal'
import useFileUploadSettings from '../hooks/useFileUploadSettings'
import Modal, { ModalBody, ModalFooter, ModalHeader } from './ui/Modal'
import AppSurface from './ui/AppSurface'
import Button from './ui/Button'
import TextInput from './ui/TextInput'
import TextArea from './ui/TextArea'
import InlineSpinner from './ui/InlineSpinner'

export default function ReuploadFileModal({ isOpen, onClose, document, onSuccess }) {
  // Use dynamic file upload settings
  const { validateFile, getAcceptString, getAllowedTypesDisplay } = useFileUploadSettings()
  const [formData, setFormData] = useState({
    fileCode: '',
    title: '',
    versionNo: '',
    documentType: '',
    projectCategory: '',
    comments: ''
  })
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [availableReviewers, setAvailableReviewers] = useState([])
  const [loadingReviewers, setLoadingReviewers] = useState(true)
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' })

  // Load document details when modal opens
  useEffect(() => {
    if (isOpen && document) {
      loadDocumentDetails()
      loadReviewers()
    }
  }, [isOpen, document])

  const loadDocumentDetails = async () => {
    setLoadingDocument(true)
    try {
      const res = await api.get(`/documents/${document.id}`)
      const doc = res.data.data.document
      
      setFormData({
        fileCode: doc.fileCode || '',
        title: doc.title || '',
        versionNo: doc.version || '1.0',
        documentType: doc.documentType?.name || '',
        projectCategory: doc.projectCategory?.name || '',
        comments: doc.description || ''
      })
    } catch (error) {
      console.error('Failed to load document details:', error)
    } finally {
      setLoadingDocument(false)
    }
  }

  const loadReviewers = async () => {
    setLoadingReviewers(true)
    try {
      const res = await api.get('/users')
      const users = res.data.data?.users || res.data.users || []
      
      // Filter only active users
      const activeUsers = users.filter(user => user.status === 'ACTIVE')
      setAvailableReviewers(activeUsers)
    } catch (error) {
      console.error('Failed to load reviewers:', error)
      setAvailableReviewers([])
    } finally {
      setLoadingReviewers(false)
    }
  }

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
      setAlertModal({ show: true, title: 'Invalid File', message: validation.error, type: 'error' })
      return
    }

    setSelectedFile(file)
  }

  const handleReuploadAndResubmit = async () => {
    if (!selectedFile) {
      setAlertModal({ show: true, title: 'File Required', message: 'Please upload a revised document file', type: 'warning' })
      return
    }

    setLoading(true)
    try {
      // Upload the new file version
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      
      await api.post(`/documents/${document.id}/upload`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Update document details if changed
      if (formData.title !== document.title || formData.comments !== document.description) {
        await api.put(`/documents/${document.id}`, {
          title: formData.title,
          description: formData.comments
        })
      }

      // Resubmit for review (workflow will use existing reviewers)
      await api.post(`/workflow/submit/${document.id}`)

      setAlertModal({ show: true, title: 'Success', message: 'Document revised and resubmitted successfully!', type: 'success' })
      setTimeout(() => {
        handleClose()
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (error) {
      console.error('Error resubmitting document:', error)
      setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to resubmit document', type: 'error' })
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
      projectCategory: '',
      comments: ''
    })
    setSelectedFile(null)
    onClose()
  }

  return (
    <>
      <AlertModal
        show={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false, title: '', message: '', type: 'info' })}
      />
      <Modal onClose={handleClose} closeOnBackdrop size="md">
        <ModalHeader
          title="Reupload Revised Document"
          subtitle="Upload the revised version and resubmit for review"
          onClose={handleClose}
        />

        {loadingDocument ? (
          <ModalBody className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <InlineSpinner className="h-10 w-10 border-2" />
              <p className="text-sm text-ink-muted">Loading document details...</p>
            </div>
          </ModalBody>
        ) : (
          <>
            <ModalBody className="space-y-4">
              {/* File Code - Read Only */}
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  File Code
                </label>
                <TextInput
                  type="text"
                  value={formData.fileCode}
                  disabled
                  className="bg-surface-muted text-ink-muted cursor-not-allowed"
                />
                {formData.projectCategory && (
                  <p className="text-xs text-brand mt-1">
                    Project Category: {formData.projectCategory}
                  </p>
                )}
              </div>

              {/* Document Title & Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <TextInput
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Input text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    Version / Revision No.
                  </label>
                  <TextInput
                    type="text"
                    value={formData.versionNo}
                    disabled
                    className="bg-surface-muted text-ink-muted cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Document Type & Comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    Document Type
                  </label>
                  <TextInput
                    type="text"
                    value={formData.documentType}
                    disabled
                    className="bg-surface-muted text-ink-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    Comments / Notes
                  </label>
                  <TextArea
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Input text"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Upload Revised Document */}
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  Upload Revised Document <span className="text-red-500">*</span>
                </label>
                <div
                  className="rounded-[18px]"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <AppSurface
                    variant="muted"
                    padding="lg"
                    className={[
                      'border-2 border-dashed text-center transition-colors',
                      dragActive ? 'border-brand bg-blue-50/40' : 'border-border'
                    ].join(' ')}
                  >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-ink">{selectedFile.name}</p>
                      <p className="text-xs text-ink-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-sm text-red-600 hover:text-red-700 font-semibold underline underline-offset-2"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-ink-soft mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-semibold text-ink mb-1">Drop files here</p>
                      <p className="text-xs text-ink-muted mb-4">Supported formats: {getAllowedTypesDisplay()}</p>
                      <p className="text-xs text-ink-soft mb-4">OR</p>
                      <label className="cursor-pointer">
                        <span className="text-sm text-brand hover:text-brand-hover font-semibold underline underline-offset-2">
                          Browse files
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
                  </AppSurface>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Resubmission Information
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      The document will be automatically resubmitted to the same reviewers who returned it for amendments.
                    </p>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="flex-wrap justify-end">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleReuploadAndResubmit} disabled={loading || !selectedFile || !formData.title || loadingDocument}>
                {loading ? <><InlineSpinner className="h-4 w-4 border-2 border-white/40 border-t-white" /><span>Resubmitting...</span></> : 'Reupload & Resubmit'}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  )
}

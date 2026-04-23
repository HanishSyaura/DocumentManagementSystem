import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import useFileUploadSettings from '../hooks/useFileUploadSettings'

export default function NewVersionRequestModal({ onClose, onSubmit }) {
  // Use dynamic file upload settings
  const { validateFile } = useFileUploadSettings()
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [formData, setFormData] = useState({
    documentId: '',
    title: '',
    documentType: '',
    projectCategory: '',
    dateOfDocument: '',
    remarks: '',
    changeType: 'major'
  })
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredDocuments, setFilteredDocuments] = useState([])

  useEffect(() => {
    loadDocuments()
  }, [])

  // Filter documents based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = documents.filter(doc =>
        doc.fileCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.projectCategory?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredDocuments(filtered)
    } else {
      setFilteredDocuments(documents)
    }
  }, [searchQuery, documents])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.document-search')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const loadDocuments = async () => {
    try {
      // Fetch only published documents
      const res = await api.get('/documents', {
        params: {
          status: 'PUBLISHED',
          limit: 1000
        }
      })
      const docs = res.data.data || []
      
      // Map documents with all necessary information
      const publishedDocuments = docs.map(doc => ({
        id: doc.id,
        fileCode: doc.fileCode,
        title: doc.title,
        currentVersion: doc.version || '1.0',
        projectCategory: doc.projectCategory || null,
        documentType: doc.documentType || null
      }))
      
      setDocuments(publishedDocuments)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setDocuments([])
    }
  }

  // Extract date from file code (e.g., MOM/01/251230/001 -> 30 Dec 2025)
  const extractDateFromFileCode = (fileCode) => {
    try {
      // File code format: TYPE/VERSION/YYMMDD/SEQ
      const parts = fileCode.split('/')
      if (parts.length >= 3) {
        const dateStr = parts[2] // YYMMDD format
        if (dateStr && dateStr.length === 6) {
          const yy = dateStr.substring(0, 2)
          const mm = dateStr.substring(2, 4)
          const dd = dateStr.substring(4, 6)
          
          // Convert YY to full year (assume 2000s)
          const year = `20${yy}`
          
          // Format as YYYY-MM-DD for date input
          return `${year}-${mm}-${dd}`
        }
      }
    } catch (error) {
      console.error('Error extracting date from file code:', error)
    }
    return '' // Return empty if extraction fails
  }

  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc)
    setSearchQuery(doc.fileCode)
    setShowDropdown(false)
    
    // Extract date from file code
    const extractedDate = extractDateFromFileCode(doc.fileCode)
    
    setFormData({
      documentId: doc.id,
      title: doc.title,
      documentType: doc.documentType?.name || '',
      projectCategory: doc.projectCategory?.name || '',
      dateOfDocument: extractedDate,
      remarks: '',
      changeType: 'major'
    })
  }

  const incrementSuffix = (suffix) => {
    const s = String(suffix || '').toLowerCase()
    if (!s) return 'a'
    const chars = s.split('')
    for (let i = chars.length - 1; i >= 0; i--) {
      if (chars[i] !== 'z') {
        chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1)
        return chars.join('')
      }
      chars[i] = 'a'
    }
    return `a${chars.join('')}`
  }

  const computeNewFileCode = (fileCode, changeType) => {
    const code = String(fileCode || '').trim()
    if (!code) return ''
    const parts = code.split('/')
    if (parts.length < 2) return code

    const seg = parts[1]
    const m = /^(\d+)([a-zA-Z]*)$/.exec(String(seg || '').trim())
    if (!m) return code

    const digitsStr = m[1]
    const suffix = m[2] || ''
    const digitsLen = Math.max(2, digitsStr.length)
    const n = parseInt(digitsStr, 10)
    if (Number.isNaN(n)) return code

    if (changeType === 'minor') {
      parts[1] = `${String(n).padStart(digitsLen, '0')}${incrementSuffix(suffix)}`
    } else {
      parts[1] = String(n + 1).padStart(digitsLen, '0')
    }

    return parts.join('/')
  }

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

  const handleSubmitRequest = async () => {
    if (!formData.documentId || !formData.title || !formData.dateOfDocument) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('documentId', formData.documentId)
      formDataToSubmit.append('title', formData.title)
      formDataToSubmit.append('documentType', formData.documentType)
      formDataToSubmit.append('projectCategory', formData.projectCategory)
      formDataToSubmit.append('dateOfDocument', formData.dateOfDocument)
      formDataToSubmit.append('remarks', formData.remarks)
      formDataToSubmit.append('changeType', formData.changeType)
      
      if (selectedFile) {
        formDataToSubmit.append('file', selectedFile)
      }

      await onSubmit(formDataToSubmit)
      handleClose()
    } catch (error) {
      console.error('Error submitting version request:', error)
      alert('Failed to submit version request')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      documentId: '',
      title: '',
      documentType: '',
      projectCategory: '',
      dateOfDocument: '',
      remarks: '',
      changeType: 'major'
    })
    setSelectedDocument(null)
    setSelectedFile(null)
    setSearchQuery('')
    setShowDropdown(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Version Request (NVR)</h2>
              <p className="text-sm text-gray-600 mt-1">
                Request a new version for an existing controlled document.
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
          <div className="px-6 py-4 space-y-6">
            {/* Select Document (File Code Search) */}
            <div className="relative document-search">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document (Search File Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                  if (!e.target.value) {
                    setSelectedDocument(null)
                    setFormData({
                      documentId: '',
                      title: '',
                      documentType: '',
                      projectCategory: '',
                      dateOfDocument: '',
                      remarks: ''
                    })
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search file codes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              
              {/* Dropdown for available documents */}
              {showDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredDocuments.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No published documents found</div>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleDocumentSelect(doc)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900">{doc.fileCode}</div>
                        <div className="text-xs text-gray-600">{doc.title}</div>
                        {doc.projectCategory && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            {doc.projectCategory.name}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedDocument && (
                <p className="text-xs text-gray-600 mt-2">
                  <span className="font-medium">New File Code will be:</span> {computeNewFileCode(selectedDocument.fileCode, formData.changeType)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!selectedDocument}
                  onClick={() => setFormData({ ...formData, changeType: 'minor' })}
                  className={`p-3 rounded-lg border text-left transition-colors disabled:opacity-60 ${
                    formData.changeType === 'minor'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">Minor change</div>
                  <div className="text-xs text-gray-600 mt-1">01 → 01a, 01a → 01b (alphabet sequence)</div>
                </button>
                <button
                  type="button"
                  disabled={!selectedDocument}
                  onClick={() => setFormData({ ...formData, changeType: 'major' })}
                  className={`p-3 rounded-lg border text-left transition-colors disabled:opacity-60 ${
                    formData.changeType === 'major'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">Major change</div>
                  <div className="text-xs text-gray-600 mt-1">01 → 02 → 03 (numeric increment)</div>
                </button>
              </div>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
                disabled={!selectedDocument}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Document Type & Project Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <input
                  type="text"
                  value={formData.documentType}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Category
                </label>
                <input
                  type="text"
                  value={formData.projectCategory}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                />
              </div>
            </div>

            {/* Date of Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Document <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateOfDocument}
                onChange={(e) => setFormData({ ...formData, dateOfDocument: e.target.value })}
                disabled={!selectedDocument}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Input text"
                rows={3}
                disabled={!selectedDocument}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={loading || !formData.documentId || !formData.title || !formData.dateOfDocument}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Request...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

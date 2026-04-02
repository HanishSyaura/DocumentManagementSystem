import React, { useState, useEffect } from 'react'
import api from '../api/axios'

export default function RequestSupersedeModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    fileCode: '',
    title: '',
    documentType: '',
    version: '',
    action: 'SUPERSEDE',
    reason: '',
    supersedingFileCode: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [publishedDocs, setPublishedDocs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showDocumentSearch, setShowDocumentSearch] = useState(false)
  const [loadingPublishedDocs, setLoadingPublishedDocs] = useState(false)
  const [allPublishedDocs, setAllPublishedDocs] = useState([])

  // Load published documents to select from
  useEffect(() => {
    loadPublishedDocuments()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showResults && !event.target.closest('.superseding-doc-search')) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showResults])

  const loadPublishedDocuments = async () => {
    try {
      setLoadingPublishedDocs(true)
      console.log('Loading published documents...')
      const res = await api.get('/documents/my-status?status=PUBLISHED&limit=1000')
      const docs = res.data.data?.documents || []
      console.log('Published documents loaded:', docs.length)
      console.log('Sample doc:', docs[0])
      setPublishedDocs(docs)
      setAllPublishedDocs(docs)
      
      // Initialize search results with all available documents
      const availableDocs = docs.filter(doc => 
        doc.rawStatus !== 'SUPERSEDED' && 
        doc.rawStatus !== 'OBSOLETE'
      )
      setSearchResults(availableDocs)
    } catch (error) {
      console.error('Failed to load published documents:', error)
      setPublishedDocs([])
      setAllPublishedDocs([])
    } finally {
      setLoadingPublishedDocs(false)
    }
  }

  // Search for published documents to replace (client-side filtering)
  const handleSearch = (query) => {
    setSearchQuery(query)
    setShowResults(true)
    
    if (!query.trim()) {
      // Show all available published docs when empty
      const filtered = allPublishedDocs.filter(doc => 
        (!selectedDoc || doc.id !== selectedDoc.id) && 
        doc.rawStatus !== 'SUPERSEDED' && 
        doc.rawStatus !== 'OBSOLETE'
      )
      setSearchResults(filtered)
      return
    }

    // Filter available published documents based on query
    const filtered = allPublishedDocs.filter(doc => {
      // Don't show the document being superseded
      if (selectedDoc && doc.id === selectedDoc.id) return false
      
      // Don't show already superseded/obsolete documents
      if (doc.rawStatus === 'SUPERSEDED' || doc.rawStatus === 'OBSOLETE') return false
      
      // Search in file code, title, and document type
      const searchText = query.toLowerCase()
      return (
        doc.fileCode?.toLowerCase().includes(searchText) ||
        doc.title?.toLowerCase().includes(searchText) ||
        doc.documentType?.toLowerCase().includes(searchText)
      )
    })
    
    setSearchResults(filtered)
  }

  const handleSelectSupersedingDocument = (doc) => {
    setFormData(prev => ({
      ...prev,
      supersedingFileCode: doc.fileCode,
      supersedingDocId: doc.id // Store superseding document ID for API call
    }))
    setSearchQuery(doc.fileCode + ' - ' + doc.title)
    setShowResults(false)
  }

  const handleSelectDocumentToObsolete = (doc) => {
    setSelectedDoc(doc)
    setFormData({
      fileCode: doc.fileCode,
      title: doc.title,
      documentType: doc.documentType || '',
      version: doc.version,
      documentId: doc.id, // Store document ID for API call
      action: formData.action,
      reason: formData.reason,
      supersedingFileCode: formData.supersedingFileCode
    })
    setShowDocumentSearch(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.fileCode) {
      setError('Please select a document')
      return
    }
    
    if (!formData.action) {
      setError('Please select an action type')
      return
    }
    
    if (!formData.reason.trim()) {
      setError('Please provide a reason')
      return
    }

    if (formData.action === 'SUPERSEDE' && !formData.supersedingFileCode) {
      setError('Please select a superseding document')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create supersede/obsolete request
      const payload = {
        documentId: selectedDoc.id,
        actionType: formData.action,
        reason: formData.reason
      }

      // Add superseding document ID if action is SUPERSEDE
      if (formData.action === 'SUPERSEDE' && formData.supersedingDocId) {
        payload.supersedingDocId = formData.supersedingDocId
      }

      await api.post('/supersede-requests', payload)
      
      // Call onSubmit callback to close modal and refresh list
      if (onSubmit) {
        onSubmit(formData)
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Failed to submit:', error)
      setError(error.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Document Selection Modal */}
      {showDocumentSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Select Document to Supersede/Obsolete</h3>
              <button
                onClick={() => setShowDocumentSearch(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {publishedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDocumentToObsolete(doc)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{doc.fileCode}</div>
                    <div className="text-sm text-gray-600">{doc.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {doc.documentType} • Version {doc.version}
                    </div>
                  </button>
                ))}
                {publishedDocs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No published documents found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Request Supersede / Obsolete Document</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info Box */}
          <div className="px-6 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                Please make sure a replacement file is available before requesting to supersede, and ensure it goes through the review and approval process.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Select Document Button */}
            {!formData.fileCode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Document <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDocumentSearch(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Click to select a published document
                </button>
              </div>
            )}

            {/* Selected Document Info */}
            {formData.fileCode && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected Document</label>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm font-medium text-gray-900">{formData.fileCode}</div>
                      <div className="text-sm text-gray-600">{formData.title}</div>
                      <div className="text-xs text-gray-500">
                        {formData.documentType} • Version {formData.version}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDoc(null)
                      setFormData({
                        fileCode: '',
                        title: '',
                        documentType: '',
                        version: '',
                        action: formData.action,
                        reason: formData.reason,
                        supersedingFileCode: ''
                      })
                      setSearchQuery('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Action Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.fileCode}
              >
                <option value="SUPERSEDE">Supersede</option>
                <option value="OBSOLETE">Obsolete</option>
              </select>
            </div>

            {/* Superseding Document Search (only for SUPERSEDE action) */}
            {formData.action === 'SUPERSEDE' && formData.fileCode && (
              <div className="relative superseding-doc-search">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Superseding Document <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                      // Show all available documents when clicked
                      if (!searchQuery.trim()) {
                        const filtered = allPublishedDocs.filter(doc => 
                          (!selectedDoc || doc.id !== selectedDoc.id) && 
                          doc.rawStatus !== 'SUPERSEDED' && 
                          doc.rawStatus !== 'OBSOLETE'
                        )
                        setSearchResults(filtered)
                      }
                      setShowResults(true)
                    }}
                    placeholder="Search by file code or title..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {searching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Search Results Dropdown */}
                {showResults && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {loadingPublishedDocs ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        Loading documents...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleSelectSupersedingDocument(doc)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">{doc.fileCode}</div>
                          <div className="text-sm text-gray-600">{doc.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {doc.documentType} • Version {doc.version}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No published documents found
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Search for published documents only. Documents already marked as superseded or obsolete will not appear.
                </p>
              </div>
            )}


            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for {formData.action === 'SUPERSEDE' ? 'Supersede' : 'Obsolete'} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for supersede or obsolete"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                required
                disabled={!formData.fileCode}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading || !formData.fileCode}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

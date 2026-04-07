import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import RequestSupersedeModal from './RequestSupersedeModal'
import ReviewSupersedeModal from './ReviewSupersedeModal'
import ApproveSupersedeModal from './ApproveSupersedeModal'
import ArchiveDocumentModal from './ArchiveDocumentModal'
import DocumentViewerModal from './DocumentViewerModal'
import StatusBadge from './StatusBadge'
import ActionMenu from './ActionMenu'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import { PermissionGate } from './PermissionGate'
import { hasPermission } from '../utils/permissions'
import { usePreferences } from '../contexts/PreferencesContext'

export default function SupersededObsolete() {
  const { itemsPerPage, t } = usePreferences()
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionTypeFilter, setActionTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  // Filter and search documents
  useEffect(() => {
    let filtered = documents

    // Apply action type filter
    if (actionTypeFilter !== 'All') {
      filtered = filtered.filter(doc => doc.actionType === actionTypeFilter)
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(doc => doc.status === statusFilter)
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.fileCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredDocuments(filtered)
    setCurrentPage(1)
  }, [documents, actionTypeFilter, statusFilter, searchQuery])

  const loadDocuments = async () => {
    try {
      // Only fetch supersede/obsolete requests
      // The requests contain all necessary information including completed ones
      const requestsRes = await api.get('/supersede-requests')
      
      console.log('Requests API Response:', requestsRes.data)
      
      const requests = requestsRes.data.data?.requests || requestsRes.data.requests || []
      
      console.log('Loaded supersede/obsolete requests:', requests.length)
      
      // Format requests to match expected structure
      const formattedRequests = requests.map(req => {
        // Map status display
        let displayStatus = req.status
        if (req.status === 'Approved') {
          displayStatus = 'Completed'
        }
        
        // Get replaced by info (superseding document)
        let replacedBy = '-'
        if (req.actionType === 'Supersede' && req.supersedingDoc) {
          replacedBy = `${req.supersedingDoc.fileCode} - ${req.supersedingDoc.title}`
        }
        
        return {
          id: req.id,
          fileCode: req.fileCode || '',
          title: req.title || '',
          actionType: req.actionType,
          requestedBy: req.requestedBy || '',
          replacedBy: replacedBy,
          status: displayStatus,
          rawStatus: req.rawStatus || req.status,
          isArchived: req.isArchived || false,
          type: 'request'
        }
      })
      
      setDocuments(formattedRequests)
      setFilteredDocuments(formattedRequests)
    } catch (error) {
      console.error('Failed to load requests:', error)
      console.error('Error details:', error.response?.data)
      // Mock data for demonstration
      const mockDocs = [
        {
          id: 1,
          fileCode: 'MoM01250821001',
          title: 'Minutes of Meeting',
          actionType: 'Superseded',
          requestedBy: 'Mr. Jin',
          status: 'Approved'
        },
        {
          id: 2,
          fileCode: 'PP01250821001',
          title: 'Project Plan',
          actionType: 'Obsolete',
          requestedBy: 'Ms. Nicole',
          status: 'Pending Review'
        },
        {
          id: 3,
          fileCode: 'PRA01250821001',
          title: 'Project Requirement Analysis',
          actionType: 'Superseded',
          requestedBy: 'Mr. Khairul',
          status: 'Reviewed'
        },
        {
          id: 4,
          fileCode: 'DD01250821001',
          title: 'Design Document',
          actionType: 'Obsolete',
          requestedBy: 'Ms. Hanish',
          status: 'Pending Approval'
        }
      ]
      setDocuments(mockDocs)
      setFilteredDocuments(mockDocs)
    } finally {
      setLoading(false)
    }
  }

  // Get unique action types and statuses for filters
  const allActionTypes = ['All', ...new Set(documents.map(doc => doc.actionType))]
  const allStatuses = ['All', ...new Set(documents.map(doc => doc.status))]

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleView = async (doc) => {
    try {
      // Fetch the full document details
      const response = await api.get(`/supersede-requests/${doc.id}`)
      const requestData = response.data.data?.request || response.data.request
      
      console.log('Request data for view:', requestData)
      
      // Set document details for the viewer modal
      setSelectedDocument({
        id: requestData.document.id,
        fileCode: requestData.document.fileCode,
        fileName: requestData.document.title,
        title: requestData.document.title,
        status: requestData.document.status
      })
      setShowViewModal(true)
    } catch (error) {
      console.error('Error fetching document details:', error)
      alert('Failed to load document details. Please try again.')
    }
  }

  const handleReview = async (doc) => {
    try {
      // Fetch full request details including documentId, reason, etc.
      const response = await api.get(`/supersede-requests/${doc.id}`)
      const requestData = response.data.data?.request || response.data.request
      
      setSelectedDocument({
        id: requestData.id,
        documentId: requestData.document.id,
        fileCode: requestData.document.fileCode,
        title: requestData.document.title,
        documentType: requestData.document.documentType || '',
        version: requestData.document.version,
        actionType: requestData.actionType === 'OBSOLETE' ? 'Obsolete' : 'Supersede',
        reason: requestData.reason,
        requestedBy: requestData.requestedBy?.name || '',
        replacementFileCode: requestData.supersedingDoc?.fileCode || '',
        status: doc.status
      })
      setShowReviewModal(true)
    } catch (error) {
      console.error('Error fetching request details:', error)
      alert('Failed to load request details. Please try again.')
    }
  }

  const handleReviewSubmit = async (reviewData) => {
    console.log('Review submitted:', reviewData)
    
    setShowReviewModal(false)
    setSelectedDocument(null)
    
    // Reload documents to show updated status
    loadDocuments()
  }

  const handleApproved = async (doc) => {
    try {
      // Fetch full request details including documentId, reason, etc.
      const response = await api.get(`/supersede-requests/${doc.id}`)
      const requestData = response.data.data?.request || response.data.request
      
      setSelectedDocument({
        id: requestData.id,
        documentId: requestData.document.id,
        fileCode: requestData.document.fileCode,
        title: requestData.document.title,
        documentType: requestData.document.documentType || '',
        version: requestData.document.version,
        actionType: requestData.actionType === 'OBSOLETE' ? 'Obsolete' : 'Supersede',
        reason: requestData.reason,
        requestedBy: requestData.requestedBy?.name || '',
        replacementFileCode: requestData.supersedingDoc?.fileCode || '',
        status: doc.status
      })
      setShowApproveModal(true)
    } catch (error) {
      console.error('Error fetching request details:', error)
      alert('Failed to load request details. Please try again.')
    }
  }

  const handleApproveSubmit = async (approvalData) => {
    console.log('Approval submitted:', approvalData)
    
    setShowApproveModal(false)
    setSelectedDocument(null)
    
    // Reload documents to show updated status
    loadDocuments()
  }

  const handleRequestSupersede = () => {
    setShowRequestModal(true)
  }

  const handleRequestSubmit = async (requestData) => {
    console.log('Request submitted:', requestData)
    
    setShowRequestModal(false)
    // Reload documents to show new request
    loadDocuments()
  }

  const handleArchive = async (doc) => {
    try {
      // Fetch the full document details including documentId
      const response = await api.get(`/supersede-requests/${doc.id}`)
      const requestData = response.data.data?.request || response.data.request
      
      console.log('Request data:', requestData)
      
      // Set document with documentId for the archive modal
      // Use the actual document status (OBSOLETE/SUPERSEDED), not the request status (APPROVED)
      setSelectedDocument({
        id: requestData.document.id,
        fileCode: requestData.document.fileCode,
        title: requestData.document.title,
        status: requestData.document.status || 'OBSOLETE'
      })
      setShowArchiveModal(true)
    } catch (error) {
      console.error('Error fetching document details:', error)
      alert('Failed to load document details')
    }
  }

  const handleArchiveComplete = (updatedDocument) => {
    console.log('Document archived:', updatedDocument)
    alert('Document archived successfully!')
    loadDocuments()
  }

  return (
    <>
      {/* Request Supersede/Obsolete Modal */}
      {showRequestModal && (
        <RequestSupersedeModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestSubmit}
        />
      )}

      {/* Review Supersede/Obsolete Modal */}
      {showReviewModal && selectedDocument && (
        <ReviewSupersedeModal
          document={selectedDocument}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedDocument(null)
          }}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Approve Supersede/Obsolete Modal */}
      {showApproveModal && selectedDocument && (
        <ApproveSupersedeModal
          document={selectedDocument}
          onClose={() => {
            setShowApproveModal(false)
            setSelectedDocument(null)
          }}
          onSubmit={handleApproveSubmit}
        />
      )}

      {/* Archive Document Modal */}
      {showArchiveModal && selectedDocument && (
        <ArchiveDocumentModal
          isOpen={showArchiveModal}
          onClose={() => {
            setShowArchiveModal(false)
            setSelectedDocument(null)
          }}
          document={selectedDocument}
          onArchive={handleArchiveComplete}
        />
      )}
      
      {/* Document Viewer Modal */}
      {showViewModal && selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          onClose={() => {
            setShowViewModal(false)
            setSelectedDocument(null)
          }}
        />
      )}

      <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('superseded_title')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('superseded_desc')}
        </p>
      </div>

      {/* Document List */}
      <div className="card p-6" data-tour-id="so-list-card">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('superseded_list')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('superseded_list_desc')}
              </p>
            </div>
            
            {/* Actions */}
            <PermissionGate module="documents.superseded" action="create">
              <button 
                onClick={handleRequestSupersede}
                data-tour-id="so-btn-request"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('request_supersede')}
              </button>
            </PermissionGate>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by file code, title, or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Action Type Filter */}
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {allActionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {allStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('file_code')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('doc_title')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('action_type')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('replaced_by')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('requested_by')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('status')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('archive_status')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span>{t('loading_docs')}</span>
                    </div>
                  </td>
                </tr>
              ) : currentDocuments.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState 
                      message={t('no_docs_found')} 
                      description={searchQuery || actionTypeFilter !== 'All' || statusFilter !== 'All' ? t('try_adjusting') : t('no_superseded_docs')}
                      actionLabel={searchQuery ? t('clear_search') : null}
                      onAction={searchQuery ? () => setSearchQuery('') : null}
                    />
                  </td>
                </tr>
              ) : (
                currentDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <a href="#" className="text-gray-900 font-medium hover:text-blue-600">
                        {doc.fileCode}
                      </a>
                    </td>
                    <td className="py-4 px-4">
                      <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                        {doc.title}
                      </a>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{doc.actionType}</td>
                    <td className="py-4 px-4 text-gray-700">
                      <span className="text-sm" title={doc.replacedBy}>
                        {doc.replacedBy === '-' ? '-' : (
                          <span className="text-blue-600">{doc.replacedBy}</span>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{doc.requestedBy}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-4 px-4">
                      {doc.isArchived ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('archived')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {t('not_archived')}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <ActionMenu
                        actions={[
                          ...(hasPermission('documents.superseded', 'view')
                            ? [{ label: t('view'), onClick: () => handleView(doc) }]
                            : []
                          ),
                          ...(doc.status === 'Pending Review' && hasPermission('documents.review', 'review')
                            ? [{ label: t('review_action'), onClick: () => handleReview(doc) }]
                            : []
                          ),
                          ...(doc.status === 'Pending Approval' && hasPermission('documents.review', 'approve')
                            ? [{ label: t('approve_action'), onClick: () => handleApproved(doc) }]
                            : []
                          ),
                          ...(doc.status === 'Completed' && !doc.isArchived && hasPermission('documents.superseded', 'update')
                            ? [{ label: t('archive_action'), onClick: () => handleArchive(doc) }]
                            : []
                          )
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span>{t('loading_docs')}</span>
              </div>
            </div>
          ) : currentDocuments.length === 0 ? (
            <EmptyState 
              message={t('no_docs_found')} 
              description={searchQuery || actionTypeFilter !== 'All' || statusFilter !== 'All' ? t('try_adjusting') : t('no_superseded_docs')}
              actionLabel={searchQuery ? t('clear_search') : null}
              onAction={searchQuery ? () => setSearchQuery('') : null}
            />
          ) : (
            currentDocuments.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <a href="#" className="text-gray-900 font-semibold hover:text-blue-600">
                      {doc.fileCode}
                    </a>
                    <div className="text-sm text-gray-600 mt-1">{doc.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={doc.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">{t('action_type')}:</span>
                    <div className="text-gray-900 font-medium">{doc.actionType}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('replaced_by')}:</span>
                    <div className="text-gray-900 font-medium text-xs">
                      {doc.replacedBy === '-' ? '-' : (
                        <span className="text-blue-600">{doc.replacedBy}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('requested_by')}:</span>
                    <div className="text-gray-900 font-medium">{doc.requestedBy}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('archive_status')}:</span>
                    <div className="text-gray-900 font-medium">
                      {doc.isArchived ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('archived')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {t('not_archived')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleView(doc)}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('view')}
                  </button>
                  {doc.status === 'Pending Review' && (
                    <button
                      onClick={() => handleReview(doc)}
                      className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      {t('review_action')}
                    </button>
                  )}
                  {doc.status === 'Pending Approval' && (
                    <button
                      onClick={() => handleApproved(doc)}
                      className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      {t('approve_action')}
                    </button>
                  )}
                  {doc.status === 'Completed' && !doc.isArchived && (
                    <button
                      onClick={() => handleArchive(doc)}
                      className="flex-1 px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      {t('archive_action')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Pagination */}
      {!loading && filteredDocuments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredDocuments.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
    </>
  )
}

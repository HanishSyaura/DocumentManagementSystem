import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import ActionMenu from '../components/ActionMenu'
import ConfirmModal, { AlertModal } from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { usePreferences } from '../contexts/PreferencesContext'
import { isAdmin } from '../utils/permissions'
import * as XLSX from 'xlsx'

// Tab Navigation Component
function TabNavigation({ activeTab, onTabChange }) {
  const { t } = usePreferences()
  const tabs = [
    { id: 'new-documents', label: t('mr_new_doc_register') },
    { id: 'new-versions', label: t('mr_new_version_register') },
    { id: 'obsolete', label: t('mr_obsolete_register') },
    { id: 'old-versions', label: t('mr_old_version_register') },
    { id: 'consolidated', label: t('mr_consolidated_register') }
  ]

  return (
    <div className="border-b border-gray-200 mb-6" data-tour-id="mr-tabbar">
      <nav className="flex space-x-8" aria-label="Register Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            data-tour-id={`mr-tab-${tab.id}`}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// New Document Register Component
function NewDocumentRegister({ projectCategories = [], documentTypes = [], users = [] }) {
  const { itemsPerPage, t } = usePreferences()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null })
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' })
  const [deleting, setDeleting] = useState(false)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    documentTypeId: 'all',
    projectCategoryId: 'all',
    ownerId: 'all',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)

  useEffect(() => {
    loadDocuments()
  }, [filters, currentPage])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/master-record/new-documents', { params: filters })
      setDocuments(res.data.data?.documents || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const purgeByFileCode = async (fileCode) => {
    setDeleting(true)
    try {
      await api.delete(`/documents/code/${encodeURIComponent(fileCode)}/purge`)
      setConfirmModal({ show: false, title: '', message: '', onConfirm: null })
      setAlertModal({
        show: true,
        title: 'Deleted',
        message: `All records for "${fileCode}" have been deleted.`,
        type: 'success'
      })
      await loadDocuments()
    } catch (error) {
      setConfirmModal({ show: false, title: '', message: '', onConfirm: null })
      setAlertModal({
        show: true,
        title: 'Delete failed',
        message: error.response?.data?.message || 'Failed to delete document records. Please try again.',
        type: 'error'
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/master-record/new-documents', {
        params: { ...filters, export: 'excel' },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `new_document_register_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  // Pagination calculations
  const filteredDocuments = documents.filter((doc) => {
    if (filters.search && !doc.fileCode.toLowerCase().includes(filters.search.toLowerCase()) && 
        !doc.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })
  const totalPages = Math.ceil(filteredDocuments.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_date_from')}</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_date_to')}</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('document_type')}</label>
            <select
              value={filters.documentTypeId}
              onChange={(e) => setFilters({ ...filters, documentTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={documentTypes.length === 0}
            >
              <option value="all">{t('mr_all_types')}</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project_category')}</label>
            <select
              value={filters.projectCategoryId}
              onChange={(e) => setFilters({ ...filters, projectCategoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={projectCategories.length === 0}
            >
              <option value="all">All Categories</option>
              {projectCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('owner')}</label>
            <select
              value={filters.ownerId}
              onChange={(e) => setFilters({ ...filters, ownerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={users.length === 0}
            >
              <option value="all">{t('mr_all_owners')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_search')}</label>
            <input
              type="text"
              placeholder={t('mr_file_code_placeholder')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('mr_export_excel')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('file_code')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('mr_doc_title')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('project_category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('version')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('mr_registered_date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('owner')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    {t('mr_loading_documents')}
                  </td>
                </tr>
              ) : paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8">
                    <EmptyState
                      message={t('mr_no_docs_found')}
                      description={filters.search ? t('mr_try_adjust') : t('mr_no_docs_registered')}
                      actionLabel={filters.search ? 'Clear Search' : null}
                      onAction={filters.search ? () => setFilters({ ...filters, search: '' }) : null}
                    />
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {doc.fileCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {doc.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.projectCategory || ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(() => {
                        const seg = String(doc.fileCode || '').split('/')[1] || ''
                        const m = /^(\d+)([a-zA-Z]*)$/.exec(String(seg || '').trim())
                        if (!m) return doc.version
                        const digitsStr = m[1]
                        const suffix = (m[2] || '').toLowerCase()
                        const digitsLen = Math.max(2, digitsStr.length)
                        return `${digitsStr.padStart(digitsLen, '0')}${suffix}` || doc.version
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.registeredDate}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{doc.owner}</div>
                      <div className="text-xs text-gray-500">{doc.department}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <ActionMenu
                        actions={[
                          { label: 'View', onClick: () => console.log('View document:', doc) },
                          { label: 'Download', onClick: () => console.log('Download document:', doc) },
                          ...(isAdmin() ? [{
                            label: 'Delete',
                            variant: 'destructive',
                            onClick: () => setConfirmModal({
                              show: true,
                              title: 'Delete document records?',
                              message: `This will permanently delete ALL records for "${doc.fileCode}" (document, versions, registers, and stored files). This action cannot be undone.`,
                              onConfirm: () => purgeByFileCode(doc.fileCode)
                            })
                          }] : [])
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      <AlertModal
        show={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false, title: '', message: '', type: 'info' })}
      />

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
  )
}

// New Version Register Component
function NewVersionRegister({ projectCategories = [], users = [] }) {
  const { itemsPerPage, t } = usePreferences()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    reason: 'all',
    projectCategoryId: 'all',
    search: ''
  })

  useEffect(() => {
    loadVersions()
  }, [filters])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/master-record/version-register', { params: filters })
      const data = res.data.data?.records || []
      
      // Format for frontend
      const formattedVersions = data.map(record => ({
        id: record.id,
        fileCode: record.fileCode,
        title: record.documentTitle,
        projectCategory: record.projectCategory || '',
        previousVersion: record.previousVersion,
        newVersion: record.newVersion,
        versionDate: new Date(record.versionDate).toLocaleDateString('en-GB'),
        updatedBy: record.updatedBy,
        changeSummary: record.changeSummary || 'No summary provided'
      }))
      
      setVersions(formattedVersions)
    } catch (error) {
      console.error('Failed to load versions:', error)
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    alert('Exporting New Version Register...')
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  // Pagination calculations
  const filteredVersions = versions.filter((v) => {
    if (filters.search && !v.fileCode.toLowerCase().includes(filters.search.toLowerCase()) && 
        !v.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })
  const totalPages = Math.ceil(filteredVersions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedVersions = filteredVersions.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_version_date_from')}</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_version_date_to')}</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_previous_version')}</label>
            <input
              type="text"
              placeholder="e.g., 02a"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_updated_by')}</label>
            <select
              value={filters.owner}
              onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={users.length === 0}
            >
              <option value="all">{t('mr_all_users')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project_category')}</label>
            <select
              value={filters.projectCategoryId}
              onChange={(e) => setFilters({ ...filters, projectCategoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={projectCategories.length === 0}
            >
              <option value="all">All Categories</option>
              {projectCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_search')}</label>
            <input
              type="text"
              placeholder={t('mr_file_code_placeholder')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('mr_export_excel')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('file_code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_doc_title')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('project_category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_previous_version')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_new_version')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_version_date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_updated_by')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_change_summary')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    {t('mr_loading_versions')}
                  </td>
                </tr>
              ) : paginatedVersions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8">
                    <EmptyState
                      message={t('mr_no_versions')}
                      description={filters.search ? t('mr_try_adjust') : t('mr_no_new_versions')}
                      actionLabel={filters.search ? 'Clear Search' : null}
                      onAction={filters.search ? () => setFilters({ ...filters, search: '' }) : null}
                    />
                  </td>
                </tr>
              ) : (
                paginatedVersions.map((version) => (
                <tr key={version.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{version.fileCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{version.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.projectCategory}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.previousVersion}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {version.newVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.versionDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.updatedBy}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{version.changeSummary}</td>
                  <td className="px-4 py-3 text-sm">
                    <ActionMenu
                      actions={[
                        { label: t('mr_compare'), onClick: () => console.log('Compare version:', version) }
                      ]}
                    />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && filteredVersions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredVersions.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  )
}

// Obsolete Register Component
function ObsoleteRegister({ projectCategories = [] }) {
  const { itemsPerPage, t } = usePreferences()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    owner: 'all',
    projectCategoryId: 'all',
    search: ''
  })

  useEffect(() => {
    loadObsoleteDocuments()
  }, [filters])

  const loadObsoleteDocuments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/master-record/obsolete-register', { params: filters })
      const data = res.data.data?.records || []
      
      // Format for frontend
      const formattedDocs = data.map(record => ({
        id: record.id,
        fileCode: record.fileCode,
        title: record.documentTitle,
        type: record.documentType,
        projectCategory: record.projectCategory || '',
        obsoleteDate: new Date(record.obsoleteDate).toLocaleDateString('en-GB'),
        reason: record.reason,
        replacedBy: record.replacedBy || 'N/A',
        lastOwner: record.lastOwner
      }))
      
      setDocuments(formattedDocs)
    } catch (error) {
      console.error('Failed to load obsolete documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    alert('Exporting Obsolete Register...')
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  // Pagination calculations
  const filteredDocuments = documents.filter((doc) => {
    if (filters.search && !doc.fileCode.toLowerCase().includes(filters.search.toLowerCase()) && 
        !doc.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })
  const totalPages = Math.ceil(filteredDocuments.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_obsolete_date_from')}</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_obsolete_date_to')}</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('document_type')}</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('mr_all_types')}</option>
              <option value="procedure">Procedure</option>
              <option value="policy">Policy</option>
              <option value="manual">Manual</option>
              <option value="form">Form</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_reason')}</label>
            <select
              value={filters.reason}
              onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('mr_all_reasons')}</option>
              <option value="decommissioned">System decommissioned</option>
              <option value="outdated">Outdated</option>
              <option value="replaced">Replaced by new document</option>
              <option value="merged">Merged with another document</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project_category')}</label>
            <select
              value={filters.projectCategoryId}
              onChange={(e) => setFilters({ ...filters, projectCategoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={projectCategories.length === 0}
            >
              <option value="all">All Categories</option>
              {projectCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_search')}</label>
            <input
              type="text"
              placeholder={t('mr_file_code_placeholder')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('mr_export_excel')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('file_code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_doc_title')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('type')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('project_category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_obsolete_date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_reason')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_replaced_by')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    {t('mr_loading_documents')}
                  </td>
                </tr>
              ) : paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8">
                    <EmptyState
                      message={t('mr_no_obsolete_docs')}
                      description={filters.search ? t('mr_try_adjust') : t('mr_no_obsolete_yet')}
                      actionLabel={filters.search ? 'Clear Search' : null}
                      onAction={filters.search ? () => setFilters({ ...filters, search: '' }) : null}
                    />
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-600">{doc.fileCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{doc.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.projectCategory}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.obsoleteDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.reason}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-medium">{doc.replacedBy}</td>
                  <td className="px-4 py-3 text-sm">
                    <ActionMenu
                      actions={[
                        { label: t('mr_view_archive'), onClick: () => console.log('View archive:', doc) }
                      ]}
                    />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
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
  )
}

// Old Version Register Component
function OldVersionRegister({ projectCategories = [] }) {
  const { itemsPerPage, t } = usePreferences()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    owner: 'all',
    projectCategoryId: 'all',
    search: ''
  })

  useEffect(() => {
    loadArchivedVersions()
  }, [filters])

  const loadArchivedVersions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/master-record/archive-register', { params: filters })
      const data = res.data.data?.records || []
      
      // Format for frontend
      const formattedVersions = data.map(record => ({
        id: record.id,
        fileCode: record.fileCode,
        title: record.documentTitle,
        projectCategory: record.projectCategory || '',
        version: record.version,
        archivedDate: new Date(record.archivedDate).toLocaleDateString('en-GB'),
        archivedBy: record.archivedBy,
        currentVersion: record.currentVersion,
        retentionUntil: record.retentionUntil ? new Date(record.retentionUntil).toLocaleDateString('en-GB') : 'N/A'
      }))
      
      setVersions(formattedVersions)
    } catch (error) {
      console.error('Failed to load archived versions:', error)
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    alert('Exporting Old Version Register...')
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  // Pagination calculations
  const filteredVersions = versions.filter((v) => {
    if (filters.search && !v.fileCode.toLowerCase().includes(filters.search.toLowerCase()) && 
        !v.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })
  const totalPages = Math.ceil(filteredVersions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedVersions = filteredVersions.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_archived_date_from')}</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_archived_date_to')}</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_old_version')}</label>
            <input
              type="text"
              placeholder="e.g., 1.0"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_current_version')}</label>
            <input
              type="text"
              placeholder="e.g., 2.2"
              value={filters.owner}
              onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project_category')}</label>
            <select
              value={filters.projectCategoryId}
              onChange={(e) => setFilters({ ...filters, projectCategoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={projectCategories.length === 0}
            >
              <option value="all">All Categories</option>
              {projectCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_search')}</label>
            <input
              type="text"
              placeholder={t('mr_file_code_placeholder')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('mr_export_excel')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('file_code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_doc_title')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('project_category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_old_version')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_current_version')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_archived_date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('mr_retention_until')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    {t('mr_loading_versions')}
                  </td>
                </tr>
              ) : paginatedVersions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8">
                    <EmptyState
                      message={t('mr_no_old_versions')}
                      description={filters.search ? t('mr_try_adjust') : t('mr_no_archived_versions')}
                      actionLabel={filters.search ? 'Clear Search' : null}
                      onAction={filters.search ? () => setFilters({ ...filters, search: '' }) : null}
                    />
                  </td>
                </tr>
              ) : (
                paginatedVersions.map((version) => (
                <tr key={version.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{version.fileCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{version.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.projectCategory}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.version}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      {version.currentVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.archivedDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{version.retentionUntil}</td>
                  <td className="px-4 py-3 text-sm">
                    <ActionMenu
                      actions={[
                        { label: t('mr_restore'), onClick: () => console.log('Restore version:', version) }
                      ]}
                    />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && filteredVersions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredVersions.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  )
}

function ConsolidatedRegister() {
  const { itemsPerPage, t } = usePreferences()
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: itemsPerPage, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', projectCategoryId: 'all' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' })
  const [documentTypes, setDocumentTypes] = useState([])
  const [projectCategories, setProjectCategories] = useState([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [typesRes, projRes] = await Promise.all([
          api.get('/system/config/document-types'),
          api.get('/system/config/project-categories')
        ])
        if (cancelled) return
        setDocumentTypes(typesRes.data?.data?.documentTypes || [])
        setProjectCategories(projRes.data?.data?.projectCategories || [])
      } catch (_) {
        if (cancelled) return
        setDocumentTypes([])
        setProjectCategories([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    loadRows()
  }, [filters, currentPage, pageSize])

  const loadRows = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/master-record/consolidated', {
        params: { search: filters.search, projectCategoryId: filters.projectCategoryId, page: currentPage, limit: pageSize }
      })
      const data = res.data?.data || {}
      setRows(Array.isArray(data.rows) ? data.rows : [])
      setPagination(data.pagination || { page: currentPage, limit: pageSize, total: 0 })
    } catch (_) {
      setRows([])
      setPagination({ page: currentPage, limit: pageSize, total: 0 })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return ''
    return dt.toISOString().split('T')[0]
  }

  const downloadTemplate = () => {
    const header = ['Document Title', 'Type of Document', 'Project Category', 'Date', 'Status', 'Rev', 'Reference No']
    const ws = XLSX.utils.aoa_to_sheet([header])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Running Document')
    XLSX.writeFile(wb, `consolidated_registry_template_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportExcel = async () => {
    try {
      const res = await api.get('/reports/master-record/consolidated', {
        params: { search: filters.search, projectCategoryId: filters.projectCategoryId, export: 1 }
      })
      const data = res.data?.data || {}
      const allRows = Array.isArray(data.rows) ? data.rows : []
      const header = ['Document Title', 'Type of Document', 'Project Category', 'Date', 'Status', 'Rev', 'Reference No', 'Register', 'Source']
      const aoa = [header]
      for (const r of allRows) {
        aoa.push([
          r.documentTitle || '',
          r.documentType || '',
          r.projectCategory || '',
          formatDate(r.date),
          r.status || '',
          r.rev || '',
          r.fileCode || '',
          r.register || '',
          r.source || ''
        ])
      }
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Consolidated Registry')
      XLSX.writeFile(wb, `consolidated_registry_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (_) {
      setAlertModal({ show: true, title: t('mr_export_failed'), message: t('mr_export_failed_desc'), type: 'error' })
    }
  }

  const findHeaderRow = (aoa) => {
    const needle = ['reference no', 'reference', 'no rujukan', '参考', '编号']
    for (let i = 0; i < Math.min(20, aoa.length); i++) {
      const row = Array.isArray(aoa[i]) ? aoa[i] : []
      const joined = row.map((c) => String(c || '').toLowerCase()).join(' | ')
      if (needle.some((n) => joined.includes(n))) return i
    }
    return -1
  }

  const toExcelDate = (v) => {
    if (!v) return null
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v
    if (typeof v === 'number') {
      const epoch = new Date(Date.UTC(1899, 11, 30))
      const ms = v * 24 * 60 * 60 * 1000
      const d = new Date(epoch.getTime() + ms)
      if (!Number.isNaN(d.getTime())) return d
      return null
    }
    const s = String(v).trim()
    if (!s) return null
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) return d
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (m) {
      const dd = parseInt(m[1], 10)
      const mm = parseInt(m[2], 10) - 1
      const yy = parseInt(m[3], 10)
      const d2 = new Date(yy, mm, dd)
      if (!Number.isNaN(d2.getTime())) return d2
    }
    return null
  }

  const mapColumns = (headerRow) => {
    const idx = {}
    const norm = headerRow.map((h) => String(h || '').trim().toLowerCase())
    const pick = (...names) => {
      for (const n of names) {
        const at = norm.indexOf(n)
        if (at >= 0) return at
      }
      return -1
    }
    idx.title = pick('document title', 'tajuk dokumen', '文件标题')
    idx.type = pick('type of document', 'jenis dokumen', 'document type', 'jenis dokumen', '文件类型')
    idx.category = pick('project category', 'kategori projek', '项目类别')
    idx.date = pick('date', 'tarikh', '日期')
    idx.status = pick('status', 'status', '状态')
    idx.rev = pick('rev', 'revision', 'revisi', '修订')
    idx.ref = pick('reference no', 'reference', 'reference no.', 'no rujukan', '编号', '参考编号')
    return idx
  }

  const openImport = () => {
    setImportOpen(true)
    setImporting(false)
    setImportFile(null)
    setImportError('')
    setImportResult(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImporting(false)
    setImportFile(null)
    setImportError('')
    setImportResult(null)
  }

  const runImport = async () => {
    setImportError('')
    setImportResult(null)
    if (!importFile) {
      setImportError(t('mr_import_select_file'))
      return
    }
    if (documentTypes.length === 0 || projectCategories.length === 0) {
      setImportError(t('mr_import_missing_master'))
      return
    }
    setImporting(true)
    try {
      const buf = await importFile.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' })
      const headerRowIndex = findHeaderRow(aoa)
      if (headerRowIndex < 0) {
        setImportError(t('mr_import_bad_template'))
        setImporting(false)
        return
      }
      const header = aoa[headerRowIndex]
      const cols = mapColumns(header)
      if (cols.ref < 0 || cols.title < 0 || cols.type < 0 || cols.category < 0) {
        setImportError(t('mr_import_bad_template'))
        setImporting(false)
        return
      }

      const matchDocTypeId = (val) => {
        const s = String(val || '').trim()
        if (!s) return null
        const lower = s.toLowerCase()
        const byName = documentTypes.find((dt) => String(dt.name || '').toLowerCase() === lower)
        if (byName) return byName.id
        const byPrefix = documentTypes.find((dt) => String(dt.prefix || '').toLowerCase() === lower)
        return byPrefix ? byPrefix.id : null
      }

      const matchProjectCategoryId = (val) => {
        const s = String(val || '').trim()
        if (!s) return null
        const lower = s.toLowerCase()
        const byName = projectCategories.find((pc) => String(pc.name || '').toLowerCase() === lower)
        if (byName) return byName.id
        const byCode = projectCategories.find((pc) => String(pc.code || '').toLowerCase() === lower)
        return byCode ? byCode.id : null
      }

      const payloadRows = []
      for (let r = headerRowIndex + 1; r < aoa.length; r++) {
        const row = aoa[r]
        if (!Array.isArray(row)) continue
        const fileCode = String(row[cols.ref] || '').trim()
        const documentTitle = String(row[cols.title] || '').trim()
        const docTypeCell = row[cols.type]
        const projCell = row[cols.category]
        const documentTypeId = matchDocTypeId(docTypeCell)
        const projectCategoryId = matchProjectCategoryId(projCell)
        const status = cols.status >= 0 ? String(row[cols.status] || '').trim() : ''
        const rev = cols.rev >= 0 ? String(row[cols.rev] || '').trim() : ''
        const date = cols.date >= 0 ? toExcelDate(row[cols.date]) : null
        const hasAny = fileCode || documentTitle || docTypeCell || projCell
        if (!hasAny) continue

        payloadRows.push({
          lineNumber: r + 1,
          fileCode,
          documentTitle,
          documentTypeId,
          projectCategoryId,
          documentDate: date ? date.toISOString() : null,
          status,
          rev
        })
      }

      if (payloadRows.length === 0) {
        setImportError(t('mr_import_empty_rows'))
        setImporting(false)
        return
      }

      const res = await api.post('/reports/master-record/consolidated/import', { rows: payloadRows })
      setImportResult(res.data?.data || null)
      const counts = res.data?.data?.counts
      setAlertModal({
        show: true,
        title: t('mr_import_done'),
        message: `${t('mr_imported')}: ${counts?.imported ?? 0} | ${t('mr_rejected')}: ${counts?.failed ?? 0}`,
        type: 'success'
      })
      await loadRows()
    } catch (e) {
      setImportError(e?.response?.data?.message || t('mr_import_failed_desc'))
    } finally {
      setImporting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pageSize))

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mr_search')}</label>
            <input
              type="text"
              placeholder={t('mr_file_code_placeholder')}
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setCurrentPage(1) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project_category')}</label>
            <select
              value={filters.projectCategoryId}
              onChange={(e) => { setFilters({ ...filters, projectCategoryId: e.target.value }); setCurrentPage(1) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={projectCategories.length === 0}
            >
              <option value="all">All Categories</option>
              {projectCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end justify-end gap-3">
            {isAdmin() && (
              <button
                onClick={openImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('mr_import_excel')}
              </button>
            )}
            <button
              onClick={exportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('mr_export_excel')}
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('file_code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mr_doc_title')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('project_category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mr_rev')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mr_register')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">{t('loading')}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <EmptyState title={t('no_data')} message={t('no_records')} />
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.fileCode}>
                  <td className="px-4 py-3 text-sm font-mono text-blue-600">{r.fileCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.documentTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.documentType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.projectCategory}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.date ? new Date(r.date).toLocaleDateString('en-GB') : ''}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.rev}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{r.register}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && (pagination.total || 0) > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={pagination.total || 0}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
        />
      )}

      {alertModal.show && (
        <AlertModal
          isOpen={alertModal.show}
          onClose={() => setAlertModal({ ...alertModal, show: false })}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
        />
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeImport} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('mr_import_excel')}</h2>
                  <p className="text-sm text-gray-600 mt-1">{t('mr_import_desc')}</p>
                </div>
                <button onClick={closeImport} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {importError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {importError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('mr_download_template')}
                  </button>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                </div>

                {importResult?.failed?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-900">
                      {t('mr_rejected')} ({importResult.failed.length})
                    </div>
                    <div className="max-h-56 overflow-auto divide-y divide-gray-100">
                      {importResult.failed.slice(0, 50).map((f) => (
                        <div key={`${f.lineNumber}-${f.reasonCode}`} className="px-4 py-2 text-sm">
                          <div className="font-medium text-gray-900">Line {f.lineNumber}</div>
                          <div className="text-gray-700">{f.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={closeImport}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={importing}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={runImport}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  disabled={importing}
                >
                  {importing ? t('loading') : t('mr_import')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Master Record Component
export default function MasterRecord() {
  const { t } = usePreferences()
  const [activeTab, setActiveTab] = useState('new-documents')
  const [projectCategories, setProjectCategories] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    totalDocuments: 0,
    active: 0,
    newThisMonth: 0,
    obsolete: 0
  })

  useEffect(() => {
    loadStats()
    loadProjectCategories()
    loadDocumentTypes()
    loadUsers()
  }, [])

  const loadProjectCategories = async () => {
    try {
      const res = await api.get('/system/config/project-categories')
      setProjectCategories(res.data?.data?.projectCategories || [])
    } catch (_) {
      setProjectCategories([])
    }
  }

  const loadDocumentTypes = async () => {
    try {
      const res = await api.get('/system/config/document-types')
      setDocumentTypes(res.data?.data?.documentTypes || [])
    } catch (_) {
      setDocumentTypes([])
    }
  }

  const loadUsers = async () => {
    try {
      const res = await api.get('/reports/config/users', { params: { status: 'ACTIVE' } })
      const raw = res.data?.data?.users || []
      const formatted = raw.map((u) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`
      }))
      setUsers(formatted)
    } catch (_) {
      setUsers([])
    }
  }

  const loadStats = async () => {
    try {
      const res = await api.get('/reports/dashboard-stats')
      const data = res.data.data?.stats || {}
      
      // Calculate new this month
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const newDocsRes = await api.get('/reports/master-record/new-documents', {
        params: {
          dateFrom: firstDayOfMonth.toISOString().split('T')[0]
        }
      })
      const newThisMonth = newDocsRes.data.data?.documents?.length || 0

      setStats({
        totalDocuments: data.documents?.total || 0,
        active: data.documents?.published || 0,
        newThisMonth,
        obsolete: data.documents?.obsolete || 0
      })
    } catch (error) {
      console.error('Failed to load master record stats:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>{t('mr_title')}</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('mr_desc')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('mr_total_documents')}</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{t('mr_all_registered')}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('mr_active')}</p>
          <p className="text-3xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{t('mr_currently_in_use')}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('mr_new_this_month')}</p>
          <p className="text-3xl font-bold text-blue-600">{stats.newThisMonth}</p>
          <p className="text-xs text-gray-500 mt-1">{t('mr_recently_registered')}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('status_obsolete')}</p>
          <p className="text-3xl font-bold text-red-600">{stats.obsolete}</p>
          <p className="text-xs text-gray-500 mt-1">{t('mr_deprecated_docs')}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'new-documents' && (
          <NewDocumentRegister
            projectCategories={projectCategories}
            documentTypes={documentTypes}
            users={users}
          />
        )}
        {activeTab === 'new-versions' && (
          <NewVersionRegister projectCategories={projectCategories} users={users} />
        )}
        {activeTab === 'obsolete' && <ObsoleteRegister projectCategories={projectCategories} />}
        {activeTab === 'old-versions' && <OldVersionRegister projectCategories={projectCategories} />}
        {activeTab === 'consolidated' && <ConsolidatedRegister />}
      </div>
    </div>
  )
}

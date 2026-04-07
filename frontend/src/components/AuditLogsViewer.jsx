import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import { usePreferences } from '../contexts/PreferencesContext'

// Log Detail Modal Component
function LogDetailModal({ log, onClose }) {
  const { t, formatDateTime } = usePreferences()
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('alv_detail_title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('alv_timestamp')}</p>
              <p className="text-sm text-gray-900">{formatDateTime(log.timestamp)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('status')}</p>
              <p className="text-sm">
                <span className="text-green-600 font-medium">{t('alv_success')}</span>
              </p>
            </div>
          </div>

          {/* User Info */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">{t('alv_user')}</p>
            <p className="text-sm text-gray-900">{log.user || t('alv_system')}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">{t('alv_ip_address')}</p>
            <p className="text-sm text-gray-900">{log.ipAddress || '-'}</p>
          </div>

          <hr className="border-gray-200" />

          {/* Action Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('alv_module')}</p>
              <p className="text-sm text-gray-900">{log.module}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('action')}</p>
              <p className="text-sm text-gray-900">{log.action}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">{t('description')}</p>
            <p className="text-sm text-gray-900">{log.description || '-'}</p>
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <hr className="border-gray-200" />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">{t('alv_additional_details')}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  )
}

// All possible action types in the system
const ALL_ACTION_TYPES = [
  // Authentication
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  // Document actions
  'CREATE',
  'UPDATE',
  'DELETE',
  'UPLOAD',
  'DOWNLOAD',
  'VIEW',
  'ACKNOWLEDGE',
  'REJECT',
  // Workflow actions
  'SUBMIT_FOR_REVIEW',
  'REVIEW_APPROVE',
  'REVIEW_RETURN',
  'FIRST_APPROVE',
  'FIRST_RETURN',
  'SECOND_APPROVE',
  'SECOND_RETURN',
  'PUBLISH',
  'ARCHIVE',
  // Supersede/Obsolete actions
  'SUPERSEDE',
  'OBSOLETE',
  'SUPERSEDE_REQUEST',
  'SUPERSEDE_REVIEW_APPROVE',
  'SUPERSEDE_REVIEW_REJECT',
  'SUPERSEDE_FINAL_APPROVE',
  'SUPERSEDE_REJECT',
  // Version request actions
  'VERSION_REQUEST',
  'VERSION_ACKNOWLEDGE',
  'VERSION_REVIEW_APPROVE',
  'VERSION_REVIEW_REJECT',
  'VERSION_FINAL_APPROVE',
  'VERSION_REJECT',
  // User management
  'ACTIVATE',
  'DEACTIVATE',
  'ROLE_ASSIGN',
  'ROLE_REMOVE',
  // Role management
  'ROLE_CREATE',
  'ROLE_UPDATE',
  'ROLE_DELETE',
  'ROLE_PERMISSION_UPDATE',
  // Folder management
  'FOLDER_CREATE',
  'FOLDER_UPDATE',
  'FOLDER_DELETE',
]

// Main Audit Logs Viewer Component
export default function AuditLogsViewer() {
  const { t, itemsPerPage, formatDateTime } = usePreferences()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateRange: '7days',
    module: 'all',
    action: 'all',
    user: 'all',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedLog, setSelectedLog] = useState(null)
  const [filterOptions, setFilterOptions] = useState({
    modules: [],
    actions: ALL_ACTION_TYPES,
    users: []
  })

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions()
  }, [])

  // Load logs when filters or page changes
  useEffect(() => {
    loadLogs()
  }, [filters, currentPage, pageSize])

  const loadFilterOptions = async () => {
    try {
      const res = await api.get('/reports/activity-logs/filters')
      const data = res.data?.data || {}
      
      // Merge API actions with predefined actions (remove duplicates)
      const apiActions = Array.isArray(data.actions) ? data.actions : []
      const allActions = [...new Set([...ALL_ACTION_TYPES, ...apiActions])]
      
      setFilterOptions({
        modules: Array.isArray(data.modules) ? data.modules : [],
        actions: allActions,
        users: Array.isArray(data.users) ? data.users : []
      })
    } catch (error) {
      console.error('Failed to load filter options:', error)
      setFilterOptions({ modules: [], actions: ALL_ACTION_TYPES, users: [] })
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        dateRange: filters.dateRange,
        ...(filters.module !== 'all' && { module: filters.module }),
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.user !== 'all' && { user: filters.user }),
        ...(filters.search && { search: filters.search })
      })
      const res = await api.get(`/reports/activity-logs?${params}`)
      setLogs(res.data?.data?.logs || [])
      setTotalRecords(res.data?.data?.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to load logs:', error)
      setLogs([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        dateRange: filters.dateRange,
        ...(filters.module !== 'all' && { module: filters.module }),
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.user !== 'all' && { user: filters.user }),
        ...(filters.search && { search: filters.search })
      })
      const res = await api.get(`/reports/activity-logs/export?${params}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export logs:', error)
      alert('Export failed. Please try again.')
    }
  }

  const getActionBadge = (action) => {
    const colors = {
      // Document actions
      CREATE: 'bg-blue-100 text-blue-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      UPLOAD: 'bg-purple-100 text-purple-800',
      DRAFT_UPLOAD: 'bg-purple-100 text-purple-800',
      DOWNLOAD: 'bg-green-100 text-green-800',
      VIEW: 'bg-gray-100 text-gray-800',
      ACKNOWLEDGE: 'bg-green-100 text-green-800',
      REJECT: 'bg-orange-100 text-orange-800',
      // Workflow actions
      SUBMIT_FOR_REVIEW: 'bg-blue-100 text-blue-800',
      APPROVE: 'bg-teal-100 text-teal-800',
      REVIEW_APPROVE: 'bg-teal-100 text-teal-800',
      REVIEW_RETURN: 'bg-orange-100 text-orange-800',
      FIRST_APPROVE: 'bg-teal-100 text-teal-800',
      FIRST_RETURN: 'bg-orange-100 text-orange-800',
      SECOND_APPROVE: 'bg-teal-100 text-teal-800',
      SECOND_RETURN: 'bg-orange-100 text-orange-800',
      PUBLISH: 'bg-emerald-100 text-emerald-800',
      ARCHIVE: 'bg-slate-100 text-slate-800',
      // Supersede/Obsolete actions
      SUPERSEDE: 'bg-amber-100 text-amber-800',
      OBSOLETE: 'bg-gray-100 text-gray-800',
      SUPERSEDE_REQUEST: 'bg-amber-100 text-amber-800',
      SUPERSEDE_REVIEW_APPROVE: 'bg-teal-100 text-teal-800',
      SUPERSEDE_REVIEW_REJECT: 'bg-orange-100 text-orange-800',
      SUPERSEDE_FINAL_APPROVE: 'bg-emerald-100 text-emerald-800',
      SUPERSEDE_REJECT: 'bg-red-100 text-red-800',
      // Version request actions
      VERSION_REQUEST: 'bg-blue-100 text-blue-800',
      VERSION_ACKNOWLEDGE: 'bg-green-100 text-green-800',
      VERSION_REVIEW_APPROVE: 'bg-teal-100 text-teal-800',
      VERSION_REVIEW_REJECT: 'bg-orange-100 text-orange-800',
      VERSION_FINAL_APPROVE: 'bg-emerald-100 text-emerald-800',
      VERSION_REJECT: 'bg-red-100 text-red-800',
      // Auth actions
      LOGIN: 'bg-indigo-100 text-indigo-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      PASSWORD_CHANGE: 'bg-purple-100 text-purple-800',
      PASSWORD_RESET: 'bg-purple-100 text-purple-800',
      // User management
      ACTIVATE: 'bg-green-100 text-green-800',
      DEACTIVATE: 'bg-red-100 text-red-800',
      ROLE_ASSIGN: 'bg-blue-100 text-blue-800',
      ROLE_REMOVE: 'bg-orange-100 text-orange-800',
      // Role management
      ROLE_CREATE: 'bg-blue-100 text-blue-800',
      ROLE_UPDATE: 'bg-yellow-100 text-yellow-800',
      ROLE_DELETE: 'bg-red-100 text-red-800',
      ROLE_PERMISSION_UPDATE: 'bg-yellow-100 text-yellow-800',
      // Folder management
      FOLDER_CREATE: 'bg-blue-100 text-blue-800',
      FOLDER_UPDATE: 'bg-yellow-100 text-yellow-800',
      FOLDER_DELETE: 'bg-red-100 text-red-800',
    }
    const colorClass = colors[action] || 'bg-gray-100 text-gray-800'
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colorClass}`}>{action}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('alv_header')}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('alv_header_desc')}
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('alv_date_range')}</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">{t('alv_today')}</option>
              <option value="7days">{t('alv_7days')}</option>
              <option value="30days">{t('alv_30days')}</option>
              <option value="90days">{t('alv_90days')}</option>
              <option value="custom">{t('alv_custom_range')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('alv_module')}</label>
            <select
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('alv_all_modules')}</option>
              {filterOptions.modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('action')}</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('alv_all_actions')}</option>
              <optgroup label={t('alv_auth_group')}>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
                <option value="PASSWORD_RESET">PASSWORD_RESET</option>
              </optgroup>
              <optgroup label={t('alv_doc_actions_group')}>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="UPLOAD">UPLOAD</option>
                <option value="DRAFT_UPLOAD">DRAFT_UPLOAD</option>
                <option value="DOWNLOAD">DOWNLOAD</option>
                <option value="VIEW">VIEW</option>
                <option value="ACKNOWLEDGE">ACKNOWLEDGE</option>
                <option value="REJECT">REJECT</option>
              </optgroup>
              <optgroup label={t('alv_workflow_group')}>
                <option value="SUBMIT_FOR_REVIEW">SUBMIT_FOR_REVIEW</option>
                <option value="REVIEW_APPROVE">REVIEW_APPROVE</option>
                <option value="REVIEW_RETURN">REVIEW_RETURN</option>
                <option value="FIRST_APPROVE">FIRST_APPROVE</option>
                <option value="FIRST_RETURN">FIRST_RETURN</option>
                <option value="SECOND_APPROVE">SECOND_APPROVE</option>
                <option value="SECOND_RETURN">SECOND_RETURN</option>
                <option value="PUBLISH">PUBLISH</option>
                <option value="ARCHIVE">ARCHIVE</option>
              </optgroup>
              <optgroup label={t('alv_supersede_group')}>
                <option value="SUPERSEDE">SUPERSEDE</option>
                <option value="OBSOLETE">OBSOLETE</option>
                <option value="SUPERSEDE_REQUEST">SUPERSEDE_REQUEST</option>
                <option value="SUPERSEDE_REVIEW_APPROVE">SUPERSEDE_REVIEW_APPROVE</option>
                <option value="SUPERSEDE_REVIEW_REJECT">SUPERSEDE_REVIEW_REJECT</option>
                <option value="SUPERSEDE_FINAL_APPROVE">SUPERSEDE_FINAL_APPROVE</option>
                <option value="SUPERSEDE_REJECT">SUPERSEDE_REJECT</option>
              </optgroup>
              <optgroup label={t('alv_version_group')}>
                <option value="VERSION_REQUEST">VERSION_REQUEST</option>
                <option value="VERSION_ACKNOWLEDGE">VERSION_ACKNOWLEDGE</option>
                <option value="VERSION_REVIEW_APPROVE">VERSION_REVIEW_APPROVE</option>
                <option value="VERSION_REVIEW_REJECT">VERSION_REVIEW_REJECT</option>
                <option value="VERSION_FINAL_APPROVE">VERSION_FINAL_APPROVE</option>
                <option value="VERSION_REJECT">VERSION_REJECT</option>
              </optgroup>
              <optgroup label={t('alv_user_mgmt_group')}>
                <option value="ACTIVATE">ACTIVATE</option>
                <option value="DEACTIVATE">DEACTIVATE</option>
                <option value="ROLE_ASSIGN">ROLE_ASSIGN</option>
                <option value="ROLE_REMOVE">ROLE_REMOVE</option>
              </optgroup>
              <optgroup label={t('alv_role_mgmt_group')}>
                <option value="ROLE_CREATE">ROLE_CREATE</option>
                <option value="ROLE_UPDATE">ROLE_UPDATE</option>
                <option value="ROLE_DELETE">ROLE_DELETE</option>
                <option value="ROLE_PERMISSION_UPDATE">ROLE_PERMISSION_UPDATE</option>
              </optgroup>
              <optgroup label={t('alv_folder_mgmt_group')}>
                <option value="FOLDER_CREATE">FOLDER_CREATE</option>
                <option value="FOLDER_UPDATE">FOLDER_UPDATE</option>
                <option value="FOLDER_DELETE">FOLDER_DELETE</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('alv_user')}</label>
            <select
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('alv_all_users')}</option>
              {filterOptions.users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('alv_search_placeholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleExport}
            data-tour-id="logs-export-activity"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{t('alv_export_csv')}</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('alv_timestamp')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('alv_user')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('alv_module')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('action')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('view_details')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {t('loading')}...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8">
                    <EmptyState
                      message={t('alv_no_logs')}
                      description={filters.search ? t('alv_no_logs_search_desc') : t('alv_no_logs_filter_desc')}
                      actionLabel={filters.search ? t('alv_clear_search') : null}
                      onAction={filters.search ? () => handleFilterChange('search', '') : null}
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900 font-medium">{log.user || t('alv_system')}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={log.description}>{log.description || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('alv_view')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalRecords > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalRecords / pageSize)}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}

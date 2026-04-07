import React, { useState, useEffect } from 'react'
import { usePreferences } from '../contexts/PreferencesContext'
import api from '../api/axios'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import { formatDateTime } from '../utils/dateFormatter'

// User Activity Detail Modal
function UserActivityDetailModal({ activity, onClose }) {
  const { t } = usePreferences()
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('ual_detail_title')} - {activity.userName}
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
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('alv_user')}</p>
              <p className="text-sm text-gray-900 font-medium">{activity.userName}</p>
              <p className="text-xs text-gray-500">{activity.email}</p>
              <p className="text-xs text-gray-500">{activity.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('department')}</p>
              <p className="text-sm text-gray-900">{activity.department || 'N/A'}</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Session Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('ual_login_time')}</p>
              <p className="text-sm text-gray-900">{formatDateTime(activity.loginTime)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('ual_logout_time')}</p>
              <p className="text-sm text-gray-900">{activity.logoutTime ? formatDateTime(activity.logoutTime) : t('ual_still_active')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('ual_session_duration')}</p>
              <p className="text-sm text-gray-900">{activity.duration}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{t('alv_ip_address')}</p>
              <p className="text-sm text-gray-900">{activity.ipAddress}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">{t('ual_device')}</p>
            <p className="text-sm text-gray-900">{activity.device}</p>
          </div>

          <hr className="border-gray-200" />

          {/* Activity Summary */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">{t('ual_activity_summary')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">{t('ual_pages_viewed')}</p>
                <p className="text-2xl font-bold text-blue-600">{activity.pagesViewed || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">{t('ual_docs_accessed')}</p>
                <p className="text-2xl font-bold text-green-600">{activity.documentsAccessed || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">{t('ual_actions_performed')}</p>
                <p className="text-2xl font-bold text-purple-600">{activity.actionsPerformed || 0}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">{t('ual_downloads')}</p>
                <p className="text-2xl font-bold text-orange-600">{activity.downloads || 0}</p>
              </div>
            </div>
          </div>

          {/* Recent Actions */}
          {activity.recentActions && activity.recentActions.length > 0 && (
            <>
              <hr className="border-gray-200" />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3">{t('ual_recent_actions')}</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activity.recentActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{action.action}</p>
                        <p className="text-xs text-gray-500">{action.entityName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{formatDateTime(action.time)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          action.module === 'Document' ? 'bg-blue-100 text-blue-800' :
                          action.module === 'Configuration' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {action.module}
                        </span>
                      </div>
                    </div>
                  ))}
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

// Main User Activity Logs Component
export default function UserActivityLogs() {
  const { t } = usePreferences()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateRange: '7days',
    user: 'all',
    department: 'all',
    status: 'all',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalSessionsToday: 0,
    avgSessionDuration: '0h 0m',
    totalActionsToday: 0
  })
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  useEffect(() => {
    loadActivities()
  }, [filters, currentPage])

  const loadUsers = async () => {
    try {
      const res = await api.get('/users')
      const userList = res.data.data?.users || res.data.data || []
      setUsers(userList)
      
      // Extract unique departments
      const depts = [...new Set(userList.map(u => u.department).filter(Boolean))]
      setDepartments(depts)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadStats = async () => {
    try {
      const res = await api.get('/audit/user-activities/stats')
      setStats(res.data.data?.stats || res.data.data || {})
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        dateRange: filters.dateRange,
        user: filters.user,
        department: filters.department,
        status: filters.status,
        search: filters.search
      })
      const res = await api.get(`/audit/user-activities?${params}`)
      const data = res.data.data
      setActivities(data.activities || [])
      setTotalRecords(data.total || 0)
    } catch (error) {
      console.error('Failed to load user activities:', error)
      setActivities([])
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
      const params = new URLSearchParams(filters)
      const res = await api.get(`/audit/user-activities/export?${params}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `user_activities_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export user activities:', error)
      alert('Export failed. Please try again.')
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          {t('ual_active')}
        </span>
      )
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">{t('ual_completed')}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">{t('ual_active_users')}</p>
          <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">{t('ual_total_sessions')}</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalSessionsToday}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">{t('ual_avg_duration')}</p>
          <p className="text-2xl font-bold text-purple-600">{stats.avgSessionDuration}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">{t('ual_total_actions')}</p>
          <p className="text-2xl font-bold text-orange-600">{stats.totalActionsToday.toLocaleString()}</p>
        </div>
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
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('alv_user')}</label>
            <select
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('ual_all_users')}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('department')}</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('ual_all_departments')}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('ual_all_status')}</option>
              <option value="active">{t('ual_active_sessions_filter')}</option>
              <option value="completed">{t('ual_completed_sessions')}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('ual_search_placeholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleExport}
            data-tour-id="logs-export-users"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{t('alv_export_csv')}</span>
          </button>
        </div>
      </div>

      {/* Activities Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('alv_user')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('ual_login_time')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('ual_session_duration')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('alv_ip_address')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('view_details')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    {t('ual_loading')}
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8">
                    <EmptyState
                      message={t('ual_no_activities')}
                      description={filters.search ? t('ual_no_activities_search_desc') : t('ual_no_activities_filter_desc')}
                      actionLabel={filters.search ? t('alv_clear_search') : null}
                      onAction={filters.search ? () => handleFilterChange('search', '') : null}
                    />
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {activity.userName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium">{activity.userName}</div>
                          <div className="text-gray-500 text-xs">{activity.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDateTime(activity.loginTime)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {activity.duration}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {activity.ipAddress}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {activity.actionsPerformed}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(activity.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedActivity(activity)}
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

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <UserActivityDetailModal 
          activity={selectedActivity} 
          onClose={() => setSelectedActivity(null)} 
        />
      )}
    </div>
  )
}

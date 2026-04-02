import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../contexts/PreferencesContext'
import api from '../api/axios'
import { AlertModal } from './ConfirmModal'

// Main System Reports Component
export default function SystemReports() {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' })
  const [stats, setStats] = useState({
    availableReports: 6,
    generatedToday: 0,
    scheduledReports: 0,
    totalSize: '0 MB'
  })

  useEffect(() => {
    loadStats()
    loadRecentReports()
  }, [])

  const loadStats = async () => {
    try {
      const res = await api.get('/reports/system/stats')
      setStats(res.data.data?.stats || {})
    } catch (error) {
      console.error('Failed to load report stats:', error)
    }
  }

  const loadRecentReports = async () => {
    try {
      setLoading(true)
      const res = await api.get('/reports/system/recent?limit=10')
      setRecentReports(res.data.data?.reports || [])
    } catch (error) {
      console.error('Failed to load recent reports:', error)
      setRecentReports([])
    } finally {
      setLoading(false)
    }
  }

  // Only include reports that are applicable to this DMS system
  const reportTypes = [
    {
      id: 'document-stats',
      name: 'Document Statistics Report',
      description: 'Overview of document creation, approval rates, and lifecycle metrics across all document types',
      category: 'Documents',
      estimatedTime: '1-2 minutes',
      metrics: ['Total documents', 'By document type', 'By status', 'Approval rates', 'Processing time']
    },
    {
      id: 'user-activity',
      name: 'User Activity Report',
      description: 'Analysis of user actions, document submissions, reviews, and approvals',
      category: 'Users',
      estimatedTime: '1-2 minutes',
      metrics: ['Active users', 'Actions by user', 'Documents created', 'Reviews completed', 'Approvals given']
    },
    {
      id: 'document-request',
      name: 'Document Request Report',
      description: 'Summary of new document requests (NDR) and version requests (NVR) with acknowledgment status',
      category: 'Requests',
      estimatedTime: '1 minute',
      metrics: ['Total requests', 'Pending acknowledgment', 'Acknowledged', 'By document type', 'By requester']
    },
    {
      id: 'security-audit',
      name: 'Security & Audit Report',
      description: 'Security events, login history, permission changes, and system audit trail',
      category: 'Security',
      estimatedTime: '2-3 minutes',
      metrics: ['Login history', 'Failed logins', 'Permission changes', 'Document access logs', 'System changes']
    },
    {
      id: 'template-usage',
      name: 'Template Usage Report',
      description: 'Statistics on document template downloads and utilization by document type',
      category: 'Templates',
      estimatedTime: '1 minute',
      metrics: ['Template downloads', 'Most used templates', 'By document type', 'Upload history']
    },
    {
      id: 'storage-usage',
      name: 'Storage Usage Report',
      description: 'File storage consumption, document sizes, and storage distribution analysis',
      category: 'System',
      estimatedTime: '1-2 minutes',
      metrics: ['Total storage used', 'By document type', 'By file format', 'Largest documents', 'Growth trend']
    }
  ]

  const handleViewReport = (reportId) => {
    // Navigate to report viewer with default 30-day date range
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const params = new URLSearchParams({
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    })
    navigate(`/reports/${reportId}?${params.toString()}`)
  }

  const handleDownloadReport = async (report) => {
    try {
      const res = await api.get(`/reports/system/${report.id}/download`, {
        responseType: 'blob'
      })
      
      // Create blob with correct MIME type for CSV
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Use the format from the report, default to csv
      const format = (report.format || 'CSV').toLowerCase()
      link.setAttribute('download', `${report.name.replace(/\s+/g, '_')}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download report:', error)
      setAlertModal({
        show: true,
        title: 'Download Failed',
        message: 'Failed to download report. The file may not exist or has expired.',
        type: 'error'
      })
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      Documents: 'bg-blue-50 text-blue-700 border-blue-200',
      Users: 'bg-purple-50 text-purple-700 border-purple-200',
      Requests: 'bg-green-50 text-green-700 border-green-200',
      Security: 'bg-red-50 text-red-700 border-red-200',
      Templates: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      System: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return colors[category] || colors.System
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--dms-text-primary)' }}>{t('sr_title')}</h2>
        <p className="mt-1 text-sm muted">
          {t('sr_desc')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium muted mb-1">{t('sr_available_reports')}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--dms-primary)' }}>{stats.availableReports}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium muted mb-1">{t('sr_generated_today')}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--dms-secondary)' }}>{stats.generatedToday}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium muted mb-1">{t('sr_scheduled_reports')}</p>
          <p className="text-2xl font-bold text-purple-600">{stats.scheduledReports}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium muted mb-1">{t('sr_total_size')}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--dms-accent)' }}>{stats.totalSize}</p>
        </div>
      </div>

      {/* Report Types Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--dms-text-primary)' }}>Available Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <div key={report.id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="mb-3">
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--dms-text-primary)' }}>{report.name}</h4>
                <span className={`inline-block text-xs px-2 py-0.5 rounded border ${getCategoryColor(report.category)}`}>
                  {report.category}
                </span>
              </div>

              <p className="text-xs muted mb-3 line-clamp-2">{report.description}</p>

              <div className="mb-3">
                <p className="text-xs font-medium muted mb-1">Includes:</p>
                <div className="flex flex-wrap gap-1">
                  {report.metrics.slice(0, 3).map((metric, index) => (
                    <span key={index} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--dms-panel-bg)', color: 'var(--dms-text-primary)' }}>
                      {metric}
                    </span>
                  ))}
                  {report.metrics.length > 3 && (
                    <span className="text-xs muted">+{report.metrics.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs muted mb-3">
                <span>Est. {report.estimatedTime}</span>
              </div>

              <button
                onClick={() => handleViewReport(report.id)}
                className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                style={{ background: 'var(--dms-primary)' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--dms-primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--dms-primary)'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('sr_generate_view')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--dms-text-primary)' }}>{t('sr_recent_reports')}</h3>
          <button className="text-sm font-medium" style={{ color: 'var(--dms-primary)' }}>
            View All
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead style={{ background: 'var(--dms-panel-bg)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: 'var(--dms-text-primary)' }}>
                  Report Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: 'var(--dms-text-primary)' }}>
                  Generated At
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: 'var(--dms-text-primary)' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: 'var(--dms-text-primary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200" style={{ background: 'var(--dms-card-bg)' }}>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center muted">
                    {t('loading')}...
                  </td>
                </tr>
              ) : recentReports.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center muted">
                    {t('sr_no_recent')}
                  </td>
                </tr>
              ) : (
                recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--dms-text-primary)' }}>
                      {report.name}
                    </td>
                    <td className="px-4 py-3 text-sm muted">
                      {report.generatedAt}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--dms-secondary)' }}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="font-medium"
                        style={{ color: 'var(--dms-primary)' }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        show={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false })}
      />
    </div>
  )
}

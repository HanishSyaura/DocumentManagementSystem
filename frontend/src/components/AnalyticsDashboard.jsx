import React, { useState, useEffect } from 'react'
import { usePreferences } from '../contexts/PreferencesContext'
import api from '../api/axios'

export default function AnalyticsDashboard() {
  const { t } = usePreferences()
  const [timeRange, setTimeRange] = useState('30days')
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalEventsTrend: { percent: 0, direction: 'same' },
    activeUsers: 0,
    successfulLogins: 0,
    failedLogins: 0,
    failedLoginsTrend: { percent: 0, direction: 'same' },
    documentsProcessed: 0,
    documentsTrend: { percent: 0, direction: 'same' }
  })
  const [activityTimeline, setActivityTimeline] = useState([])
  const [moduleUsage, setModuleUsage] = useState([])
  const [documentStatus, setDocumentStatus] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [topActivities, setTopActivities] = useState([])
  const [loading, setLoading] = useState(false)

  // Format string to Title Case (e.g., "REVIEW_APPROVE" -> "Review Approve")
  const formatToTitleCase = (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/audit/analytics?range=${timeRange}`)
      const data = res.data.data?.analytics || {}
      
      setAnalytics({
        totalEvents: data.overview?.totalEvents || 0,
        totalEventsTrend: data.overview?.totalEventsTrend || { percent: 0, direction: 'same' },
        activeUsers: data.overview?.activeUsers || 0,
        successfulLogins: data.overview?.successfulLogins || 0,
        failedLogins: data.overview?.failedLogins || 0,
        failedLoginsTrend: data.overview?.failedLoginsTrend || { percent: 0, direction: 'same' },
        documentsProcessed: data.overview?.documentsProcessed || 0,
        documentsTrend: data.overview?.documentsTrend || { percent: 0, direction: 'same' }
      })
      
      setActivityTimeline(data.activityTimeline || [])
      setModuleUsage(data.moduleUsage || [])
      setDocumentStatus(data.documentStatus || [])
      setTopUsers(data.topUsers || [])
      setTopActivities(data.topActivities || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setAnalytics({
        totalEvents: 0,
        totalEventsTrend: { percent: 0, direction: 'same' },
        activeUsers: 0,
        successfulLogins: 0,
        failedLogins: 0,
        failedLoginsTrend: { percent: 0, direction: 'same' },
        documentsProcessed: 0,
        documentsTrend: { percent: 0, direction: 'same' }
      })
      setActivityTimeline([])
      setModuleUsage([])
      setDocumentStatus([])
      setTopUsers([])
      setTopActivities([])
    } finally {
      setLoading(false)
    }
  }


  const getTrendIcon = (trend) => {
    if (trend === 'up') return (
      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    )
    if (trend === 'down') return (
      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    )
    return (
      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--dms-text-primary, #111827)' }}>{t('ad_title')}</h2>
          <p className="mt-1 text-sm muted">
            {t('ad_desc')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" style={{ color: 'var(--dms-text-primary, #374151)' }}>{t('ad_time_period')}</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500"
            style={{ background: 'var(--dms-card-bg, #fff)', color: 'var(--dms-text-primary, #111827)' }}
          >
            <option value="7days">{t('ad_last_7')}</option>
            <option value="30days">{t('ad_last_30')}</option>
            <option value="90days">{t('ad_last_90')}</option>
            <option value="year">{t('ad_this_year')}</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <p className="text-sm font-medium muted mb-2">{t('ad_total_events')}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--dms-primary)' }}>{analytics.totalEvents.toLocaleString()}</p>
          <p className={`text-xs mt-2 ${analytics.totalEventsTrend.direction === 'up' ? 'text-green-600' : analytics.totalEventsTrend.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {analytics.totalEventsTrend.direction === 'up' ? '↑' : analytics.totalEventsTrend.direction === 'down' ? '↓' : '→'} {analytics.totalEventsTrend.percent}% {t('ad_from_last_period')}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium muted mb-2">{t('ad_active_users')}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--dms-secondary)' }}>{analytics.activeUsers}</p>
          <p className="text-xs text-gray-500 mt-2">{analytics.successfulLogins} {t('ad_logins_period')}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium muted mb-2">{t('ad_failed_logins')}</p>
          <p className="text-3xl font-bold text-red-600">{analytics.failedLogins}</p>
          <p className={`text-xs mt-2 ${analytics.failedLoginsTrend.direction === 'up' ? 'text-red-600' : analytics.failedLoginsTrend.direction === 'down' ? 'text-green-600' : 'text-gray-500'}`}>
            {analytics.failedLoginsTrend.direction === 'up' ? '↑' : analytics.failedLoginsTrend.direction === 'down' ? '↓' : '→'} {analytics.failedLoginsTrend.percent}% {t('ad_from_last_period')}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium muted mb-2">{t('ad_documents')}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--dms-accent)' }}>{analytics.documentsProcessed.toLocaleString()}</p>
          <p className={`text-xs mt-2 ${analytics.documentsTrend.direction === 'up' ? 'text-green-600' : analytics.documentsTrend.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {analytics.documentsTrend.direction === 'up' ? '↑' : analytics.documentsTrend.direction === 'down' ? '↓' : '→'} {analytics.documentsTrend.percent}% {t('ad_from_last_period')}
          </p>
        </div>
      </div>

      {/* Activity Timeline Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--dms-text-primary, #111827)' }}>{t('ad_activity_timeline')}</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {activityTimeline.map((data, index) => {
            const maxValue = Math.max(...activityTimeline.map(d => d.events))
            const height = (data.events / maxValue) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center gap-1">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{ height: `${height * 2}px` }}
                      title={`${data.events} events`}
                    />
                  </div>
                  <div
                    className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer"
                    style={{ height: `${(data.documents / maxValue) * 200}px` }}
                    title={`${data.documents} documents`}
                  />
                </div>
                <p className="text-xs muted mt-2 font-medium">{data.day}</p>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs muted">{t('ad_events')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs muted">{t('ad_documents')}</span>
          </div>
        </div>
      </div>

      {/* Module Usage & Document Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Usage */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--dms-text-primary, #111827)' }}>{t('ad_module_usage')}</h3>
          <div className="space-y-4">
            {moduleUsage.map((module, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{module.name}</span>
                  <span className="text-gray-600">{module.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${module.color} h-2 rounded-full transition-all`}
                    style={{ width: `${module.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--dms-text-primary, #111827)' }}>{t('ad_doc_status')}</h3>
          <div className="space-y-3">
            {documentStatus.map((status, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 ${status.color} rounded-full`}></div>
                  <span className="text-sm font-medium text-gray-700">{formatToTitleCase(status.status)}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Documents</span>
              <span className="text-lg font-bold text-gray-900">
                {documentStatus.reduce((sum, s) => sum + s.count, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Top Users & Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active Users */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--dms-text-primary, #111827)' }}>{t('ad_top_users')}</h3>
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{user.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.actions} actions</p>
                  </div>
                </div>
                        {getTrendIcon(user.trend)}
              </div>
            ))}
          </div>
        </div>

        {/* Top Activities */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--dms-text-primary, #111827)' }}>{t('ad_top_activities')}</h3>
          <div className="space-y-3">
            {topActivities.map((activity, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {index + 1}. {formatToTitleCase(activity.name)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-semibold">{activity.count}</span>
                    <span className="text-gray-500">({activity.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${activity.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { usePreferences } from '../contexts/PreferencesContext'
import { normalizeAppPath } from '../utils/normalizeUrl'

// Inline SVG icons
const DocumentTextIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const ClockIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const ArchiveBoxIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const BadgeCheckIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
)

function MetricCard({ title, value, description, Icon, iconBg = 'bg-blue-50', iconColor = 'text-blue-700' }) {
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow h-full">
      <div className="flex flex-col h-full">
        {/* Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg ${iconBg} ${iconColor} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-semibold text-gray-700 leading-tight flex-1 min-w-0">{title}</h3>
        </div>
        
        {/* Value */}
        <div className="mb-2">
          <span className="text-3xl lg:text-4xl font-bold text-gray-900">{value}</span>
        </div>
        
        {/* Description */}
        <p className="text-xs text-gray-500 leading-snug">{description}</p>
      </div>
    </div>
  )
}

function Avatar({ name, profileImage }) {
  // Get user initials from name
  const getInitials = () => {
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden flex-shrink-0">
      {profileImage ? (
        <img src={normalizeAppPath(profileImage)} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials()
      )}
    </div>
  )
}

export default function Dashboard() {
  const { t, formatRelativeTime } = usePreferences()
  const [metrics, setMetrics] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get('/reports/dashboard')
        if (!mounted) return
        // Backend returns: { success, message, data: { metrics, recentActivity } }
        setMetrics(res.data.data?.metrics || res.data.metrics)
        setRecent(res.data.data?.recentActivity || res.data.recentActivity || [])
      } catch (e) {
        console.error('Failed to load dashboard', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between" data-tour-id="dashboard-header">
        <div>
          <h1 className="text-2xl font-semibold">{t('dashboard_overview')}</h1>
          <div className="text-sm text-gray-500">{t('dashboard_welcome')}</div>
        </div>
        <div className="text-sm text-gray-600">&nbsp;</div>
      </header>

      {loading && <div className="text-gray-500">{t('loading_dashboard')}</div>}

      {!loading && metrics && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5" data-tour-id="dashboard-metrics">
            <MetricCard 
              title={t('docs_in_draft')}
              value={metrics.drafts} 
              description={t('draft_desc')}
              Icon={DocumentTextIcon} 
              iconBg="bg-indigo-50" 
              iconColor="text-indigo-600" 
            />
            <MetricCard 
              title={t('pending_reviews')}
              value={metrics.pendingReviews} 
              description={t('review_desc')}
              Icon={ClockIcon} 
              iconBg="bg-yellow-50" 
              iconColor="text-yellow-600" 
            />
            <MetricCard 
              title={t('approved_published')}
              value={metrics.published} 
              description={t('published_desc')}
              Icon={BadgeCheckIcon} 
              iconBg="bg-green-50" 
              iconColor="text-green-600" 
            />
            <MetricCard 
              title={t('superseded_archived')}
              value={metrics.superseded} 
              description={t('archived_desc')}
              Icon={ArchiveBoxIcon} 
              iconBg="bg-gray-100" 
              iconColor="text-gray-600" 
            />
          </section>

          <section className="mt-6 space-y-6">
            {/* Recent Document Activity - Full Width */}
            <div className="card p-5">
              <div className="mb-4">
                <h2 className="font-semibold text-gray-900 text-base">{t('recent_activity')}</h2>
                <p className="text-xs text-gray-500 mt-1">{t('recent_activity_desc')}</p>
              </div>
              <div>
                {/* Desktop table - Compact 3 columns */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b border-gray-200">
                        <th className="py-3 px-2 font-semibold text-xs uppercase tracking-wide w-1/3">{t('user_document')}</th>
                        <th className="py-3 px-2 font-semibold text-xs uppercase tracking-wide w-1/3">{t('action')}</th>
                        <th className="py-3 px-2 font-semibold text-xs uppercase tracking-wide w-1/3 text-right">{t('time')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((r, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.user} profileImage={r.profileImage} />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 text-sm truncate">{r.user}</div>
                                <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline text-xs truncate block">
                                  {r.document}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-gray-700 text-sm">{r.action}</td>
                          <td className="py-3 px-2 text-gray-500 text-xs text-right whitespace-nowrap">
                            {r.updatedAt ? formatRelativeTime(r.updatedAt) : r.when}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile stacked list */}
                <div className="md:hidden space-y-3">
                  {recent.map((r, i) => (
                    <div key={i} className="card p-3 flex items-start gap-3">
                      <Avatar name={r.user} profileImage={r.profileImage} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{r.user}</div>
                            <div className="text-xs text-gray-500">{r.document}</div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {r.updatedAt ? formatRelativeTime(r.updatedAt) : r.when}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 mt-2">{r.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-5 pt-4 border-t border-gray-100">
                <a className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline" href="#">
                  {t('view_all_logs')} →
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {!loading && !metrics && <div className="text-red-500">Failed to load dashboard.</div>}
    </div>
  )
}

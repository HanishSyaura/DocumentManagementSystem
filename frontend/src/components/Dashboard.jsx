import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { usePreferences } from '../contexts/PreferencesContext'
import PageHeader from './ui/PageHeader'
import AppSurface from './ui/AppSurface'
import DashboardMetricCard from './dashboard/DashboardMetricCard'
import DashboardQuickActions from './dashboard/DashboardQuickActions'
import DashboardActivityTable from './dashboard/DashboardActivityTable'
import DashboardSkeleton from './dashboard/DashboardSkeleton'

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
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard_overview')}
        subtitle={t('dashboard_welcome')}
        className="mb-1"
      />

      {loading && <DashboardSkeleton />}

      {!loading && metrics && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-tour-id="dashboard-metrics">
            <DashboardMetricCard
              title={t('docs_in_draft')}
              value={metrics.drafts}
              description={t('draft_desc')}
              icon={DocumentTextIcon}
              tone="indigo"
            />
            <DashboardMetricCard
              title={t('pending_reviews')}
              value={metrics.pendingReviews}
              description={t('review_desc')}
              icon={ClockIcon}
              tone="warning"
            />
            <DashboardMetricCard
              title={t('approved_published')}
              value={metrics.published}
              description={t('published_desc')}
              icon={BadgeCheckIcon}
              tone="success"
            />
            <DashboardMetricCard
              title={t('superseded_archived')}
              value={metrics.superseded}
              description={t('archived_desc')}
              icon={ArchiveBoxIcon}
              tone="neutral"
            />
          </section>

          <DashboardQuickActions />

          <DashboardActivityTable
            title={t('recent_activity')}
            subtitle={t('recent_activity_desc')}
            recent={recent}
            formatRelativeTime={formatRelativeTime}
            viewAllLabel={t('view_all_logs')}
            viewAllTo="/logs"
            columns={{
              userDocument: t('user_document'),
              action: t('action'),
              time: t('time')
            }}
            emptyTitle={t('no_recent_activity_title')}
            emptyDescription={t('no_recent_activity_desc')}
          />
        </>
      )}

      {!loading && !metrics && (
        <AppSurface padding="lg" className="border-red-100 bg-red-50 text-red-700">
          Failed to load dashboard.
        </AppSurface>
      )}
    </div>
  )
}

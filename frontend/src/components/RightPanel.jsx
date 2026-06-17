import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../contexts/NotificationContext'
import { usePreferences } from '../contexts/PreferencesContext'
import AppSurface from './ui/AppSurface'
import EmptyPanelState from './ui/EmptyPanelState'
import SectionHeader from './ui/SectionHeader'
import AppRightPanelToggle from './layout/AppRightPanelToggle'

// Notification icon components
const WarningIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
)

const InfoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
)

const ErrorIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
)

const SuccessIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

function NotificationItem({ type = 'info', title, message, time, unread }) {
  const styles = {
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200'
  }

  const icons = {
    warning: <WarningIcon />,
    info: <InfoIcon />,
    error: <ErrorIcon />,
    success: <SuccessIcon />
  }

  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${styles[type]}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <p className="text-sm font-semibold leading-snug truncate">{title}</p>}
            <p className={`text-sm leading-snug ${title ? 'mt-0.5 font-medium' : 'font-medium'}`}>{message}</p>
          </div>
          {unread && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
        </div>
        <p className="text-xs mt-1 opacity-75">{time}</p>
      </div>
    </div>
  )
}

export default function RightPanel({ onCollapseChange, isCollapsed = false }) {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(isCollapsed)
  const [isNotificationsCollapsed, setIsNotificationsCollapsed] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()
  const { t } = usePreferences()
  const navigate = useNavigate()

  // Sync with parent collapse state
  React.useEffect(() => {
    setIsPanelCollapsed(isCollapsed)
  }, [isCollapsed])

  // Notify parent about collapse state changes
  React.useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isPanelCollapsed)
    }
  }, [isPanelCollapsed, onCollapseChange])

  const handleClearAll = () => {
    clearAll()
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    const link = notification.link
    if (link) {
      if (String(link).startsWith('http://') || String(link).startsWith('https://')) {
        window.location.assign(link)
      } else {
        navigate(link)
      }
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const seconds = Math.floor((now - then) / 1000)
    
    if (seconds < 60) return t('time_just_now')
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} ${t('time_minutes_ago')}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${t('time_hours_ago')}`
    const days = Math.floor(hours / 24)
    return `${days} ${t('time_days_ago')}`
  }

  const normalizeDate = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const getGroupKey = (timestamp) => {
    const now = normalizeDate(new Date())
    const date = normalizeDate(new Date(timestamp))
    const diffDays = Math.round((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    return 'earlier'
  }

  const visibleNotifications = (showUnreadOnly ? notifications.filter(n => !n.read) : notifications)
  const grouped = visibleNotifications.reduce((acc, n) => {
    const k = getGroupKey(n.timestamp || n.createdAt)
    acc[k] = acc[k] || []
    acc[k].push(n)
    return acc
  }, {})

  return (
    <>
      <AppRightPanelToggle
        collapsed={isPanelCollapsed}
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
      />

      <aside className={`app-rightpanel dms-scrollbar hidden h-full w-rightpanel overflow-y-auto border-l border-border bg-surface-muted p-4 transition-transform duration-300 xl:block ${isPanelCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
        <AppSurface padding="md" className="space-y-4">
          <SectionHeader
            title={t('system_notifications')}
            subtitle={t('important_alerts')}
            actions={(
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {unreadCount}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotificationsCollapsed(!isNotificationsCollapsed)}
                  className="rounded-lg p-1 text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  <svg className="h-5 w-5 transition-transform" style={{ transform: isNotificationsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          />

          {!isNotificationsCollapsed && (
            <>
              {notifications.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-ink-secondary transition-colors hover:text-ink"
                    >
                      {t('mark_all_read')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowUnreadOnly(v => !v)}
                    className={`transition-colors ${showUnreadOnly ? 'text-brand' : 'text-ink-muted hover:text-ink-secondary'}`}
                  >
                    {showUnreadOnly ? t('show_all') : t('show_unread')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-brand transition-colors hover:text-brand-hover"
                  >
                    {t('clear_all')}
                  </button>
                </div>
              )}

              {visibleNotifications.length > 0 ? (
                <div className="dms-scrollbar max-h-[calc(100vh-14rem)] space-y-4 overflow-y-auto pr-1">
                  {(['today', 'yesterday', 'earlier']).filter(k => (grouped[k] || []).length > 0).map((k) => (
                    <div key={k}>
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        {k === 'today' ? t('notif_today') : k === 'yesterday' ? t('notif_yesterday') : t('notif_earlier')}
                      </div>
                      <div className="space-y-3">
                        {(grouped[k] || []).map(notification => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`cursor-pointer transition-opacity ${!notification.read ? 'opacity-100' : 'opacity-75'}`}
                          >
                            <NotificationItem
                              type={notification.severity || 'info'}
                              title={notification.title}
                              message={notification.message || notification.title}
                              unread={!notification.read}
                              time={getTimeAgo(notification.timestamp || notification.createdAt)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanelState
                  icon={<InfoIcon />}
                  title={t('no_notifications')}
                  description={t('all_caught_up')}
                />
              )}
            </>
          )}
        </AppSurface>
      </aside>
    </>
  )
}

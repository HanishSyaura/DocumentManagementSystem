import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../contexts/NotificationContext'
import { usePreferences } from '../contexts/PreferencesContext'

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

// Quick Access icon components
const PlusIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

function NotificationItem({ type = 'info', message, time }) {
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
        <p className="text-sm font-medium leading-snug">{message}</p>
        <p className="text-xs mt-1 opacity-75">{time}</p>
      </div>
    </div>
  )
}

function QuickAccessButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
    >
      <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
        <Icon />
      </div>
      <span className="text-xs font-medium text-gray-700 mt-2 text-center leading-tight">
        {label}
      </span>
    </button>
  )
}

export default function RightPanel({ onCollapseChange, isCollapsed = false }) {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(isCollapsed)
  const [isNotificationsCollapsed, setIsNotificationsCollapsed] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications()
  const { t } = usePreferences()

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

  return (
    <>
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
        className="fixed right-0 top-20 bg-white shadow-lg rounded-l-lg p-2 z-30 hover:bg-gray-50 transition-colors"
        style={{ transform: isPanelCollapsed ? 'translateX(0)' : 'translateX(-320px)' }}
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      <aside className={`app-rightpanel w-80 p-4 h-full overflow-y-auto transition-transform duration-300 ${isPanelCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
        {/* System Notifications */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            {t('system_notifications')}
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {notifications.length}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('clear_all')}
              </button>
            )}
            <button 
              onClick={() => setIsNotificationsCollapsed(!isNotificationsCollapsed)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5 transition-transform" style={{ transform: isNotificationsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {!isNotificationsCollapsed && (
          <>
            <p className="text-xs text-gray-500 mb-3">{t('important_alerts')}</p>
            
            {notifications.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`cursor-pointer ${!notification.read ? 'opacity-100' : 'opacity-60'}`}
                  >
                    <NotificationItem
                      type={notification.severity || 'info'}
                      message={notification.message || notification.title}
                      time={getTimeAgo(notification.timestamp || notification.createdAt)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-gray-500 font-medium">{t('no_notifications')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('all_caught_up')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
    </>
  )
}

import React, { useState, Component } from 'react'
import { usePreferences } from '../contexts/PreferencesContext'
import AuditLogsViewer from '../components/AuditLogsViewer'
import UserActivityLogs from '../components/UserActivityLogs'
import SystemReports from '../components/SystemReports'
import AnalyticsDashboard from '../components/AnalyticsDashboard'

// Error Fallback with translations
function ErrorDisplay({ error, onRetry }) {
  const { t } = usePreferences()
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
      <h3 className="text-lg font-semibold text-red-800 mb-2">{t('lr_error_title')}</h3>
      <p className="text-red-600 text-sm mb-4">{error?.message || 'Unknown error'}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        {t('lr_try_again')}
      </button>
    </div>
  )
}

// Error Boundary for catching render errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('LogsReports Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }
    return this.props.children
  }
}

// Tab Navigation Component
function TabNavigation({ activeTab, onTabChange }) {
  const { t } = usePreferences()
  const tabs = [
    { id: 'activity', label: t('lr_activity_logs') },
    { id: 'users', label: t('lr_user_activity') },
    { id: 'reports', label: t('lr_system_reports') },
    { id: 'analytics', label: t('lr_analytics') }
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

// Main Logs & Reports Page Component
export default function LogsReports() {
  const [activeTab, setActiveTab] = useState('activity')
  const { t } = usePreferences()

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('lr_title')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('lr_desc')}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        <ErrorBoundary>
          {activeTab === 'activity' && <AuditLogsViewer />}
          {activeTab === 'users' && <UserActivityLogs />}
          {activeTab === 'reports' && <SystemReports />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
        </ErrorBoundary>
      </div>
    </div>
  )
}

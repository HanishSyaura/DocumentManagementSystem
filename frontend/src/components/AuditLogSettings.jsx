import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { usePreferences } from '../contexts/PreferencesContext'

// Main Component
export default function AuditLogSettings() {
  const { t } = usePreferences()
  const [settings, setSettings] = useState({
    retentionDays: 90,
    autoArchiveDays: 365,
    permanentRetention: false,
    trackAuth: true,
    trackDocuments: true,
    trackConfig: true,
    trackUsers: true,
    trackDownloads: true,
    trackPermissions: true,
    trackFailures: true,
    alertFailedLogins: true,
    alertUnauthorized: true,
    alertBulkExports: true,
    alertConfigChanges: true
  })
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get('/audit/settings')
      setSettings(res.data.settings || settings)
    } catch (error) {
      console.error('Failed to load audit settings:', error)
      // Use default settings if load fails
    }
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/audit/settings', settings)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save audit settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    loadSettings()
    setSaveSuccess(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('als_title')}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('als_desc')}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">{t('als_view_activity')}</p>
          <p className="text-xs text-blue-700 mt-1">{t('als_view_activity_desc')}</p>
        </div>
      </div>
      {/* Log Retention Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>⏱️</span>
          <span>{t('als_retention_period')}</span>
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('als_keep_logs')}
            </label>
            <input
              type="number"
              min="1"
              value={settings.retentionDays}
              onChange={(e) => handleChange('retentionDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">{t('als_auto_delete')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('als_auto_archive')}
            </label>
            <input
              type="number"
              min="1"
              value={settings.autoArchiveDays}
              onChange={(e) => handleChange('autoArchiveDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">{t('als_move_archive')}</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="permanentRetention"
              checked={settings.permanentRetention}
              onChange={(e) => handleChange('permanentRetention', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="permanentRetention" className="ml-2 text-sm text-gray-700">
              {t('als_permanent_retention')}
            </label>
          </div>
        </div>
      </div>

      {/* Events to Track */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎯</span>
          <span>{t('als_events_track')}</span>
        </h3>
        <div className="space-y-3">
          {[
            { id: 'trackAuth', label: t('als_track_auth') },
            { id: 'trackDocuments', label: t('als_track_docs') },
            { id: 'trackConfig', label: t('als_track_config') },
            { id: 'trackUsers', label: t('als_track_users') },
            { id: 'trackDownloads', label: t('als_track_downloads') },
            { id: 'trackPermissions', label: t('als_track_permissions') },
            { id: 'trackFailures', label: t('als_track_failures') }
          ].map((event) => (
            <div key={event.id} className="flex items-center">
              <input
                type="checkbox"
                id={event.id}
                checked={settings[event.id]}
                onChange={(e) => handleChange(event.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={event.id} className="ml-2 text-sm text-gray-700">
                {event.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security Alerts */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🔔</span>
          <span>{t('als_security_alerts')}</span>
        </h3>
        <div className="space-y-3">
          {[
            { id: 'alertFailedLogins', label: t('als_alert_failed') },
            { id: 'alertUnauthorized', label: t('als_alert_unauthorized') },
            { id: 'alertBulkExports', label: t('als_alert_bulk') },
            { id: 'alertConfigChanges', label: t('als_alert_config') }
          ].map((alert) => (
            <div key={alert.id} className="flex items-center">
              <input
                type="checkbox"
                id={alert.id}
                checked={settings[alert.id]}
                onChange={(e) => handleChange(alert.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={alert.id} className="ml-2 text-sm text-gray-700">
                {alert.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('saving') : t('als_save_settings')}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          {t('als_reset_defaults')}
        </button>
        {saveSuccess && (
          <span className="text-green-600 text-sm font-medium flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('als_saved_success')}
          </span>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useNotifications } from '../contexts/NotificationContext'

export default function NotificationPreferences() {
  const { preferences: contextPreferences, updatePreferences, loading } = useNotifications()
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (contextPreferences) {
      setSettings(contextPreferences)
    }
  }, [contextPreferences])

  const handleSave = async () => {
    setSaving(true)
    setSuccessMessage('')
    try {
      await updatePreferences(settings)
      setSuccessMessage('Notification preferences saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      alert('Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  const NotificationCategory = ({ title, description, items }) => (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NotificationToggle
            key={item.key}
            label={item.label}
            description={item.description}
            emailChecked={settings?.emailNotifications[item.key] ?? true}
            inAppChecked={settings?.inAppNotifications[item.key] ?? true}
            onEmailChange={(e) => setSettings({
              ...settings,
              emailNotifications: { ...settings.emailNotifications, [item.key]: e.target.checked }
            })}
            onInAppChange={(e) => setSettings({
              ...settings,
              inAppNotifications: { ...settings.inAppNotifications, [item.key]: e.target.checked }
            })}
          />
        ))}
      </div>
    </div>
  )

  const NotificationToggle = ({ label, description, emailChecked, inAppChecked, onEmailChange, onInAppChange }) => (
    <div className="py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-3 -mx-3 rounded transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex gap-6 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={emailChecked}
            onChange={onEmailChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">📧 Email</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inAppChecked}
            onChange={onInAppChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">🔔 In-App</span>
        </label>
      </div>
    </div>
  )

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const documentNotifications = [
    { key: 'documentAssigned', label: 'Document Assigned', description: 'When a document is assigned to you' },
    { key: 'statusChanged', label: 'Status Changed', description: 'When document status changes (draft → review → published)' },
    { key: 'versionUpdate', label: 'New Version', description: 'When a new version of a document is published' },
    { key: 'documentUploaded', label: 'Document Uploaded', description: 'When a new document is uploaded to the system' },
    { key: 'documentDownloaded', label: 'Document Downloaded', description: 'When someone downloads your document' },
    { key: 'documentDeleted', label: 'Document Deleted', description: 'When a document is deleted or archived' },
    { key: 'documentShared', label: 'Document Shared', description: 'When a document is shared with you' }
  ]

  const reviewNotifications = [
    { key: 'reviewRequired', label: 'Review Required', description: 'When your review is required on a document' },
    { key: 'approvalRequired', label: 'Approval Required', description: 'When your approval is needed' },
    { key: 'reviewCompleted', label: 'Review Completed', description: 'When someone completes a review on your document' },
    { key: 'approvalGranted', label: 'Approval Granted', description: 'When your document is approved' },
    { key: 'approvalRejected', label: 'Approval Rejected', description: 'When your document is rejected with comments' },
    { key: 'acknowledgementRequired', label: 'Acknowledgement Required', description: 'When you need to acknowledge a published document' }
  ]

  const commentNotifications = [
    { key: 'commentAdded', label: 'New Comment', description: 'When someone comments on your document' },
    { key: 'mentionInComment', label: 'Mentioned in Comment', description: 'When someone mentions you (@username) in a comment' },
    { key: 'commentReply', label: 'Comment Reply', description: 'When someone replies to your comment' }
  ]

  const workflowNotifications = [
    { key: 'workflowAssigned', label: 'Workflow Assigned', description: 'When a workflow task is assigned to you' },
    { key: 'workflowCompleted', label: 'Workflow Completed', description: 'When a workflow you initiated is completed' },
    { key: 'workflowDelayed', label: 'Workflow Delayed', description: 'When a workflow is experiencing delays' },
    { key: 'taskAssigned', label: 'Task Assigned', description: 'When a specific task is assigned to you' },
    { key: 'taskDueSoon', label: 'Task Due Soon', description: 'Reminder when a task is due within 24 hours' },
    { key: 'taskOverdue', label: 'Task Overdue', description: 'When a task assigned to you is overdue' }
  ]

  const systemNotifications = [
    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications and updates' },
    { key: 'systemMaintenance', label: 'System Maintenance', description: 'Scheduled maintenance and downtime notifications' },
    { key: 'storageWarning', label: 'Storage Warning', description: 'When storage quota is running low' },
    { key: 'securityAlert', label: 'Security Alert', description: 'Suspicious activity or security-related notifications' },
    { key: 'passwordExpiry', label: 'Password Expiry', description: 'Reminder when your password is about to expire' }
  ]

  const teamNotifications = [
    { key: 'teamInvitation', label: 'Team Invitation', description: "When you're invited to join a team or project" },
    { key: 'userAdded', label: 'User Added', description: 'When a new user joins your team' },
    { key: 'permissionChanged', label: 'Permission Changed', description: 'When your permissions are updated' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
        <p className="text-sm text-gray-600">
          Customize how you want to be notified about activities in the document management system.
          You can choose to receive notifications via email, in-app notifications, or both.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="card p-4 bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const allEnabled = { ...settings.emailNotifications }
              Object.keys(allEnabled).forEach(key => allEnabled[key] = true)
              setSettings({ ...settings, emailNotifications: allEnabled })
            }}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Enable All Email
          </button>
          <button
            onClick={() => {
              const allDisabled = { ...settings.emailNotifications }
              Object.keys(allDisabled).forEach(key => allDisabled[key] = false)
              setSettings({ ...settings, emailNotifications: allDisabled })
            }}
            className="px-4 py-2 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Disable All Email
          </button>
          <button
            onClick={() => {
              const allEnabled = { ...settings.inAppNotifications }
              Object.keys(allEnabled).forEach(key => allEnabled[key] = true)
              setSettings({ ...settings, inAppNotifications: allEnabled })
            }}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Enable All In-App
          </button>
          <button
            onClick={() => {
              const allDisabled = { ...settings.inAppNotifications }
              Object.keys(allDisabled).forEach(key => allDisabled[key] = false)
              setSettings({ ...settings, inAppNotifications: allDisabled })
            }}
            className="px-4 py-2 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Disable All In-App
          </button>
        </div>
      </div>

      {/* Categories */}
      <NotificationCategory
        title="📄 Document Events"
        description="Notifications related to document creation, updates, and lifecycle changes"
        items={documentNotifications}
      />

      <NotificationCategory
        title="✅ Review & Approval"
        description="Notifications for review and approval processes"
        items={reviewNotifications}
      />

      <NotificationCategory
        title="💬 Comments & Mentions"
        description="Notifications for comments and when you're mentioned"
        items={commentNotifications}
      />

      <NotificationCategory
        title="🔄 Workflow & Tasks"
        description="Notifications for workflow assignments and task management"
        items={workflowNotifications}
      />

      <NotificationCategory
        title="⚙️ System & Security"
        description="System alerts, maintenance, and security notifications"
        items={systemNotifications}
      />

      <NotificationCategory
        title="👥 Team & Collaboration"
        description="Notifications for team activities and permission changes"
        items={teamNotifications}
      />

      {/* Email Digest Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Digest</h3>
        <p className="text-sm text-gray-600 mb-4">
          Receive a summary of your notifications in a single email instead of individual emails for each event.
        </p>
        <select
          value={settings.digestFrequency}
          onChange={(e) => setSettings({ ...settings, digestFrequency: e.target.value })}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="realtime">Real-time (No digest - send immediately)</option>
          <option value="hourly">Hourly Digest</option>
          <option value="daily">Daily Digest (Morning)</option>
          <option value="weekly">Weekly Digest (Monday Morning)</option>
        </select>
      </div>

      {/* Quiet Hours */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quiet Hours</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pause non-urgent notifications during specific hours. Urgent notifications will still be delivered.
        </p>
        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={settings.quietHours?.enabled ?? false}
            onChange={(e) => setSettings({
              ...settings,
              quietHours: { ...settings.quietHours, enabled: e.target.checked }
            })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 font-medium">Enable Quiet Hours</span>
        </label>
        
        {settings.quietHours?.enabled && (
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={settings.quietHours?.start || '22:00'}
                onChange={(e) => setSettings({
                  ...settings,
                  quietHours: { ...settings.quietHours, start: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={settings.quietHours?.end || '08:00'}
                onChange={(e) => setSettings({
                  ...settings,
                  quietHours: { ...settings.quietHours, end: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setSettings(contextPreferences)}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Reset Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

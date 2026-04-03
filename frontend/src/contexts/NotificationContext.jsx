import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const NotificationContext = createContext()

// Create a silent API instance that doesn't log 404 errors (for optional backend sync)
const silentApi = api

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Notification types mapped to preference keys
export const NOTIFICATION_TYPES = {
  // Document-related
  DOCUMENT_ASSIGNED: 'documentAssigned',
  DOCUMENT_STATUS_CHANGED: 'statusChanged',
  DOCUMENT_VERSION_UPDATE: 'versionUpdate',
  DOCUMENT_UPLOADED: 'documentUploaded',
  DOCUMENT_DOWNLOADED: 'documentDownloaded',
  DOCUMENT_DELETED: 'documentDeleted',
  DOCUMENT_SHARED: 'documentShared',
  
  // Review & Approval
  REVIEW_REQUIRED: 'reviewRequired',
  APPROVAL_REQUIRED: 'approvalRequired',
  REVIEW_COMPLETED: 'reviewCompleted',
  APPROVAL_GRANTED: 'approvalGranted',
  APPROVAL_REJECTED: 'approvalRejected',
  ACKNOWLEDGEMENT_REQUIRED: 'acknowledgementRequired',
  
  // Comments & Mentions
  COMMENT_ADDED: 'commentAdded',
  MENTION_IN_COMMENT: 'mentionInComment',
  COMMENT_REPLY: 'commentReply',
  
  // Workflow & Tasks
  WORKFLOW_ASSIGNED: 'workflowAssigned',
  WORKFLOW_COMPLETED: 'workflowCompleted',
  WORKFLOW_DELAYED: 'workflowDelayed',
  TASK_ASSIGNED: 'taskAssigned',
  TASK_DUE_SOON: 'taskDueSoon',
  TASK_OVERDUE: 'taskOverdue',
  
  // System & Security
  SYSTEM_ALERT: 'systemAlerts',
  SYSTEM_MAINTENANCE: 'systemMaintenance',
  STORAGE_WARNING: 'storageWarning',
  SECURITY_ALERT: 'securityAlert',
  PASSWORD_EXPIRY: 'passwordExpiry',
  
  // Team & Collaboration
  TEAM_INVITATION: 'teamInvitation',
  USER_ADDED: 'userAdded',
  PERMISSION_CHANGED: 'permissionChanged'
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)

  const hasAccessToken = () => {
    try {
      return Boolean(localStorage.getItem('token'))
    } catch {
      return false
    }
  }

  // Load user notification preferences
  const loadPreferences = useCallback(async () => {
    try {
      // Try to load from localStorage first
      const savedPreferences = localStorage.getItem('notificationPreferences')
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences))
        setLoading(false)
      }

      if (!hasAccessToken()) {
        if (!savedPreferences) {
          const defaults = getDefaultPreferences()
          setPreferences(defaults)
          localStorage.setItem('notificationPreferences', JSON.stringify(defaults))
        }
        return
      }
      
      // Backend sync enabled
      try {
        const res = await silentApi.get('/user/notification-settings')
        const serverPreferences = res.data.data?.settings || res.data.settings || getDefaultPreferences()
        setPreferences(serverPreferences)
        localStorage.setItem('notificationPreferences', JSON.stringify(serverPreferences))
      } catch (apiError) {
        // Backend not available or endpoint doesn't exist, use localStorage
        if (!savedPreferences) {
          const defaults = getDefaultPreferences()
          setPreferences(defaults)
          localStorage.setItem('notificationPreferences', JSON.stringify(defaults))
        }
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
      const defaults = getDefaultPreferences()
      setPreferences(defaults)
      localStorage.setItem('notificationPreferences', JSON.stringify(defaults))
    } finally {
      setLoading(false)
    }
  }, [])

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    try {
      if (!hasAccessToken()) {
        const savedNotifications = localStorage.getItem('notifications')
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications)
          setNotifications(parsed)
          setUnreadCount(parsed.filter(n => !n.read).length)
        } else {
          setNotifications([])
          setUnreadCount(0)
        }
        return
      }

      // Always fetch from backend first for fresh data
      const res = await silentApi.get('/notifications')
      const backendNotifications = res.data.data?.notifications || res.data.notifications || []
      
      // Map backend fields to frontend format
      const mappedNotifications = backendNotifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.isRead,
        severity: n.severity || 'info',
        timestamp: n.createdAt,
        createdAt: n.createdAt,
        metadata: n.metadata || {}
      }))
      
      setNotifications(mappedNotifications)
      setUnreadCount(mappedNotifications.filter(n => !n.read).length)
      
      // Save to localStorage as backup only
      localStorage.setItem('notifications', JSON.stringify(mappedNotifications))
    } catch (apiError) {
      // Fallback to localStorage only if backend fails
      try {
        const savedNotifications = localStorage.getItem('notifications')
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications)
          setNotifications(parsed)
          setUnreadCount(parsed.filter(n => !n.read).length)
        } else {
          setNotifications([])
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('Failed to load notifications from localStorage:', error)
        setNotifications([])
        setUnreadCount(0)
      }
    }
  }, [])

  // Initialize
  useEffect(() => {
    loadPreferences()
    loadNotifications()
    
    // Poll for new notifications every 5 seconds for faster updates
    const interval = setInterval(loadNotifications, 5000)
    
    return () => clearInterval(interval)
  }, [loadPreferences, loadNotifications])

  // Check if notification should be shown based on user preferences
  const shouldShowNotification = useCallback((type, channel = 'inApp') => {
    if (!preferences) return true // Show by default if preferences not loaded
    
    const channelKey = channel === 'email' ? 'emailNotifications' : 'inAppNotifications'
    return preferences[channelKey]?.[type] !== false
  }, [preferences])

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const { type, title, message, severity = 'info', link = null, metadata = {} } = notification
    
    // Check if this type should be shown
    if (!shouldShowNotification(type, 'inApp')) {
      console.log('Notification type disabled by user:', type)
      return
    }

    const newNotification = {
      id: Date.now() + Math.random(),
      type,
      title,
      message,
      severity, // 'info', 'success', 'warning', 'error'
      link,
      metadata,
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    const updatedNotifications = [newNotification, ...notifications]
    setNotifications(updatedNotifications)
    setUnreadCount(prev => prev + 1)

    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))

    // Optionally persist to backend
    if (hasAccessToken()) {
      silentApi.post('/notifications', newNotification).catch(() => {})
    }

    return newNotification
  }, [shouldShowNotification])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    )
    setNotifications(updatedNotifications)
    setUnreadCount(prev => Math.max(0, prev - 1))

    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))

    try {
      if (hasAccessToken()) {
        await silentApi.patch(`/notifications/${notificationId}/read`)
      }
    } catch (error) {
      // Backend endpoint doesn't exist yet, already saved to localStorage
    }
  }, [notifications])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updatedNotifications)
    setUnreadCount(0)

    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))

    try {
      await silentApi.patch('/notifications/read-all')
    } catch (error) {
      // Backend endpoint doesn't exist yet, already saved to localStorage
    }
  }, [notifications])

  // Clear a notification
  const clearNotification = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    const updatedNotifications = notifications.filter(n => n.id !== notificationId)
    setNotifications(updatedNotifications)

    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))

    try {
      await silentApi.delete(`/notifications/${notificationId}`)
    } catch (error) {
      // Backend endpoint doesn't exist yet, already saved to localStorage
    }
  }, [notifications])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    setNotifications([])
    setUnreadCount(0)

    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify([]))

    try {
      await silentApi.delete('/notifications/all')
    } catch (error) {
      // Backend endpoint doesn't exist yet, already saved to localStorage
    }
  }, [])

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    setPreferences(newPreferences)
    
    // Save to localStorage immediately
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences))
    
    try {
      await silentApi.put('/user/notification-settings', newPreferences)
    } catch (error) {
      // Backend endpoint doesn't exist yet, already saved to localStorage
      console.log('Notification preferences saved to localStorage (backend not available)')
    }
  }, [])

  const value = {
    notifications,
    unreadCount,
    preferences,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    updatePreferences,
    loadNotifications,
    shouldShowNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Default notification preferences
function getDefaultPreferences() {
  return {
    emailNotifications: {
      // Document events
      documentAssigned: true,
      statusChanged: true,
      versionUpdate: false,
      documentUploaded: false,
      documentDownloaded: false,
      documentDeleted: true,
      documentShared: true,
      
      // Review & Approval
      reviewRequired: true,
      approvalRequired: true,
      reviewCompleted: true,
      approvalGranted: true,
      approvalRejected: true,
      acknowledgementRequired: true,
      
      // Comments
      commentAdded: true,
      mentionInComment: true,
      commentReply: true,
      
      // Workflow
      workflowAssigned: true,
      workflowCompleted: false,
      workflowDelayed: true,
      taskAssigned: true,
      taskDueSoon: true,
      taskOverdue: true,
      
      // System
      systemAlerts: true,
      systemMaintenance: true,
      storageWarning: true,
      securityAlert: true,
      passwordExpiry: true,
      
      // Team
      teamInvitation: true,
      userAdded: false,
      permissionChanged: true
    },
    inAppNotifications: {
      // Document events
      documentAssigned: true,
      statusChanged: true,
      versionUpdate: true,
      documentUploaded: true,
      documentDownloaded: false,
      documentDeleted: true,
      documentShared: true,
      
      // Review & Approval
      reviewRequired: true,
      approvalRequired: true,
      reviewCompleted: true,
      approvalGranted: true,
      approvalRejected: true,
      acknowledgementRequired: true,
      
      // Comments
      commentAdded: true,
      mentionInComment: true,
      commentReply: true,
      
      // Workflow
      workflowAssigned: true,
      workflowCompleted: true,
      workflowDelayed: true,
      taskAssigned: true,
      taskDueSoon: true,
      taskOverdue: true,
      
      // System
      systemAlerts: true,
      systemMaintenance: true,
      storageWarning: true,
      securityAlert: true,
      passwordExpiry: true,
      
      // Team
      teamInvitation: true,
      userAdded: true,
      permissionChanged: true
    },
    digestFrequency: 'daily', // 'realtime', 'hourly', 'daily', 'weekly'
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  }
}

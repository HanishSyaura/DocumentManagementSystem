/**
 * Shared Date Formatting Utility
 * Provides consistent date/time formatting across the application
 * Now supports user preferences for format customization
 */

/**
 * Format a date/timestamp to a standard display format
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} dateFormat - Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * @param {string} timeFormat - Time format (12h, 24h)
 * @returns {string} Formatted date string
 */
export const formatDateTime = (timestamp, dateFormat = 'DD/MM/YYYY', timeFormat = '24h') => {
  if (!timestamp) return '-'
  
  try {
    const date = new Date(timestamp)
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '-'
    
    const dateStr = formatDate(timestamp, dateFormat)
    const timeStr = formatTime(timestamp, timeFormat)
    
    return `${dateStr}, ${timeStr}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return '-'
  }
}

/**
 * Format a date to date-only format
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} format - Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, format = 'DD/MM/YYYY') => {
  if (!timestamp) return '-'
  
  try {
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) return '-'
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`
      case 'DD/MM/YYYY':
      default:
        return `${day}/${month}/${year}`
    }
  } catch (error) {
    console.error('Error formatting date:', error)
    return '-'
  }
}

/**
 * Format a date to time-only format
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} format - Time format (12h, 24h)
 * @returns {string} Formatted time string
 */
export const formatTime = (timestamp, format = '24h') => {
  if (!timestamp) return '-'
  
  try {
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) return '-'
    
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    if (format === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM'
      const hours12 = hours % 12 || 12
      return `${hours12}:${minutes}:${seconds} ${period}`
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return '-'
  }
}

/**
 * Format a date for display in relative terms (e.g., "2 hours ago")
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} dateFormat - Date format for fallback
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp, dateFormat = 'DD/MM/YYYY') => {
  if (!timestamp) return '-'
  
  try {
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) return '-'
    
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    
    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
    
    return formatDate(timestamp, dateFormat)
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return '-'
  }
}

/**
 * Format duration in a human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string (e.g., "2h 30m")
 */
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '-'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

export default {
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatDuration
}

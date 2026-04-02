/**
 * User Data Events Utility
 * Dispatches custom events when user data changes
 */

/**
 * Dispatch event to notify components that user data has changed
 * Use this whenever you update localStorage user data
 */
export const notifyUserDataChanged = () => {
  const event = new CustomEvent('userDataChanged', {
    detail: { timestamp: Date.now() }
  })
  window.dispatchEvent(event)
  console.log('User data change event dispatched')
}

/**
 * Update user data in localStorage and notify listeners
 * @param {Object} userData - User data object
 */
export const updateUserData = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData))
  notifyUserDataChanged()
}

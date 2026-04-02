import React from 'react'
import { Navigate } from 'react-router-dom'
import { hasPermission, hasAnyPermission } from '../utils/permissions'
import { getDefaultRoute } from '../utils/defaultRoute'

/**
 * Protected route that checks both authentication and permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string} props.module - Required module permission (e.g., 'dashboard', 'documents.draft')
 * @param {string} props.action - Required action permission (e.g., 'view', 'create')
 * @param {boolean} props.requireAny - If true, only requires ANY permission for the module
 * @param {string} props.redirectTo - Where to redirect if unauthorized (default: '/')
 */
export default function ProtectedRoute({ 
  children, 
  module = null, 
  action = 'view',
  requireAny = false,
  redirectTo = null
}) {
  const token = localStorage.getItem('token')
  
  // First check: Is user logged in?
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Second check: Does user have required permissions?
  if (module) {
    const hasAccess = requireAny 
      ? hasAnyPermission(module)
      : hasPermission(module, action)

    // Debug logging
    console.log(`ProtectedRoute check: module="${module}", action="${action}", requireAny=${requireAny}, hasAccess=${hasAccess}`)

    if (!hasAccess) {
      // If no redirectTo specified, use user's default accessible route
      const targetRoute = redirectTo || getDefaultRoute()
      
      console.warn(`Access denied to ${module}.${action}. Redirecting to ${targetRoute}`)
      
      // Prevent redirect loop - if we're being redirected to the same route, show error instead
      if (window.location.pathname === targetRoute) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className="text-gray-700 mb-4">
                You do not have permission to access this page.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Required: <code className="bg-gray-100 px-2 py-1 rounded">{module}.{action}</code>
              </p>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Back to Login
              </button>
            </div>
          </div>
        )
      }
      
      return <Navigate to={targetRoute} replace />
    }
  }

  return children
}

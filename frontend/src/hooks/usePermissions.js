import { useMemo } from 'react'
import { 
  getUserPermissions, 
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasRole as checkRole,
  isAdmin as checkIsAdmin,
  getUserRoles
} from '../utils/permissions'

/**
 * Hook to access user permissions
 */
export const usePermissions = () => {
  const permissions = useMemo(() => getUserPermissions(), [])
  const roles = useMemo(() => getUserRoles(), [])

  const hasPermission = useMemo(() => 
    (module, action) => checkPermission(module, action),
    []
  )

  const hasAnyPermission = useMemo(() =>
    (module) => checkAnyPermission(module),
    []
  )

  const hasRole = useMemo(() =>
    (roleName) => checkRole(roleName),
    []
  )

  const isAdmin = useMemo(() => checkIsAdmin(), [])

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin
  }
}

/**
 * Hook to check specific permission
 * @param {string} module 
 * @param {string} action 
 * @returns {boolean}
 */
export const useHasPermission = (module, action) => {
  return useMemo(() => checkPermission(module, action), [module, action])
}

/**
 * Hook to check if user has any permission for a module
 * @param {string} module 
 * @returns {boolean}
 */
export const useHasAnyPermission = (module) => {
  return useMemo(() => checkAnyPermission(module), [module])
}

/**
 * Hook to check if user has a role
 * @param {string} roleName 
 * @returns {boolean}
 */
export const useHasRole = (roleName) => {
  return useMemo(() => checkRole(roleName), [roleName])
}

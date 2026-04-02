import React from 'react'
import { hasPermission, hasAnyPermission, hasRole, isAdmin } from '../utils/permissions'

/**
 * Component that conditionally renders children based on permissions
 * 
 * Usage:
 * <PermissionGate module="dashboard" action="view">
 *   <DashboardComponent />
 * </PermissionGate>
 */
export const PermissionGate = ({ module, action, children, fallback = null }) => {
  const permitted = hasPermission(module, action)
  
  if (!permitted) {
    return fallback
  }

  return <>{children}</>
}

/**
 * Component that renders if user has ANY permission for a module
 * 
 * Usage:
 * <AnyPermissionGate module="documents.draft">
 *   <DraftDocumentsLink />
 * </AnyPermissionGate>
 */
export const AnyPermissionGate = ({ module, children, fallback = null }) => {
  const permitted = hasAnyPermission(module)
  
  if (!permitted) {
    return fallback
  }

  return <>{children}</>
}

/**
 * Component that renders if user has a specific role
 * 
 * Usage:
 * <RoleGate role="Administrator">
 *   <AdminPanel />
 * </RoleGate>
 */
export const RoleGate = ({ role, children, fallback = null }) => {
  const hasRequiredRole = hasRole(role)
  
  if (!hasRequiredRole) {
    return fallback
  }

  return <>{children}</>
}

/**
 * Component that renders only for admins
 * 
 * Usage:
 * <AdminGate>
 *   <AdminSettings />
 * </AdminGate>
 */
export const AdminGate = ({ children, fallback = null }) => {
  const isAdminUser = isAdmin()
  
  if (!isAdminUser) {
    return fallback
  }

  return <>{children}</>
}

/**
 * Component that renders if user has ANY of the specified permissions
 * 
 * Usage:
 * <AnyOfPermissionsGate permissions={[
 *   { module: 'documents.draft', action: 'create' },
 *   { module: 'documents.draft', action: 'edit' }
 * ]}>
 *   <CreateOrEditButton />
 * </AnyOfPermissionsGate>
 */
export const AnyOfPermissionsGate = ({ permissions, children, fallback = null }) => {
  const hasAny = permissions.some(({ module, action }) => 
    hasPermission(module, action)
  )
  
  if (!hasAny) {
    return fallback
  }

  return <>{children}</>
}

/**
 * Component that renders if user has ALL of the specified permissions
 * 
 * Usage:
 * <AllPermissionsGate permissions={[
 *   { module: 'documents.draft', action: 'view' },
 *   { module: 'documents.draft', action: 'edit' }
 * ]}>
 *   <AdvancedEditButton />
 * </AllPermissionsGate>
 */
export const AllPermissionsGate = ({ permissions, children, fallback = null }) => {
  const hasAll = permissions.every(({ module, action }) => 
    hasPermission(module, action)
  )
  
  if (!hasAll) {
    return fallback
  }

  return <>{children}</>
}

export default PermissionGate

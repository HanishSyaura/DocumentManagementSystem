# Smart Login Redirect Implementation

## Overview
The DMS now intelligently redirects users to the first page they have permission to access, rather than always redirecting to the dashboard.

## Problem Solved
Previously, when a user logged in, they were always redirected to "/" (dashboard). If the user didn't have dashboard permissions, they would see a blank page or access denied error.

## Solution
Implemented a smart redirect system that:
1. Checks user's permissions after login
2. Redirects to the first accessible route in priority order
3. Prevents redirect loops
4. Shows clear "Access Denied" message if stuck

## Files Created/Modified

### New Files
1. **`frontend/src/utils/defaultRoute.js`** (61 lines)
   - `getDefaultRoute()` - Finds first accessible route for user
   - `canAccessDashboard()` - Checks if user can access dashboard
   - `ROUTE_PRIORITY` - Ordered list of routes to check

### Modified Files
1. **`frontend/src/components/Login.jsx`**
   - Line 4: Import `getDefaultRoute`
   - Lines 30-33: Use `getDefaultRoute()` instead of hardcoded `'/'`
   - Now redirects to first accessible route after login

2. **`frontend/src/components/ProtectedRoute.jsx`**
   - Line 4: Import `getDefaultRoute`
   - Line 21: Changed default `redirectTo` from `'/'` to `null`
   - Lines 40-43: Use `getDefaultRoute()` if no `redirectTo` specified
   - Lines 45-62: Prevent redirect loops with error page
   - Added debug console logging

3. **`frontend/src/App.jsx`**
   - Line 98: Removed hardcoded `redirectTo="/"` from config route
   - Re-enabled SessionProvider

## Route Priority Order

When a user logs in, the system checks these routes in order:

1. **Dashboard** (`/`) - `dashboard` module
2. **New Document Request** (`/new-document-request`) - `newDocumentRequest` module
3. **My Documents Status** (`/my-documents`) - `myDocumentsStatus` module
4. **Drafts** (`/drafts`) - `documents.draft` module
5. **Review & Approval** (`/review-approval`) - `documents.review` module
6. **Published Documents** (`/published`) - `documents.published` module
7. **Archived** (`/archived`) - `documents.superseded` module
8. **Configuration** (`/config`) - `configuration.roles` module
9. **Logs & Reports** (`/logs`) - `logsReport.activityLogs` module
10. **Master Record** (`/master-record`) - `masterRecord` module
11. **Profile Settings** (`/profile`) - `profileSettings` module (fallback)

The user is redirected to the **first route** in this list that they have ANY permission for.

## How It Works

### Login Flow
```
User enters credentials
  ↓
Login API call
  ↓
Store token + user data (with permissions)
  ↓
Call getDefaultRoute()
  ↓
Check ROUTE_PRIORITY in order
  ↓
Find first route with hasAnyPermission()
  ↓
Redirect user to that route
```

### Permission Check Flow
```
User navigates to protected route
  ↓
ProtectedRoute checks token
  ↓
ProtectedRoute checks module permissions
  ↓
If has access → Show page
If no access → Redirect to getDefaultRoute()
```

### Redirect Loop Prevention
```
User denied access to route
  ↓
Calculate targetRoute = redirectTo || getDefaultRoute()
  ↓
If targetRoute === current route → Show "Access Denied" page
If targetRoute !== current route → Redirect to targetRoute
```

## Example Scenarios

### Scenario 1: Admin User
- **Permissions**: All modules
- **Login redirect**: `/` (Dashboard)
- **Reason**: Dashboard is first in priority list

### Scenario 2: Document Creator
- **Permissions**: `newDocumentRequest`, `myDocumentsStatus`, `documents.draft`
- **Dashboard permission**: ❌ No
- **Login redirect**: `/new-document-request`
- **Reason**: First accessible route in priority list

### Scenario 3: Reviewer Only
- **Permissions**: `documents.review`, `documents.published`
- **Dashboard permission**: ❌ No
- **Login redirect**: `/review-approval`
- **Reason**: First accessible route in priority list

### Scenario 4: No Permissions
- **Permissions**: None (empty)
- **Login redirect**: `/profile`
- **Reason**: Fallback route - every user can access their profile

### Scenario 5: User Tries Accessing Forbidden Route
- **User at**: `/drafts`
- **Permission**: ❌ No access to `documents.draft`
- **Action**: Redirect to their default route (e.g., `/my-documents`)

### Scenario 6: Redirect Loop Detected
- **User at**: `/`
- **Permission**: ❌ No access to `dashboard`
- **Default route**: `/` (user only has dashboard in list but no permission)
- **Action**: Show "Access Denied" error page with "Back to Login" button

## Debug Console Output

When testing, check the browser console for:

```javascript
// On login
Getting default route for user with permissions: {...}
Default route determined: /drafts (module: documents.draft)
Redirecting user to: /drafts

// On protected route access
ProtectedRoute check: module="dashboard", action="view", requireAny=false, hasAccess=false
Access denied to dashboard.view. Redirecting to /drafts
```

## Benefits

1. **Better UX**: Users land on a page they can actually use
2. **No Blank Pages**: No more confusion from access denied on login
3. **Role-Based Landing**: Different roles see different first pages
4. **Failsafe**: Always has fallback to profile page
5. **Loop Prevention**: Detects and prevents infinite redirects
6. **Debug Friendly**: Console logs help troubleshoot permission issues

## Testing

### Test Case 1: Admin Login
1. Login as admin (has all permissions)
2. Should redirect to `/` (Dashboard)
3. Console: "Default route determined: / (module: dashboard)"

### Test Case 2: Limited User Login
1. Remove dashboard view permission from a user's role
2. Login as that user
3. Should redirect to next accessible route (e.g., `/new-document-request`)
4. Console: "Default route determined: /new-document-request (module: newDocumentRequest)"

### Test Case 3: Manual Navigation to Forbidden Route
1. Login as user without dashboard permission
2. Manually type `/` in browser URL
3. Should automatically redirect to user's default route
4. Console: "Access denied to dashboard.view. Redirecting to /drafts"

### Test Case 4: User with No Permissions
1. Create user with no role assignments
2. Login as that user
3. Should redirect to `/profile`
4. Console: "User has no permissions, defaulting to /profile"

## Customization

### Change Route Priority
Edit `ROUTE_PRIORITY` array in `frontend/src/utils/defaultRoute.js`:

```javascript
const ROUTE_PRIORITY = [
  { path: '/my-custom-page', module: 'customModule' },  // Add new routes
  { path: '/', module: 'dashboard' },
  // ... rest of routes
]
```

### Change Fallback Route
Modify the fallback in `getDefaultRoute()`:

```javascript
// Current fallback
console.warn('No accessible routes found, defaulting to /profile')
return '/profile'

// Change to custom fallback
console.warn('No accessible routes found, defaulting to /help')
return '/help'
```

### Add Custom Redirect Logic
Extend `getDefaultRoute()` with custom logic:

```javascript
export const getDefaultRoute = () => {
  const permissions = getUserPermissions()
  const user = JSON.parse(localStorage.getItem('user'))
  
  // Custom logic: VIP users always go to dashboard
  if (user.isVIP) {
    return '/'
  }
  
  // Custom logic: New users go to onboarding
  if (user.isNewUser) {
    return '/onboarding'
  }
  
  // Standard priority logic
  for (const route of ROUTE_PRIORITY) {
    if (hasAnyPermission(route.module)) {
      return route.path
    }
  }
  
  return '/profile'
}
```

## Integration with Session Management

The smart redirect works seamlessly with the session management system:

1. User logs in → Redirected to first accessible route
2. Session timeout warning appears → User clicks "Stay Logged In"
3. HMR update → User logged out → Must login again → Redirected to accessible route
4. User manually navigates to forbidden route → Redirected to accessible route

## Summary

✅ Users always land on a page they can access
✅ No more blank pages or access denied errors on login
✅ Role-based landing pages
✅ Redirect loop prevention
✅ Debug logging for troubleshooting
✅ Fully integrated with permission system
✅ Works with session management
✅ Easy to customize and extend

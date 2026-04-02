# Debug User Permissions

## How to check current permissions in browser

Open your browser's Developer Console (F12) and run these commands:

### 1. Check raw user data in localStorage
```javascript
JSON.parse(localStorage.getItem('user'))
```

### 2. Check processed permissions
```javascript
const user = JSON.parse(localStorage.getItem('user'))
const permissions = user.roles[0].role.permissions
console.log('Raw permissions:', permissions)
console.log('Parsed:', typeof permissions === 'string' ? JSON.parse(permissions) : permissions)
```

### 3. Check specific permission
```javascript
// Check if documents.published.create exists
const user = JSON.parse(localStorage.getItem('user'))
const perms = typeof user.roles[0].role.permissions === 'string' 
  ? JSON.parse(user.roles[0].role.permissions) 
  : user.roles[0].role.permissions
console.log('documents.published permissions:', perms['documents.published'])
```

## Solution: Force Logout and Re-login

After updating permissions in the database, the user MUST log out and log back in for the new permissions to take effect.

The permissions are loaded during login and stored in localStorage. Updating permissions in the database does NOT automatically update the user's active session.

### To fix immediately:
1. Click the user avatar in top right
2. Click "Logout"
3. Log back in with same credentials
4. The new permissions will be loaded

## Alternative: Clear localStorage manually

In browser console:
```javascript
localStorage.removeItem('user')
localStorage.removeItem('token')
location.reload()
```

Then log back in.

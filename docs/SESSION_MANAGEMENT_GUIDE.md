# Session Management Implementation Guide

## Overview
The DMS now includes comprehensive session management with automatic logout on idle, absolute timeout, and HMR-based logout during development.

## Features Implemented

### 1. Idle Timeout
- **Duration**: 30 minutes of inactivity
- **Behavior**: User is logged out after 30 minutes without any mouse/keyboard/touch activity
- **Warning**: 2-minute warning before logout

### 2. Absolute Timeout
- **Duration**: 8 hours maximum session
- **Behavior**: User is logged out after 8 hours regardless of activity
- **Warning**: 2-minute warning before logout

### 3. HMR Auto-Logout (Development Only)
- **Trigger**: When Vite HMR detects code changes
- **Behavior**: User is immediately logged out and redirected to login page
- **Message**: "Application has been updated. Please login again."
- **Purpose**: Ensures fresh authentication state after code changes

### 4. Session Warning Modal
- **Appearance**: 2 minutes before timeout
- **Display**: Large countdown timer showing MM:SS
- **Actions**:
  - "Stay Logged In" - Extends session by resetting timers
  - "Logout Now" - Immediately logs out user

## Files Created/Modified

### New Files
1. **`frontend/src/utils/sessionManager.js`** (200 lines)
   - Core session management logic
   - Activity tracking
   - Timeout calculation
   - HMR detection
   - Singleton pattern

2. **`frontend/src/components/SessionProvider.jsx`** (171 lines)
   - React wrapper for session manager
   - Warning modal component
   - Navigation integration
   - Countdown timer UI

### Modified Files
1. **`frontend/src/App.jsx`**
   - Wrapped entire app with `<SessionProvider>`
   - Lines 17, 21, 137

## Configuration

All timeouts are configured in `frontend/src/utils/sessionManager.js`:

```javascript
const SESSION_CONFIG = {
  IDLE_TIMEOUT: 30 * 60 * 1000,           // 30 minutes
  ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000,   // 8 hours
  WARNING_BEFORE_TIMEOUT: 2 * 60 * 1000,  // 2 minutes
  CHECK_INTERVAL: 60 * 1000                // Check every 1 minute
}
```

To change timeouts, modify these values (in milliseconds).

## How It Works

### 1. Session Initialization
- When user logs in, `sessionStartTime` and `lastActivityTime` are stored in localStorage
- Activity listeners are attached to track user interactions
- Timeout check runs every minute

### 2. Activity Tracking
Monitors these events:
- `mousedown` - Mouse clicks
- `keydown` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch interactions
- `click` - Click events

Each activity updates `lastActivityTime`.

### 3. Timeout Detection
Every minute, the system checks:
1. **Idle time** = Current time - Last activity time
2. **Session duration** = Current time - Session start time
3. If either exceeds limit minus warning time → Show warning modal
4. If either exceeds limit → Automatic logout

### 4. Warning Modal
- Shows countdown timer
- Updates every second
- Two actions:
  - **Stay Logged In**: Calls `sessionManager.extendSession()` which resets both timers
  - **Logout Now**: Immediately calls logout function

### 5. HMR Detection (Development)
- Uses Vite's `import.meta.hot` API
- On HMR update, stores flag in sessionStorage
- On next check, detects flag and logs out user
- Prevents stale authentication state

## Testing

### Test Idle Timeout
1. Login to the application
2. **Reduce timeout temporarily** in `sessionManager.js`:
   ```javascript
   IDLE_TIMEOUT: 3 * 60 * 1000,  // 3 minutes for testing
   WARNING_BEFORE_TIMEOUT: 30 * 1000,  // 30 seconds warning
   ```
3. Wait 2.5 minutes without touching mouse/keyboard
4. Warning modal should appear at 2:30
5. Wait 30 more seconds → Automatic logout

### Test Absolute Timeout
1. Login to the application
2. **Reduce timeout temporarily**:
   ```javascript
   ABSOLUTE_TIMEOUT: 5 * 60 * 1000,  // 5 minutes for testing
   WARNING_BEFORE_TIMEOUT: 30 * 1000,
   ```
3. Keep using the app actively for 4.5 minutes
4. Warning modal should appear at 4:30
5. Even with continued activity, logout occurs at 5:00

### Test HMR Auto-Logout
1. Login to the application
2. Make any code change in frontend (e.g., add a comment)
3. Save the file (triggers HMR)
4. Should immediately redirect to login page with message

### Test Stay Logged In
1. Trigger warning modal (idle or absolute)
2. Click "Stay Logged In" button
3. Modal disappears
4. Timers are reset
5. Continue using app normally

### Test Logout Now
1. Trigger warning modal
2. Click "Logout Now" button
3. Immediately redirects to login page
4. Token removed from localStorage

## User Experience Flow

### Normal Usage
```
User logs in
  ↓
Uses app actively
  ↓
No timeouts triggered
  ↓
Continues working
```

### Idle Timeout Flow
```
User logs in
  ↓
Uses app
  ↓
Stops activity for 28 minutes
  ↓
⚠️ Warning appears: "2:00 remaining"
  ↓
Option 1: Clicks "Stay Logged In" → Continue
Option 2: Clicks "Logout Now" → Logout
Option 3: Ignores warning → Auto-logout at 0:00
```

### HMR Flow (Development)
```
Developer logs in
  ↓
Makes code changes
  ↓
Saves file (HMR triggered)
  ↓
🔄 Immediately logged out
  ↓
Message: "Application has been updated"
  ↓
Must login again with fresh state
```

## Security Benefits

1. **Idle Protection**: Prevents unauthorized access when user walks away
2. **Session Limit**: Prevents indefinite sessions that could be hijacked
3. **Fresh Auth State**: HMR logout ensures authentication is always current with code
4. **User Control**: Warning gives user chance to extend session
5. **Clear Feedback**: Modal clearly communicates timeout reason

## Customization

### Change Timeout Durations
Edit `SESSION_CONFIG` in `frontend/src/utils/sessionManager.js`.

### Change Warning Style
Edit `SessionWarningModal` component in `frontend/src/components/SessionProvider.jsx`.

### Add Toast Notifications
Replace `alert()` on line 129 of `SessionProvider.jsx` with your toast library:
```javascript
// Before
if (message) {
  alert(message)
}

// After
if (message) {
  toast.info(message)
}
```

### Disable HMR Auto-Logout
Comment out HMR detection in `sessionManager.js` lines 80-93.

### Different Timeouts per Role
Modify `sessionManager.init()` to accept config parameter:
```javascript
sessionManager.init(onWarning, onLogout, {
  idleTimeout: user.role === 'admin' ? 60 : 30,
  absoluteTimeout: user.role === 'admin' ? 12 : 8
})
```

## Production Considerations

1. **HMR is Development Only**: The HMR logout only activates when `import.meta.hot` is available (dev mode)
2. **Timeouts are Reasonable**: 30 min idle / 8 hour absolute are industry standard
3. **localStorage Persistence**: Session times survive page refreshes
4. **No Server Sync**: Client-side only; backend JWT expiration is separate
5. **Activity Detection**: Covers all common user interactions

## Integration with Backend

The session manager works alongside backend JWT expiration:
- Backend JWT typically expires in 24 hours
- Frontend session expires in 8 hours
- Whichever expires first triggers logout
- Both should be configured to reasonable values

## Troubleshooting

### Warning not appearing
- Check if `CHECK_INTERVAL` is too long
- Verify user is logged in (token in localStorage)
- Check browser console for errors

### Logout happening too early
- Verify `SESSION_CONFIG` values
- Check if multiple tabs are interfering
- Ensure activity events are firing

### HMR logout not working
- Only works in development (Vite dev server)
- Check if `import.meta.hot` is available
- Verify HMR is enabled in Vite config

### Modal not closing
- Check if `onExtend` callback is called
- Verify `sessionManager.extendSession()` is working
- Check for JavaScript errors in console

## Summary

The session management system provides:
✅ Automatic idle logout (30 min)
✅ Absolute session limit (8 hours)
✅ 2-minute warning before logout
✅ HMR-based logout in development
✅ User control to extend session
✅ Clean UI with countdown timer
✅ Seamless integration with existing app
✅ Production-ready and secure

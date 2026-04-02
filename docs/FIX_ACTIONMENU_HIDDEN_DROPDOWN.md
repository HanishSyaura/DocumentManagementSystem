# Fix: ActionMenu Showing Empty/Hidden Dropdown

## Problem
When clicking the three-dot Actions button, nothing appears or shows a "hidden window". This happens when a user has **no permissions** for any actions in that row.

## Root Cause
In the ActionMenu component, when the permission gates filter out all actions, an **empty array** `[]` is passed to the component:

```javascript
<ActionMenu
  actions={[
    ...(hasPermission('documents.draft', 'update') ? [{ ... }] : []),  // Empty if no permission
    ...(hasPermission('documents.draft', 'delete') ? [{ ... }] : [])   // Empty if no permission
  ]}
/>
// Result: actions = [] (empty array)
```

The ActionMenu still rendered the three-dot button, but when clicked:
- The dropdown had no items to show
- It appeared "hidden" or invisible
- Clicking did nothing visible

## Solution
**File:** `frontend/src/components/ActionMenu.jsx`  
**Lines:** 17-20

Added an early return to hide the component completely when there are no actions:

```javascript
// Don't render anything if there are no actions
if (!actions || actions.length === 0) {
  return null
}
```

## Impact
✅ Three-dot menu button **disappears completely** when user has no permissions for any actions  
✅ No more confusing "empty" or "hidden" dropdowns  
✅ Cleaner UI - only shows actions button when there are actually actions available  
✅ Applies automatically across ALL pages using ActionMenu  

## Affected Components
This fix automatically applies to all pages using `<ActionMenu>`:
- ✅ DraftDocuments.jsx
- ✅ PublishedDocuments.jsx
- ✅ ReviewAndApproval.jsx
- ✅ SupersededObsolete.jsx
- ✅ Configuration.jsx
- ✅ WorkflowConfiguration.jsx
- ✅ Any other component using ActionMenu

## Testing
1. Login as a user with **VIEW-only** permissions
2. Navigate to any page with action menus (e.g., Draft Documents)
3. **Expected:** Three-dot Actions button should be **completely hidden** for all rows
4. Login as a user with full permissions
5. **Expected:** Three-dot Actions button appears and shows available actions

## User Experience
**Before:**
- User sees three-dot button
- Clicks it
- Nothing appears (confusing!)

**After:**
- User with no action permissions: **No three-dot button at all**
- User with action permissions: Three-dot button shows dropdown with available actions

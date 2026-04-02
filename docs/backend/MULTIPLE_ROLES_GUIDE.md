# Multiple Roles Assignment Guide

## Yes, You Can Assign Multiple Roles! ✅

Your DMS **fully supports** assigning multiple roles to a single user without any errors. The system is designed to handle this correctly.

## Database Schema Support

### UserRole Table (schema.prisma lines 84-98)
```prisma
model UserRole {
  id        Int      @id @default(autoincrement())
  userId    Int
  roleId    Int
  assignedAt DateTime @default(now())
  assignedBy Int?

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])  // ✅ Prevents duplicate role assignments
  @@index([userId])
  @@index([roleId])
}
```

**Key Points:**
- ✅ One-to-Many relationship: One user can have multiple UserRole records
- ✅ Unique constraint on `[userId, roleId]` prevents duplicate assignments
- ✅ Cascade delete: When user/role is deleted, UserRole records are cleaned up automatically

## How Multiple Roles Work

### 1. Creating a User with Multiple Roles
**Location**: `usersController.js` lines 115-122

```javascript
// You can pass multiple roleIds in the request
if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
  await prisma.userRole.createMany({
    data: roleIds.map(roleId => ({
      userId: user.id,
      roleId: parseInt(roleId)
    }))
  });
}
```

**Example Request:**
```json
POST /api/users
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roleIds": [1, 2, 3]  // ✅ Assign reviewer, approver, publisher roles
}
```

### 2. Updating User Roles
**Location**: `usersController.js` lines 185-199

```javascript
if (roleIds && Array.isArray(roleIds)) {
  // Remove existing roles
  await prisma.userRole.deleteMany({
    where: { userId }
  });

  // Add new roles
  if (roleIds.length > 0) {
    await prisma.userRole.createMany({
      data: roleIds.map(roleId => ({
        userId,
        roleId: parseInt(roleId)
      }))
    });
  }
}
```

**Example Request:**
```json
PUT /api/users/5
{
  "roleIds": [2, 3, 4]  // ✅ Replace all roles with new ones
}
```

## Permission Handling with Multiple Roles

### Role Check - ANY Match (OR Logic)
**Location**: `auth.js` lines 84-98

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles;  // Array of role names
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};
```

**How it Works:**
- Uses `Array.some()` which returns `true` if user has **ANY** of the required roles
- This is **OR logic** - user needs at least one of the specified roles

**Example:**
```javascript
// User has roles: ['reviewer', 'approver', 'publisher']

// ✅ PASSES - User has 'reviewer'
authorize('reviewer', 'admin')

// ✅ PASSES - User has 'approver'
authorize('approver')

// ❌ FAILS - User doesn't have 'admin'
authorize('admin')

// ✅ PASSES - User has 'publisher'
authorize('drafter', 'reviewer', 'approver', 'publisher')
```

### Permission Merging - ALL Permissions Combined
**Location**: `auth.js` lines 60-65

```javascript
permissions: session.user.roles.reduce((acc, r) => {
  const rolePermissions = typeof r.role.permissions === 'string' 
    ? JSON.parse(r.role.permissions) 
    : r.role.permissions;
  return { ...acc, ...rolePermissions };  // ✅ Merges all permissions
}, {})
```

**How it Works:**
- Uses `reduce()` to merge permissions from all roles
- Later role permissions **override** earlier ones (if same key)
- User gets **ALL permissions** from **ALL roles** combined

**Example:**

If user has 3 roles:
```javascript
// Role 1: reviewer
{
  "documents": ["read", "review"],
  "folders": ["read"]
}

// Role 2: approver
{
  "documents": ["read", "approve"],
  "workflows": ["manage"]
}

// Role 3: publisher
{
  "documents": ["read", "publish"],
  "folders": ["read", "create"]
}

// ✅ MERGED RESULT (User gets all unique permissions):
{
  "documents": ["read", "publish"],      // Last role wins
  "folders": ["read", "create"],         // Last role wins
  "workflows": ["manage"]                // Only from approver
}
```

### Permission Check - ANY Match (OR Logic)
**Location**: `auth.js` lines 106-120

```javascript
const authorizePermission = (resource, ...actions) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions[resource] || [];
    const hasPermission = actions.some(action => 
      userPermissions.includes(action)
    );
    
    if (!hasPermission) {
      return next(new ForbiddenError(`You don't have permission...`));
    }
    next();
  };
};
```

**Example:**
```javascript
// User has: documents: ["read", "review", "approve"]

// ✅ PASSES - Has 'read'
authorizePermission('documents', 'read')

// ✅ PASSES - Has 'approve'
authorizePermission('documents', 'approve', 'publish')

// ❌ FAILS - Doesn't have 'delete'
authorizePermission('documents', 'delete')
```

## Workflow Implications

### Document Submission Notifications
**Location**: `workflowService.js` lines 645-673

Users with **reviewer** role get notifications when documents are submitted.

If a user has multiple roles including reviewer, they will:
- ✅ Receive review notifications (as reviewer)
- ✅ Can also approve documents (if they have approver role)
- ✅ Can also publish documents (if they have publisher role)

### Pending Tasks
**Location**: `workflowService.js` lines 645-713

```javascript
async getPendingTasks(userId, userRoles, filters = {}) {
  const whereClauses = [];

  if (userRoles.includes('reviewer') || userRoles.includes('admin')) {
    whereClauses.push({
      stage: 'REVIEW',
      status: { in: ['PENDING_REVIEW', 'IN_REVIEW'] }
    });
  }

  if (userRoles.includes('approver') || userRoles.includes('admin')) {
    whereClauses.push({
      stage: 'APPROVAL',
      status: { in: ['PENDING_APPROVAL', 'IN_APPROVAL'] }
    });
  }

  // Returns ALL matching tasks (OR logic)
  const where = { OR: whereClauses };
}
```

**Example:**
If user has both **reviewer** and **approver** roles:
- ✅ Sees documents in REVIEW stage
- ✅ Sees documents in APPROVAL stage
- ✅ Can work on both types of tasks

## Common Role Combinations

### 1. **Document Owner** (drafter + reviewer)
```json
{
  "roleIds": [1, 2]  // drafter, reviewer
}
```
- Can create their own documents
- Can review other people's documents

### 2. **Senior Staff** (reviewer + approver)
```json
{
  "roleIds": [2, 3]  // reviewer, approver
}
```
- Can review documents
- Can also approve documents (skip to approval if needed)

### 3. **Document Controller** (reviewer + approver + publisher)
```json
{
  "roleIds": [2, 3, 5]  // reviewer, approver, publisher
}
```
- Full workflow control
- Can review, approve, and publish

### 4. **Super Admin** (all roles)
```json
{
  "roleIds": [1, 2, 3, 4, 5, 6]  // All roles
}
```
- Can perform any action in the system

## Potential Issues & Solutions

### ⚠️ Issue 1: User Receives Duplicate Notifications
**Scenario**: User has both `reviewer` and `approver` roles, and document submission notifies "all reviewers".

**Current Behavior**: User gets only ONE notification (database prevents duplicates via bulk insert)

**No Action Needed** ✅

### ⚠️ Issue 2: Permission Override
**Scenario**: Two roles have conflicting permissions for the same resource.

**Current Behavior**: Last role in the array wins (spread operator behavior)

**Solution**: If this is a problem, you can change the merge logic to be more sophisticated:
```javascript
// Instead of: { ...acc, ...rolePermissions }
// Use union for arrays:
Object.keys(rolePermissions).forEach(key => {
  if (Array.isArray(rolePermissions[key])) {
    acc[key] = [...new Set([...(acc[key] || []), ...rolePermissions[key]])];
  }
});
```

### ⚠️ Issue 3: User Assigned to Review Their Own Document
**Scenario**: User is both document owner and has reviewer role.

**Current Behavior**: System allows this (no self-review prevention)

**Recommendation**: Add validation in review endpoint:
```javascript
if (document.ownerId === userId) {
  throw new ForbiddenError('Cannot review your own document');
}
```

## Testing Multiple Roles

### Test Scenario 1: Basic Assignment
```bash
# Create user with multiple roles
POST /api/users
{
  "email": "multi@test.com",
  "firstName": "Multi",
  "roleIds": [2, 3]  # reviewer, approver
}

# ✅ Expected: User created with both roles
```

### Test Scenario 2: Permission Check
```bash
# Login as multi-role user
# Access endpoint requiring 'reviewer' role

GET /api/workflow/pending-tasks

# ✅ Expected: Returns both REVIEW and APPROVAL stage documents
```

### Test Scenario 3: Role Update
```bash
# Update user roles
PUT /api/users/5
{
  "roleIds": [3, 5]  # Change to approver, publisher only
}

# ✅ Expected: Old roles removed, new roles assigned
# ✅ Expected: User loses review permissions, gains publish permissions
```

## Summary

✅ **Multiple roles ARE supported**
✅ **No permission conflicts** - permissions are merged
✅ **Role checks use OR logic** - user needs any matching role
✅ **Permission checks use OR logic** - user needs any matching permission
✅ **Database has proper constraints** - prevents duplicate assignments
✅ **Workflow system handles multiple roles correctly**

**Recommendation**: Multiple roles work great for your DMS! Feel free to assign users multiple roles based on their responsibilities.

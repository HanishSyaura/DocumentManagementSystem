# Role System Flag Update

## Overview
This update changes the role system to only protect the **Administrator** role from deletion, while allowing all other roles (Reviewer, Approver, Acknowledger, Drafter, Viewer) to be deleted by administrators.

## What Changed

### Before
- All 6 default roles were marked as `isSystem: true` (protected)
- None of the roles could be deleted, even if unused
- This was overly restrictive

### After
- Only **Administrator** role is marked as `isSystem: true` (protected)
- All other roles (`Reviewer`, `Approver`, `Acknowledger`, `Drafter`, `Viewer`) are `isSystem: false`
- These roles can be deleted if they have no assigned users
- Provides flexibility while maintaining system integrity

## How to Apply

### Step 1: Update Existing Database

Run the migration script to update existing roles in your database:

```bash
cd backend
node update-roles-system-flag.js
```

**Expected Output:**
```
🔄 Updating role system flags...

✅ Updated 5 role(s) to be non-system roles
✅ Administrator role confirmed as system role

📋 Current roles status:
   ✏️ Acknowledger (DELETABLE) - 0 user(s)
   🔒 Administrator (PROTECTED) - 1 user(s)
   ✏️ Approver (DELETABLE) - 0 user(s)
   ✏️ Drafter (DELETABLE) - 0 user(s)
   ✏️ Reviewer (DELETABLE) - 0 user(s)
   ✏️ Viewer (DELETABLE) - 0 user(s)

✨ Update completed successfully!
ℹ️  Only the Administrator role is now protected from deletion.
ℹ️  All other roles can be deleted if they have no assigned users.
```

### Step 2: Future Seeding (Optional)

The seed file has been updated. If you run the seed script again, it will create roles with the correct system flags:

```bash
npx prisma db seed
```

## Role Deletion Rules

### Administrator Role
- **Cannot be deleted** - Protected system role
- Error message: "Cannot delete the Administrator role. This is a protected system role required for system management."

### Other Roles (Reviewer, Approver, etc.)
- **Can be deleted** if no users are assigned
- If users are assigned, you'll get: "Cannot delete role. It is assigned to X user(s)"
- To delete: First reassign users to different roles, then delete the role

## Use Cases

### Why Allow Role Deletion?

1. **Flexibility**: Organizations can customize their role structure
2. **Workflow Changes**: If you change your approval workflow, you can remove unused roles
3. **Simplification**: Remove roles that don't fit your organization's needs
4. **Custom Roles**: Create and delete custom roles as needed

### Example Scenarios

**Scenario 1: Simplify Workflow**
- Your organization decides not to use the "Acknowledger" role
- No users have this role assigned
- Admin can delete the "Acknowledger" role from the system

**Scenario 2: Custom Role Structure**
- Create a new "Technical Lead" role
- If it doesn't work out, you can delete it
- No need to keep unused roles cluttering the system

**Scenario 3: Reorganization**
- Company restructures approval process
- Old roles can be removed after reassigning users
- Keep role list clean and relevant

## Safety Measures

The system has built-in protections:

1. **Administrator Protection**: Cannot delete admin role (system crashes without it)
2. **User Assignment Check**: Cannot delete roles with assigned users
3. **Cascade Prevention**: Must manually reassign users before deletion
4. **Audit Trail**: All role deletions are logged

## Frontend Impact

In the Role & Permission Management page:
- Administrator role: Delete button disabled or shows warning
- Other roles: Delete button enabled if no users assigned
- Clearer feedback on why a role cannot be deleted

## Backend Changes

### Files Modified

1. **`backend/prisma/seed.js`**
   - Changed `isSystem: false` for all roles except `admin`
   
2. **`backend/src/controllers/rolesController.js`**
   - Improved error message for admin role deletion
   - More specific feedback to users

3. **`backend/update-roles-system-flag.js`** (NEW)
   - Migration script to update existing databases
   - One-time execution to apply changes

## Verification

After applying the update, verify in your database:

```sql
-- Check role system flags
SELECT id, name, displayName, isSystem 
FROM Role 
ORDER BY name;
```

Expected result:
| id | name | displayName | isSystem |
|----|------|-------------|----------|
| 1  | acknowledger | Acknowledger | 0 |
| 2  | admin | Administrator | 1 |
| 3  | approver | Approver | 0 |
| 4  | drafter | Drafter | 0 |
| 5  | reviewer | Reviewer | 0 |
| 6  | viewer | Viewer | 0 |

## Rollback (If Needed)

If you need to revert this change:

```javascript
// Run in Node.js with Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

await prisma.role.updateMany({
  where: { name: { in: ['reviewer', 'approver', 'acknowledger', 'drafter', 'viewer'] } },
  data: { isSystem: true }
});
```

## Questions?

- **Q: Can I create a new admin role?**
  - A: Yes, but only one role should be marked as `isSystem: true` for clarity

- **Q: What happens to workflows using deleted roles?**
  - A: Workflows reference roles by ID, so delete the workflow or update it first

- **Q: Can I rename the admin role?**
  - A: The display name can be changed, but the internal name "admin" should remain

- **Q: Will this affect existing permissions?**
  - A: No, only the deletion protection changes, all permissions remain intact

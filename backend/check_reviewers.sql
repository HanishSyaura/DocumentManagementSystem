-- Check if there are any users with reviewer role
SELECT 
  u.id,
  u.email,
  u.firstName,
  u.lastName,
  u.status,
  r.name as roleName
FROM User u
JOIN UserRole ur ON u.id = ur.userId
JOIN Role r ON ur.roleId = r.id
WHERE r.name = 'reviewer' AND u.status = 'ACTIVE';

-- Check all roles
SELECT id, name, description FROM Role;

-- Check notification settings
SELECT * FROM Configuration WHERE key = 'notification_settings';

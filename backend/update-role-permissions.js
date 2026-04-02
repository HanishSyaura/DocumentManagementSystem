const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRolePermissions() {
  console.log('🔧 System Role Permission Updater\n');
  console.log('Current system roles in database:\n');

  // Get all system roles
  const systemRoles = await prisma.role.findMany({
    where: { isSystem: true }
  });

  systemRoles.forEach((role, index) => {
    console.log(`${index + 1}. ${role.displayName} (${role.name})`);
    console.log(`   Current permissions: ${role.permissions || 'None'}\n`);
  });

  console.log('=' .repeat(60));
  console.log('\nTo update a role\'s permissions, modify the permissions object below');
  console.log('and run this script.\n');

  // Example: Update Administrator permissions
  const adminPermissions = {
    dashboard: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true, approve: true, publish: true },
    users: { view: true, create: true, edit: true, delete: true },
    roles: { view: true, create: true, edit: true, delete: true },
    workflows: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true, export: true },
    settings: { view: true, edit: true }
  };

  // Uncomment to update Administrator role:
  /*
  const adminRole = await prisma.role.update({
    where: { name: 'admin' },
    data: {
      permissions: JSON.stringify(adminPermissions)
    }
  });
  console.log('✅ Administrator permissions updated');
  */

  // Example: Update Viewer permissions
  const viewerPermissions = {
    dashboard: { view: true },
    documents: { view: true },
    reports: { view: true }
  };

  // Uncomment to update Viewer role:
  /*
  const viewerRole = await prisma.role.update({
    where: { name: 'viewer' },
    data: {
      permissions: JSON.stringify(viewerPermissions)
    }
  });
  console.log('✅ Viewer permissions updated');
  */

  console.log('\n💡 Instructions:');
  console.log('1. Edit this file to define the permissions you want');
  console.log('2. Uncomment the update code for the role you want to modify');
  console.log('3. Run: node update-role-permissions.js');
  console.log('4. Permissions will be updated in the database');

  await prisma.$disconnect();
}

updateRolePermissions().catch(console.error);

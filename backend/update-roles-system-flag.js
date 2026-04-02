const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRoleSystemFlags() {
  console.log('🔄 Updating role system flags...\n');

  try {
    // Update all roles except admin to isSystem = false
    const result = await prisma.role.updateMany({
      where: {
        name: {
          not: 'admin'
        }
      },
      data: {
        isSystem: false
      }
    });

    console.log(`✅ Updated ${result.count} role(s) to be non-system roles`);

    // Verify the admin role is still a system role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (adminRole && adminRole.isSystem) {
      console.log('✅ Administrator role confirmed as system role\n');
    }

    // Display current roles status
    console.log('📋 Current roles status:');
    const allRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        isSystem: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    allRoles.forEach(role => {
      const icon = role.isSystem ? '🔒' : '✏️';
      const status = role.isSystem ? '(PROTECTED)' : '(DELETABLE)';
      console.log(`   ${icon} ${role.displayName} ${status} - ${role._count.users} user(s)`);
    });

    console.log('\n✨ Update completed successfully!');
    console.log('ℹ️  Only the Administrator role is now protected from deletion.');
    console.log('ℹ️  All other roles can be deleted if they have no assigned users.\n');

  } catch (error) {
    console.error('❌ Error updating roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateRoleSystemFlags()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

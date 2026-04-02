const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');
    
    // Query users
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    console.log(`Found ${users.length} users in database:\n`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`  Roles: ${user.roles.map(r => r.role.displayName).join(', ')}`);
      console.log(`  Status: ${user.status}\n`);
    });
    
    // Query roles
    const roles = await prisma.role.findMany();
    console.log(`\nFound ${roles.length} roles in database:`);
    roles.forEach(role => {
      console.log(`- ${role.displayName} (${role.name})`);
    });
    
    // Query document types
    const docTypes = await prisma.documentType.findMany();
    console.log(`\n\nFound ${docTypes.length} document types in database:`);
    docTypes.forEach(dt => {
      console.log(`- ${dt.name} (ID: ${dt.id}, Prefix: ${dt.prefix})`);
    });
    
    // Query project categories
    const projCats = await prisma.projectCategory.findMany();
    console.log(`\n\nFound ${projCats.length} project categories in database:`);
    projCats.forEach(pc => {
      console.log(`- ${pc.name} (ID: ${pc.id}, Code: ${pc.code})`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

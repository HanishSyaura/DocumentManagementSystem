const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking UAT test data...\n');

    // Check users
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      const roles = user.roles.map(ur => ur.role.displayName).join(', ');
      console.log(`   - ${user.email} (${roles})`);
    });

    // Check roles
    const roles = await prisma.role.findMany();
    console.log(`\n🎭 Roles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`   - ${role.displayName} (${role.name})`);
    });

    // Check document types
    const docTypes = await prisma.documentType.findMany();
    console.log(`\n📄 Document Types: ${docTypes.length}`);
    docTypes.forEach(dt => {
      console.log(`   - ${dt.name} (${dt.prefix})`);
    });

    // Check project categories
    const categories = await prisma.projectCategory.findMany();
    console.log(`\n🏷️  Project Categories: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.code})`);
    });

    // Check folders
    const folders = await prisma.folder.findMany();
    console.log(`\n📁 Folders: ${folders.length}`);
    folders.forEach(folder => {
      console.log(`   - ${folder.name}`);
    });

    // Check workflows
    const workflows = await prisma.workflow.findMany({
      include: {
        steps: true
      }
    });
    console.log(`\n⚙️  Workflows: ${workflows.length}`);
    workflows.forEach(wf => {
      console.log(`   - ${wf.name} (${wf.steps.length} steps)`);
    });

    // Check documents
    const documents = await prisma.document.findMany();
    console.log(`\n📋 Documents: ${documents.length}`);
    
    console.log('\n✅ UAT data check complete!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

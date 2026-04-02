const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFolders() {
  try {
    console.log('Seeding folders...');

    // Get the first admin user
    const adminUser = await prisma.user.findFirst({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create a user first.');
      return;
    }

    // Create root folders
    const home = await prisma.folder.create({
      data: {
        name: 'Home',
        createdById: adminUser.id
      }
    });

    const projectAlpha = await prisma.folder.create({
      data: {
        name: 'Project Alpha',
        createdById: adminUser.id
      }
    });

    const marketing = await prisma.folder.create({
      data: {
        name: 'Marketing',
        createdById: adminUser.id
      }
    });

    const clientReports = await prisma.folder.create({
      data: {
        name: 'Client Reports',
        createdById: adminUser.id
      }
    });

    const archived = await prisma.folder.create({
      data: {
        name: 'Archived',
        createdById: adminUser.id
      }
    });

    // Create subfolders for Project Alpha
    await prisma.folder.create({
      data: {
        name: 'Design Docs',
        parentId: projectAlpha.id,
        createdById: adminUser.id
      }
    });

    await prisma.folder.create({
      data: {
        name: 'Development',
        parentId: projectAlpha.id,
        createdById: adminUser.id
      }
    });

    await prisma.folder.create({
      data: {
        name: 'Testing',
        parentId: projectAlpha.id,
        createdById: adminUser.id
      }
    });

    console.log('✅ Folders seeded successfully!');
    console.log('Created folders:');
    console.log('- Home');
    console.log('- Project Alpha');
    console.log('  - Design Docs');
    console.log('  - Development');
    console.log('  - Testing');
    console.log('- Marketing');
    console.log('- Client Reports');
    console.log('- Archived');

  } catch (error) {
    console.error('Error seeding folders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFolders();

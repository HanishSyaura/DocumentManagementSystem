const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const docs = await prisma.document.findMany({
      where: { status: 'DRAFT' },
      include: {
        documentType: true,
        projectCategory: true,
        createdBy: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`Found ${docs.length} recent draft documents:\n`);
    
    docs.forEach(d => {
      console.log(`ID: ${d.id}`);
      console.log(`Title: ${d.title}`);
      console.log(`File Code: ${d.fileCode}`);
      console.log(`Doc Type: ${d.documentType?.name || 'N/A'}`);
      console.log(`Project Cat: ${d.projectCategory?.name || 'N/A'}`);
      console.log(`Created By: ${d.createdBy?.firstName} ${d.createdBy?.lastName}`);
      console.log(`Created At: ${d.createdAt}`);
      console.log('---\n');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

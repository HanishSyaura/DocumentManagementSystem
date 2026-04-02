const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReturnedDocuments() {
  try {
    console.log('Checking documents with RETURNED status or in DRAFT stage...\n');
    
    const docs = await prisma.document.findMany({
      where: {
        OR: [
          { status: 'RETURNED' },
          { 
            stage: 'DRAFT',
            status: { in: ['ACKNOWLEDGED', 'RETURNED'] }
          }
        ]
      },
      select: {
        id: true,
        fileCode: true,
        title: true,
        status: true,
        stage: true,
        ownerId: true,
        createdById: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log(`Found ${docs.length} documents:\n`);
    
    docs.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(`File Code: ${doc.fileCode}`);
      console.log(`Title: ${doc.title}`);
      console.log(`Status: ${doc.status}`);
      console.log(`Stage: ${doc.stage}`);
      console.log(`Owner ID: ${doc.ownerId}`);
      console.log(`Created By ID: ${doc.createdById}`);
      console.log(`Last Updated: ${doc.updatedAt}`);
      console.log('---\n');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReturnedDocuments();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocOwners() {
  try {
    const documents = await prisma.document.findMany({
      include: {
        owner: true,
        createdBy: true,
        documentType: true
      }
    });

    console.log('=== Document Ownership ===\n');
    documents.forEach(doc => {
      console.log(`File Code: ${doc.fileCode}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Document Type: ${doc.documentType?.name || 'NULL'}`);
      console.log(`  Owner: ${doc.owner?.email || 'NULL'} (ID: ${doc.ownerId})`);
      console.log(`  Created By: ${doc.createdBy?.email || 'NULL'} (ID: ${doc.createdById})`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocOwners();

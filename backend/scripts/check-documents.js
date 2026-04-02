const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocuments() {
  try {
    console.log('Checking documents in database...\n');

    const documents = await prisma.document.findMany({
      include: {
        folder: true,
        documentType: true,
        versions: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`Total documents: ${documents.length}\n`);

    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.fileCode} - ${doc.title}`);
      console.log(`   Status: ${doc.status}, Stage: ${doc.stage}`);
      console.log(`   Folder: ${doc.folder ? doc.folder.name : 'No folder'} (ID: ${doc.folderId})`);
      console.log(`   Type: ${doc.documentType?.name || 'Unknown'}`);
      console.log(`   Versions: ${doc.versions.length}`);
      console.log(`   Created: ${doc.createdAt.toISOString()}`);
      console.log('');
    });

    // Check published documents specifically
    const publishedDocs = await prisma.document.findMany({
      where: { status: 'PUBLISHED' },
      include: { folder: true }
    });

    console.log(`Published documents: ${publishedDocs.length}`);
    publishedDocs.forEach(doc => {
      console.log(`  - ${doc.fileCode} in folder: ${doc.folder?.name || 'None'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocuments();

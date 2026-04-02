const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixDocumentTypes() {
  try {
    console.log('=== Checking Document Type Associations ===\n');

    // 1. Get all documents
    const documents = await prisma.document.findMany({
      include: {
        documentType: true
      }
    });

    console.log(`Total documents: ${documents.length}\n`);

    // 2. Check which documents are missing documentType
    const missingType = documents.filter(doc => !doc.documentType);
    console.log(`Documents missing documentType: ${missingType.length}`);
    
    if (missingType.length > 0) {
      console.log('\nDocuments without documentType:');
      missingType.forEach(doc => {
        console.log(`  - ID: ${doc.id}, File Code: ${doc.fileCode}, Title: ${doc.title}`);
      });
    }

    // 3. Get all document types
    console.log('\n--- Available Document Types ---');
    const docTypes = await prisma.documentType.findMany();
    docTypes.forEach(dt => {
      console.log(`  ${dt.id}: ${dt.name} (Prefix: ${dt.prefix})`);
    });

    // 4. Try to fix by matching file code prefix
    console.log('\n--- Attempting Auto-Fix ---');
    for (const doc of missingType) {
      if (!doc.fileCode || doc.fileCode === '-' || doc.fileCode.startsWith('PENDING-')) {
        console.log(`  Skipping ${doc.fileCode} - no valid file code`);
        continue;
      }

      const prefix = doc.fileCode.split('/')[0];
      const matchingType = docTypes.find(dt => dt.prefix === prefix);

      if (matchingType) {
        console.log(`  Fixing ${doc.fileCode} -> ${matchingType.name} (${matchingType.prefix})`);
        await prisma.document.update({
          where: { id: doc.id },
          data: { documentTypeId: matchingType.id }
        });
      } else {
        console.log(`  Cannot fix ${doc.fileCode} - no matching document type for prefix "${prefix}"`);
      }
    }

    console.log('\n--- Verification ---');
    const updatedDocs = await prisma.document.findMany({
      include: {
        documentType: true
      }
    });

    const stillMissing = updatedDocs.filter(doc => !doc.documentType);
    console.log(`Documents still missing documentType: ${stillMissing.length}`);

    if (stillMissing.length === 0) {
      console.log('\n✓ All documents now have documentType assigned!');
    }

    console.log('\n--- Final Document Status ---');
    updatedDocs.forEach(doc => {
      console.log(`  ${doc.fileCode}: ${doc.documentType?.name || 'MISSING'} (${doc.documentType?.prefix || 'N/A'})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixDocumentTypes();

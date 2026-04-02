const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDocumentTypes() {
  try {
    console.log('=== Checking Document Types ===\n');

    // 1. Get all document types
    const docTypes = await prisma.documentType.findMany({
      select: {
        id: true,
        name: true,
        prefix: true
      }
    });

    console.log('Document Types in system:');
    docTypes.forEach(type => {
      console.log(`  ID: ${type.id}, Name: "${type.name}", Prefix: ${type.prefix}`);
    });

    // 2. Get documents with file codes
    const docs = await prisma.document.findMany({
      where: {
        fileCode: {
          not: {
            startsWith: 'PENDING-'
          }
        }
      },
      select: {
        id: true,
        fileCode: true,
        title: true,
        status: true,
        documentType: {
          select: {
            id: true,
            name: true,
            prefix: true
          }
        }
      }
    });

    console.log('\n\nDocuments with valid file codes:');
    docs.forEach(doc => {
      console.log(`\n  File Code: ${doc.fileCode}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Status: ${doc.status}`);
      console.log(`  Document Type ID: ${doc.documentType.id}`);
      console.log(`  Document Type Name: "${doc.documentType.name}"`);
      console.log(`  Document Type Prefix: ${doc.documentType.prefix}`);
    });

    // 3. Check for "Minutes of Meeting" specifically
    console.log('\n\n=== Checking "Minutes of Meeting" documents ===');
    const momDocs = docs.filter(doc => 
      doc.documentType.name.toLowerCase().includes('minutes') ||
      doc.documentType.name.toLowerCase().includes('meeting') ||
      doc.documentType.name.toLowerCase() === 'minutes of meeting'
    );

    console.log(`Found ${momDocs.length} Minutes of Meeting documents:`);
    momDocs.forEach(doc => {
      console.log(`  - ${doc.fileCode}: ${doc.title}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDocumentTypes();

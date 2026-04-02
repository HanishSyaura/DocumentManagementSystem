const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDrafts() {
  try {
    console.log('=== Checking Draft Documents in Database ===\n');

    // Get all documents
    const allDocs = await prisma.document.findMany({
      include: {
        owner: true,
        documentType: true
      }
    });

    console.log(`Total documents in database: ${allDocs.length}\n`);

    // Filter by status
    const draftStatus = allDocs.filter(doc => doc.status === 'DRAFT');
    const draftStage = allDocs.filter(doc => doc.stage === 'DRAFT');
    const bothDraft = allDocs.filter(doc => doc.status === 'DRAFT' && doc.stage === 'DRAFT');

    console.log(`Documents with status='DRAFT': ${draftStatus.length}`);
    console.log(`Documents with stage='DRAFT': ${draftStage.length}`);
    console.log(`Documents with both status='DRAFT' AND stage='DRAFT': ${bothDraft.length}\n`);

    console.log('--- All Documents Status/Stage ---');
    allDocs.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(`  File Code: ${doc.fileCode}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Status: ${doc.status}`);
      console.log(`  Stage: ${doc.stage}`);
      console.log(`  Owner: ${doc.owner?.email || 'N/A'}`);
      console.log(`  Document Type: ${doc.documentType?.name || 'N/A'}`);
      console.log('');
    });

    // Show what getUserDrafts would return
    console.log('--- Documents getUserDrafts (status=DRAFT) Would Return ---');
    if (draftStatus.length === 0) {
      console.log('  No documents found with status="DRAFT"');
    } else {
      draftStatus.forEach(doc => {
        console.log(`  ${doc.fileCode}: ${doc.title}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrafts();

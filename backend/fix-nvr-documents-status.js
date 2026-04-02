const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNVRDocumentsStatus() {
  try {
    console.log('\n=== Fixing NVR-created documents status ===\n');
    
    // Find all version requests that have been approved (acknowledged)
    const acknowledgedRequests = await prisma.versionRequest.findMany({
      where: {
        status: 'APPROVED',
        newDocumentId: { not: null }
      },
      include: {
        newDocument: true
      }
    });
    
    console.log(`Found ${acknowledgedRequests.length} acknowledged version requests\n`);
    
    if (acknowledgedRequests.length === 0) {
      console.log('No documents to fix.');
      return;
    }
    
    // Update each new document to ACKNOWLEDGED status
    let updatedCount = 0;
    for (const request of acknowledgedRequests) {
      const doc = request.newDocument;
      
      if (doc.status === 'DRAFT') {
        console.log(`Updating document ${doc.fileCode} (ID: ${doc.id})`);
        console.log(`  Current status: ${doc.status}`);
        
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            status: 'ACKNOWLEDGED',
            acknowledgedById: request.reviewedById,
            acknowledgedAt: request.reviewedAt
          }
        });
        
        console.log(`  ✓ Updated to ACKNOWLEDGED\n`);
        updatedCount++;
      } else {
        console.log(`Skipping document ${doc.fileCode} - already has status: ${doc.status}\n`);
      }
    }
    
    console.log(`\n✓ Successfully updated ${updatedCount} document(s)\n`);
    
  } catch (error) {
    console.error('\nError:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNVRDocumentsStatus();

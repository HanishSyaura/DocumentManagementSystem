const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVersionRequests() {
  try {
    console.log('\n=== Checking Version Requests ===\n');
    
    // Get all version requests
    const allRequests = await prisma.versionRequest.findMany({
      include: {
        document: {
          include: {
            documentType: true,
            projectCategory: true
          }
        },
        requestedBy: true,
        newDocument: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Total version requests: ${allRequests.length}\n`);
    
    if (allRequests.length === 0) {
      console.log('No version requests found in database.');
    } else {
      allRequests.forEach((req, index) => {
        console.log(`\n--- Request #${index + 1} ---`);
        console.log(`ID: ${req.id}`);
        console.log(`Status: ${req.status}`);
        console.log(`Stage: ${req.stage}`);
        console.log(`Document ID: ${req.documentId}`);
        console.log(`Document File Code: ${req.document.fileCode}`);
        console.log(`Document Title: ${req.document.title}`);
        console.log(`Proposed Changes: ${req.proposedChanges}`);
        console.log(`Requested By: ${req.requestedBy.email}`);
        console.log(`Created At: ${req.createdAt}`);
        console.log(`New Document ID: ${req.newDocumentId || 'None'}`);
        if (req.newDocument) {
          console.log(`New Document File Code: ${req.newDocument.fileCode}`);
        }
      });
    }
    
    // Check pending requests specifically
    console.log('\n\n=== Pending Version Requests ===\n');
    const pendingRequests = await prisma.versionRequest.findMany({
      where: {
        status: {
          in: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'IN_APPROVAL']
        }
      },
      include: {
        document: true,
        requestedBy: true
      }
    });
    
    console.log(`Pending requests: ${pendingRequests.length}\n`);
    pendingRequests.forEach(req => {
      console.log(`- ID ${req.id}: ${req.document.fileCode} (${req.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVersionRequests();

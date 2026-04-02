const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRequests() {
  try {
    console.log('Checking supersede/obsolete requests for T/01/260101/001...\n');
    
    const requests = await prisma.supersedeObsoleteRequest.findMany({
      where: {
        document: {
          fileCode: 'T/01/260101/001'
        }
      },
      include: {
        document: {
          select: {
            fileCode: true,
            title: true,
            status: true
          }
        },
        supersedingDoc: {
          select: {
            fileCode: true,
            title: true
          }
        },
        requestedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${requests.length} request(s):\n`);
    
    requests.forEach((req, index) => {
      console.log(`Request ${index + 1}:`);
      console.log(`  ID: ${req.id}`);
      console.log(`  Document: ${req.document.fileCode} - ${req.document.title}`);
      console.log(`  Action Type: ${req.actionType}`);
      console.log(`  Status: ${req.status}`);
      console.log(`  Stage: ${req.stage}`);
      console.log(`  Reason: ${req.reason}`);
      console.log(`  Requested By: ${req.requestedBy.firstName} ${req.requestedBy.lastName}`);
      console.log(`  Created At: ${req.createdAt}`);
      if (req.supersedingDoc) {
        console.log(`  Superseding Doc: ${req.supersedingDoc.fileCode}`);
      }
      console.log('---\n');
    });
    
    // Check actual document status
    const doc = await prisma.document.findUnique({
      where: { fileCode: 'T/01/260101/001' },
      select: {
        id: true,
        fileCode: true,
        title: true,
        status: true,
        stage: true,
        supersededById: true
      }
    });
    
    console.log('Actual Document Status:');
    console.log(`  File Code: ${doc.fileCode}`);
    console.log(`  Title: ${doc.title}`);
    console.log(`  Status: ${doc.status}`);
    console.log(`  Stage: ${doc.stage}`);
    console.log(`  Superseded By ID: ${doc.supersededById || 'None'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRequests();

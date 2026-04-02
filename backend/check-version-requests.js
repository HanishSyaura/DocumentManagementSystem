const prisma = require('./src/config/database');

async function checkVersionRequests() {
  console.log('\n========================================');
  console.log('Checking Version Requests');
  console.log('========================================\n');

  const versionRequests = await prisma.versionRequest.findMany({
    include: {
      document: {
        select: {
          id: true,
          fileCode: true,
          title: true,
          status: true
        }
      },
      newDocument: {
        select: {
          id: true,
          fileCode: true,
          title: true,
          status: true,
          stage: true,
          ownerId: true
        }
      },
      requestedBy: {
        select: {
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (versionRequests.length === 0) {
    console.log('❌ No version requests found');
  } else {
    console.log(`Found ${versionRequests.length} version request(s):\n`);
    
    versionRequests.forEach((vr, index) => {
      console.log(`${index + 1}. Version Request ID: ${vr.id}`);
      console.log(`   Status: ${vr.status}`);
      console.log(`   Original Document: ${vr.document.fileCode} - "${vr.document.title}"`);
      console.log(`   Requested By: ${vr.requestedBy.email}`);
      
      if (vr.newDocument) {
        console.log(`   ✅ New Document Created: ${vr.newDocument.fileCode}`);
        console.log(`      ID: ${vr.newDocument.id}`);
        console.log(`      Status: ${vr.newDocument.status}`);
        console.log(`      Stage: ${vr.newDocument.stage}`);
        console.log(`      Owner ID: ${vr.newDocument.ownerId}`);
      } else {
        console.log(`   ❌ New Document NOT created yet (Request status: ${vr.status})`);
      }
      console.log('');
    });
  }

  // Check all documents in DRAFT stage
  console.log('\n========================================');
  console.log('Documents in DRAFT Stage');
  console.log('========================================\n');

  const draftDocs = await prisma.document.findMany({
    where: {
      stage: 'DRAFT'
    },
    select: {
      id: true,
      fileCode: true,
      title: true,
      status: true,
      stage: true,
      ownerId: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  console.log(`Found ${draftDocs.length} document(s) in DRAFT stage:\n`);
  draftDocs.forEach((doc, index) => {
    console.log(`${index + 1}. ${doc.fileCode} - "${doc.title}"`);
    console.log(`   Status: ${doc.status}, Stage: ${doc.stage}, Owner ID: ${doc.ownerId}`);
    console.log(`   Created: ${doc.createdAt}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkVersionRequests().catch(console.error);

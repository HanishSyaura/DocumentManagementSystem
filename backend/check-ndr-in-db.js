const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNDRDocuments() {
  try {
    console.log('=== Checking NDR Documents in Database ===\n');

    // 1. Check all documents
    const allDocs = await prisma.document.findMany({
      select: {
        id: true,
        fileCode: true,
        title: true,
        status: true,
        stage: true,
        ownerId: true,
        createdById: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`Total documents (last 20): ${allDocs.length}\n`);

    // 2. Check NDR documents
    const ndrDocs = await prisma.document.findMany({
      where: {
        status: 'PENDING_ACKNOWLEDGMENT'
      },
      select: {
        id: true,
        fileCode: true,
        title: true,
        status: true,
        stage: true,
        ownerId: true,
        createdById: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`NDR Documents (PENDING_ACKNOWLEDGMENT): ${ndrDocs.length}`);
    
    if (ndrDocs.length > 0) {
      console.log('\nNDR Documents:');
      ndrDocs.forEach((doc, i) => {
        console.log(`\n${i + 1}. ID: ${doc.id}`);
        console.log(`   File Code: ${doc.fileCode}`);
        console.log(`   Title: ${doc.title}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Stage: ${doc.stage}`);
        console.log(`   Owner ID: ${doc.ownerId}`);
        console.log(`   Created By: ${doc.createdById}`);
        console.log(`   Created At: ${doc.createdAt}`);
      });
    } else {
      console.log('\n⚠ No NDR documents found!');
    }

    // 3. Check documents by stage
    const acknowledgmentDocs = await prisma.document.findMany({
      where: {
        stage: 'ACKNOWLEDGMENT'
      },
      select: {
        id: true,
        fileCode: true,
        title: true,
        status: true,
        stage: true,
        ownerId: true
      }
    });

    console.log(`\n\nDocuments in ACKNOWLEDGMENT stage: ${acknowledgmentDocs.length}`);
    if (acknowledgmentDocs.length > 0) {
      acknowledgmentDocs.forEach((doc, i) => {
        console.log(`\n${i + 1}. ${doc.fileCode} - ${doc.title} (Status: ${doc.status})`);
      });
    }

    // 4. Group by status
    const statusGroups = await prisma.document.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('\n\nDocuments by Status:');
    statusGroups.forEach(group => {
      console.log(`  ${group.status}: ${group._count.status}`);
    });

    // 5. Check if there are any documents at all
    const totalCount = await prisma.document.count();
    console.log(`\n\nTotal documents in database: ${totalCount}`);

    // 6. Sample some recent documents
    console.log('\n\nRecent Documents (any status):');
    allDocs.slice(0, 5).forEach((doc, i) => {
      console.log(`\n${i + 1}. ${doc.fileCode}`);
      console.log(`   Title: ${doc.title}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Stage: ${doc.stage}`);
      console.log(`   Owner ID: ${doc.ownerId}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNDRDocuments();

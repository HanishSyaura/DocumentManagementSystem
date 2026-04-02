const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testObsoleteDocuments() {
  console.log('=== Testing Obsolete Document Ownership ===\n');
  
  try {
    // Get all obsolete documents
    const obsoleteDocs = await prisma.document.findMany({
      where: {
        OR: [
          { status: 'OBSOLETE' },
          { status: 'SUPERSEDED' }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`Found ${obsoleteDocs.length} obsolete/superseded documents:\n`);
    
    if (obsoleteDocs.length === 0) {
      console.log('No obsolete or superseded documents found.');
      return;
    }
    
    obsoleteDocs.forEach(doc => {
      console.log(`Document: ${doc.fileCode} - ${doc.title}`);
      console.log(`  Status: ${doc.status}`);
      console.log(`  Owner: ${doc.owner?.email || 'N/A'} (ID: ${doc.ownerId})`);
      console.log(`  Created By: ${doc.createdBy?.email || 'N/A'} (ID: ${doc.createdById})`);
      console.log(`  Obsolete Date: ${doc.obsoleteDate || 'N/A'}`);
      console.log(`  Reason: ${doc.obsoleteReason || 'N/A'}`);
      console.log('');
    });
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('\n=== All Users ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}`);
    });
    
    // For each user, check what documents they own
    console.log('\n=== Documents by Owner ===');
    for (const user of users) {
      const userDocs = await prisma.document.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          fileCode: true,
          title: true,
          status: true
        }
      });
      
      if (userDocs.length > 0) {
        console.log(`\n${user.email} owns ${userDocs.length} document(s):`);
        userDocs.forEach(doc => {
          console.log(`  - ${doc.fileCode}: ${doc.title} (${doc.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testObsoleteDocuments();

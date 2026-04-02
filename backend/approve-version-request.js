const versionRequestService = require('./src/services/versionRequestService');
const prisma = require('./src/config/database');

async function approveVersionRequest() {
  console.log('\n========================================');
  console.log('Approving Version Request');
  console.log('========================================\n');

  try {
    // Get the first pending version request
    const vr = await prisma.versionRequest.findFirst({
      where: {
        status: {
          in: ['PENDING_REVIEW', 'PENDING_APPROVAL']
        }
      }
    });

    if (!vr) {
      console.log('❌ No pending version requests found');
      await prisma.$disconnect();
      return;
    }

    console.log(`Found Version Request ID: ${vr.id}`);
    console.log(`Current Status: ${vr.status}\n`);

    const userId = 1; // Admin user ID

    // If in review stage, approve for review first
    if (vr.status === 'PENDING_REVIEW') {
      console.log('Step 1: Approving review stage...');
      await versionRequestService.reviewRequest(vr.id, userId, 'approve', 'Auto-approved for testing');
      console.log('✅ Review approved\n');
    }

    // Now approve final approval
    console.log('Step 2: Approving final approval...');
    const result = await versionRequestService.approveRequest(vr.id, userId, 'Auto-approved for testing');
    console.log('✅ Version request approved!\n');

    if (result.newDocument) {
      console.log('========================================');
      console.log('New Document Created Successfully!');
      console.log('========================================');
      console.log(`File Code: ${result.newDocument.fileCode}`);
      console.log(`Title: ${result.newDocument.title}`);
      console.log(`Status: ${result.newDocument.status}`);
      console.log(`Stage: ${result.newDocument.stage}`);
      console.log(`Owner ID: ${result.newDocument.ownerId}`);
      console.log('\n✅ The new document should now appear in Draft Documents!');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

approveVersionRequest();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const versionRequestController = require('./src/controllers/versionRequestController');
const versionRequestService = require('./src/services/versionRequestService');

async function testAPICall() {
  try {
    console.log('\n=== Simulating API Call ===\n');
    
    // Simulate the listRequests call
    const filters = {};
    const pagination = {
      page: 1,
      limit: 15,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    console.log('Calling versionRequestService.listRequests...');
    const result = await versionRequestService.listRequests(filters, pagination);
    console.log(`Got ${result.requests.length} requests from service`);
    
    // Try to format like the controller does
    console.log('\nAttempting to format requests...');
    const requests = result.requests.map((req, index) => {
      console.log(`\nFormatting request ${index + 1} (ID: ${req.id})`);
      try {
        const formatted = {
          id: req.id,
          title: req.proposedChanges,
          documentType: req.document?.documentType?.name || '',
          projectCategory: req.document?.projectCategory?.name || '',
          dateOfDocument: req.targetDate ? new Date(req.targetDate).toLocaleDateString('en-GB') : '',
          requestDate: req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : '',
          remarks: req.remarks || '',
          fileCode: req.document?.fileCode || '',
          status: req.status,
          rawStatus: req.status,
          stage: req.stage
        };
        console.log('  ✓ Formatted successfully');
        return formatted;
      } catch (error) {
        console.error('  ✗ Error formatting:', error.message);
        console.error('  Stack:', error.stack);
        throw error;
      }
    });
    
    console.log(`\n✓ Successfully formatted all ${requests.length} requests`);
    console.log('\nFormatted requests:');
    console.log(JSON.stringify(requests, null, 2));
    
  } catch (error) {
    console.error('\n✗ Error occurred:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAPICall();

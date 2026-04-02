const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDateField() {
  try {
    console.log('Testing dateOfDocument field...');
    
    // Try to create a test document with dateOfDocument
    const testDoc = await prisma.document.create({
      data: {
        fileCode: `TEST-${Date.now()}`,
        title: 'Test Document',
        description: 'Testing dateOfDocument field',
        documentTypeId: 1,
        createdById: 1,
        ownerId: 1,
        status: 'DRAFT',
        stage: 'DRAFT',
        version: '1.0',
        dateOfDocument: new Date('2026-01-02')
      }
    });
    
    console.log('✓ Success! dateOfDocument field works correctly');
    console.log('Created document:', testDoc);
    
    // Clean up - delete the test document
    await prisma.document.delete({
      where: { id: testDoc.id }
    });
    
    console.log('✓ Test document cleaned up');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateField();

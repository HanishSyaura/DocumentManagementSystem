const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testListRequests() {
  try {
    console.log('\n=== Testing listRequests logic ===\n');
    
    const filters = {};
    const pagination = {
      page: 1,
      limit: 15,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    const { status, search } = filters;
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { reasonForRevision: { contains: search } },
        { proposedChanges: { contains: search } },
        { remarks: { contains: search } }
      ];
    }
    
    // Get total count
    const total = await prisma.versionRequest.count({ where });
    console.log(`Total version requests: ${total}`);
    
    // Get requests
    const requests = await prisma.versionRequest.findMany({
      where,
      include: {
        document: {
          include: {
            documentType: true,
            projectCategory: true,
            owner: true
          }
        },
        newDocument: {
          include: {
            documentType: true,
            projectCategory: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });
    
    console.log(`\nFound ${requests.length} requests\n`);
    
    // Try to format each request
    requests.forEach((req, index) => {
      console.log(`\n--- Request #${index + 1} (ID: ${req.id}) ---`);
      try {
        console.log(`Document ID: ${req.documentId}`);
        console.log(`Document exists: ${!!req.document}`);
        if (req.document) {
          console.log(`  File Code: ${req.document.fileCode}`);
          console.log(`  Title: ${req.document.title}`);
          console.log(`  DocumentType exists: ${!!req.document.documentType}`);
          if (req.document.documentType) {
            console.log(`    DocumentType name: ${req.document.documentType.name}`);
          } else {
            console.log(`    ERROR: documentType is NULL`);
          }
          console.log(`  ProjectCategory exists: ${!!req.document.projectCategory}`);
          if (req.document.projectCategory) {
            console.log(`    ProjectCategory name: ${req.document.projectCategory.name}`);
          } else {
            console.log(`    WARNING: projectCategory is NULL`);
          }
        } else {
          console.log(`  ERROR: document relation is NULL`);
        }
        
        // Try the formatting logic
        const formatted = {
          id: req.id,
          title: req.proposedChanges,
          documentType: req.document.documentType?.name || '',
          projectCategory: req.document.projectCategory?.name || '',
          dateOfDocument: req.targetDate ? new Date(req.targetDate).toLocaleDateString('en-GB') : '',
          requestDate: req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : '',
          remarks: req.remarks || '',
          fileCode: req.document.fileCode,
          status: req.status
        };
        console.log(`  Formatted successfully:`, formatted);
      } catch (error) {
        console.log(`  ERROR formatting request:`, error.message);
      }
    });
    
  } catch (error) {
    console.error('\nError:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testListRequests();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting UAT test data seeding (fixed version)...\n');

  try {
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    // 1. Create Test Users (skip if exists)
    console.log('Creating test users...');
    const testUsers = [
      {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        employeeId: 'UAT001',
        department: 'IT',
        position: 'System Administrator',
        status: 'ACTIVE',
        roleName: 'admin'
      },
      {
        email: 'drafter@test.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Drafter',
        employeeId: 'UAT002',
        department: 'Operations',
        position: 'Document Creator',
        status: 'ACTIVE',
        roleName: 'drafter'
      },
      {
        email: 'reviewer@test.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Reviewer',
        employeeId: 'UAT003',
        department: 'Quality Assurance',
        position: 'Document Reviewer',
        status: 'ACTIVE',
        roleName: 'reviewer'
      },
      {
        email: 'approver@test.com',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Approver',
        employeeId: 'UAT004',
        department: 'Management',
        position: 'Department Manager',
        status: 'ACTIVE',
        roleName: 'approver'
      },
      {
        email: 'controller@test.com',
        password: hashedPassword,
        firstName: 'Lisa',
        lastName: 'Controller',
        employeeId: 'UAT005',
        department: 'Document Control',
        position: 'Document Controller',
        status: 'ACTIVE',
        roleName: 'acknowledger'
      },
      {
        email: 'viewer@test.com',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Viewer',
        employeeId: 'UAT006',
        department: 'General',
        position: 'Staff',
        status: 'ACTIVE',
        roleName: 'viewer'
      }
    ];

    for (const userData of testUsers) {
      const { roleName, ...userDataWithoutRole } = userData;
      
      try {
        // Try to create user if not exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        let user;
        if (!existingUser) {
          user = await prisma.user.create({
            data: userDataWithoutRole
          });
          console.log(`   ✓ Created user: ${userData.email}`);
        } else {
          user = existingUser;
          console.log(`   ℹ User already exists: ${userData.email}`);
        }

        // Assign role to user
        const role = await prisma.role.findUnique({
          where: { name: roleName }
        });

        if (role) {
          const existingUserRole = await prisma.userRole.findUnique({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: role.id
              }
            }
          });

          if (!existingUserRole) {
            await prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: role.id
              }
            });
          }
        }

        // Create user preferences
        const existingPref = await prisma.userPreference.findUnique({
          where: { userId: user.id }
        });

        if (!existingPref) {
          await prisma.userPreference.create({
            data: {
              userId: user.id,
              language: 'en',
              timezone: 'Asia/Kuala_Lumpur',
              dateFormat: 'DD/MM/YYYY',
              timeFormat: '24h',
              itemsPerPage: 15
            }
          });
        }
      } catch (err) {
        console.log(`   ⚠ Error with user ${userData.email}: ${err.message}`);
      }
    }
    console.log('✅ Test users processed\n');

    // 2. Create Document Types
    console.log('Creating document types...');
    const documentTypes = [
      { name: 'Minutes of Meeting', prefix: 'MOM', description: 'Meeting minutes and records', isActive: true },
      { name: 'Project Plan', prefix: 'PP', description: 'Project planning documents', isActive: true },
      { name: 'Requirement Analysis', prefix: 'PRA', description: 'Project requirement analysis', isActive: true },
      { name: 'Design Document', prefix: 'DD', description: 'Design specifications', isActive: true },
      { name: 'SOP', prefix: 'SOP', description: 'Standard Operating Procedures', isActive: true },
      { name: 'Policy', prefix: 'POL', description: 'Company policies', isActive: true },
      { name: 'Manual', prefix: 'MAN', description: 'User manuals and guides', isActive: true },
      { name: 'Business Case', prefix: 'BC', description: 'Business case documents', isActive: true },
      { name: 'Risk Management', prefix: 'RMP', description: 'Risk management plans', isActive: true },
      { name: 'Work Breakdown Structure', prefix: 'WBS', description: 'WBS documents', isActive: true }
    ];

    for (const docType of documentTypes) {
      try {
        await prisma.documentType.upsert({
          where: { name: docType.name },
          update: {},
          create: docType
        });
        console.log(`   ✓ ${docType.name}`);
      } catch (err) {
        console.log(`   ⚠ Error with ${docType.name}: ${err.message}`);
      }
    }
    console.log('✅ Document types created\n');

    // 3. Create Project Categories
    console.log('Creating project categories...');
    const projectCategories = [
      { name: 'Internal', code: 'INT', description: 'Internal projects', isActive: true },
      { name: 'External', code: 'EXT', description: 'External projects', isActive: true },
      { name: 'Client', code: 'CLI', description: 'Client projects', isActive: true },
      { name: 'R&D', code: 'RND', description: 'Research and Development', isActive: true }
    ];

    for (const category of projectCategories) {
      try {
        await prisma.projectCategory.upsert({
          where: { name: category.name },
          update: {},
          create: category
        });
        console.log(`   ✓ ${category.name}`);
      } catch (err) {
        console.log(`   ⚠ Error with ${category.name}: ${err.message}`);
      }
    }
    console.log('✅ Project categories created\n');

    // 4. Create Sample Folders
    console.log('Creating sample folders...');
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          some: {
            role: {
              name: 'admin'
            }
          }
        }
      }
    });

    if (adminUser) {
      const folders = [
        { name: 'Policies', parentId: null },
        { name: 'Procedures', parentId: null },
        { name: 'Projects', parentId: null },
        { name: 'Meeting Minutes', parentId: null },
        { name: 'Quality Documents', parentId: null }
      ];

      for (const folder of folders) {
        try {
          const existing = await prisma.folder.findFirst({
            where: {
              name: folder.name,
              createdById: adminUser.id
            }
          });

          if (!existing) {
            await prisma.folder.create({
              data: {
                name: folder.name,
                parentId: folder.parentId,
                createdById: adminUser.id
              }
            });
            console.log(`   ✓ ${folder.name}`);
          } else {
            console.log(`   ℹ Folder already exists: ${folder.name}`);
          }
        } catch (err) {
          console.log(`   ⚠ Error with folder ${folder.name}: ${err.message}`);
        }
      }
      console.log('✅ Sample folders processed\n');
    } else {
      console.log('⚠ No admin user found, skipping folder creation\n');
    }

    // 5. Create Basic Workflows
    console.log('Creating basic workflow...');
    const momDocType = await prisma.documentType.findUnique({
      where: { prefix: 'MOM' }
    });
    const reviewerRole = await prisma.role.findUnique({
      where: { name: 'reviewer' }
    });
    const approverRole = await prisma.role.findUnique({
      where: { name: 'approver' }
    });
    const acknowledgerRole = await prisma.role.findUnique({
      where: { name: 'acknowledger' }
    });

    if (momDocType && reviewerRole && approverRole && acknowledgerRole) {
      try {
        const existingWorkflow = await prisma.workflow.findUnique({
          where: { documentTypeId: momDocType.id }
        });

        if (!existingWorkflow) {
          const workflow = await prisma.workflow.create({
            data: {
              name: 'Standard MoM Workflow',
              description: 'Standard workflow for Minutes of Meeting documents',
              documentTypeId: momDocType.id,
              isActive: true
            }
          });

          // Create workflow steps
          await prisma.workflowStep.create({
            data: {
              workflowId: workflow.id,
              stepOrder: 1,
              stepName: 'Review',
              roleId: reviewerRole.id,
              isRequired: true,
              dueInDays: 3
            }
          });

          await prisma.workflowStep.create({
            data: {
              workflowId: workflow.id,
              stepOrder: 2,
              stepName: 'Approval',
              roleId: approverRole.id,
              isRequired: true,
              dueInDays: 2
            }
          });

          await prisma.workflowStep.create({
            data: {
              workflowId: workflow.id,
              stepOrder: 3,
              stepName: 'Acknowledgment',
              roleId: acknowledgerRole.id,
              isRequired: true,
              dueInDays: 1
            }
          });

          console.log('   ✓ Standard MoM Workflow with 3 steps');
          console.log('✅ Basic workflow created\n');
        } else {
          console.log('   ℹ Workflow already exists for MoM\n');
        }
      } catch (err) {
        console.log(`   ⚠ Error creating workflow: ${err.message}\n`);
      }
    }

    // 6. Create System Configuration
    console.log('Creating system configuration...');
    const configs = [
      {
        key: 'system.name',
        value: 'Document Management System',
        description: 'System name'
      },
      {
        key: 'document.max_file_size',
        value: '52428800',
        description: 'Maximum file size for document uploads'
      },
      {
        key: 'document.allowed_types',
        value: JSON.stringify(['pdf', 'doc', 'docx', 'xls', 'xlsx']),
        description: 'Allowed file types for documents'
      },
      {
        key: 'notification.email_enabled',
        value: 'true',
        description: 'Enable email notifications'
      }
    ];

    for (const config of configs) {
      try {
        await prisma.configuration.upsert({
          where: { key: config.key },
          update: { value: config.value },
          create: config
        });
        console.log(`   ✓ ${config.key}`);
      } catch (err) {
        console.log(`   ⚠ Error with config ${config.key}: ${err.message}`);
      }
    }
    console.log('✅ System configuration created\n');

    console.log('🎉 UAT test data seeding completed successfully!\n');
    console.log('📋 Test User Accounts:');
    console.log('┌─────────────────────────┬──────────────────────┬──────────────┐');
    console.log('│ Email                   │ Role                 │ Password     │');
    console.log('├─────────────────────────┼──────────────────────┼──────────────┤');
    console.log('│ admin@test.com          │ Administrator        │ Test@123     │');
    console.log('│ drafter@test.com        │ Drafter              │ Test@123     │');
    console.log('│ reviewer@test.com       │ Reviewer             │ Test@123     │');
    console.log('│ approver@test.com       │ Approver             │ Test@123     │');
    console.log('│ controller@test.com     │ Document Controller  │ Test@123     │');
    console.log('│ viewer@test.com         │ Viewer               │ Test@123     │');
    console.log('└─────────────────────────┴──────────────────────┴──────────────┘\n');
    console.log('✨ You can now start UAT testing!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

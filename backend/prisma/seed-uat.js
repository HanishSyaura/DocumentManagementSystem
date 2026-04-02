const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting UAT test data seeding...');

  try {
    // 1. Create Roles
    console.log('Creating roles...');
    const roles = [
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        isSystem: true,
        permissions: JSON.stringify({
          all: true
        })
      },
      {
        name: 'drafter',
        displayName: 'Drafter',
        description: 'Can create and edit draft documents',
        isSystem: true,
        permissions: JSON.stringify({
          documents: ['create', 'read', 'update', 'delete'],
          drafts: ['create', 'read', 'update', 'delete', 'submit']
        })
      },
      {
        name: 'reviewer',
        displayName: 'Reviewer',
        description: 'Can review documents',
        isSystem: true,
        permissions: JSON.stringify({
          documents: ['read'],
          review: ['read', 'approve', 'reject', 'return']
        })
      },
      {
        name: 'approver',
        displayName: 'Approver',
        description: 'Can approve documents',
        isSystem: true,
        permissions: JSON.stringify({
          documents: ['read'],
          approval: ['read', 'approve', 'reject', 'return']
        })
      },
      {
        name: 'acknowledger',
        displayName: 'Document Controller',
        description: 'Can acknowledge and publish documents',
        isSystem: true,
        permissions: JSON.stringify({
          documents: ['read', 'publish'],
          acknowledgment: ['read', 'acknowledge', 'publish']
        })
      },
      {
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Can only view published documents',
        isSystem: true,
        permissions: JSON.stringify({
          documents: ['read']
        })
      }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
    }
    console.log('✅ Roles created successfully');

    // 2. Create Test Users
    console.log('Creating test users...');
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    const testUsers = [
      {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        employeeId: 'EMP001',
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
        employeeId: 'EMP002',
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
        employeeId: 'EMP003',
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
        employeeId: 'EMP004',
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
        employeeId: 'EMP005',
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
        employeeId: 'EMP006',
        department: 'General',
        position: 'Staff',
        status: 'ACTIVE',
        roleName: 'viewer'
      }
    ];

    for (const userData of testUsers) {
      const { roleName, ...userDataWithoutRole } = userData;
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userDataWithoutRole
      });

      // Assign role to user
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (role) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            roleId: role.id
          }
        });
      }

      // Create user preferences
      await prisma.userPreference.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          language: 'en',
          timezone: 'Asia/Kuala_Lumpur',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          itemsPerPage: 15
        }
      });
    }
    console.log('✅ Test users created successfully');

    // 3. Create Document Types
    console.log('Creating document types...');
    const documentTypes = [
      { name: 'Minutes of Meeting', prefix: 'MOM', description: 'Meeting minutes and records' },
      { name: 'Project Plan', prefix: 'PP', description: 'Project planning documents' },
      { name: 'Requirement Analysis', prefix: 'PRA', description: 'Project requirement analysis' },
      { name: 'Design Document', prefix: 'DD', description: 'Design specifications' },
      { name: 'SOP', prefix: 'SOP', description: 'Standard Operating Procedures' },
      { name: 'Policy', prefix: 'POL', description: 'Company policies' },
      { name: 'Manual', prefix: 'MAN', description: 'User manuals and guides' },
      { name: 'Business Case', prefix: 'BC', description: 'Business case documents' },
      { name: 'Risk Management', prefix: 'RMP', description: 'Risk management plans' },
      { name: 'Work Breakdown Structure', prefix: 'WBS', description: 'WBS documents' }
    ];

    for (const docType of documentTypes) {
      await prisma.documentType.upsert({
        where: { name: docType.name },
        update: {},
        create: docType
      });
    }
    console.log('✅ Document types created successfully');

    // 4. Create Project Categories
    console.log('Creating project categories...');
    const projectCategories = [
      { name: 'Internal', code: 'INT', description: 'Internal projects' },
      { name: 'External', code: 'EXT', description: 'External projects' },
      { name: 'Client', code: 'CLI', description: 'Client projects' },
      { name: 'R&D', code: 'RND', description: 'Research and Development' }
    ];

    for (const category of projectCategories) {
      await prisma.projectCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }
    console.log('✅ Project categories created successfully');

    // 5. Create Sample Folders
    console.log('Creating sample folders...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });

    const folders = [
      { name: 'Policies', parentId: null },
      { name: 'Procedures', parentId: null },
      { name: 'Projects', parentId: null },
      { name: 'Meeting Minutes', parentId: null },
      { name: 'Quality Documents', parentId: null }
    ];

    for (const folder of folders) {
      await prisma.folder.upsert({
        where: {
          name_createdById: {
            name: folder.name,
            createdById: adminUser.id
          }
        },
        update: {},
        create: {
          name: folder.name,
          parentId: folder.parentId,
          createdById: adminUser.id
        }
      });
    }
    console.log('✅ Sample folders created successfully');

    // 6. Create Basic Workflows
    console.log('Creating basic workflows...');
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
      const workflow = await prisma.workflow.upsert({
        where: { documentTypeId: momDocType.id },
        update: {},
        create: {
          name: 'Standard MoM Workflow',
          description: 'Standard workflow for Minutes of Meeting documents',
          documentTypeId: momDocType.id,
          isActive: true
        }
      });

      // Create workflow steps
      await prisma.workflowStep.upsert({
        where: {
          workflowId_stepOrder: {
            workflowId: workflow.id,
            stepOrder: 1
          }
        },
        update: {},
        create: {
          workflowId: workflow.id,
          stepOrder: 1,
          stepName: 'Review',
          roleId: reviewerRole.id,
          isRequired: true,
          dueInDays: 3
        }
      });

      await prisma.workflowStep.upsert({
        where: {
          workflowId_stepOrder: {
            workflowId: workflow.id,
            stepOrder: 2
          }
        },
        update: {},
        create: {
          workflowId: workflow.id,
          stepOrder: 2,
          stepName: 'Approval',
          roleId: approverRole.id,
          isRequired: true,
          dueInDays: 2
        }
      });

      await prisma.workflowStep.upsert({
        where: {
          workflowId_stepOrder: {
            workflowId: workflow.id,
            stepOrder: 3
          }
        },
        update: {},
        create: {
          workflowId: workflow.id,
          stepOrder: 3,
          stepName: 'Acknowledgment',
          roleId: acknowledgerRole.id,
          isRequired: true,
          dueInDays: 1
        }
      });

      console.log('✅ Basic workflows created successfully');
    }

    // 7. Create System Configuration
    console.log('Creating system configuration...');
    const configs = [
      {
        key: 'system.name',
        value: 'Document Management System',
        description: 'System name'
      },
      {
        key: 'document.max_file_size',
        value: '52428800', // 50MB in bytes
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
      },
      {
        key: 'retention.archive_after_days',
        value: '1825', // 5 years
        description: 'Archive documents after specified days'
      }
    ];

    for (const config of configs) {
      await prisma.configuration.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: config
      });
    }
    console.log('✅ System configuration created successfully');

    console.log('');
    console.log('🎉 UAT test data seeding completed successfully!');
    console.log('');
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
    console.log('└─────────────────────────┴──────────────────────┴──────────────┘');
    console.log('');
    console.log('📁 Document Types Created:');
    documentTypes.forEach(dt => console.log(`   - ${dt.name} (${dt.prefix})`));
    console.log('');
    console.log('🏷️  Project Categories Created:');
    projectCategories.forEach(pc => console.log(`   - ${pc.name} (${pc.code})`));
    console.log('');
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

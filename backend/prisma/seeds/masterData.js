const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMasterData() {
  console.log('Seeding master data...');

  try {
    // Seed Document Types
    const documentTypes = [
      { name: 'Minutes of Meeting', prefix: 'MoM', description: 'Meeting minutes and records' },
      { name: 'Project Plan', prefix: 'PP', description: 'Project planning documents' },
      { name: 'Requirement Analysis', prefix: 'RA', description: 'System and project requirements' },
      { name: 'Design Document', prefix: 'DD', description: 'Technical design specifications' },
      { name: 'Standard Operating Procedure', prefix: 'SOP', description: 'Operational procedures and guidelines' },
      { name: 'Policy Document', prefix: 'POL', description: 'Company policies and regulations' },
      { name: 'User Manual', prefix: 'MAN', description: 'User guides and documentation' },
      { name: 'Business Case', prefix: 'BC', description: 'Business justification documents' },
      { name: 'Work Breakdown Structure', prefix: 'WBS', description: 'Project work breakdown' },
      { name: 'Risk Management Plan', prefix: 'RMP', description: 'Risk assessment and mitigation plans' }
    ];

    console.log('Creating document types...');
    for (const docType of documentTypes) {
      await prisma.documentType.upsert({
        where: { name: docType.name },
        update: docType,
        create: docType
      });
    }
    console.log(`✓ Created ${documentTypes.length} document types`);

    // Seed Project Categories
    const projectCategories = [
      { name: 'Internal', code: 'INT', description: 'Internal company projects and documents' },
      { name: 'External', code: 'EXT', description: 'External client projects' },
      { name: 'Client Project', code: 'CLIENT', description: 'Client-specific projects and deliverables' },
      { name: 'Research & Development', code: 'RND', description: 'R&D initiatives and experiments' },
      { name: 'Infrastructure', code: 'INFRA', description: 'Infrastructure and IT projects' },
      { name: 'Compliance', code: 'COMP', description: 'Regulatory compliance projects' }
    ];

    console.log('Creating project categories...');
    for (const category of projectCategories) {
      await prisma.projectCategory.upsert({
        where: { name: category.name },
        update: category,
        create: category
      });
    }
    console.log(`✓ Created ${projectCategories.length} project categories`);

    console.log('Master data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding master data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedMasterData()
    .then(() => {
      console.log('Seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedMasterData };

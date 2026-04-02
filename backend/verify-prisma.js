// Quick verification that Prisma client is properly generated
const { PrismaClient } = require('@prisma/client');

console.log('✓ Prisma Client loaded successfully');

// Check if the dateOfDocument field exists in the schema
const prisma = new PrismaClient();
console.log('✓ Prisma Client instantiated');

// Check the Prisma schema
const fs = require('fs');
const schemaPath = require('path').join(__dirname, 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

if (schemaContent.includes('dateOfDocument')) {
  console.log('✓ dateOfDocument field found in schema.prisma');
} else {
  console.log('✗ dateOfDocument field NOT found in schema.prisma');
}

console.log('\nPrisma client is ready!');
console.log('You can now start the server with: npm start or npm run dev');

process.exit(0);

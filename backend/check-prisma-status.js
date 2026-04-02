const { PrismaClient } = require('@prisma/client');

async function checkPrismaStatus() {
  console.log('\n========================================');
  console.log('Checking Prisma Client Status');
  console.log('========================================\n');

  try {
    const prisma = new PrismaClient();
    
    // Check if VersionRequest model exists
    console.log('1. Checking if VersionRequest model exists in Prisma client...');
    if (prisma.versionRequest) {
      console.log('   ✅ VersionRequest model found in Prisma client');
    } else {
      console.log('   ❌ VersionRequest model NOT found in Prisma client');
      console.log('   → You need to run: npx prisma generate');
    }
    
    // Check if SupersedeObsoleteRequest model exists (for comparison)
    console.log('\n2. Checking if SupersedeObsoleteRequest model exists (for comparison)...');
    if (prisma.supersedeObsoleteRequest) {
      console.log('   ✅ SupersedeObsoleteRequest model found');
    } else {
      console.log('   ❌ SupersedeObsoleteRequest model NOT found');
    }
    
    // Try to connect to database
    console.log('\n3. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
    
    // Try to query VersionRequest table
    console.log('\n4. Testing VersionRequest table access...');
    try {
      const count = await prisma.versionRequest.count();
      console.log(`   ✅ VersionRequest table exists (found ${count} records)`);
    } catch (error) {
      console.log('   ❌ VersionRequest table does NOT exist in database');
      console.log('   → You need to run: npx prisma migrate dev --name add_version_request_model');
      console.log('   Error:', error.message);
    }
    
    await prisma.$disconnect();
    
    console.log('\n========================================');
    console.log('Diagnostic Complete');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Error during diagnostic:');
    console.error(error.message);
    console.log('\n');
    process.exit(1);
  }
}

checkPrismaStatus();

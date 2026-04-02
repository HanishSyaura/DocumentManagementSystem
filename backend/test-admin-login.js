const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...\n');

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@company.com' },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found with email: admin@company.com');
      return;
    }

    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', `${user.firstName} ${user.lastName}`);
    console.log('   Status:', user.status);
    console.log('   Roles:', user.roles.map(r => r.role.name).join(', '));
    console.log('   Password hash:', user.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'Admin@123';
    console.log('\n🔐 Testing password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password is CORRECT\n');
      console.log('📝 Login credentials:');
      console.log('   Email: admin@company.com');
      console.log('   Password: Admin@123');
    } else {
      console.log('❌ Password is INCORRECT');
      console.log('   The stored hash does not match the test password');
      
      // Try to create a new hash for comparison
      console.log('\n🔧 Creating new hash for comparison...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('   New hash:', newHash.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@company.com' },
      include: { roles: { include: { role: true } } }
    });
    
    if (user) {
      console.log('✅ User found:', user.email);
      console.log('Roles:', user.roles.map(r => r.role.name).join(', '));
      console.log('Status:', user.status);
    } else {
      console.log('❌ User NOT found');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();

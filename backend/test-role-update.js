const http = require('http');

function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@company.com',
      password: 'Admin@123'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.data?.accessToken);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getRoles(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/roles',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function updateRole(token, roleId, updateData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(updateData);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/roles/${roleId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Testing Role Update Persistence\n');
  console.log('='.repeat(60));

  try {
    // Login
    console.log('\n1️⃣  Logging in...');
    const token = await login();
    console.log('   ✅ Logged in successfully');

    // Get current roles
    console.log('\n2️⃣  Fetching current roles...');
    const rolesResponse = await getRoles(token);
    const roles = rolesResponse.data?.roles || [];
    console.log(`   ✅ Found ${roles.length} roles`);

    // Find the Viewer role (non-system role)
    const viewerRole = roles.find(r => r.name === 'viewer');
    if (!viewerRole) {
      console.log('   ❌ Viewer role not found');
      return;
    }

    console.log(`\n3️⃣  Current Viewer role state:`);
    console.log(`   - Display Name: ${viewerRole.displayName}`);
    console.log(`   - Description: ${viewerRole.description || 'N/A'}`);
    console.log(`   - Permissions: ${viewerRole.permissions}`);

    // Update the role
    console.log('\n4️⃣  Updating Viewer role...');
    const testDescription = `Test update at ${new Date().toISOString()}`;
    const updateData = {
      displayName: 'Viewer',
      description: testDescription,
      permissions: JSON.stringify({
        dashboard: { view: true },
        documents: { view: true, create: false }
      })
    };

    const updateResult = await updateRole(token, viewerRole.id, updateData);
    console.log(`   Status: ${updateResult.status}`);
    
    if (updateResult.status === 200 && updateResult.data.success) {
      console.log('   ✅ Role updated successfully');
    } else {
      console.log('   ❌ Role update failed');
      console.log('   Response:', JSON.stringify(updateResult.data, null, 2));
      return;
    }

    // Fetch roles again to verify persistence
    console.log('\n5️⃣  Fetching roles again to verify...');
    const verifyResponse = await getRoles(token);
    const verifyRoles = verifyResponse.data?.roles || [];
    const updatedRole = verifyRoles.find(r => r.id === viewerRole.id);

    if (updatedRole) {
      console.log('   ✅ Role found in database');
      console.log(`\n📋 Updated Viewer role:`);
      console.log(`   - Display Name: ${updatedRole.displayName}`);
      console.log(`   - Description: ${updatedRole.description}`);
      console.log(`   - Permissions: ${updatedRole.permissions}`);

      if (updatedRole.description === testDescription) {
        console.log('\n✅ SUCCESS: Changes persisted to database!');
      } else {
        console.log('\n❌ FAILURE: Changes did NOT persist');
        console.log(`   Expected: ${testDescription}`);
        console.log(`   Got: ${updatedRole.description}`);
      }
    } else {
      console.log('   ❌ Role not found after update');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

runTest();

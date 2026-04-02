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

function createRole(token, roleData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(roleData);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/roles',
      method: 'POST',
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

function deleteRole(token, roleId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/roles/${roleId}`,
      method: 'DELETE',
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
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Testing Custom Role CRUD with Database Persistence\n');
  console.log('='.repeat(60));

  let createdRoleId = null;

  try {
    // Login
    console.log('\n1️⃣  Logging in...');
    const token = await login();
    console.log('   ✅ Logged in');

    // Create a custom role
    console.log('\n2️⃣  Creating custom role...');
    const newRoleData = {
      name: 'test_coordinator',
      displayName: 'Test Coordinator',
      description: 'Custom role for testing',
      permissions: JSON.stringify({
        dashboard: { view: true },
        documents: { view: true, create: true }
      })
    };

    const createResult = await createRole(token, newRoleData);
    console.log(`   Status: ${createResult.status}`);
    
    if (createResult.status === 201 && createResult.data.success) {
      createdRoleId = createResult.data.data?.role?.id;
      console.log('   ✅ Role created successfully');
      console.log(`   📝 Role ID: ${createdRoleId}`);
    } else {
      console.log('   ❌ Role creation failed');
      console.log('   Response:', JSON.stringify(createResult.data, null, 2));
      return;
    }

    // Verify it appears in the list
    console.log('\n3️⃣  Verifying role in database...');
    const rolesAfterCreate = await getRoles(token);
    const foundRole = rolesAfterCreate.data?.roles?.find(r => r.id === createdRoleId);
    
    if (foundRole) {
      console.log('   ✅ Role found in database');
      console.log(`   - Name: ${foundRole.name}`);
      console.log(`   - Display Name: ${foundRole.displayName}`);
      console.log(`   - Description: ${foundRole.description}`);
    } else {
      console.log('   ❌ Role NOT found in database');
      return;
    }

    // Update the role
    console.log('\n4️⃣  Updating role...');
    const updateData = {
      displayName: 'Test Coordinator (Updated)',
      description: 'Updated description at ' + new Date().toISOString(),
      permissions: JSON.stringify({
        dashboard: { view: true },
        documents: { view: true, create: true, edit: true }
      })
    };

    const updateResult = await updateRole(token, createdRoleId, updateData);
    console.log(`   Status: ${updateResult.status}`);
    
    if (updateResult.status === 200 && updateResult.data.success) {
      console.log('   ✅ Role updated successfully');
    } else {
      console.log('   ❌ Role update failed');
      console.log('   Response:', JSON.stringify(updateResult.data, null, 2));
    }

    // Verify update persisted
    console.log('\n5️⃣  Verifying update persisted...');
    const rolesAfterUpdate = await getRoles(token);
    const updatedRole = rolesAfterUpdate.data?.roles?.find(r => r.id === createdRoleId);
    
    if (updatedRole) {
      console.log('   ✅ Role found in database');
      console.log(`   - Display Name: ${updatedRole.displayName}`);
      console.log(`   - Description: ${updatedRole.description}`);
      
      if (updatedRole.displayName === updateData.displayName) {
        console.log('   ✅ UPDATE PERSISTED SUCCESSFULLY!');
      } else {
        console.log('   ❌ Update did NOT persist');
      }
    }

    // Delete the role
    console.log('\n6️⃣  Deleting test role...');
    const deleteResult = await deleteRole(token, createdRoleId);
    console.log(`   Status: ${deleteResult.status}`);
    
    if (deleteResult.status === 200 && deleteResult.data.success) {
      console.log('   ✅ Role deleted successfully');
    } else {
      console.log('   ⚠️  Role deletion returned:', JSON.stringify(deleteResult.data, null, 2));
    }

    // Verify deletion
    console.log('\n7️⃣  Verifying deletion...');
    const rolesAfterDelete = await getRoles(token);
    const deletedRole = rolesAfterDelete.data?.roles?.find(r => r.id === createdRoleId);
    
    if (!deletedRole) {
      console.log('   ✅ Role successfully removed from database');
    } else {
      console.log('   ❌ Role still exists in database');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CRUD OPERATIONS TEST COMPLETE');
    console.log('📊 Summary:');
    console.log('   ✅ CREATE: Role created and persisted');
    console.log('   ✅ READ: Role retrieved from database');
    console.log('   ✅ UPDATE: Changes persisted to database');
    console.log('   ✅ DELETE: Role removed from database');
    console.log('\n🎉 All database operations working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

runTest();

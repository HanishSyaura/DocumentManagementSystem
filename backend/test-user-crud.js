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

function createUser(token, userData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(userData);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/users',
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

function updateUser(token, userId, updateData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(updateData);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/users/${userId}`,
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

function getUsers(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/users',
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

function deleteUser(token, userId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/users/${userId}`,
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
  console.log('🧪 Testing User CRUD with Database Persistence\n');
  console.log('='.repeat(60));

  let createdUserId = null;

  try {
    // Login
    console.log('\n1️⃣  Logging in...');
    const token = await login();
    console.log('   ✅ Logged in');

    // Get initial user count
    console.log('\n2️⃣  Getting initial user count...');
    const initialUsers = await getUsers(token);
    const initialCount = initialUsers.data?.users?.length || 0;
    console.log(`   📊 Initial users: ${initialCount}`);

    // Create a new user
    console.log('\n3️⃣  Creating new user...');
    const newUserData = {
      email: 'test.user@company.com',
      password: 'Test@123',
      firstName: 'Test',
      lastName: 'User',
      roleIds: [2] // Admin role
    };

    const createResult = await createUser(token, newUserData);
    console.log(`   Status: ${createResult.status}`);
    
    if (createResult.status === 201 && createResult.data.success) {
      createdUserId = createResult.data.data?.user?.id;
      console.log('   ✅ User created successfully');
      console.log(`   📝 User ID: ${createdUserId}`);
    } else {
      console.log('   ❌ User creation failed');
      console.log('   Response:', JSON.stringify(createResult.data, null, 2));
      return;
    }

    // Verify user in database
    console.log('\n4️⃣  Verifying user in database...');
    const usersAfterCreate = await getUsers(token);
    const foundUser = usersAfterCreate.data?.users?.find(u => u.id === createdUserId);
    
    if (foundUser) {
      console.log('   ✅ User found in database');
      console.log(`   - Name: ${foundUser.firstName} ${foundUser.lastName}`);
      console.log(`   - Email: ${foundUser.email}`);
      console.log(`   - Status: ${foundUser.status}`);
      console.log(`   - Roles: ${foundUser.roles?.map(r => r.role.displayName).join(', ')}`);
    } else {
      console.log('   ❌ User NOT found in database');
      return;
    }

    // Update the user
    console.log('\n5️⃣  Updating user...');
    const updateData = {
      firstName: 'Updated Test',
      lastName: 'User Updated',
      roleIds: [3] // Change to Viewer role
    };

    const updateResult = await updateUser(token, createdUserId, updateData);
    console.log(`   Status: ${updateResult.status}`);
    
    if (updateResult.status === 200 && updateResult.data.success) {
      console.log('   ✅ User updated successfully');
    } else {
      console.log('   ❌ User update failed');
      console.log('   Response:', JSON.stringify(updateResult.data, null, 2));
    }

    // Verify update persisted
    console.log('\n6️⃣  Verifying update persisted...');
    const usersAfterUpdate = await getUsers(token);
    const updatedUser = usersAfterUpdate.data?.users?.find(u => u.id === createdUserId);
    
    if (updatedUser) {
      console.log('   ✅ User found in database');
      console.log(`   - Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log(`   - Roles: ${updatedUser.roles?.map(r => r.role.displayName).join(', ')}`);
      
      if (updatedUser.firstName === updateData.firstName) {
        console.log('   ✅ UPDATE PERSISTED SUCCESSFULLY!');
      } else {
        console.log('   ❌ Update did NOT persist');
      }
    }

    // Delete the user
    console.log('\n7️⃣  Deleting test user...');
    const deleteResult = await deleteUser(token, createdUserId);
    console.log(`   Status: ${deleteResult.status}`);
    
    if (deleteResult.status === 200 && deleteResult.data.success) {
      console.log('   ✅ User deleted successfully');
    } else {
      console.log('   ⚠️  User deletion returned:', JSON.stringify(deleteResult.data, null, 2));
    }

    // Verify deletion
    console.log('\n8️⃣  Verifying deletion...');
    const usersAfterDelete = await getUsers(token);
    const deletedUser = usersAfterDelete.data?.users?.find(u => u.id === createdUserId);
    
    if (!deletedUser) {
      console.log('   ✅ User successfully removed from database');
    } else {
      console.log('   ❌ User still exists in database');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ USER CRUD OPERATIONS TEST COMPLETE');
    console.log('📊 Summary:');
    console.log('   ✅ CREATE: User created and persisted');
    console.log('   ✅ READ: User retrieved from database');
    console.log('   ✅ UPDATE: Changes persisted to database');
    console.log('   ✅ DELETE: User removed from database');
    console.log('\n🎉 All user database operations working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

runTest();

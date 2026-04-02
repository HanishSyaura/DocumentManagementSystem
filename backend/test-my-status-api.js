const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testMyStatusAPI() {
  try {
    console.log('=== Testing My Document Status API ===\n');

    // 1. Login as user ID 1 (owner of the NDR)
    console.log('1. Logging in as admin (user ID 1)...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@dms.com',
      password: 'Admin@123'
    });

    const token = loginRes.data.token;
    const userId = loginRes.data.user?.id || loginRes.data.id;
    console.log(`✓ Logged in as user ID: ${userId}\n`);

    // 2. Call My Document Status API
    console.log('2. Calling /api/documents/my-status...');
    const response = await axios.get(`${API_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    });

    console.log(`✓ API Response received`);
    console.log(`Status: ${response.status}`);
    console.log(`\nResponse structure:`, Object.keys(response.data));
    
    const documents = response.data.documents || response.data.data?.documents || [];
    console.log(`\nTotal documents returned: ${documents.length}\n`);

    // 3. Check for NDR documents
    const ndrDocs = documents.filter(doc => 
      doc.rawStatus === 'PENDING_ACKNOWLEDGMENT' ||
      doc.status === 'Pending Acknowledgment' ||
      doc.stage === 'ACKNOWLEDGMENT'
    );

    console.log(`NDR documents in response: ${ndrDocs.length}`);

    if (ndrDocs.length > 0) {
      console.log('\n✓ NDR Documents found:');
      ndrDocs.forEach((doc, i) => {
        console.log(`\n${i + 1}. ${doc.title}`);
        console.log(`   File Code: ${doc.fileCode}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Raw Status: ${doc.rawStatus}`);
        console.log(`   Stage: ${doc.stage}`);
      });
    } else {
      console.log('\n✗ NO NDR documents in API response!');
      console.log('\nAll documents in response:');
      documents.forEach((doc, i) => {
        console.log(`\n${i + 1}. ${doc.title}`);
        console.log(`   File Code: ${doc.fileCode}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Raw Status: ${doc.rawStatus}`);
        console.log(`   Stage: ${doc.stage}`);
      });
    }

    // 4. Check specific document ID 10
    console.log('\n\n3. Looking for document ID 10 (MoM123)...');
    const doc10 = documents.find(doc => doc.id === 10);
    
    if (doc10) {
      console.log('✓ Found document ID 10!');
      console.log(JSON.stringify(doc10, null, 2));
    } else {
      console.log('✗ Document ID 10 NOT found in response');
      console.log('\nDocument IDs in response:', documents.map(d => d.id));
    }

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMyStatusAPI();

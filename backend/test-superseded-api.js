const axios = require('axios');

async function testSupersedeObsoleteAPI() {
  console.log('=== Testing Superseded/Obsolete API ===\n');
  
  try {
    // First, get a token by logging in
    console.log('Step 1: Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Admin@123'
    });
    
    const token = loginRes.data.token;
    console.log('✓ Login successful\n');
    
    // Test the superseded-obsolete endpoint
    console.log('Step 2: Fetching superseded/obsolete documents...');
    const res = await axios.get('http://localhost:5000/api/documents/superseded-obsolete', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ API call successful\n');
    console.log('Response:', JSON.stringify(res.data, null, 2));
    
    const documents = res.data.data?.documents || res.data.documents || [];
    console.log(`\n✓ Found ${documents.length} documents`);
    
    if (documents.length > 0) {
      console.log('\nDocuments:');
      documents.forEach((doc, idx) => {
        console.log(`\n${idx + 1}. ${doc.fileCode} - ${doc.title}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Type: ${doc.documentType}`);
        console.log(`   Owner: ${doc.owner || 'N/A'}`);
        console.log(`   Obsolete Date: ${doc.obsoleteDate || 'N/A'}`);
        console.log(`   Reason: ${doc.reason || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSupersedeObsoleteAPI();

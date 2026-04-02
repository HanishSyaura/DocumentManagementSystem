const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testMyStatusResponse() {
  try {
    console.log('=== Testing /documents/my-status Response ===\n');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@dms.com',
      password: 'Admin@123'
    });

    const token = loginRes.data.token;
    console.log('✓ Logged in\n');

    // 2. Call the API
    console.log('2. Calling /documents/my-status...');
    const response = await axios.get(`${API_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    });

    console.log('✓ Response received\n');
    console.log('Response structure:', Object.keys(response.data));
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);

    const documents = response.data.data?.documents || response.data.documents || [];
    console.log(`\nTotal documents: ${documents.length}\n`);

    // 3. Check each document's documentType
    console.log('=== Document Types Check ===\n');
    documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  File Code: ${doc.fileCode}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Document Type: "${doc.documentType}" (type: ${typeof doc.documentType})`);
      console.log(`  Raw Status: ${doc.rawStatus}`);
      console.log(`  Stage: ${doc.stage}`);
      
      if (!doc.documentType || doc.documentType === '' || doc.documentType === null) {
        console.log(`  ⚠️  WARNING: Document Type is empty/null!`);
      }
      console.log('');
    });

    // 4. Check for valid file codes with document types
    const validDocs = documents.filter(doc => 
      doc.fileCode && 
      !doc.fileCode.startsWith('PENDING-') && 
      doc.fileCode !== '-' &&
      doc.documentType &&
      doc.documentType !== '' &&
      doc.documentType !== null
    );

    console.log(`\n=== Documents with Valid File Codes and Types ===`);
    console.log(`Found: ${validDocs.length}\n`);
    validDocs.forEach(doc => {
      console.log(`  ${doc.fileCode} - ${doc.title}`);
      console.log(`    Type: "${doc.documentType}"`);
    });

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testMyStatusResponse();

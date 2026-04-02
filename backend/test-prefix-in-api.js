const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

// Test credentials
const testUser = {
  email: 'admin@company.com',
  password: 'Admin@123'
};

async function testPrefixInAPI() {
  try {
    console.log('=== Testing Document Type Prefix in API Response ===\n');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    // Check different possible token paths
    const token = loginRes.data.data?.token || loginRes.data.data?.accessToken || loginRes.data.token || loginRes.data.accessToken;
    console.log('✓ Login successful');
    console.log('Token:', token ? 'Found' : 'Not found');
    console.log('');

    // 2. Fetch documents from my-status
    console.log('2. Fetching documents from /api/documents/my-status...');
    const docsRes = await axios.get(`${API_BASE_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 10 }
    });

    console.log('\nRaw API Response Structure:');
    console.log('docsRes.data:', JSON.stringify(docsRes.data, null, 2));
    console.log('');

    const documents = docsRes.data.data?.documents || docsRes.data.documents || [];
    console.log(`✓ Total documents fetched: ${documents.length}\n`);

    // 3. Analyze each document
    console.log('3. Document Analysis:');
    console.log('='.repeat(80));
    
    documents.forEach((doc, index) => {
      console.log(`\nDocument #${index + 1}:`);
      console.log(`  File Code: ${doc.fileCode}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Document Type: ${doc.documentType || 'NULL'}`);
      console.log(`  Document Type Prefix: ${doc.documentTypePrefix || 'NULL'}`);
      console.log(`  Status: ${doc.status}`);
      console.log(`  Raw Status: ${doc.rawStatus}`);
      
      // Check if prefix matches file code
      if (doc.documentTypePrefix && doc.fileCode && doc.fileCode !== '-') {
        const fileCodePrefix = doc.fileCode.split('/')[0];
        const matches = fileCodePrefix === doc.documentTypePrefix;
        console.log(`  File Code Prefix: ${fileCodePrefix}`);
        console.log(`  Match: ${matches ? '✓ YES' : '✗ NO'}`);
      } else {
        console.log(`  Warning: Missing prefix or file code`);
      }
    });

    console.log('\n' + '='.repeat(80));

    // 4. Test filtering simulation
    console.log('\n4. Simulating Frontend Filter:');
    console.log('='.repeat(80));
    
    // Test for "Minutes of Meeting" (should have prefix "MOM")
    console.log('\nTest Case: Document Type = "Minutes of Meeting" (Expected Prefix: MOM)');
    const momDocs = documents.filter(doc => {
      const hasValidFileCode = doc.fileCode && !doc.fileCode.startsWith('PENDING-') && doc.fileCode !== '-';
      const hasDocType = doc.documentType && doc.documentType !== null;
      const matchesType = hasDocType && doc.fileCode && doc.fileCode.startsWith('MOM/');
      return hasValidFileCode && matchesType;
    });
    console.log(`  Filtered Count: ${momDocs.length}`);
    momDocs.forEach(doc => {
      console.log(`    - ${doc.fileCode}: ${doc.title}`);
    });

    // Test for "Terms of Service" (should have prefix "TS")
    console.log('\nTest Case: Document Type = "Terms of Service" (Expected Prefix: TS)');
    const tsDocs = documents.filter(doc => {
      const hasValidFileCode = doc.fileCode && !doc.fileCode.startsWith('PENDING-') && doc.fileCode !== '-';
      const hasDocType = doc.documentType && doc.documentType !== null;
      const matchesType = hasDocType && doc.fileCode && doc.fileCode.startsWith('TS/');
      return hasValidFileCode && matchesType;
    });
    console.log(`  Filtered Count: ${tsDocs.length}`);
    tsDocs.forEach(doc => {
      console.log(`    - ${doc.fileCode}: ${doc.title}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✓ Test completed successfully!');

  } catch (error) {
    console.error('\n✗ Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPrefixInAPI();

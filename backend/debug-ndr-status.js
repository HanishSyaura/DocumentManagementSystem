const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function debugNDRStatus() {
  try {
    console.log('=== Debugging NDR Documents in My Document Status ===\n');

    // 1. Login
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@dms.com',
      password: 'Admin@123'
    });

    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log(`✓ Logged in as user ID: ${userId}\n`);

    // 2. Get all documents for this user
    console.log('2. Fetching My Document Status...');
    const myDocsRes = await axios.get(`${API_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    });

    const allDocs = myDocsRes.data.documents;
    console.log(`Total documents: ${allDocs.length}\n`);

    // 3. Check for NDR/Pending Acknowledgment documents
    const ndrDocs = allDocs.filter(doc => 
      doc.rawStatus === 'PENDING_ACKNOWLEDGMENT' || 
      doc.status === 'Pending Acknowledgment' ||
      doc.stage === 'ACKNOWLEDGMENT'
    );

    console.log(`Documents with PENDING_ACKNOWLEDGMENT status: ${ndrDocs.length}`);
    
    if (ndrDocs.length > 0) {
      console.log('\nNDR Documents found:');
      ndrDocs.forEach((doc, index) => {
        console.log(`\n--- NDR Document ${index + 1} ---`);
        console.log(`File Code: ${doc.fileCode}`);
        console.log(`Title: ${doc.title}`);
        console.log(`Status: ${doc.status}`);
        console.log(`Raw Status: ${doc.rawStatus}`);
        console.log(`Stage: ${doc.stage}`);
      });
    } else {
      console.log('\n⚠ No NDR documents found in My Document Status!');
    }

    // 4. Check document requests endpoint
    console.log('\n\n3. Checking Document Requests (NDR) endpoint...');
    const requestsRes = await axios.get(`${API_URL}/documents/requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const requests = requestsRes.data.requests;
    console.log(`Total NDR requests: ${requests.length}`);
    
    if (requests.length > 0) {
      console.log('\nNDR Requests:');
      requests.forEach((req, index) => {
        console.log(`\n--- Request ${index + 1} ---`);
        console.log(`File Code: ${req.fileCode}`);
        console.log(`Title: ${req.title}`);
        console.log(`Status: ${req.status}`);
      });
    }

    // 5. Try to get all documents (without filtering by ownerId)
    console.log('\n\n4. Fetching ALL documents (admin view)...');
    const allDocsRes = await axios.get(`${API_URL}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    });

    const allSystemDocs = allDocsRes.data.documents;
    console.log(`Total system documents: ${allSystemDocs.length}`);

    // Count by status
    const statusCounts = {};
    allSystemDocs.forEach(doc => {
      const status = doc.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\nDocument count by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // 6. Create a test NDR
    console.log('\n\n5. Creating a test NDR document...');
    const createRes = await axios.post(`${API_URL}/documents/requests`, {
      title: 'Test NDR Document for Debugging',
      documentType: 'General Document',
      projectCategory: 'Internal',
      dateOfDocument: new Date().toISOString(),
      remarks: 'This is a test document to debug the My Document Status issue'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✓ Test NDR created successfully');
    console.log(`Document ID: ${createRes.data.document.id}`);
    console.log(`File Code: ${createRes.data.document.fileCode}`);
    console.log(`Status: ${createRes.data.document.status}`);
    console.log(`Stage: ${createRes.data.document.stage}`);
    console.log(`Owner ID: ${createRes.data.document.ownerId}`);
    console.log(`Created By ID: ${createRes.data.document.createdById}`);

    // 7. Verify it appears in My Document Status
    console.log('\n\n6. Verifying test NDR appears in My Document Status...');
    const verifyRes = await axios.get(`${API_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 }
    });

    const updatedDocs = verifyRes.data.documents;
    const testDoc = updatedDocs.find(doc => doc.id === createRes.data.document.id);

    if (testDoc) {
      console.log('✓ Test NDR document found in My Document Status!');
      console.log(`  File Code: ${testDoc.fileCode}`);
      console.log(`  Status: ${testDoc.status}`);
      console.log(`  Stage: ${testDoc.stage}`);
    } else {
      console.log('✗ Test NDR document NOT found in My Document Status!');
      console.log('This indicates a filtering or query issue.');
    }

  } catch (error) {
    console.error('\n✗ Debug failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

debugNDRStatus();

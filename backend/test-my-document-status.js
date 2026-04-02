const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testMyDocumentStatus() {
  try {
    console.log('=== Testing My Document Status Endpoint ===\n');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@dms.com',
      password: 'Admin@123'
    });

    const token = loginRes.data.token;
    console.log('✓ Login successful\n');

    // 2. Test My Document Status endpoint
    console.log('2. Fetching My Document Status...');
    const myDocsRes = await axios.get(`${API_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 100
      }
    });

    console.log('✓ My Document Status retrieved successfully');
    console.log(`Total documents: ${myDocsRes.data.documents.length}\n`);

    // Display sample documents
    if (myDocsRes.data.documents.length > 0) {
      console.log('Sample Documents:');
      myDocsRes.data.documents.slice(0, 3).forEach((doc, index) => {
        console.log(`\n--- Document ${index + 1} ---`);
        console.log(`File Code: ${doc.fileCode}`);
        console.log(`Title: ${doc.title}`);
        console.log(`Version: ${doc.version}`);
        console.log(`Status: ${doc.status}`);
        console.log(`Raw Status: ${doc.rawStatus}`);
        console.log(`Stage: ${doc.stage}`);
        console.log(`Document Type: ${doc.documentType}`);
        console.log(`Owner: ${doc.owner}`);
        console.log(`Last Updated: ${doc.lastUpdated}`);
        console.log(`Created At: ${doc.createdAt}`);
        console.log(`Submitted At: ${doc.submittedAt || 'Not submitted'}`);
        console.log(`Reviewed At: ${doc.reviewedAt || 'Not reviewed'}`);
        console.log(`Approved At: ${doc.approvedAt || 'Not approved'}`);
        console.log(`Published At: ${doc.publishedAt || 'Not published'}`);
        console.log(`Has File: ${doc.hasFile}`);
      });
    }

    // 3. Test with status filter
    console.log('\n\n3. Testing with status filter (DRAFT)...');
    const draftDocsRes = await axios.get(`${API_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        status: 'DRAFT',
        page: 1,
        limit: 10
      }
    });

    console.log(`✓ Draft documents: ${draftDocsRes.data.documents.length}`);

    // 4. Test with stage filter
    console.log('\n4. Testing with stage filter (REVIEW)...');
    const reviewDocsRes = await axios.get(`${API_URL}/documents/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        stage: 'REVIEW',
        page: 1,
        limit: 10
      }
    });

    console.log(`✓ Documents in review: ${reviewDocsRes.data.documents.length}`);

    // 5. Status breakdown
    console.log('\n\n5. Document Status Breakdown:');
    const statusCounts = {};
    myDocsRes.data.documents.forEach(doc => {
      statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n✓ All tests passed successfully!');
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testMyDocumentStatus();

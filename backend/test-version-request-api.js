const axios = require('axios');

async function testAPI() {
  try {
    console.log('\n=== Testing Version Requests API ===\n');
    
    // You'll need to get a valid token from your login
    // For now, let's test if the endpoint is accessible
    const baseURL = 'http://localhost:3000/api';
    
    // Test without auth to see the error
    try {
      const response = await axios.get(`${baseURL}/documents/version-requests`);
      console.log('Success! Status:', response.status);
      console.log('Data structure:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('Response error:');
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      } else if (error.request) {
        console.log('No response received');
        console.log('Request:', error.request);
      } else {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAPI();

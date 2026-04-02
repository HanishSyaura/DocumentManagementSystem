const http = require('http');

// Test /api/users endpoint
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/users',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer dummy_token_for_test'
  }
};

console.log('Testing GET /api/users endpoint...\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}\n`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();

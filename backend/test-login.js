const http = require('http');

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

console.log('Testing POST /api/auth/login endpoint...\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}\n`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      // Check token location
      console.log('\n--- Token Check ---');
      console.log('data.accessToken:', parsed.data?.accessToken ? 'EXISTS' : 'MISSING');
      console.log('data.data.accessToken:', parsed.data?.data?.accessToken ? 'EXISTS' : 'MISSING');
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();

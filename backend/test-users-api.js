const http = require('http');

// Use the token from the screenshot - you'll need to replace this with actual token from browser
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AY29tcGFueS5jb20iLCJyb2xlcyI6WyJhZG1pbiJdLCJqdGkiOiJiNjg3MjIzNDA1MWJmN2NkMzdlNzViNzM2MzlkNTM1OSIsImlhdCI6MTc2MzcxMDA1MiwiZXhwIjoxNzYzNzM4ODUyfQ.NBrajJjkb3o8JJqaRGUd8WwwlqUpHJQXiJYNrys1J70';

console.log('Testing GET /api/users with authentication...\n');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/users',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
};

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
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();

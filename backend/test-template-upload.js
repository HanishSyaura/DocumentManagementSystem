const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function testTemplateUpload() {
  try {
    // First, login to get token
    console.log('1. Logging in...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@company.com',
      password: 'System'
    });
    
    const token = loginRes.data.data.token;
    console.log('✓ Login successful');
    
    // Get document types
    console.log('\n2. Fetching document types...');
    const docTypesRes = await axios.get('http://localhost:3000/api/system/config/document-types', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const documentTypes = docTypesRes.data.data.documentTypes;
    console.log('✓ Document types:', documentTypes.map(dt => `${dt.id}: ${dt.name}`));
    
    if (documentTypes.length === 0) {
      console.error('✗ No document types found! Please create at least one document type first.');
      return;
    }
    
    const firstDocType = documentTypes[0];
    console.log(`\n3. Using document type: ${firstDocType.name} (ID: ${firstDocType.id})`);
    
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-template.txt');
    fs.writeFileSync(testFilePath, 'This is a test template file');
    
    // Create FormData
    console.log('\n4. Creating template upload request...');
    const formData = new FormData();
    formData.append('documentTypeId', firstDocType.id.toString());
    formData.append('templateName', 'Test Template');
    formData.append('version', '1.0');
    formData.append('uploadedBy', 'Test User');
    formData.append('files', fs.createReadStream(testFilePath));
    
    console.log('FormData fields:', {
      documentTypeId: firstDocType.id,
      templateName: 'Test Template',
      version: '1.0',
      uploadedBy: 'Test User'
    });
    
    // Upload template
    console.log('\n5. Uploading template...');
    const uploadRes = await axios.post('http://localhost:3000/api/templates', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✓ Template uploaded successfully!');
    console.log('Response:', JSON.stringify(uploadRes.data, null, 2));
    
    // Cleanup
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('\n✗ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testTemplateUpload();

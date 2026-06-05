// Test script for API endpoints
const fetch = require('node-fetch');

async function testRateAPI() {
  console.log('🧪 Testing Rate API...');
  try {
    const response = await fetch('http://localhost:3000/api/fetch-rate');
    const data = await response.json();
    console.log('✅ Rate API Response:', data);
  } catch (error) {
    console.error('❌ Rate API Error:', error.message);
  }
}

async function testSubmitAPI() {
  console.log('🧪 Testing Submit API...');
  try {
    // Create a test FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('fullName', 'Test User');
    formData.append('mobileNumber', '0241234567');
    formData.append('referralName', 'Test Referral');
    formData.append('ghsAmount', '100');
    formData.append('rmbAmount', '185');
    
    // Create a dummy file for testing
    const fs = require('fs');
    const testImagePath = './public/placeholder.jpg'; // Use any image file
    
    if (fs.existsSync(testImagePath)) {
      formData.append('alipayQR', fs.createReadStream(testImagePath));
    } else {
      console.log('⚠️ No test image found, skipping QR upload test');
    }

    const response = await fetch('http://localhost:3000/api/submit-transaction', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('✅ Submit API Response:', data);
  } catch (error) {
    console.error('❌ Submit API Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  await testRateAPI();
  console.log('');
  await testSubmitAPI();
  console.log('\n✅ Tests completed!');
}

runTests(); 
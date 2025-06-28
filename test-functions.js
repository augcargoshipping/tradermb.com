// Simple test script for Netlify Functions
const fetch = require('node-fetch');

// Mock event and context for testing
const mockEvent = {
  httpMethod: 'GET',
  headers: {},
  body: null
};

const mockContext = {};

// Test fetch-rate function
async function testFetchRate() {
  console.log('🧪 Testing fetch-rate function...');
  
  try {
    // Import the function
    const { handler } = require('./netlify/functions/fetch-rate');
    
    // Call the function
    const result = await handler(mockEvent, mockContext);
    
    console.log('✅ Fetch-rate result:', JSON.parse(result.body));
  } catch (error) {
    console.error('❌ Fetch-rate error:', error.message);
  }
}

// Test submit-transaction function
async function testSubmitTransaction() {
  console.log('🧪 Testing submit-transaction function...');
  
  try {
    // Import the function
    const { handler } = require('./netlify/functions/submit-transaction');
    
    // Mock POST event
    const postEvent = {
      ...mockEvent,
      httpMethod: 'POST',
      body: JSON.stringify({
        customerName: 'Test User',
        mobileNumber: '0241234567',
        referralName: 'Test Referral',
        ghsAmount: '100',
        rmbAmount: '185',
        referenceCode: 'TEST123'
      })
    };
    
    // Call the function
    const result = await handler(postEvent, mockContext);
    
    console.log('✅ Submit-transaction result:', JSON.parse(result.body));
  } catch (error) {
    console.error('❌ Submit-transaction error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting function tests...\n');
  
  await testFetchRate();
  console.log('');
  await testSubmitTransaction();
  
  console.log('\n✅ Tests completed!');
}

runTests(); 
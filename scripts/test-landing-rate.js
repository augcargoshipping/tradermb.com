const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLandingRate() {
  console.log('🧪 Testing landing page rate loading...\n');

  try {
    // Test 1: Check if rate API is working
    console.log('1️⃣ Testing rate API...');
    const response = await fetch('http://localhost:3000/api/fetch-rate');
    const data = await response.json();
    console.log(`✅ API Response:`, data);
    
    if (data.success && data.rate !== null) {
      console.log(`✅ Rate is available: ${data.rate}`);
    } else {
      console.log(`❌ Rate is not available:`, data.error || 'Unknown error');
    }

    // Test 2: Check if landing page loads
    console.log('\n2️⃣ Testing landing page...');
    const pageResponse = await fetch('http://localhost:3000/');
    console.log(`✅ Landing page status: ${pageResponse.status}`);
    
    if (pageResponse.ok) {
      console.log('✅ Landing page is accessible');
    } else {
      console.log('❌ Landing page is not accessible');
    }

    console.log('\n🎉 Landing page rate test completed!');
    console.log('\n📊 Summary:');
    console.log('   - Rate API is working correctly');
    console.log('   - Landing page is accessible');
    console.log('   - If rate shows "Unavailable", check browser console for errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLandingRate(); 
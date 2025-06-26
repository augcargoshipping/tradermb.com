// Test script to verify rate functionality
async function testRateFunctionality() {
  console.log('🧪 Testing Rate Functionality...\n');

  try {
    // Test 1: Fetch current rate
    console.log('1️⃣ Testing rate fetching...');
    const fetchResponse = await fetch('http://localhost:3000/api/fetch-rate');
    const fetchResult = await fetchResponse.json();
    
    if (fetchResult.success) {
      console.log(`✅ Rate fetched successfully: ${fetchResult.rate}`);
    } else {
      console.log(`❌ Rate fetch failed: ${fetchResult.error}`);
    }

    // Test 2: Set a new rate
    console.log('\n2️⃣ Testing rate setting...');
    const newRate = 0.55; // Slightly different rate for testing
    const setResponse = await fetch('http://localhost:3000/api/set-rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rate: newRate }),
    });
    
    const setResult = await setResponse.json();
    
    if (setResult.success) {
      console.log(`✅ Rate set successfully to: ${newRate}`);
    } else {
      console.log(`❌ Rate setting failed: ${setResult.error}`);
    }

    // Test 3: Fetch the updated rate
    console.log('\n3️⃣ Testing updated rate fetching...');
    const updatedFetchResponse = await fetch('http://localhost:3000/api/fetch-rate');
    const updatedFetchResult = await updatedFetchResponse.json();
    
    if (updatedFetchResult.success) {
      console.log(`✅ Updated rate fetched: ${updatedFetchResult.rate}`);
      if (updatedFetchResult.rate === newRate) {
        console.log('✅ Rate update confirmed!');
      } else {
        console.log('⚠️ Rate update not reflected yet');
      }
    } else {
      console.log(`❌ Updated rate fetch failed: ${updatedFetchResult.error}`);
    }

    console.log('\n🎉 Rate functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Wait a bit for the server to start, then run the test
setTimeout(testRateFunctionality, 2000); 
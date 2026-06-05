async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality...\n');

  try {
    // Test 1: Forgot Password API
    console.log('📧 Testing Forgot Password API...');
    const forgotResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com' // Replace with a real email for testing
      }),
    });

    const forgotData = await forgotResponse.json();
    console.log(`📊 Forgot Password Response Status: ${forgotResponse.status}`);
    console.log(`📊 Response:`, JSON.stringify(forgotData, null, 2));

    if (forgotResponse.ok) {
      console.log('✅ Forgot Password API is working!');
    } else {
      console.log('❌ Forgot Password API failed');
    }

    // Test 2: Reset Password API (with invalid token)
    console.log('\n🔐 Testing Reset Password API (with invalid token)...');
    const resetResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'newpassword123'
      }),
    });

    const resetData = await resetResponse.json();
    console.log(`📊 Reset Password Response Status: ${resetResponse.status}`);
    console.log(`📊 Response:`, JSON.stringify(resetData, null, 2));

    if (resetResponse.status === 400) {
      console.log('✅ Reset Password API correctly rejected invalid token!');
    } else {
      console.log('⚠️ Reset Password API response unexpected');
    }

    // Test 3: Check if pages are accessible
    console.log('\n🌐 Testing Password Reset Pages...');
    
    const forgotPageResponse = await fetch('http://localhost:3000/auth/forgot-password');
    console.log(`📊 Forgot Password Page Status: ${forgotPageResponse.status}`);
    
    const resetPageResponse = await fetch('http://localhost:3000/auth/reset-password?token=test');
    console.log(`📊 Reset Password Page Status: ${resetPageResponse.status}`);

    if (forgotPageResponse.ok && resetPageResponse.ok) {
      console.log('✅ Password reset pages are accessible!');
    } else {
      console.log('❌ Some password reset pages are not accessible');
    }

    console.log('\n📋 Summary:');
    console.log('- Forgot Password API: ' + (forgotResponse.ok ? '✅ Working' : '❌ Failed'));
    console.log('- Reset Password API: ' + (resetResponse.status === 400 ? '✅ Working' : '⚠️ Check'));
    console.log('- Pages Accessible: ' + (forgotPageResponse.ok && resetPageResponse.ok ? '✅ Yes' : '❌ No'));

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testPasswordReset(); 
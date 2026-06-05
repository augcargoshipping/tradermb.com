async function testPasswordResetFlow() {
  console.log('🧪 Testing Complete Password Reset Flow...\n');

  // Replace with a real email address that exists in your system
  const testEmail = 'your-test-email@example.com'; // CHANGE THIS TO A REAL EMAIL
  
  try {
    console.log(`📧 Testing password reset for: ${testEmail}`);
    
    // Step 1: Request password reset
    console.log('\n1️⃣ Requesting password reset...');
    const forgotResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const forgotData = await forgotResponse.json();
    console.log(`📊 Response:`, JSON.stringify(forgotData, null, 2));

    if (forgotResponse.ok) {
      console.log('✅ Password reset request successful!');
      
      if (forgotData.message.includes('check console')) {
        console.log('\n📋 For development mode:');
        console.log('- Check the server console for the reset link');
        console.log('- Copy the reset URL and test it manually');
        console.log('- The reset link will be valid for 1 hour');
      } else {
        console.log('📧 Email should be sent to the provided address');
      }
    } else {
      console.log('❌ Password reset request failed');
      return;
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Check your email (or server console for development)');
    console.log('2. Click the reset link in the email');
    console.log('3. Enter a new password on the reset page');
    console.log('4. Try signing in with the new password');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testPasswordResetFlow(); 
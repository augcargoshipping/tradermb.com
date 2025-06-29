const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testDashboardEndpoints() {
  console.log('🧪 Testing Dashboard API Endpoints...\n');

  // Test 1: Check if server is running
  try {
    const response = await fetch(`${BASE_URL}/api/check-env`);
    if (response.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server is not responding properly');
      return;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return;
  }

  // Test 2: Test user orders endpoint (will fail without auth, but should return proper error)
  try {
    const response = await fetch(`${BASE_URL}/api/user/orders?userId=test`);
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ User orders endpoint is working (returns proper error for invalid user)');
    } else if (response.ok) {
      console.log('✅ User orders endpoint is working');
    } else {
      console.log(`⚠️ User orders endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ User orders endpoint error:', error.message);
  }

  // Test 3: Test update profile endpoint (will fail without auth, but should return proper error)
  try {
    const formData = new FormData();
    formData.append('userId', 'test');
    formData.append('name', 'Test User');
    formData.append('email', 'test@example.com');

    const response = await fetch(`${BASE_URL}/api/user/update-profile`, {
      method: 'POST',
      body: formData,
    });
    
    if (response.status === 400 || response.status === 404) {
      console.log('✅ Update profile endpoint is working (returns proper error for invalid user)');
    } else if (response.ok) {
      console.log('✅ Update profile endpoint is working');
    } else {
      console.log(`⚠️ Update profile endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Update profile endpoint error:', error.message);
  }

  // Test 4: Test change password endpoint (will fail without auth, but should return proper error)
  try {
    const response = await fetch(`${BASE_URL}/api/user/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test',
        currentPassword: 'test',
        newPassword: 'newtest',
      }),
    });
    
    if (response.status === 400 || response.status === 404) {
      console.log('✅ Change password endpoint is working (returns proper error for invalid user)');
    } else if (response.ok) {
      console.log('✅ Change password endpoint is working');
    } else {
      console.log(`⚠️ Change password endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Change password endpoint error:', error.message);
  }

  console.log('\n🎉 Dashboard API testing completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Visit http://localhost:3000');
  console.log('2. Click "Sign In" to create an account or login');
  console.log('3. After authentication, click "Dashboard" to access your dashboard');
  console.log('4. Test the profile editing and order viewing features');
}

testDashboardEndpoints().catch(console.error); 
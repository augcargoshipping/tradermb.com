async function testUserOrders() {
  console.log('🧪 Testing User Orders API...\n');

  try {
    // Test with a sample user ID
    const userId = 'USER_1751131442951_hepgrs5oi'; // This should match a user in your system
    
    console.log(`📋 Testing orders for user: ${userId}`);
    
    const response = await fetch(`http://localhost:3000/api/user/orders?userId=${userId}`);
    const data = await response.json();
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response data:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ User orders API is working correctly!');
      if (data.orders && data.orders.length > 0) {
        console.log(`📈 Found ${data.orders.length} orders for this user`);
        data.orders.forEach((order, index) => {
          console.log(`  ${index + 1}. ${order.fields.Customer_Name} - ${order.fields.Reference_Code} - ${order.fields.Status}`);
        });
      } else {
        console.log('📭 No orders found for this user (this is normal if they haven\'t made any transactions)');
      }
    } else {
      console.log('❌ User orders API failed');
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testUserOrders(); 
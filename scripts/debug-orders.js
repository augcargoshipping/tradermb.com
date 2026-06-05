require('dotenv').config({ path: '.env.local' });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugOrders() {
  console.log('🔍 Debugging Airtable orders...\n');

  try {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    
    console.log(`🔑 Environment check:`);
    console.log(`   Base ID: ${baseId ? 'SET' : 'NOT SET'}`);
    console.log(`   Token: ${token ? 'SET' : 'NOT SET'}\n`);
    
    if (!baseId || !token) {
      console.log('❌ Airtable credentials not found in .env.local');
      console.log('Please check your .env.local file has AIRTABLE_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN');
      return;
    }

    const baseUrl = `https://api.airtable.com/v0/${baseId}/CUSTOMERS`;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Get recent orders
    console.log('1️⃣ Fetching recent orders...');
    const response = await fetch(`${baseUrl}?maxRecords=10&sort[0][field]=Submitted_At&sort[0][direction]=desc`, {
      headers,
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch orders: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log(`✅ Found ${data.records?.length || 0} recent orders\n`);

    if (data.records && data.records.length > 0) {
      console.log('📋 Sample order fields:');
      const sampleOrder = data.records[0];
      console.log(`   Record ID: ${sampleOrder.id}`);
      console.log(`   Reference: ${sampleOrder.fields.Reference_Code}`);
      console.log(`   Customer Name: ${sampleOrder.fields.Customer_Name}`);
      console.log(`   Mobile: ${sampleOrder.fields.Mobile_Number}`);
      console.log(`   Status: ${sampleOrder.fields.Status}`);
      console.log(`   Amount: ₵${sampleOrder.fields.GHS_Amount} → ¥${sampleOrder.fields.RMB_Amount}`);
      console.log(`   Submitted: ${sampleOrder.fields.Submitted_At}`);
      console.log(`   User ID: ${sampleOrder.fields.user_id || 'Not set'}`);
      console.log(`   All fields: ${Object.keys(sampleOrder.fields).join(', ')}\n`);

      // Check for specific user
      const targetUserId = 'USER_1751156574433_3j07x5dv0';
      console.log(`2️⃣ Checking for orders with user_id: ${targetUserId}`);
      
      const userOrders = data.records.filter(order => 
        order.fields.user_id === targetUserId
      );
      console.log(`✅ Found ${userOrders.length} orders for user ${targetUserId}`);

      if (userOrders.length === 0) {
        console.log('🔍 Checking for orders by name/phone match...');
        // Get user details first
        const usersUrl = `https://api.airtable.com/v0/${baseId}/USERS`;
        const userResponse = await fetch(`${usersUrl}?filterByFormula={User_ID}='${targetUserId}'`, {
          headers,
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.records && userData.records.length > 0) {
            const user = userData.records[0];
            console.log(`👤 User found: ${user.fields.Full_Name} (${user.fields.Email})`);
            
            // Check for orders by name
            const nameMatches = data.records.filter(order => 
              order.fields.Customer_Name === user.fields.Full_Name
            );
            console.log(`📋 Orders by name match: ${nameMatches.length}`);
            
            // Check for orders by phone
            const phoneMatches = data.records.filter(order => 
              order.fields.Mobile_Number === user.fields.Phone
            );
            console.log(`📋 Orders by phone match: ${phoneMatches.length}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugOrders(); 
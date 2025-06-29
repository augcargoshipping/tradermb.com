require('dotenv').config({ path: '.env.local' });

const Airtable = require('airtable');
const bcrypt = require('bcryptjs');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USERS_TABLE_NAME = process.env.AIRTABLE_USERS_TABLE || 'USERS';

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function testExactAuth() {
  try {
    console.log('🔍 Testing exact authentication process...');
    
    // Test credentials
    const testCredentials = [
      { email: 'kofiomega300@gmail.com', password: 'password123' },
      { email: 'omegah', password: 'password123' }
    ];
    
    for (const cred of testCredentials) {
      console.log(`\n🧪 Testing: ${cred.email} / ${cred.password}`);
      
      // Step 1: Get user by email or username
      let user = null;
      
      // Try email first
      const emailUsers = await base.table(USERS_TABLE_NAME).select({
        filterByFormula: `{Email}='${cred.email}'`
      }).all();
      
      if (emailUsers.length > 0) {
        user = emailUsers[0];
        console.log('✅ User found by email');
      } else {
        // Try username
        const usernameUsers = await base.table(USERS_TABLE_NAME).select({
          filterByFormula: `{Username}='${cred.email}'`
        }).all();
        
        if (usernameUsers.length > 0) {
          user = usernameUsers[0];
          console.log('✅ User found by username');
        } else {
          console.log('❌ User not found');
          continue;
        }
      }
      
      console.log('   User ID:', user.id);
      console.log('   Full Name:', user.fields.Full_Name);
      console.log('   Email:', user.fields.Email);
      console.log('   Username:', user.fields.Username);
      console.log('   Status:', user.fields.Status);
      console.log('   Has Password:', !!user.fields.Password);
      
      if (user.fields.Password) {
        console.log('   Password Hash Length:', user.fields.Password.length);
        console.log('   Password Hash Starts With:', user.fields.Password.substring(0, 10) + '...');
        
        // Step 2: Verify password
        const isValidPassword = await bcrypt.compare(cred.password, user.fields.Password);
        console.log('   Password Valid:', isValidPassword ? '✅ YES' : '❌ NO');
        
        if (isValidPassword) {
          console.log('🎉 AUTHENTICATION SUCCESS!');
          console.log('   This should work in the app.');
        } else {
          console.log('❌ AUTHENTICATION FAILED');
          console.log('   Password does not match.');
        }
      } else {
        console.log('❌ No password field found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExactAuth(); 
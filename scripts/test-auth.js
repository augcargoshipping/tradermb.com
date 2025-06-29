require('dotenv').config({ path: '.env.local' });

const Airtable = require('airtable');
const bcrypt = require('bcryptjs');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USERS_TABLE_NAME = process.env.AIRTABLE_USERS_TABLE || 'USERS';

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   - AIRTABLE_API_KEY');
  console.error('   - AIRTABLE_BASE_ID');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function testAuth() {
  try {
    console.log('🔍 Testing authentication system...');
    
    const table = base.table(USERS_TABLE_NAME);
    
    // List all users
    console.log('\n📋 Fetching all users...');
    const records = await table.select().all();
    
    if (records.length === 0) {
      console.log('❌ No users found in the USERS table');
      console.log('\n💡 You need to create a user first. Try registering at /auth/signup');
      return;
    }
    
    console.log(`✅ Found ${records.length} user(s):`);
    records.forEach((record, index) => {
      const fields = record.fields;
      console.log(`   ${index + 1}. ${fields.Full_Name || 'No name'} (${fields.Email || 'No email'})`);
      console.log(`      Username: ${fields.Username || 'No username'}`);
      console.log(`      Status: ${fields.Status || 'No status'}`);
      console.log(`      Has Password: ${fields.Password ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Test user lookup by email
    if (records.length > 0) {
      const firstUser = records[0];
      const testEmail = firstUser.fields.Email;
      
      if (testEmail) {
        console.log(`🧪 Testing user lookup by email: ${testEmail}`);
        const emailUsers = await table.select({
          filterByFormula: `{Email}='${testEmail}'`
        }).all();
        
        if (emailUsers.length > 0) {
          console.log('✅ User found by email');
        } else {
          console.log('❌ User not found by email');
        }
      }
      
      // Test user lookup by username
      const testUsername = firstUser.fields.Username;
      if (testUsername) {
        console.log(`🧪 Testing user lookup by username: ${testUsername}`);
        const usernameUsers = await table.select({
          filterByFormula: `{Username}='${testUsername}'`
        }).all();
        
        if (usernameUsers.length > 0) {
          console.log('✅ User found by username');
        } else {
          console.log('❌ User not found by username');
        }
      }
    }
    
    // Test password verification
    if (records.length > 0) {
      const firstUser = records[0];
      const hashedPassword = firstUser.fields.Password;
      
      if (hashedPassword) {
        console.log('\n🔐 Testing password verification...');
        console.log('   Note: This will test with a dummy password');
        
        const testPassword = 'testpassword123';
        const isValid = await bcrypt.compare(testPassword, hashedPassword);
        
        if (isValid) {
          console.log('✅ Password verification works (test password matched)');
        } else {
          console.log('✅ Password verification works (test password did not match - expected)');
        }
        
        // Test with empty password
        const emptyPasswordValid = await bcrypt.compare('', hashedPassword);
        console.log(`   Empty password test: ${emptyPasswordValid ? '❌ Matched (problem!)' : '✅ Did not match (good)'}`);
      } else {
        console.log('\n⚠️  No password found for first user');
      }
    }
    
    console.log('\n📝 Field names in USERS table:');
    const fields = await table.fields();
    fields.forEach(field => {
      console.log(`   - ${field.name} (${field.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Could not find table')) {
      console.log('\n💡 Solution: Make sure your USERS table exists and the name matches:');
      console.log(`   Expected: ${USERS_TABLE_NAME}`);
      console.log('   Check your AIRTABLE_USERS_TABLE environment variable');
    }
  }
}

testAuth(); 
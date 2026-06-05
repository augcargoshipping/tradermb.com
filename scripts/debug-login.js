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

async function debugLogin() {
  try {
    console.log('🔍 Debugging login process...');
    
    const table = base.table(USERS_TABLE_NAME);
    
    // Get the user we know exists
    const records = await table.select({
      filterByFormula: `{Email}='kofiomega300@gmail.com'`
    }).all();
    
    if (records.length === 0) {
      console.log('❌ User not found by email');
      return;
    }
    
    const user = records[0];
    console.log('✅ User found:', user.fields.Full_Name);
    console.log('   Email:', user.fields.Email);
    console.log('   Username:', user.fields.Username);
    console.log('   Status:', user.fields.Status);
    console.log('   Has Password:', !!user.fields.Password);
    
    if (user.fields.Password) {
      console.log('   Password Hash Length:', user.fields.Password.length);
      console.log('   Password Hash Starts With:', user.fields.Password.substring(0, 10) + '...');
    }
    
    // Test different password scenarios
    console.log('\n🧪 Testing password scenarios:');
    
    // Test with empty password
    const emptyResult = await bcrypt.compare('', user.fields.Password);
    console.log('   Empty password:', emptyResult ? '❌ MATCHED (BAD)' : '✅ No match (good)');
    
    // Test with common passwords
    const commonPasswords = ['password', '123456', 'password123', 'admin', 'test'];
    for (const pwd of commonPasswords) {
      const result = await bcrypt.compare(pwd, user.fields.Password);
      if (result) {
        console.log(`   "${pwd}": ✅ MATCHED!`);
      }
    }
    
    // Test with username as password
    const usernameAsPassword = await bcrypt.compare(user.fields.Username, user.fields.Password);
    console.log(`   Username as password: ${usernameAsPassword ? '✅ MATCHED!' : 'No match'}`);
    
    // Test with email as password
    const emailAsPassword = await bcrypt.compare(user.fields.Email, user.fields.Password);
    console.log(`   Email as password: ${emailAsPassword ? '✅ MATCHED!' : 'No match'}`);
    
    console.log('\n💡 Try these credentials:');
    console.log('   Email: kofiomega300@gmail.com');
    console.log('   Username: omegah');
    console.log('   Password: (try the ones that matched above)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLogin(); 
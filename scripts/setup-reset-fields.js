const Airtable = require('airtable');

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

async function setupResetFields() {
  try {
    console.log('🔍 Checking USERS table structure...');
    
    // Get table metadata
    const table = base.table(USERS_TABLE_NAME);
    
    // List all fields in the table
    const fields = await table.fields();
    console.log('\n📋 Current fields in USERS table:');
    fields.forEach(field => {
      console.log(`   - ${field.name} (${field.type})`);
    });
    
    // Check if reset fields exist
    const hasResetToken = fields.some(f => f.name === 'reset_token');
    const hasResetTokenExpiry = fields.some(f => f.name === 'reset_token_expiry');
    
    console.log('\n🔍 Reset field status:');
    console.log(`   - reset_token: ${hasResetToken ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   - reset_token_expiry: ${hasResetTokenExpiry ? '✅ Exists' : '❌ Missing'}`);
    
    if (!hasResetToken || !hasResetTokenExpiry) {
      console.log('\n⚠️  Manual setup required:');
      console.log('   1. Go to your Airtable base');
      console.log('   2. Open the USERS table');
      console.log('   3. Add these fields manually:');
      console.log('      - Field name: reset_token');
      console.log('      - Field type: Single line text');
      console.log('      - Field name: reset_token_expiry');
      console.log('      - Field type: Single line text');
      console.log('\n   Note: Use "Single line text" type, not "Date" type');
    } else {
      console.log('\n✅ All reset fields are properly configured!');
    }
    
    // Test creating a user with reset fields
    console.log('\n🧪 Testing user creation with reset fields...');
    const testUser = {
      'Full_Name': 'Test User',
      'Username': 'testuser',
      'Email': 'test@example.com',
      'Phone': '1234567890',
      'Password': 'hashedpassword',
      'Status': 'active',
      'reset_token': 'test_token_123',
      'reset_token_expiry': Date.now().toString()
    };
    
    try {
      const record = await table.create(testUser);
      console.log('✅ Successfully created test user with reset fields');
      console.log(`   Record ID: ${record.id}`);
      
      // Clean up - delete the test record
      await table.destroy(record.id);
      console.log('✅ Cleaned up test record');
      
    } catch (error) {
      console.error('❌ Error creating test user:', error.message);
      if (error.message.includes('Unknown field name')) {
        console.log('\n💡 Solution: Make sure the field names are exactly:');
        console.log('   - reset_token (lowercase)');
        console.log('   - reset_token_expiry (lowercase)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Could not find table')) {
      console.log('\n💡 Solution: Make sure your USERS table exists and the name matches:');
      console.log(`   Expected: ${USERS_TABLE_NAME}`);
      console.log('   Check your AIRTABLE_USERS_TABLE environment variable');
    }
  }
}

setupResetFields(); 
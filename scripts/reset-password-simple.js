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

async function resetPasswordSimple() {
  try {
    console.log('🔧 Resetting password to simple test value...');
    
    const table = base.table(USERS_TABLE_NAME);
    
    // Find the user
    const records = await table.select({
      filterByFormula: `{Email}='kofiomega300@gmail.com'`
    }).all();
    
    if (records.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = records[0];
    console.log('✅ Found user:', user.fields.Full_Name);
    
    // Create a simple password hash
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    await table.update(user.id, {
      'Password': hashedPassword
    });
    
    console.log('✅ Password reset successfully!');
    console.log('\n📝 New login credentials:');
    console.log('   Email: kofiomega300@gmail.com');
    console.log('   Username: omegah');
    console.log('   Password: password123');
    console.log('\n💡 Try logging in with these credentials now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetPasswordSimple(); 
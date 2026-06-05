console.log('🔧 Airtable Field Setup Guide for Password Reset\n');

console.log('📋 You need to add these fields to your USERS table in Airtable:\n');

console.log('1. Field Name: reset_token');
console.log('   Type: Single line text');
console.log('   Description: Stores the password reset token\n');

console.log('2. Field Name: reset_token_expiry');
console.log('   Type: Single line text (NOT Date field)');
console.log('   Description: Stores when the reset token expires (as ISO string)\n');

console.log('📝 Steps to add these fields in Airtable:');
console.log('1. Open your Airtable base');
console.log('2. Go to the USERS table');
console.log('3. Click the "+" button next to the last column');
console.log('4. Add "reset_token" as a Single line text field');
console.log('5. Add another field called "reset_token_expiry" as a Single line text field (NOT Date)');
console.log('6. Save your changes\n');

console.log('⚠️  IMPORTANT: Use "Single line text" for both fields, not "Date" field!');
console.log('✅ After adding these fields, the password reset functionality will work correctly!');
console.log('🔄 You may need to restart your development server after making these changes.'); 
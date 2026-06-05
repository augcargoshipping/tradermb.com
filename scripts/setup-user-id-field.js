require('dotenv').config();

const airtableBaseId = process.env.AIRTABLE_BASE_ID;
const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

async function setupUserIdField() {
  console.log('Setting up user_id field for CUSTOMERS table...\n');

  if (!airtableBaseId || !airtableToken) {
    console.error('Missing Airtable credentials in .env.local');
    console.log('Please ensure AIRTABLE_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN are set');
    return;
  }

  try {
    console.log('Checking current fields in CUSTOMERS table...');
    const fieldsResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${airtableBaseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!fieldsResponse.ok) {
      throw new Error(`Failed to fetch table schema: ${fieldsResponse.statusText}`);
    }

    const tablesData = await fieldsResponse.json();
    const customersTable = tablesData.tables.find(table => table.name === 'CUSTOMERS');
    
    if (!customersTable) {
      console.error('CUSTOMERS table not found in your Airtable base');
      return;
    }

    console.log('Found CUSTOMERS table');
    console.log('Current fields:', customersTable.fields.map(f => f.name));

    const hasUserIdField = customersTable.fields.some(field => field.name === 'user_id');
    
    if (hasUserIdField) {
      console.log('user_id field already exists in CUSTOMERS table');
    } else {
      console.log('user_id field does not exist. You need to add it manually in Airtable:');
      console.log('1. Go to your Airtable base');
      console.log('2. Open the CUSTOMERS table');
      console.log('3. Add a new field called "user_id" (Single line text type)');
      console.log('4. Save the table');
      console.log('\nAfter adding the field, run this script again to link existing transactions.');
      return;
    }

    console.log('\nLinking existing transactions to users...');
    
    const usersResponse = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/USERS`, {
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
    }

    const usersData = await usersResponse.json();
    console.log(`Found ${usersData.records.length} users`);

    const customersResponse = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/CUSTOMERS`, {
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!customersResponse.ok) {
      throw new Error(`Failed to fetch customers: ${customersResponse.statusText}`);
    }

    const customersData = await customersResponse.json();
    console.log(`Found ${customersData.records.length} customer records`);

    const recordsToUpdate = [];
    let linkedCount = 0;

    customersData.records.forEach(customer => {
      const customerName = customer.fields.Customer_Name;
      const mobileNumber = customer.fields.Mobile_Number;
      
      const matchingUser = usersData.records.find(user => {
        const userName = user.fields.Full_Name;
        const userPhone = user.fields.Phone;
        return userName === customerName && userPhone === mobileNumber;
      });

      if (matchingUser && matchingUser.fields.User_ID && !customer.fields.user_id) {
        recordsToUpdate.push({
          id: customer.id,
          fields: {
            user_id: matchingUser.fields.User_ID
          }
        });
        linkedCount++;
        console.log(`Will link: ${customerName} (${customer.fields.Reference_Code}) to user ${matchingUser.fields.User_ID}`);
      }
    });

    if (recordsToUpdate.length === 0) {
      console.log('No records need linking (all already have user_id or no matches found)');
      return;
    }

    console.log(`\nUpdating ${recordsToUpdate.length} records with user_id...`);

    const batchSize = 10;
    for (let i = 0; i < recordsToUpdate.length; i += batchSize) {
      const batch = recordsToUpdate.slice(i, i + batchSize);
      
      const updateResponse = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/CUSTOMERS`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: batch
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Failed to update records: ${JSON.stringify(errorData)}`);
      }

      console.log(`Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recordsToUpdate.length / batchSize)}`);
    }

    console.log(`\nSuccessfully linked ${linkedCount} transactions to user accounts!`);
    console.log('\nNext steps:');
    console.log('1. Test the dashboard by signing in with a user account');
    console.log('2. Check if their completed transactions appear in the dashboard');
    console.log('3. Make sure the user_id field is being set for new transactions');

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your Airtable credentials in .env.local');
    console.log('2. Ensure you have read/write permissions on the base');
    console.log('3. Verify the table names are correct (CUSTOMERS, USERS)');
  }
}

setupUserIdField(); 
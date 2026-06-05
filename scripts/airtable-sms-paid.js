require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const airtableBaseId = process.env.AIRTABLE_BASE_ID;
const airtableToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const tableName = 'CUSTOMERS';

const client = twilio(accountSid, authToken);

async function getPaidRecords() {
  const url = `https://api.airtable.com/v0/${airtableBaseId}/${tableName}?filterByFormula=Status='Paid'`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${airtableToken}` }
  });
  const data = await res.json();
  return data.records || [];
}

async function sendSMS(to, message) {
  return client.messages.create({
    body: message,
    from: twilioNumber,
    to: to.startsWith('+') ? to : `+233${to.replace(/^0/, '')}` // Ghana format
  });
}

async function markAsCompleted(recordId) {
  const url = `https://api.airtable.com/v0/${airtableBaseId}/${tableName}/${recordId}`;
  await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${airtableToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { Status: 'Completed' } })
  });
}

async function main() {
  const paidRecords = await getPaidRecords();
  for (const record of paidRecords) {
    const fields = record.fields;
    const mobile = fields.Mobile_Number;
    const name = fields.Customer_Name;
    const reference = fields.Reference_Code;

    // Compose your SMS message
    const message = `Hi ${name}, your RMB has been funded to your account. Reference: ${reference}. Thank you for using TRADE RMB!`;

    try {
      await sendSMS(mobile, message);
      console.log(`SMS sent to ${mobile}`);
      await markAsCompleted(record.id);
      console.log(`Status updated to Completed for record ${record.id}`);
    } catch (err) {
      console.error(`Failed for ${mobile}:`, err.message);
    }
  }
}

async function poll() {
  await main();
  setTimeout(poll, 300000); // 5 minutes
}

poll(); 
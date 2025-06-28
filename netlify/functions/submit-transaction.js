const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { customerName, mobileNumber, referralName, ghsAmount, rmbAmount, referenceCode } = body;

    // Validate required fields
    if (!customerName || !mobileNumber || !ghsAmount || !rmbAmount || !referenceCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const tableName = "CUSTOMERS";
    const baseUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;

    if (!baseId || !token) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Airtable credentials not configured' }),
      };
    }

    const getHeaders = () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });

    const handleAirtableResponse = async (response) => {
      const text = await response.text();
      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Airtable returned non-JSON response: ${text}`);
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(`Airtable API error (${response.status}): ${data.error?.message || response.statusText}`);
      }

      return data;
    };

    // Create the record data
    const recordData = {
      Customer_Name: customerName,
      Mobile_Number: mobileNumber,
      Referral_Name: referralName || '',
      GHS_Amount: parseFloat(ghsAmount),
      RMB_Amount: parseFloat(rmbAmount),
      Reference_Code: referenceCode,
      Status: "Pending",
      Submitted_At: new Date().toISOString(),
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ fields: recordData }),
    });

    const result = await handleAirtableResponse(response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        recordId: result.id,
        referenceCode: referenceCode 
      }),
    };

  } catch (error) {
    console.error('Error submitting transaction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 
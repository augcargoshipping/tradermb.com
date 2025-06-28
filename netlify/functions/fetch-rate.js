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

  try {
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

    // First, try to get rate from a dedicated rate record
    const rateResponse = await fetch(`${baseUrl}?filterByFormula={Rate_Type}='EXCHANGE_RATE'&maxRecords=1`, {
      headers: getHeaders(),
    });

    if (rateResponse.ok) {
      const rateData = await handleAirtableResponse(rateResponse);
      if (rateData.records && rateData.records.length > 0) {
        const rateRecord = rateData.records[0];
        if (rateRecord.fields.Rate && typeof rateRecord.fields.Rate === "number" && rateRecord.fields.Rate > 0) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ rate: rateRecord.fields.Rate }),
          };
        }
      }
    }

    // Fallback: look for rate in recent customer records
    const response = await fetch(`${baseUrl}?maxRecords=10&sort[0][field]=Submitted_At&sort[0][direction]=desc`, {
      headers: getHeaders(),
    });

    const data = await handleAirtableResponse(response);

    if (data.records && data.records.length > 0) {
      for (const record of data.records) {
        const fields = record.fields;
        if (fields.Rate !== undefined && typeof fields.Rate === "number" && fields.Rate > 0) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ rate: fields.Rate }),
          };
        }
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'No exchange rate found' }),
    };

  } catch (error) {
    console.error('Error fetching rate:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 
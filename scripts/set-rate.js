// Simple script to set the exchange rate
// Change this rate to match your current exchange rate
const rate = 0.54; // 1 GHS = 0.54 RMB (update this to your current rate)

async function setRate() {
  try {
    const response = await fetch('http://localhost:3000/api/set-rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rate: rate }),
    });

    const result = await response.json();
    console.log('Set rate result:', result);
    
    if (result.success) {
      console.log(`✅ Successfully set exchange rate to ${rate}`);
    } else {
      console.log(`❌ Failed to set rate: ${result.error}`);
    }
  } catch (error) {
    console.error('Error setting rate:', error);
  }
}

setRate(); 
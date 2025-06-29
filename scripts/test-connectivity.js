require('dotenv').config({ path: '.env.local' });

const https = require('https');

async function testConnectivity() {
  console.log('🔍 Testing connectivity...');
  
  const tests = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'Airtable API', url: 'https://api.airtable.com' },
    { name: 'Airtable Website', url: 'https://airtable.com' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing ${test.name}...`);
      
      const result = await new Promise((resolve, reject) => {
        const req = https.get(test.url, (res) => {
          resolve({ status: res.statusCode, success: true });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      console.log(`✅ ${test.name}: Connected (Status: ${result.status})`);
    } catch (error) {
      console.log(`❌ ${test.name}: Failed - ${error.message}`);
    }
  }
  
  console.log('\n💡 If Airtable API fails but others work, it might be:');
  console.log('   - Network blocking Airtable');
  console.log('   - Firewall/antivirus blocking the connection');
  console.log('   - Airtable servers having issues');
  console.log('   - Try using a different network or VPN');
}

testConnectivity(); 
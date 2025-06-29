const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

console.log('☁️ Testing Cloudinary Setup...\n');

// Check environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('📋 Environment Variables Check:');
console.log('Cloud Name:', cloudName ? '✅ Set' : '❌ Missing');
console.log('API Key:', apiKey ? '✅ Set' : '❌ Missing');
console.log('API Secret:', apiSecret ? '✅ Set' : '❌ Missing');

if (!cloudName || !apiKey || !apiSecret) {
  console.error('\n❌ Missing Cloudinary environment variables');
  console.log('\nPlease add these to your .env.local file:');
  console.log('CLOUDINARY_CLOUD_NAME=your-cloud-name');
  console.log('CLOUDINARY_API_KEY=your-api-key');
  console.log('CLOUDINARY_API_SECRET=your-api-secret');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

async function testCloudinaryConnection() {
  console.log('\n🔗 Testing Cloudinary connection...');
  
  try {
    // Test connection by getting account info
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
    console.log('📋 Response:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    return false;
  }
}

async function testFileUpload() {
  console.log('\n📤 Testing file upload...');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    console.log('📁 Uploading test image...');
    
    // Upload test image
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'rmb-trade/test',
          resource_type: 'auto',
          public_id: `test-${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error('❌ Upload error:', error);
            reject(error);
          } else {
            console.log('✅ Upload successful');
            resolve(result);
          }
        }
      ).end(testImageBuffer);
    });
    
    console.log('📋 Upload result:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      format: uploadResult.format,
      size: uploadResult.bytes
    });
    
    // Test if the URL is accessible
    try {
      const response = await fetch(uploadResult.secure_url);
      if (response.ok) {
        console.log('✅ File is publicly accessible');
      } else {
        console.warn('⚠️ File might not be publicly accessible');
      }
    } catch (fetchError) {
      console.warn('⚠️ Could not test file accessibility:', fetchError.message);
    }
    
    // Clean up test file
    try {
      await cloudinary.uploader.destroy(uploadResult.public_id);
      console.log('🧹 Test file cleaned up');
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete test file:', deleteError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ File upload test failed:', error);
    return false;
  }
}

async function runTests() {
  const connectionTest = await testCloudinaryConnection();
  if (!connectionTest) {
    console.log('\n❌ Connection test failed. Please check your credentials.');
    process.exit(1);
  }
  
  const uploadTest = await testFileUpload();
  if (!uploadTest) {
    console.log('\n❌ Upload test failed. Please check your configuration.');
    process.exit(1);
  }
  
  console.log('\n🎉 All tests passed! Cloudinary is ready to use.');
  console.log('\nNext steps:');
  console.log('1. Your application can now upload QR codes to Cloudinary');
  console.log('2. Files will be stored in the "rmb-trade/qr-codes/" folder');
  console.log('3. Public URLs will be generated automatically');
  console.log('4. Airtable will receive the file URLs');
  console.log('5. Images will be optimized automatically');
}

runTests().catch(console.error); 
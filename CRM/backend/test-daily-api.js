import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_BASE = 'https://api.daily.co/v1';

console.log('Testing Daily.co API Key...');
console.log('API Key:', DAILY_API_KEY ? `${DAILY_API_KEY.substring(0, 20)}...` : 'NOT FOUND');

if (!DAILY_API_KEY) {
  console.error('❌ DAILY_API_KEY is not set in .env file');
  process.exit(1);
}

// Test API key by creating a temporary room
async function testDailyAPI() {
  try {
    console.log('\n🔍 Testing Daily.co API authentication...');
    
    const response = await axios.post(
      `${DAILY_API_BASE}/rooms`,
      {
        name: `test-room-${Date.now()}`,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 60, // Expire in 1 minute
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Daily.co API authentication successful!');
    console.log('Room created:', response.data.name);
    console.log('Room URL:', response.data.url);
    
    // Delete the test room
    await axios.delete(
      `${DAILY_API_BASE}/rooms/${response.data.name}`,
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
        }
      }
    );
    
    console.log('✅ Test room deleted');
    console.log('\n✅ Daily.co API is configured correctly!');
    
  } catch (error) {
    console.error('\n❌ Daily.co API test failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data);
    
    if (error.response?.data?.error === 'authentication-error') {
      console.error('\n⚠️  INVALID API KEY!');
      console.error('The DAILY_API_KEY in your .env file is not valid.');
      console.error('\nTo fix this:');
      console.error('1. Go to https://dashboard.daily.co/developers');
      console.error('2. Find your API key in the "API Keys" section');
      console.error('3. Copy the full API key (it should be a long string)');
      console.error('4. Update DAILY_API_KEY in your .env file');
      console.error('\nCurrent key format:', DAILY_API_KEY.substring(0, 30) + '...');
    }
    
    process.exit(1);
  }
}

testDailyAPI();

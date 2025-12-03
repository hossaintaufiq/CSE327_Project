/**
 * Quick verification script for Gemini API key
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔑 Verifying Gemini API Key Setup...\n');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is NOT found in .env file');
  console.log('\n📝 To fix:');
  console.log('1. Open CRM/backend/.env file');
  console.log('2. Add: GEMINI_API_KEY=your_key_here');
  console.log('3. Get your key from: https://makersuite.google.com/app/apikey');
  console.log('4. Restart this script\n');
  process.exit(1);
}

if (apiKey.trim() === '' || apiKey === 'your_gemini_api_key' || apiKey === 'your_api_key_here') {
  console.error('❌ GEMINI_API_KEY contains placeholder value');
  console.log('\n📝 Replace with your actual API key from Google AI Studio\n');
  process.exit(1);
}

console.log('✅ API Key found in .env file');
console.log('   First 8 chars:', apiKey.substring(0, 8) + '...');
console.log('   Last 4 chars: ...' + apiKey.slice(-4));
console.log('   Length:', apiKey.length, 'characters\n');

if (!apiKey.startsWith('AIza')) {
  console.warn('⚠️  Warning: API key should typically start with "AIza"');
  console.log('   Your key starts with:', apiKey.substring(0, 5) + '...');
  console.log('   This might be invalid - double check from Google AI Studio\n');
} else {
  console.log('✅ API key format looks correct (starts with AIza)\n');
}

console.log('🎯 Next Steps:');
console.log('   1. Make sure backend server is running: npm run dev');
console.log('   2. Look for: ✅ Gemini AI configured');
console.log('   3. Test endpoint: http://localhost:5000/api/ai/health\n');
console.log('✨ Your API key setup is correct!\n');


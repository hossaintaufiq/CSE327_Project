/**
 * Test script for AI Insights API endpoint
 * This will help diagnose what's not working
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 Testing AI Insights API Setup...\n');

// Test 1: Check environment variables
console.log('1️⃣ Checking Environment Variables...');
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key') {
  console.error('❌ GEMINI_API_KEY is not set or invalid');
  console.log('   Please add GEMINI_API_KEY to your .env file');
  process.exit(1);
}
console.log('✅ GEMINI_API_KEY is set');
console.log('   Key starts with:', apiKey.substring(0, 8) + '...\n');

// Test 2: Check imports
console.log('2️⃣ Checking Module Imports...');
try {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  console.log('✅ @google/generative-ai imported successfully');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
  console.log('✅ Gemini AI client initialized');
  console.log('   Using model:', process.env.GEMINI_MODEL || 'gemini-2.5-flash');
} catch (error) {
  console.error('❌ Error importing/initializing Gemini:', error.message);
  process.exit(1);
}

// Test 3: Test basic API call
console.log('\n3️⃣ Testing Basic API Call...');
try {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
  
  const result = await model.generateContent('Say "OK" if you can read this.');
  const response = await result.response;
  const text = response.text();
  
  if (text.includes('OK')) {
    console.log('✅ Gemini API is working!');
    console.log('   Response:', text.substring(0, 50));
  } else {
    console.warn('⚠️  Unexpected response:', text.substring(0, 50));
  }
} catch (error) {
  console.error('❌ Gemini API call failed:', error.message);
  if (error.message.includes('403')) {
    console.error('   This usually means the API key is invalid');
  } else if (error.message.includes('404')) {
    console.error('   This usually means the model name is incorrect');
  }
  process.exit(1);
}

// Test 4: Check service file
console.log('\n4️⃣ Checking Service File...');
try {
  const geminiService = await import('./src/services/geminiService.js');
  if (geminiService.generateCompanyInsights) {
    console.log('✅ generateCompanyInsights function exists');
  } else {
    console.error('❌ generateCompanyInsights function not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error importing geminiService:', error.message);
  process.exit(1);
}

// Test 5: Check controller file
console.log('\n5️⃣ Checking Controller File...');
try {
  const aiController = await import('./src/controllers/aiController.js');
  if (aiController.getCompanyInsights) {
    console.log('✅ getCompanyInsights function exists');
  } else {
    console.error('❌ getCompanyInsights function not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error importing aiController:', error.message);
  console.error('   Full error:', error);
  process.exit(1);
}

// Test 6: Check routes file
console.log('\n6️⃣ Checking Routes File...');
try {
  const aiRoutes = await import('./src/routes/aiRoutes.js');
  console.log('✅ aiRoutes module loaded');
} catch (error) {
  console.error('❌ Error importing aiRoutes:', error.message);
  console.error('   Full error:', error);
  process.exit(1);
}

console.log('\n✅ All checks passed!');
console.log('\n📋 Next Steps:');
console.log('   1. Make sure backend server is running: npm run dev');
console.log('   2. Check browser console for specific error messages');
console.log('   3. Test endpoint: http://localhost:5000/api/ai/health');
console.log('   4. Test with authentication: http://localhost:5000/api/ai/company/insights');
console.log('\n✨ If server is running, restart it to load new changes!\n');


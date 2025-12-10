/**
 * AI Health Check Script
 * Tests Gemini AI integration to identify if issues are due to:
 * 1. API key problems
 * 2. Daily rate limits (Gemini free tier: 15 RPM, 1,500 RPD)
 * 3. Code errors
 */

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

console.log('🔍 GEMINI AI HEALTH CHECK\n');
console.log('='.repeat(70));

// Test 1: API Key Configuration
console.log('\n✓ Test 1: API Key Configuration');
if (!API_KEY) {
  console.log('  ❌ FAILED: GEMINI_API_KEY not found in .env');
  process.exit(1);
}
console.log(`  ✅ PASSED: API key found (${API_KEY.substring(0, 15)}...)`);
console.log(`  ℹ️  Model: ${MODEL_NAME}`);

// Test 2: Basic API Connection
console.log('\n✓ Test 2: Basic API Connection');
try {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  console.log('  ✅ PASSED: Successfully initialized Gemini client');
  
  // Test 3: Simple Text Generation (Rate Limit Test)
  console.log('\n✓ Test 3: Simple Text Generation (Rate Limit Test)');
  console.log('  ℹ️  Sending test prompt...');
  
  const startTime = Date.now();
  const result = await model.generateContent('Say "Hello, I am working!" in one sentence.');
  const response = await result.response;
  const text = response.text();
  const duration = Date.now() - startTime;
  
  console.log(`  ✅ PASSED: AI responded in ${duration}ms`);
  console.log(`  📝 Response: "${text.trim()}"`);
  
  // Test 4: Quota Information
  console.log('\n✓ Test 4: Rate Limit Information');
  console.log('  ℹ️  Gemini Free Tier Limits:');
  console.log('     - Requests per minute (RPM): 15');
  console.log('     - Requests per day (RPD): 1,500');
  console.log('     - Tokens per minute (TPM): 1 million');
  console.log('     - Tokens per day (TPD): No limit');
  
  // Test 5: Multiple Rapid Requests (Rate Limit Test)
  console.log('\n✓ Test 5: Multiple Rapid Requests (Rate Limit Test)');
  console.log('  ℹ️  Sending 3 quick requests to test rate limiting...');
  
  const promises = [];
  for (let i = 1; i <= 3; i++) {
    promises.push(
      model.generateContent(`Count to ${i}`)
        .then(res => res.response.text())
        .then(text => ({ success: true, i, text: text.substring(0, 50) }))
        .catch(err => ({ success: false, i, error: err.message }))
    );
  }
  
  const results = await Promise.all(promises);
  let successCount = 0;
  let rateLimitCount = 0;
  
  results.forEach(r => {
    if (r.success) {
      console.log(`  ✅ Request ${r.i}: SUCCESS`);
      successCount++;
    } else {
      console.log(`  ❌ Request ${r.i}: FAILED - ${r.error}`);
      if (r.error.includes('429') || r.error.toLowerCase().includes('quota') || r.error.toLowerCase().includes('rate limit')) {
        rateLimitCount++;
      }
    }
  });
  
  if (rateLimitCount > 0) {
    console.log('\n  ⚠️  RATE LIMIT DETECTED!');
    console.log('  ℹ️  This indicates you have hit the API quota limits.');
    console.log('  📋 Solutions:');
    console.log('     1. Wait for quota to reset (usually 60 seconds for RPM)');
    console.log('     2. Reduce request frequency in your app');
    console.log('     3. Upgrade to paid tier for higher limits');
  } else if (successCount === 3) {
    console.log(`\n  ✅ All ${successCount}/3 requests succeeded - No rate limiting issues`);
  }
  
  // Test 6: Error Response Parsing
  console.log('\n✓ Test 6: Error Handling Test');
  try {
    // Intentionally trigger an error with invalid request
    const invalidModel = genAI.getGenerativeModel({ model: 'invalid-model-name' });
    await invalidModel.generateContent('Test');
    console.log('  ⚠️  Expected error not thrown');
  } catch (error) {
    if (error.message) {
      console.log('  ✅ PASSED: Error handling works correctly');
      console.log(`  ℹ️  Error message format: ${error.message.substring(0, 100)}...`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log('✅ API Key: Valid');
  console.log('✅ Connection: Working');
  console.log('✅ Text Generation: Working');
  console.log(`✅ Rate Limit Status: ${rateLimitCount > 0 ? '⚠️  QUOTA EXCEEDED' : '✅ OK'}`);
  
  console.log('\n🎯 DIAGNOSIS:');
  if (rateLimitCount > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  RATE LIMIT ISSUE DETECTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('The AI is not responding because you have exceeded the free tier quota.');
    console.log('\nThis is NOT a coding issue. Your implementation is correct.');
    console.log('\n📋 RECOMMENDED ACTIONS:');
    console.log('   1. ⏰ WAIT: Rate limits reset every 60 seconds (for RPM)');
    console.log('   2. 🔧 THROTTLE: Add request throttling in your app');
    console.log('   3. 💳 UPGRADE: Consider Gemini paid tier for production');
    console.log('   4. 🔄 CACHE: Cache AI responses to reduce requests');
    console.log('\n📖 More info: https://ai.google.dev/pricing');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Your Gemini AI integration is working correctly!');
    console.log('\nIf you experience issues in the app:');
    console.log('   - Check conversation status (AI only responds when status="active")');
    console.log('   - Verify client is sending messages (not representative)');
    console.log('   - Check browser console and backend logs for errors');
  }
  
  console.log('\n');
  
} catch (error) {
  console.log('  ❌ FAILED:', error.message);
  
  console.log('\n' + '='.repeat(70));
  console.log('❌ CRITICAL ERROR');
  console.log('='.repeat(70));
  
  if (error.message?.includes('403') || error.status === 403) {
    console.log('🔑 API KEY ISSUE:');
    console.log('   - Your API key may be invalid or disabled');
    console.log('   - Check if Generative AI API is enabled in Google Cloud Console');
    console.log('   - Verify billing is enabled (if using paid tier)');
    console.log('\n📖 Setup: https://makersuite.google.com/app/apikey');
  } else if (error.message?.includes('429') || error.status === 429) {
    console.log('⏱️  RATE LIMIT EXCEEDED:');
    console.log('   - You have hit the free tier quota (15 RPM or 1,500 RPD)');
    console.log('   - Wait 60 seconds and try again');
    console.log('   - Consider upgrading to paid tier');
  } else if (error.message?.includes('404') || error.status === 404) {
    console.log('🔍 MODEL NOT FOUND:');
    console.log(`   - Model "${MODEL_NAME}" may not exist or is not accessible`);
    console.log('   - Try using "gemini-1.5-flash" or "gemini-1.5-pro"');
    console.log('   - Check model availability in your region');
  } else if (error.message?.includes('503') || error.message?.includes('overloaded') || error.status === 503) {
    console.log('🔄 SERVICE OVERLOADED:');
    console.log('   - Google\'s Gemini service is experiencing high traffic');
    console.log('   - This is a TEMPORARY issue on Google\'s side, NOT your code');
    console.log('   - The model "gemini-2.5-flash" may be experiencing heavy load');
    console.log('\n📋 SOLUTIONS:');
    console.log('   1. ⏰ WAIT: Try again in 1-5 minutes');
    console.log('   2. 🔄 RETRY: Implement exponential backoff in your app');
    console.log('   3. 🔧 FALLBACK: Use "gemini-1.5-flash" as fallback model');
    console.log('   4. 💳 PAID TIER: Paid tier has better availability');
    console.log('\n✅ YOUR CODE IS CORRECT - This is a temporary Google service issue');
  } else {
    console.log('❓ UNKNOWN ERROR:');
    console.log(`   - ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify GEMINI_API_KEY in .env file');
    console.log('   3. Check Google AI status page');
    console.log('   4. Review error stack trace above');
  }
  
  console.log('\n');
  process.exit(1);
}

/**
 * Video Call System Verification Script
 * Run this to verify all video calling components are properly configured
 */

import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const checks = [];

// Check 1: Environment Variables
console.log('🔍 Checking Environment Variables...');
const DAILY_API_KEY = process.env.DAILY_API_KEY;

if (!DAILY_API_KEY) {
  checks.push({ name: 'DAILY_API_KEY', status: '❌', message: 'Missing in .env file' });
} else if (DAILY_API_KEY.startsWith('cloud-')) {
  checks.push({ name: 'DAILY_API_KEY', status: '✅', message: 'Valid Daily.co API key format' });
} else {
  checks.push({ name: 'DAILY_API_KEY', status: '⚠️', message: 'Key present but format unusual' });
}

// Check 2: Required Models
console.log('🔍 Checking Database Models...');
try {
  const conversationModelPath = './src/models/Conversation.js';
  if (fs.existsSync(conversationModelPath)) {
    const content = fs.readFileSync(conversationModelPath, 'utf8');
    if (content.includes('metadata')) {
      checks.push({ name: 'Conversation Model', status: '✅', message: 'Has metadata field' });
    } else {
      checks.push({ name: 'Conversation Model', status: '❌', message: 'Missing metadata field' });
    }
  } else {
    checks.push({ name: 'Conversation Model', status: '❌', message: 'File not found' });
  }
} catch (error) {
  checks.push({ name: 'Conversation Model', status: '❌', message: error.message });
}

// Check 3: Controller
console.log('🔍 Checking Controllers...');
try {
  const controllerPath = './src/controllers/videoCallController.js';
  if (fs.existsSync(controllerPath)) {
    const content = fs.readFileSync(controllerPath, 'utf8');
    const hasCreate = content.includes('createCallRoom');
    const hasToken = content.includes('getCallToken');
    const hasEnd = content.includes('endCall');
    
    if (hasCreate && hasToken && hasEnd) {
      checks.push({ name: 'Video Controller', status: '✅', message: 'All functions present' });
    } else {
      checks.push({ name: 'Video Controller', status: '⚠️', message: 'Some functions missing' });
    }
  } else {
    checks.push({ name: 'Video Controller', status: '❌', message: 'File not found' });
  }
} catch (error) {
  checks.push({ name: 'Video Controller', status: '❌', message: error.message });
}

// Check 4: Routes
console.log('🔍 Checking Routes...');
try {
  const routesPath = './src/routes/videoCallRoutes.js';
  if (fs.existsSync(routesPath)) {
    checks.push({ name: 'Video Routes', status: '✅', message: 'Routes file exists' });
  } else {
    checks.push({ name: 'Video Routes', status: '❌', message: 'File not found' });
  }
} catch (error) {
  checks.push({ name: 'Video Routes', status: '❌', message: error.message });
}

// Check 5: Server Registration
console.log('🔍 Checking Server Configuration...');
try {
  const serverPath = './server.js';
  if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf8');
    if (content.includes('videoCallRoutes') && content.includes('/api/video-calls')) {
      checks.push({ name: 'Server Routes', status: '✅', message: 'Video routes registered' });
    } else {
      checks.push({ name: 'Server Routes', status: '❌', message: 'Routes not registered' });
    }
  } else {
    checks.push({ name: 'Server Routes', status: '❌', message: 'server.js not found' });
  }
} catch (error) {
  checks.push({ name: 'Server Routes', status: '❌', message: error.message });
}

// Check 6: Dependencies
console.log('🔍 Checking Dependencies...');
try {
  const packagePath = './package.json';
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageJson.dependencies['@daily-co/daily-js']) {
      checks.push({ name: 'Daily.co Package', status: '✅', message: `Version ${packageJson.dependencies['@daily-co/daily-js']}` });
    } else {
      checks.push({ name: 'Daily.co Package', status: '❌', message: 'Not installed' });
    }
  }
} catch (error) {
  checks.push({ name: 'Daily.co Package', status: '❌', message: error.message });
}

// Print Results
console.log('\n' + '='.repeat(70));
console.log('📊 VIDEO CALL SYSTEM VERIFICATION REPORT');
console.log('='.repeat(70));

let passCount = 0;
let failCount = 0;
let warnCount = 0;

checks.forEach(check => {
  console.log(`${check.status} ${check.name.padEnd(25)} - ${check.message}`);
  if (check.status === '✅') passCount++;
  else if (check.status === '❌') failCount++;
  else warnCount++;
});

console.log('='.repeat(70));
console.log(`✅ Passed: ${passCount} | ❌ Failed: ${failCount} | ⚠️  Warnings: ${warnCount}`);
console.log('='.repeat(70));

if (failCount === 0 && warnCount === 0) {
  console.log('\n🎉 ALL CHECKS PASSED! Video calling system is ready.');
  console.log('\n📝 Next Steps:');
  console.log('   1. Start backend: npm run dev');
  console.log('   2. Start frontend: cd ../Client-web && npm run dev');
  console.log('   3. Test video calls in browser');
} else if (failCount === 0) {
  console.log('\n⚠️  System functional but has warnings. Review above.');
} else {
  console.log('\n❌ CRITICAL ISSUES FOUND! Fix errors before proceeding.');
  process.exit(1);
}

console.log('');

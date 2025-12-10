/**
 * Test Credentials Generator
 * 
 * Generates and manages test credentials for API testing
 * Run: node test-credentials-generator.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { User } from './src/models/User.js';
import { Company } from './src/models/Company.js';

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyCRDPL2ooA-7mgNXJ2hP6Z-7gO9hAZKONw",
  authDomain: "crmprime-fcd64.firebaseapp.com",
  projectId: "crmprime-fcd64",
  storageBucket: "crmprime-fcd64.firebasestorage.app",
  messagingSenderId: "894818601223",
  appId: "1:894818601223:web:eddc37b77fa0460b1a9da2",
  measurementId: "G-K7PR3LLXM8"
};

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '═'.repeat(70), 'blue');
  log(`  ${title}`, 'bold');
  log('═'.repeat(70), 'blue');
}

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    log('✅ Connected to MongoDB', 'green');
    return true;
  } catch (error) {
    log(`❌ MongoDB connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function generateTestCredentials() {
  logSection('🔐 TEST CREDENTIALS GENERATOR');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  log('✅ Firebase initialized', 'green');

  // Connect to database
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    log('❌ Cannot proceed without database connection', 'red');
    process.exit(1);
  }

  const credentials = {
    timestamp: new Date().toISOString(),
    firebase: {},
    users: [],
    companies: [],
    tokens: {}
  };

  try {
    // ============ Get Existing Test Users ============
    logSection('👥 FETCHING EXISTING USERS');

    // Find test client
    const testClient = await User.findOne({ 
      email: 'testclient@example.com' 
    }).populate('companies.companyId');

    if (testClient) {
      log('✅ Found test client user', 'green');
      credentials.users.push({
        role: 'client',
        email: testClient.email,
        userId: testClient._id.toString(),
        firebaseUid: testClient.firebaseUid,
        name: testClient.name,
        companies: testClient.companies.map(c => ({
          companyId: c.companyId._id.toString(),
          companyName: c.companyId.name,
          role: c.role
        }))
      });
    } else {
      log('⚠️  No test client found - create one first', 'yellow');
    }

    // Find test admin
    const testAdmin = await User.findOne({
      'companies.role': 'company_admin'
    }).populate('companies.companyId').limit(1);

    if (testAdmin) {
      log('✅ Found test admin user', 'green');
      const activeCompany = testAdmin.companies.find(c => c.isActive);
      credentials.users.push({
        role: 'company_admin',
        email: testAdmin.email,
        userId: testAdmin._id.toString(),
        firebaseUid: testAdmin.firebaseUid,
        name: testAdmin.name,
        activeCompany: activeCompany ? {
          companyId: activeCompany.companyId._id.toString(),
          companyName: activeCompany.companyId.name,
          role: activeCompany.role
        } : null
      });
    }

    // Find test employee
    const testEmployee = await User.findOne({
      'companies.role': 'employee'
    }).populate('companies.companyId').limit(1);

    if (testEmployee) {
      log('✅ Found test employee user', 'green');
      const activeCompany = testEmployee.companies.find(c => c.isActive);
      credentials.users.push({
        role: 'employee',
        email: testEmployee.email,
        userId: testEmployee._id.toString(),
        firebaseUid: testEmployee.firebaseUid,
        name: testEmployee.name,
        activeCompany: activeCompany ? {
          companyId: activeCompany.companyId._id.toString(),
          companyName: activeCompany.companyId.name,
          role: activeCompany.role
        } : null
      });
    }

    // ============ Get Companies ============
    logSection('🏢 FETCHING COMPANIES');

    const companies = await Company.find().limit(5);
    log(`✅ Found ${companies.length} companies`, 'green');

    for (const company of companies) {
      credentials.companies.push({
        companyId: company._id.toString(),
        name: company.name,
        domain: company.domain,
        isActive: company.isActive
      });
    }

    // ============ Generate Firebase Tokens ============
    logSection('🔑 GENERATING FIREBASE TOKENS');

    // You need to manually sign in to get tokens
    log('⚠️  To get valid ID tokens, you need to sign in with Firebase Auth', 'yellow');
    log('   Run this script with --login flag and provide credentials', 'cyan');
    log('   Example: node test-credentials-generator.js --login email@example.com password', 'cyan');

    if (process.argv.includes('--login') && process.argv.length >= 5) {
      const email = process.argv[3];
      const password = process.argv[4];

      try {
        log(`\n🔐 Attempting login for: ${email}`, 'cyan');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        log('✅ Login successful!', 'green');
        log(`   Firebase UID: ${userCredential.user.uid}`, 'cyan');
        
        // Decode token
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        const expiresAt = new Date(payload.exp * 1000);
        const validMinutes = Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60);

        credentials.tokens = {
          email: email,
          firebaseUid: userCredential.user.uid,
          idToken: idToken,
          tokenLength: idToken.length,
          expiresAt: expiresAt.toISOString(),
          validForMinutes: validMinutes
        };

        log(`   Token expires: ${expiresAt.toLocaleString()}`, 'cyan');
        log(`   Valid for: ${validMinutes} minutes`, 'cyan');
      } catch (error) {
        log(`❌ Login failed: ${error.message}`, 'red');
        if (error.code === 'auth/user-not-found') {
          log('   User not found in Firebase Auth', 'yellow');
        } else if (error.code === 'auth/wrong-password') {
          log('   Incorrect password', 'yellow');
        }
      }
    }

    // ============ Save Credentials ============
    logSection('💾 SAVING CREDENTIALS');

    const credentialsPath = path.join(process.cwd(), 'test-credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    log(`✅ Credentials saved to: ${credentialsPath}`, 'green');

    // ============ Display Summary ============
    logSection('📋 CREDENTIALS SUMMARY');

    log('\n👥 Users:', 'cyan');
    credentials.users.forEach(user => {
      log(`   • ${user.role.toUpperCase()}: ${user.email}`, 'white');
      log(`     User ID: ${user.userId}`, 'white');
      log(`     Firebase UID: ${user.firebaseUid}`, 'white');
      if (user.activeCompany) {
        log(`     Active Company: ${user.activeCompany.companyName} (${user.activeCompany.companyId})`, 'white');
      }
    });

    log('\n🏢 Companies:', 'cyan');
    credentials.companies.forEach(company => {
      log(`   • ${company.name} (${company.companyId})`, 'white');
    });

    if (credentials.tokens.idToken) {
      log('\n🔑 Auth Token:', 'cyan');
      log(`   • Email: ${credentials.tokens.email}`, 'white');
      log(`   • Token: ${credentials.tokens.idToken.substring(0, 50)}...`, 'white');
      log(`   • Valid for: ${credentials.tokens.validForMinutes} minutes`, 'white');
    } else {
      log('\n⚠️  No auth token generated', 'yellow');
      log('   To generate a token, run:', 'cyan');
      log('   node test-credentials-generator.js --login your-email@example.com your-password', 'cyan');
    }

    // ============ Generate Test Scripts ============
    logSection('📝 GENERATING TEST HELPER SCRIPTS');

    // Generate a test config file
    const testConfig = {
      baseURL: 'http://localhost:5000/api',
      timeout: 10000,
      credentials: {
        client: credentials.users.find(u => u.role === 'client'),
        admin: credentials.users.find(u => u.role === 'company_admin'),
        employee: credentials.users.find(u => u.role === 'employee'),
      },
      companies: credentials.companies,
      token: credentials.tokens.idToken || null
    };

    const testConfigPath = path.join(process.cwd(), 'test-config.json');
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    log(`✅ Test config saved to: ${testConfigPath}`, 'green');

    // Generate API test template
    const apiTestTemplate = `
/**
 * API Test Template
 * Auto-generated on ${new Date().toISOString()}
 */

import fetch from 'node-fetch';
import testConfig from './test-config.json' assert { type: 'json' };

const BASE_URL = testConfig.baseURL;
const TOKEN = testConfig.token;

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
  const url = \`\${BASE_URL}\${endpoint}\`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (TOKEN && !options.skipAuth) {
    headers['Authorization'] = \`Bearer \${TOKEN}\`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  return { response, data };
}

// Example test: Get conversations
async function testGetConversations() {
  console.log('🧪 Testing GET /conversations/my-conversations');
  
  const { response, data } = await apiCall('/conversations/my-conversations');
  
  if (response.ok) {
    console.log('✅ Success:', data);
  } else {
    console.log('❌ Failed:', response.status, data);
  }
}

// Run tests
testGetConversations();
`;

    const apiTestPath = path.join(process.cwd(), 'test-api-template.js');
    fs.writeFileSync(apiTestPath, apiTestTemplate);
    log(`✅ API test template saved to: ${apiTestPath}`, 'green');

    logSection('✅ CREDENTIALS GENERATION COMPLETE');

    log('\n📁 Generated Files:', 'cyan');
    log('   • test-credentials.json - All credentials', 'white');
    log('   • test-config.json - Test configuration', 'white');
    log('   • test-api-template.js - API test template', 'white');

    log('\n📖 Usage Examples:', 'cyan');
    log('   1. View credentials: cat test-credentials.json', 'white');
    log('   2. Run API tests: node test-api-template.js', 'white');
    log('   3. Generate token: node test-credentials-generator.js --login email pass', 'white');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log('\n👋 Disconnected from database', 'cyan');
  }
}

// Run the generator
generateTestCredentials();

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import fs from 'fs';

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

async function testFirebaseAuth() {
  console.log('🔧 Testing Firebase Authentication...');
  console.log('\n💡 TIP: Use test-credentials-generator.js to generate test credentials');
  console.log('   node test-credentials-generator.js --login your-email@example.com your-password\n');

  // Check for test credentials
  let testEmail, testPassword;
  
  try {
    const testConfig = JSON.parse(fs.readFileSync('./test-config.json', 'utf-8'));
    if (testConfig.credentials.client) {
      testEmail = testConfig.credentials.client.email;
      console.log(`📋 Found test credentials for: ${testEmail}`);
    }
  } catch (error) {
    console.log('⚠️  No test-config.json found. Using command line arguments.');
  }

  // Get credentials from command line or use test config
  if (process.argv.length >= 4) {
    testEmail = process.argv[2];
    testPassword = process.argv[3];
  } else if (!testEmail) {
    console.log('❌ No credentials provided!');
    console.log('\nUsage: node test-auth.js <email> <password>');
    console.log('   OR: Generate credentials first with test-credentials-generator.js');
    process.exit(1);
  }

  if (!testPassword) {
    console.log('❌ Password required!');
    console.log('Usage: node test-auth.js <email> <password>');
    process.exit(1);
  }

  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('✅ Firebase initialized');

    // Test login
    console.log('🔑 Attempting login...');
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);

    console.log('✅ Login successful');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);

    // Get ID token
    const idToken = await userCredential.user.getIdToken();
    console.log('✅ ID Token obtained (length:', idToken.length, ')');

    // Test token decoding
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    console.log('Token expires:', new Date(payload.exp * 1000).toLocaleString());
    console.log('Token valid for:', Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes');

    // Save token to test config
    try {
      let testConfig = { credentials: {}, companies: [], token: null };
      if (fs.existsSync('./test-config.json')) {
        testConfig = JSON.parse(fs.readFileSync('./test-config.json', 'utf-8'));
      }
      testConfig.token = idToken;
      testConfig.tokenExpiry = new Date(payload.exp * 1000).toISOString();
      fs.writeFileSync('./test-config.json', JSON.stringify(testConfig, null, 2));
      console.log('✅ Token saved to test-config.json');
    } catch (error) {
      console.log('⚠️  Could not save token to test-config.json');
    }

    console.log('\n📋 You can now use this token in API tests');
    console.log('Token:', idToken.substring(0, 50) + '...');

  } catch (error) {
    console.error('❌ Firebase auth test failed:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'auth/user-not-found') {
      console.log('💡 User not found. Make sure the email is registered in Firebase Auth.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 Wrong password. Check your password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Invalid email format.');
    }
    process.exit(1);
  }
}

testFirebaseAuth();
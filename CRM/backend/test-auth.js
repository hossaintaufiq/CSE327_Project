import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

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

  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('✅ Firebase initialized');

    // Test login with your credentials
    console.log('🔑 Attempting login...');
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'nazmul.sakib01@northsouth.edu', // Replace with your test email
      'your-password' // Replace with your test password
    );

    console.log('✅ Login successful');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);

    // Get ID token
    const idToken = await userCredential.user.getIdToken();
    console.log('✅ ID Token obtained (length:', idToken.length, ')');

    // Test token decoding
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    console.log('Token expires:', new Date(payload.exp * 1000).toLocaleString());
    console.log('Token valid for:', Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes');

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
  }
}

testFirebaseAuth();
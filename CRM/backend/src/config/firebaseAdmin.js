import admin from 'firebase-admin';

let firebaseAdminInitialized = false;

export const initFirebaseAdmin = () => {
  if (firebaseAdminInitialized) {
    return;
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.warn('⚠️  Firebase Admin credentials not fully configured');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    firebaseAdminInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
  }
};

export const getFirebaseAdmin = () => {
  if (!firebaseAdminInitialized) {
    const error = new Error('Firebase Admin not initialized. Please check FIREBASE_PRIVATE_KEY in .env file.');
    error.code = 'FIREBASE_NOT_INITIALIZED';
    throw error;
  }
  return admin;
};


import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only on client side
let app;
let auth;

if (typeof window !== "undefined") {
  try {
    // Only initialize if not already initialized
    const apps = getApps();
    app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    app = null;
    auth = null;
  }
} else {
  // Server-side: create mock objects
  app = null;
  auth = null;
}

export { auth };
export default app;


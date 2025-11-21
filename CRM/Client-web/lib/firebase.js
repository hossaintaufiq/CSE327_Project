import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRDPL2ooA-7mgNXJ2hP6Z-7gO9hAZKONw",
  authDomain: "crmprime-fcd64.firebaseapp.com",
  projectId: "crmprime-fcd64",
  storageBucket: "crmprime-fcd64.firebasestorage.app",
  messagingSenderId: "894818601223",
  appId: "1:894818601223:web:eddc37b77fa0460b1a9da2",
  measurementId: "G-K7PR3LLXM8"
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


// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCRDPL2ooA-7mgNXJ2hP6Z-7gO9hAZKONw",
//   authDomain: "crmprime-fcd64.firebaseapp.com",
//   projectId: "crmprime-fcd64",
//   storageBucket: "crmprime-fcd64.firebasestorage.app",
//   messagingSenderId: "894818601223",
//   appId: "1:894818601223:web:eddc37b77fa0460b1a9da2",
//   measurementId: "G-K7PR3LLXM8"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRDPL2ooA-7mgNXJ2hP6Z-7gO9hAZKONw",
  authDomain: "crmprime-fcd64.firebaseapp.com",
  projectId: "crmprime-fcd64",
  storageBucket: "crmprime-fcd64.firebasestorage.app",
  messagingSenderId: "894818601223",
  appId: "1:894818601223:web:eddc37b77fa0460b1a9da2",
  measurementId: "G-K7PR3LLXM8"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Auth
const auth = getAuth(app);

// (Optional) Initialize Analytics — only in browser (avoids Next.js errors)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, auth, analytics };

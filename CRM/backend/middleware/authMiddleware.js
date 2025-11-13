import admin from "firebase-admin";
import User from "../models/user.js";

// Initialize Firebase Admin SDK only if credentials are provided
let adminInitialized = false;

const initializeAdmin = () => {
  if (adminInitialized || admin.apps.length > 0) return;

  const firebaseAdminKey = process.env.FIREBASE_ADMIN_KEY;
  if (!firebaseAdminKey) {
    console.warn("⚠️ FIREBASE_ADMIN_KEY not set. Firebase authentication will not work.");
    return;
  }

  try {
    const serviceAccount = JSON.parse(firebaseAdminKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminInitialized = true;
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error.message);
  }
};

// Initialize on module load
initializeAdmin();

export const authMiddleware = async (req, res, next) => {
  // Check if Firebase Admin is initialized
  if (admin.apps.length === 0) {
    return res.status(500).json({ 
      success: false,
      message: "Authentication service not configured" 
    });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "No token provided" 
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid }).populate("companyId");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(403).json({ 
      success: false,
      message: "Invalid token",
      error: error.message 
    });
  }
};

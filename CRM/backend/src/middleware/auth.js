import { getFirebaseAdmin } from '../config/firebaseAdmin.js';
import { User } from '../models/User.js';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const admin = getFirebaseAdmin();
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    req.firebaseEmail = decodedToken.email;
    
    // Get user from database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return res.status(401).json({ message: 'User not found in database' });
    }
    
    // Populate companies for easier access
    await user.populate('companies.companyId');
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


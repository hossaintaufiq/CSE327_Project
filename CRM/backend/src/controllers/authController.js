import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { getFirebaseAdmin } from '../config/firebaseAdmin.js';
import { isSuperAdminEmail } from '../config/superAdmin.js';

export const signup = async (req, res) => {
  try {
    const { email, password, name, companyName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let admin;
    try {
      admin = getFirebaseAdmin();
    } catch (error) {
      console.error('Firebase Admin not initialized:', error.message);
      return res.status(500).json({ 
        message: 'Server configuration error. Please contact administrator.',
        error: 'Firebase Admin not initialized. Check FIREBASE_PRIVATE_KEY in .env file.'
      });
    }
    
    // Create user in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
    } catch (firebaseError) {
      console.error('Firebase user creation error:', firebaseError);
      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (firebaseError.code === 'auth/invalid-email') {
        return res.status(400).json({ message: 'Invalid email address' });
      }
      if (firebaseError.code === 'auth/weak-password') {
        return res.status(400).json({ message: 'Password is too weak' });
      }
      throw firebaseError;
    }

    // Check if this is super admin email (only hossainahmmedtaufiq22@gmail.com)
    const isSuperAdmin = isSuperAdminEmail(email);
    const globalRole = isSuperAdmin ? 'super_admin' : 'user';

    // Create user in database
    const user = await User.create({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      name: name || firebaseUser.displayName,
      globalRole,
      companies: [],
    });

    // If companyName provided, create company and add user as admin
    let companyId = null;
    if (companyName && !isSuperAdmin) {
      const company = await Company.create({
        name: companyName,
        adminId: user._id,
      });
      companyId = company._id;

      // Add company membership
      user.companies.push({
        companyId: company._id,
        role: 'company_admin',
        joinedAt: new Date(),
        isActive: true,
      });
      await user.save();
    }

    // Get custom token for client
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole,
          companies: user.companies,
        },
        customToken,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ message: 'Password is too weak. Use at least 6 characters.' });
    }
    
    // Handle MongoDB errors
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ message: 'Email or company name already exists' });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Error creating user: ' + (error.message || 'Unknown error'),
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const syncUser = async (req, res) => {
  try {
    const { firebaseUid, email, name } = req.user;
    
    // Find or create user
    let user = await User.findOne({ firebaseUid });
    
    // Check if this is super admin email (only hossainahmmedtaufiq22@gmail.com)
    const isSuperAdmin = isSuperAdminEmail(email);
    
    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        name: name || email.split('@')[0],
        globalRole: isSuperAdmin ? 'super_admin' : 'user',
        companies: [],
      });
    } else {
      // Update super admin status if email matches (in case user was created before super admin check)
      // Only allow super admin for the specific email
      if (isSuperAdmin && user.globalRole !== 'super_admin') {
        user.globalRole = 'super_admin';
        await user.save();
      } else if (!isSuperAdmin && user.globalRole === 'super_admin') {
        // Security: Remove super admin role if email doesn't match
        console.warn(`Security: Removing super_admin role from ${email} - not authorized email`);
        user.globalRole = 'user';
        await user.save();
      }
      // Update user info if changed
      if (name && name !== user.name) {
        user.name = name;
        await user.save();
      }
    }

    // Populate companies
    await user.populate('companies.companyId');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole,
          companies: user.companies.map((c) => ({
            companyId: c.companyId?._id || c.companyId,
            companyName: c.companyId?.name,
            role: c.role,
            joinedAt: c.joinedAt,
            isActive: c.isActive,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Sync user error:', error.message);
    res.status(500).json({ message: 'Error syncing user: ' + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    console.log('🔍 LOGIN DEBUG:', {
      email: decodedToken.email,
      uid: decodedToken.uid,
    });
    
    // Get or create user in database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // Check if this is the super admin email (only hossainahmmed22@gmail.com)
    const isSuperAdmin = isSuperAdminEmail(decodedToken.email);
    
    console.log('🔍 SUPER ADMIN CHECK:', {
      email: decodedToken.email,
      isSuperAdmin,
      existingUserRole: user?.globalRole,
    });
    
    if (!user) {
      console.log('📝 Creating new user with role:', isSuperAdmin ? 'super_admin' : 'user');
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        globalRole: isSuperAdmin ? 'super_admin' : 'user',
        companies: [],
      });
      console.log('✅ User created with role:', user.globalRole);
    } else {
      console.log('📝 Existing user found. Current role:', user.globalRole);
      // Update super admin status if email matches (in case user was created before super admin check)
      // Only allow super admin for the specific email
      if (isSuperAdmin && user.globalRole !== 'super_admin') {
        console.log('🔄 Updating user role to super_admin');
        user.globalRole = 'super_admin';
        await user.save();
        console.log('✅ User role updated to:', user.globalRole);
      } else if (!isSuperAdmin && user.globalRole === 'super_admin') {
        // Security: Remove super admin role if email doesn't match
        console.warn(`⚠️ Security: Removing super_admin role from ${decodedToken.email} - not authorized email`);
        user.globalRole = 'user';
        await user.save();
      } else {
        console.log('ℹ️ No role change needed. Current role:', user.globalRole);
      }
      // Update user info if changed
      if (decodedToken.name && decodedToken.name !== user.name) {
        user.name = decodedToken.name;
        await user.save();
      }
    }
    
    // Refresh user from database to ensure we have latest data
    user = await User.findById(user._id);
    console.log('📤 Sending user data with role:', user.globalRole);

    // Populate companies
    await user.populate('companies.companyId');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole,
          companies: user.companies.map((c) => ({
            companyId: c.companyId?._id || c.companyId,
            companyName: c.companyId?.name,
            role: c.role,
            joinedAt: c.joinedAt,
            isActive: c.isActive,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ message: 'Invalid token: ' + error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user;
    
    // Populate companies
    await user.populate('companies.companyId');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole,
          companies: user.companies.map((c) => ({
            companyId: c.companyId?._id || c.companyId,
            companyName: c.companyId?.name,
            role: c.role,
            joinedAt: c.joinedAt,
            isActive: c.isActive,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error.message);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

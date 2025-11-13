import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/user.js";
// ensure Company model is registered with mongoose before any populate calls
import Company from "../models/Company.js";

const router = express.Router();

// GET current user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({ 
      success: true,
      user: req.user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching user data",
      error: error.message 
    });
  }
});

// POST: Create or update user (called after Firebase signup)
router.post("/register", async (req, res) => {
  try {
    const { firebaseUid, email, name, companyId, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    
    if (user) {
      return res.status(200).json({ 
        success: true,
        message: "User already exists",
        user 
      });
    }

    // Create new user
    user = new User({
      firebaseUid,
      email,
      name,
      companyId: companyId || null,
      role: role || "employee"
    });

    await user.save();
    user = await user.populate("companyId");

    res.status(201).json({ 
      success: true,
      message: "User created successfully",
      user 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Error creating user",
      error: error.message 
    });
  }
});

// GET all users (admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!["super_admin", "company_admin"].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized - Admin access required" 
      });
    }

    const users = await User.find().populate("companyId");
    res.json({ 
      success: true,
      users 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching users",
      error: error.message 
    });
  }
});

// PUT: Update user profile
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    ).populate("companyId");

    res.json({ 
      success: true,
      message: "User updated successfully",
      user 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Error updating user",
      error: error.message 
    });
  }
});

export default router;

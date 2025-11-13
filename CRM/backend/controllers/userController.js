import User from "../models/userModel.js";

// GET all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();  // fetch all users
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE a new user
export const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Create and save user in DB
    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

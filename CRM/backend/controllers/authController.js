import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { uid, name, email, role } = req.body;
    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({ uid, name, email, role });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

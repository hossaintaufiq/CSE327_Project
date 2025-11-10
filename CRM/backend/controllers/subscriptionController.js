import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

export const createSubscription = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    const sub = await Subscription.create({
      userId: user._id,
      planType: "vendor",
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    user.role = "vendor";
    user.subscriptionActive = true;
    await user.save();

    res.json({ success: true, sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data" });
  }
});

export default router;

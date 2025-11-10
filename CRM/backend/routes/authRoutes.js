import express from "express";
import { registerUser, getProfile } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/profile", verifyToken, getProfile);

export default router;

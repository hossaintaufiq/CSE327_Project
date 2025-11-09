import express from "express";
import { createSubscription } from "../controllers/subscriptionController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, createSubscription);

export default router;

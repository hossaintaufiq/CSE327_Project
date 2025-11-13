import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.get(
  "/admin/dashboard",
  authMiddleware,
  authorizeRoles("super_admin", "company_admin"),
  (req, res) => {
    res.json({ message: "Welcome to Admin Dashboard" });
  }
);

router.get(
  "/manager/dashboard",
  authMiddleware,
  authorizeRoles("manager", "company_admin"),
  (req, res) => {
    res.json({ message: "Welcome to Manager Dashboard" });
  }
);

export default router;

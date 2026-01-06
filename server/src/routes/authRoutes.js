// server/src/routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ AUTH ROUTES
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/change-password", requireAuth, changePassword);

export default router;
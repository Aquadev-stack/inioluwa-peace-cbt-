import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

// GET /api/leaderboard?level=100&courseCode=MTH%20101
router.get("/", requireAuth, getLeaderboard);

export default router;

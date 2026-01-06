import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { startExam, submitExam } from "../controllers/examController.js";

const router = express.Router();

router.post("/start", requireAuth, startExam);
router.post("/submit", requireAuth, submitExam);

export default router;

import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { bulkInsertQuestions, createQuestion, getQuestions } from "../controllers/questionController.js";

const router = Router();

// Students can GET questions (protected)
router.get("/", requireAuth, getQuestions);

// Admin only
router.post("/", requireAuth, requireAdmin, createQuestion);
router.post("/bulk", requireAuth, requireAdmin, bulkInsertQuestions);

export default router;

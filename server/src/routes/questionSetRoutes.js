// server/src/routes/questionSetRoutes.js
import express from "express";
import QuestionSet from "../models/QuestionSet.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET sets for CBT page (students can read)
router.get("/", async (req, res) => {
  try {
    const { level, course, special } = req.query;
    const filter = { isActive: true };

    if (level) filter.level = Number(level);
    if (course) filter.course = String(course).toUpperCase().trim();
    if (special === "true") filter.isSpecial = true;

    const items = await QuestionSet.find(filter)
      .sort({ createdAt: -1 })
      .select("course level title durationSec totalQuestions isSpecial createdAt");

    res.json({ items });
  } catch (e) {
    console.error("GET /api/question-sets error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET single set (students can read)
router.get("/:id", async (req, res) => {
  try {
    const item = await QuestionSet.findById(req.params.id);
    if (!item || !item.isActive) return res.status(404).json({ message: "Set not found" });
    res.json({ item });
  } catch (e) {
    console.error("GET /api/question-sets/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create set (admin)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { course, level, title, durationSec, totalQuestions, isSpecial, questions } = req.body;

    if (!course || !String(course).trim()) return res.status(400).json({ message: "Course is required" });
    if (![100, 200].includes(Number(level))) return res.status(400).json({ message: "Level must be 100 or 200" });
    if (!title || !String(title).trim()) return res.status(400).json({ message: "Set title is required" });

    const qArr = Array.isArray(questions) ? questions : [];
    if (!qArr.length) return res.status(400).json({ message: "Add at least 1 question" });

    for (const q of qArr) {
      if (!q.question?.trim()) return res.status(400).json({ message: "Every question must have text" });
      if (!q.options?.A?.trim() || !q.options?.B?.trim() || !q.options?.C?.trim() || !q.options?.D?.trim()) {
        return res.status(400).json({ message: "Each question must have options A-D" });
      }
      if (!["A", "B", "C", "D"].includes(q.answer)) {
        return res.status(400).json({ message: "Each question must have a correct answer A-D" });
      }
    }

    const mins = Math.round((Number(durationSec) || 900) / 60);
    if (mins > 40) return res.status(400).json({ message: "Maximum time allowed is 40:00" });

    const doc = await QuestionSet.create({
      course: String(course).trim().toUpperCase(),
      level: Number(level),
      title: String(title).trim(),
      durationSec: Number(durationSec) || 900,
      totalQuestions: Number(totalQuestions) || qArr.length,
      isSpecial: isSpecial !== false,
      questions: qArr.map((x, idx) => ({
        number: x.number || idx + 1,
        question: String(x.question || "").trim(),
        options: {
          A: String(x.options.A || "").trim(),
          B: String(x.options.B || "").trim(),
          C: String(x.options.C || "").trim(),
          D: String(x.options.D || "").trim(),
        },
        answer: x.answer,
        explanation: String(x.explanation || "").trim(),
      })),
      createdBy: req.user?._id,
    });

    res.status(201).json({ item: doc });
  } catch (e) {
    console.error("POST /api/question-sets error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

// server/src/controllers/examController.js
import mongoose from "mongoose";
import Question from "../models/Question.js";
import ExamAttempt from "../models/ExamAttempt.js";
import ExamResult from "../models/ExamResult.js";
import Leaderboard from "../models/Leaderboard.js";

const EXAM_QUESTIONS_COUNT = 30;
const EXAM_DURATION_SECONDS = 25 * 60;

function normalizeCourse(code) {
  return String(code || "").replace(/\s+/g, "").toUpperCase().trim();
}

function getStudentLevel(user) {
  const raw =
    user?.level ??
    user?.currentLevel ??
    user?.studentLevel ??
    user?.academicLevel ??
    null;

  const lvl = Number(raw);
  if (lvl === 100 || lvl === 200) return lvl;
  return null;
}

function assertLevelAllowed(user, examLevel) {
  const studentLevel = getStudentLevel(user);
  if (!studentLevel) return { ok: true };

  if (studentLevel !== examLevel) {
    return {
      ok: false,
      message: `You are registered as ${studentLevel} Level. You can only take ${studentLevel} Level CBT exams.`,
    };
  }
  return { ok: true };
}

/* ================= START EXAM ================= */
export async function startExam(req, res) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Not authenticated" });

    const courseCodeRaw = String(req.body.courseCode || "");
    const courseCode = normalizeCourse(courseCodeRaw);
    const level = Number(req.body.level);

    if (!courseCode || !level) {
      return res.status(400).json({ message: "courseCode and level are required" });
    }

    const gate = assertLevelAllowed(req.user, level);
    if (!gate.ok) return res.status(403).json({ message: gate.message });

    const available = await Question.countDocuments({ courseCode, level, isActive: true });
    if (available < EXAM_QUESTIONS_COUNT) {
      return res.status(400).json({
        message: `Not enough questions for ${courseCode} L${level}. Need at least ${EXAM_QUESTIONS_COUNT}.`,
        available,
      });
    }

    const sampled = await Question.aggregate([
      { $match: { courseCode, level, isActive: true } },
      { $sample: { size: EXAM_QUESTIONS_COUNT } },
      { $project: { question: 1, options: 1, courseCode: 1, level: 1 } },
    ]);

    const attempt = await ExamAttempt.create({
      userId: req.user._id,
      courseCode,
      level,
      durationSeconds: EXAM_DURATION_SECONDS,
      startedAt: new Date(),
      questionIds: sampled.map((q) => q._id),
      status: "active",
    });

    return res.json({
      attemptId: attempt._id,
      durationSeconds: EXAM_DURATION_SECONDS,
      questions: sampled,
    });
  } catch (err) {
    console.error("startExam error:", err);
    return res.status(500).json({ message: "Server error starting exam" });
  }
}

/* ================= SUBMIT EXAM ================= */
export async function submitExam(req, res) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Not authenticated" });

    const courseCodeRaw = String(req.body.courseCode || "");
    const courseCode = normalizeCourse(courseCodeRaw); // ✅ normalize always
    const level = Number(req.body.level);
    const attemptId = String(req.body.attemptId || "");
    const timeSpentSecondsRaw = Number(req.body.timeSpentSeconds);
    const answersInput = Array.isArray(req.body.answers) ? req.body.answers : [];

    if (!courseCode || !level || !attemptId) {
      return res.status(400).json({ message: "courseCode, level, attemptId are required" });
    }

    const gate = assertLevelAllowed(req.user, level);
    if (!gate.ok) return res.status(403).json({ message: gate.message });

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ message: "Invalid attemptId" });
    }

    const timeSpentSeconds = Number.isFinite(timeSpentSecondsRaw)
      ? Math.max(0, timeSpentSecondsRaw)
      : NaN;

    if (!Number.isFinite(timeSpentSeconds)) {
      return res.status(400).json({ message: "Invalid timeSpentSeconds" });
    }

    if (answersInput.length > EXAM_QUESTIONS_COUNT) {
      return res.status(400).json({ message: `answers cannot exceed ${EXAM_QUESTIONS_COUNT}` });
    }

    // idempotent
    const existingResult = await ExamResult.findOne({ attemptId }).lean();
    if (existingResult) {
      return res.json({
        resultId: existingResult._id,
        scorePercent: existingResult.scorePercent,
        correctCount: existingResult.correctCount,
        totalQuestions: existingResult.totalQuestions,
        pass: Number(existingResult.scorePercent) >= 50,
        timeSpentSeconds: existingResult.timeSpentSeconds,
        corrections: [],
        alreadySubmitted: true,
      });
    }

    const attempt = await ExamAttempt.findOne({ _id: attemptId, userId: req.user._id });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.status === "submitted") return res.status(400).json({ message: "Attempt already submitted" });

    if (attempt.courseCode !== courseCode || attempt.level !== level) {
      return res.status(400).json({ message: "Attempt does not match course/level" });
    }

    const maxAllowed = attempt.durationSeconds + 30;
    if (timeSpentSeconds > maxAllowed) {
      return res.status(400).json({ message: "Time exceeded for this exam" });
    }

    const qDocs = await Question.find({ _id: { $in: attempt.questionIds } }).select(
      "_id question options correctOption answer explanation"
    );

    if (qDocs.length !== EXAM_QUESTIONS_COUNT) {
      return res.status(400).json({ message: "Some questions missing in DB" });
    }

    const qMap = new Map(qDocs.map((q) => [String(q._id), q]));

    const chosenMap = new Map();
    for (const a of answersInput) {
      const qid = String(a?.questionId || "");
      if (!qid) continue;
      chosenMap.set(qid, String(a?.chosenOption || "").toUpperCase().trim());
    }

    let correctCount = 0;

    const graded = attempt.questionIds.map((qid) => {
      const q = qMap.get(String(qid));
      const chosen = chosenMap.get(String(qid)) || "";
      const correct = String(q?.correctOption || q?.answer || "").toUpperCase().trim();

      const isCorrect = chosen !== "" && correct !== "" && chosen === correct;
      if (isCorrect) correctCount++;

      return {
        questionId: q._id,
        chosenOption: chosen,
        isCorrect,
        correctOption: correct,
      };
    });

    const scorePercent = Math.round((correctCount / EXAM_QUESTIONS_COUNT) * 100);

    const saved = await ExamResult.create({
      userId: req.user._id,
      courseCode,
      level,
      totalQuestions: EXAM_QUESTIONS_COUNT,
      correctCount,
      scorePercent,
      durationSeconds: attempt.durationSeconds,
      timeSpentSeconds,
      attemptId: attempt._id,
      answers: graded,
    });

    attempt.status = "submitted";
    await attempt.save();

    // ✅ LEADERBOARD: upsert on normalized courseCode
    const now = new Date();

    let lb = await Leaderboard.findOne({ course: courseCode, level, user: req.user._id });

    if (!lb) {
      try {
        lb = await Leaderboard.create({
          course: courseCode, // ✅ normalized stored
          level,
          user: req.user._id,
          bestScorePercent: scorePercent,
          bestCorrect: correctCount,
          bestTotal: EXAM_QUESTIONS_COUNT,
          bestTimeSpentSeconds: timeSpentSeconds,
          attempts: 1,
          lastAttemptAt: now,
        });
      } catch (e) {
        if (e?.code === 11000) {
          lb = await Leaderboard.findOne({ course: courseCode, level, user: req.user._id });
        } else {
          throw e;
        }
      }
    }

    if (lb) {
      const isBetter =
        scorePercent > lb.bestScorePercent ||
        (scorePercent === lb.bestScorePercent && timeSpentSeconds < lb.bestTimeSpentSeconds);

      lb.attempts = (lb.attempts || 0) + 1;
      lb.lastAttemptAt = now;

      if (isBetter) {
        lb.bestScorePercent = scorePercent;
        lb.bestCorrect = correctCount;
        lb.bestTotal = EXAM_QUESTIONS_COUNT;
        lb.bestTimeSpentSeconds = timeSpentSeconds;
      }

      await lb.save();
    }

    // ✅ emit realtime update
    const io = req.app.get("io");
    if (io) {
      io.to(`lb:${level}:${courseCode}`).emit("leaderboardUpdated", {
        level,
        courseCode,
      });
    }

    const corrections = qDocs.map((q) => {
      const found = graded.find((g) => String(g.questionId) === String(q._id));
      const correct = String(q?.correctOption || q?.answer || "").toUpperCase().trim();

      return {
        questionId: q._id,
        question: q.question,
        options: q.options,
        chosenOption: found?.chosenOption || "",
        correctOption: correct,
        explanation: q.explanation || "",
        isCorrect: found?.isCorrect || false,
      };
    });

    return res.json({
      resultId: saved._id,
      scorePercent,
      correctCount,
      totalQuestions: EXAM_QUESTIONS_COUNT,
      pass: scorePercent >= 50,
      timeSpentSeconds,
      corrections,
    });
  } catch (err) {
    console.error("submitExam error:", err);
    return res.status(500).json({ message: "Server error submitting exam" });
  }
}

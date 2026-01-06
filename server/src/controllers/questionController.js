import Question from "../models/Question.js";


function buildCourseRegex(courseRaw) {
  const clean = String(courseRaw || "").trim();
  if (!clean) return null;

  // Remove all spaces and uppercase: "GST 103" -> "GST103"
  const noSpace = clean.replace(/\s+/g, "").toUpperCase();

  // Split into letters prefix and digits suffix if possible
  // Example: GST103 => ["GST", "103"]
  const match = noSpace.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    const letters = match[1];
    const digits = match[2];
    // Allow any spaces between letters and digits: GST\s*103
    return new RegExp(`^${letters}\\s*${digits}$`, "i");
  }

  // If it doesn't match that pattern, fallback:
  // Replace consecutive spaces with \s* to allow flexible spaces
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/\s+/g, "\\s*");
  return new RegExp(`^${pattern}$`, "i");
}

/**
 * GET /api/questions?course=GST103&level=100&semester=1
 */
export async function getQuestions(req, res) {
  try {
    const { course, level, semester, limit } = req.query;

    const filter = {};

    // course
    if (course) {
      const courseRegex = buildCourseRegex(course);
      if (courseRegex) filter.courseCode = courseRegex;
    }

    // level
    if (level) filter.level = Number(level);

    // semester
    if (semester) filter.semester = Number(semester);

    const lim = limit ? Math.min(Number(limit), 500) : 500;

    const items = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(lim);

    return res.json({ items, count: items.length });
  } catch (err) {
    console.error("getQuestions error:", err);
    return res.status(500).json({ message: "Server error loading questions" });
  }
}

/**
 * POST /api/questions
 * Add single question (admin only)
 */
export async function createQuestion(req, res) {
  try {
    const { courseCode, level, semester, question, options, answer, explanation } = req.body;

    if (!courseCode || !level || !question || !options || !answer) {
      return res.status(400).json({
        message: "courseCode, level, question, options, and answer are required",
      });
    }

    const doc = await Question.create({
      courseCode: String(courseCode).trim(),
      level: Number(level),
      semester: semester ? Number(semester) : 1,
      question: String(question).trim(),
      options,
      answer: String(answer).trim().toUpperCase(),
      explanation: explanation ? String(explanation).trim() : "",
    });

    return res.status(201).json({ item: doc });
  } catch (err) {
    console.error("createQuestion error:", err);
    return res.status(500).json({ message: "Server error creating question" });
  }
}

/**
 * POST /api/questions/bulk
 * Add many questions at once (admin only)
 * body: { items: [ ... ] }
 */
export async function bulkInsertQuestions(req, res) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items[] is required" });
    }

    // sanitize
    const cleaned = items.map((q) => ({
      courseCode: String(q.courseCode || "").trim(),
      level: Number(q.level),
      semester: q.semester ? Number(q.semester) : 1,
      question: String(q.question || "").trim(),
      options: q.options,
      answer: String(q.answer || "").trim().toUpperCase(),
      explanation: q.explanation ? String(q.explanation).trim() : "",
    }));

    const result = await Question.insertMany(cleaned, { ordered: false });

    return res.json({
      message: "Questions inserted successfully",
      insertedCount: result.length,
    });
  } catch (err) {
    console.error("bulkInsertQuestions error:", err);

    // If some insert failed but others succeeded, Mongo throws, so we still show a helpful message
    return res.status(500).json({
      message: "Bulk insert failed (maybe duplicates/validation). Check server logs.",
      error: err.message,
    });
  }
}

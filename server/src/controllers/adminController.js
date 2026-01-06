const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Pdf = require("../models/Pdf");
const Question = require("../models/Question");

// --- multer setup ---
const uploadDir = path.join(process.cwd(), "uploads", "pdfs");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}_${Math.random().toString(16).slice(2)}_${safe}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  const ok =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");
  cb(ok ? null : new Error("Only PDF files allowed"), ok);
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
}).single("file");

// --- PDF handlers ---
exports.uploadPdf = async (req, res) => {
  uploader(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ message: err.message });

      const { title, course, level, isNew } = req.body;
      if (!title || !course || !level) {
        return res.status(400).json({ message: "title, course, level are required" });
      }
      if (![100, 200].includes(Number(level))) {
        return res.status(400).json({ message: "Level must be 100 or 200" });
      }
      if (!req.file) return res.status(400).json({ message: "PDF file is required" });

      const fileUrl = `/uploads/pdfs/${req.file.filename}`;

      const pdf = await Pdf.create({
        title: String(title).trim(),
        course: String(course).toUpperCase().trim(),
        level: Number(level),
        isNew: String(isNew) === "true" ? true : Boolean(isNew),
        fileUrl,
        uploadedBy: req.user.id,
      });

      res.status(201).json({ item: pdf });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  });
};

exports.listPdfs = async (req, res) => {
  try {
    const items = await Pdf.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ message: "Not found" });

    // delete file from disk
    const diskPath = path.join(process.cwd(), pdf.fileUrl.replace("/uploads/", "uploads/"));
    if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);

    await pdf.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Question handlers ---
exports.createQuestion = async (req, res) => {
  try {
    const { course, level, question, options, answerIndex, explanation, difficulty } = req.body;

    if (!course || !level || !question || !options) {
      return res.status(400).json({ message: "course, level, question, options required" });
    }
    if (![100, 200].includes(Number(level))) {
      return res.status(400).json({ message: "Level must be 100 or 200" });
    }
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ message: "Options must be an array of 4" });
    }
    const ai = Number(answerIndex);
    if (![0, 1, 2, 3].includes(ai)) {
      return res.status(400).json({ message: "answerIndex must be 0-3" });
    }

    const created = await Question.create({
      course: String(course).toUpperCase().trim(),
      level: Number(level),
      question: String(question).trim(),
      options: options.map((x) => String(x)),
      answerIndex: ai,
      explanation: explanation ? String(explanation) : "",
      difficulty: difficulty || "medium",
      createdBy: req.user.id,
    });

    res.status(201).json({ item: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.bulkCreateQuestions = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items must be a non-empty array" });
    }

    const cleaned = items.map((it) => ({
      course: String(it.course).toUpperCase().trim(),
      level: Number(it.level),
      question: String(it.question).trim(),
      options: (it.options || []).map((x) => String(x)),
      answerIndex: Number(it.answerIndex),
      explanation: it.explanation ? String(it.explanation) : "",
      difficulty: it.difficulty || "medium",
      createdBy: req.user.id,
    }));

    // basic validation
    for (const q of cleaned) {
      if (![100, 200].includes(q.level)) throw new Error("Invalid level in bulk");
      if (!q.options || q.options.length !== 4) throw new Error("Each item must have 4 options");
      if (![0, 1, 2, 3].includes(q.answerIndex)) throw new Error("answerIndex must be 0-3");
    }

    const inserted = await Question.insertMany(cleaned);
    res.status(201).json({ count: inserted.length });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Bulk failed" });
  }
};

exports.listQuestions = async (req, res) => {
  try {
    const items = await Question.find().sort({ createdAt: -1 }).limit(200);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Not found" });
    await q.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

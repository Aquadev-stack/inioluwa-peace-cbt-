// server/src/routes/pdfRoutes.js
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { listPdfs, uploadPdf, deletePdf } from "../controllers/pdfController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ ensure upload folder exists inside server/src/uploads/pdfs (matches index.js static)
const uploadDir = path.join(__dirname, "..", "uploads", "pdfs");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    cb(ok ? null : new Error("Only PDF files are allowed"), ok);
  },
});

// GET /api/pdfs?level=100&q=mth&course=MTH101
router.get("/", listPdfs);

// POST /api/pdfs (admin only)
router.post("/", requireAuth, requireAdmin, upload.single("file"), uploadPdf);

// DELETE /api/pdfs/:id (admin only)
router.delete("/:id", requireAuth, requireAdmin, deletePdf);

export default router;

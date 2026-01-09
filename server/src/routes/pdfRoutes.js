// server/src/routes/pdfRoutes.js
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { listPdfs, uploadPdf, deletePdf } from "../controllers/pdfController.js";

const router = express.Router();

/**
 * ✅ uploads folder should be OUTSIDE src
 * so it works cleanly on Render:
 * server/uploads/pdfs
 */
const uploadDir = path.join(process.cwd(), "uploads", "pdfs");
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
    const ok =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
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

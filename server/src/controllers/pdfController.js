// server/src/controllers/pdfController.js
import path from "path";
import fs from "fs";
import Pdf from "../models/Pdf.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads folder is inside server/src/uploads (matches your index.js static)
const UPLOADS_DIR = path.join(__dirname, "..", "uploads", "pdfs");

export async function listPdfs(req, res) {
  try {
    // avoid 304 caching for admin refresh
    res.set("Cache-Control", "no-store");

    const { level, q, course } = req.query;

    const filter = {};
    if (level) filter.level = Number(level);

    if (course) filter.course = String(course).toUpperCase().trim();

    if (q) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ title: rx }, { course: rx }];
    }

    const items = await Pdf.find(filter).sort({ createdAt: -1 }).lean();

    // unify naming so frontend always uses `isNew`
    const mapped = items.map((x) => ({
      ...x,
      isNew: Boolean(x.isNew ?? x.isNewUpload),
    }));

    return res.json({ items: mapped });
  } catch (e) {
    console.error("LIST PDF ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function uploadPdf(req, res) {
  try {
    const { title, course, level, isNew } = req.body;

    if (!req.file) return res.status(400).json({ message: "PDF file is required" });

    if (!title?.trim() || !course?.trim() || !level) {
      // cleanup uploaded file if validation fails
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: "Title, course and level are required" });
    }

    const lvl = Number(level);
    if (![100, 200].includes(lvl)) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: "Level must be 100 or 200" });
    }

    const isNewBool = String(isNew) === "true" || isNew === true;

    // since we serve /uploads from server/src/uploads
    const fileUrl = `/uploads/pdfs/${req.file.filename}`;

    const item = await Pdf.create({
      title: String(title).trim(),
      course: String(course).toUpperCase().trim(),
      level: lvl,
      isNew: isNewBool,          // ✅ main field
      isNewUpload: isNewBool,    // ✅ backward compatibility
      fileUrl,
      uploadedBy: req.user?._id, // ESM auth uses _id
    });

    return res.status(201).json({ message: "PDF uploaded ✅", item });
  } catch (e) {
    console.error("UPLOAD PDF ERROR:", e);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deletePdf(req, res) {
  try {
    const { id } = req.params;

    const item = await Pdf.findById(id);
    if (!item) return res.status(404).json({ message: "PDF not found" });

    // delete file from disk (server/src/uploads/pdfs)
    if (item.fileUrl) {
      const filename = String(item.fileUrl).split("/uploads/pdfs/")[1];
      if (filename) {
        const fullPath = path.join(UPLOADS_DIR, filename);
        fs.unlink(fullPath, () => {});
      }
    }

    await Pdf.findByIdAndDelete(id);
    return res.json({ message: "PDF deleted ✅" });
  } catch (e) {
    console.error("DELETE PDF ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

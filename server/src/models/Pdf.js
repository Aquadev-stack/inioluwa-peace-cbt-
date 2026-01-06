// server/src/models/Pdf.js
import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    course: { type: String, required: true, uppercase: true, trim: true },
    level: { type: Number, enum: [100, 200], required: true },

    // ✅ new field used by frontend
    isNew: { type: Boolean, default: false },

    // ✅ old field some code used before (kept so old docs won't break)
    isNewUpload: { type: Boolean, default: false },

    // Example: /uploads/pdfs/1700000000000-file.pdf
    fileUrl: { type: String, required: true },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Pdf", pdfSchema);

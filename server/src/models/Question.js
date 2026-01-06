import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, uppercase: true, trim: true }, // GST 103
    level: { type: Number, required: true, enum: [100, 200] },
    semester: { type: Number, required: true, enum: [1, 2] },

    question: { type: String, required: true, trim: true },

    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },

    answer: { type: String, required: true, enum: ["A", "B", "C", "D"] },

    explanation: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questionSchema.index({ courseCode: 1, level: 1, semester: 1, isActive: 1 });

export default mongoose.model("Question", questionSchema);

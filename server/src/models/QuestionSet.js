// server/src/models/QuestionSet.js
const mongoose = require("mongoose");

const questionItemSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true }, // 1..N
    question: { type: String, required: true, trim: true },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },
    answer: { type: String, enum: ["A", "B", "C", "D"], required: true },
    explanation: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const questionSetSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, uppercase: true, trim: true },
    level: { type: Number, enum: [100, 200], required: true },
    title: { type: String, required: true, trim: true }, // e.g. "MTH101 - Past Questions 2022"
    durationSec: { type: Number, default: 900 }, // 15mins default
    totalQuestions: { type: Number, default: 50 },
    isSpecial: { type: Boolean, default: true }, // appears in “Special” on CBT
    isActive: { type: Boolean, default: true },

    questions: { type: [questionItemSchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionSet", questionSetSchema);

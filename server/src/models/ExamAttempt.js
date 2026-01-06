import mongoose from "mongoose";

const examAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    courseCode: { type: String, required: true, uppercase: true, trim: true },
    level: { type: Number, required: true, enum: [100, 200] },

    durationSeconds: { type: Number, required: true }, // 1500
    startedAt: { type: Date, required: true },

    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }],

    status: { type: String, enum: ["active", "submitted"], default: "active" },
  },
  { timestamps: true }
);

examAttemptSchema.index({ userId: 1, courseCode: 1, level: 1, status: 1 });

export default mongoose.model("ExamAttempt", examAttemptSchema);

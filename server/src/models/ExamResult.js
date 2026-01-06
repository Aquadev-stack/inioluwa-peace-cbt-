import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    chosenOption: { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    isCorrect: { type: Boolean, required: true },
    correctOption: { type: String, enum: ["A", "B", "C", "D"], required: true },
  },
  { _id: false }
);

const examResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    courseCode: { type: String, required: true, uppercase: true, trim: true },
    level: { type: Number, required: true, enum: [100, 200] },

    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    scorePercent: { type: Number, required: true },

    durationSeconds: { type: Number, required: true },
    timeSpentSeconds: { type: Number, required: true },

    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamAttempt", required: true },

    answers: { type: [answerSchema], required: true },
  },
  { timestamps: true }
);

examResultSchema.index({ courseCode: 1, level: 1, scorePercent: -1, timeSpentSeconds: 1 });

export default mongoose.model("ExamResult", examResultSchema);

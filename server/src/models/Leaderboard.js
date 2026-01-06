import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, uppercase: true, trim: true },
    level: { type: Number, required: true, enum: [100, 200] },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // best performance snapshot
    bestScorePercent: { type: Number, required: true },
    bestCorrect: { type: Number, required: true },
    bestTotal: { type: Number, required: true },

    // ✅ needed for ranking by time
    bestTimeSpentSeconds: { type: Number, required: true },

    // tracking
    attempts: { type: Number, default: 1 },
    lastAttemptAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// one row per user per course/level
leaderboardSchema.index({ course: 1, level: 1, user: 1 }, { unique: true });

// ✅ speeds up leaderboard queries
leaderboardSchema.index({ course: 1, level: 1, bestScorePercent: -1, bestTimeSpentSeconds: 1 });

export default mongoose.model("Leaderboard", leaderboardSchema);

// server/src/controllers/leaderboardController.js
import Leaderboard from "../models/Leaderboard.js";

function normalizeCourse(code) {
  return String(code || "").replace(/\s+/g, "").toUpperCase().trim();
}

export async function getLeaderboard(req, res) {
  // prevent cached empty body / 304 weirdness
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  const courseCodeRaw = String(req.query.courseCode || "");
  const courseCode = normalizeCourse(courseCodeRaw);
  const level = Number(req.query.level);
  const limit = Math.min(100, Math.max(5, Number(req.query.limit || 50)));

  if (!courseCode || !level) {
    return res.status(400).json({ message: "courseCode and level are required" });
  }

  const rows = await Leaderboard.find({ course: courseCode, level })
    .populate("user", "name")
    .sort({ bestScorePercent: -1, bestTimeSpentSeconds: 1, lastAttemptAt: -1 })
    .limit(limit)
    .lean();

  const mapped = rows.map((r) => ({
    _id: r._id,
    studentName: r.user?.name || "Unknown",
    scorePercent: r.bestScorePercent,
    timeSpentSeconds: r.bestTimeSpentSeconds,
    attempts: r.attempts,
    lastAttemptAt: r.lastAttemptAt,
  }));

  return res.json(mapped);
}

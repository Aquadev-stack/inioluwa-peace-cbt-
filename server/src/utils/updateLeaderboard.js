// server/src/utils/updateLeaderboard.js
import Leaderboard from "../models/Leaderboard.js";

function normalizeCourse(code) {
  return String(code || "").replace(/\s+/g, "").toUpperCase().trim();
}

export async function updateLeaderboardForAttempt({
  userId,
  level,
  courseCode,
  scorePercent,
  timeSpentSeconds,
}) {
  const course = normalizeCourse(courseCode);

  const existing = await Leaderboard.findOne({ user: userId, level, course });

  const now = new Date();

  if (!existing) {
    return Leaderboard.create({
      user: userId,
      level,
      course,
      bestScorePercent: scorePercent,
      bestTimeSpentSeconds: timeSpentSeconds,
      attempts: 1,
      lastAttemptAt: now,
    });
  }

  existing.attempts = (existing.attempts || 0) + 1;
  existing.lastAttemptAt = now;

  const bestScore = Number(existing.bestScorePercent ?? 0);
  const bestTime = Number(existing.bestTimeSpentSeconds ?? 0);

  const isBetter =
    scorePercent > bestScore ||
    (scorePercent === bestScore && timeSpentSeconds < bestTime);

  if (isBetter) {
    existing.bestScorePercent = scorePercent;
    existing.bestTimeSpentSeconds = timeSpentSeconds;
  }

  await existing.save();
  return existing;
}

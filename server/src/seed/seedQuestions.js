import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "../config/db.js";
import Question from "../models/Question.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// change this filename when seeding other courses
const FILE = "questions.gst101.100.json";

async function seed() {
  await connectDB();

  const fullPath = path.join(__dirname, FILE);
  const raw = fs.readFileSync(fullPath, "utf8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Seed file must be a non-empty JSON array");
  }

  // Optional: remove duplicates for that course+level by deleting all first
  const courseCode = String(items[0].courseCode).toUpperCase();
  const level = Number(items[0].level);

  await Question.deleteMany({ courseCode, level });
  const inserted = await Question.insertMany(
    items.map((q) => ({ ...q, courseCode: String(q.courseCode).toUpperCase() })),
    { ordered: false }
  );

  console.log(`✅ Seeded ${inserted.length} questions for ${courseCode} L${level}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});

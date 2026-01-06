require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const matricRegex = /^[A-Z]{3}\/\d{4}\/\d{3,6}$/i;

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing in .env");

  // ✅ set these in .env each time you want to create an admin
  const name = (process.env.NEW_ADMIN_NAME || "ADMIN").trim();
  const email = (process.env.NEW_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.NEW_ADMIN_PASSWORD || "";
  const matric = (process.env.NEW_ADMIN_MATRIC || "ADM/2025/0001").toUpperCase().trim();

  if (!email || !password) {
    throw new Error("Set NEW_ADMIN_EMAIL and NEW_ADMIN_PASSWORD in .env");
  }
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  if (!matricRegex.test(matric)) throw new Error("Admin matric must match: ADM/2025/0001");

  await mongoose.connect(process.env.MONGO_URI);

  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount >= 5) {
    console.log("❌ Admin limit reached (max 5).");
    process.exit(0);
  }

  const exists = await User.findOne({ email });
  if (exists) {
    console.log("❌ Email already exists:", email);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await User.create({
    name,
    email,
    matric,
    level: 200, // ✅ you wanted admins 200lv
    passwordHash,
    role: "admin",
  });

  console.log("✅ Admin created:", email);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Failed:", e.message);
  process.exit(1);
});

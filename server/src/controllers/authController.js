// server/src/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const matricRegex = /^[A-Z]{3}\/\d{4}\/\d{3,6}$/i;

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, level: user.level },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, matric, level, password } = req.body;

    if (!name || !email || !matric || !level || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (![100, 200].includes(Number(level))) {
      return res.status(400).json({ message: "Level must be 100 or 200" });
    }

    if (!matricRegex.test(String(matric))) {
      return res.status(400).json({ message: "Matric format: MTH/2024/1234" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailLower = String(email).toLowerCase().trim();
    const matricUpper = String(matric).toUpperCase().trim();

    const exists = await User.findOne({
      $or: [{ email: emailLower }, { matric: matricUpper }],
    });

    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    const user = await User.create({
      name: String(name).trim(),
      email: emailLower,
      matric: matricUpper,
      level: Number(level),
      passwordHash,
      role: "student",
      avatar: "",
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matric: user.matric,
        level: user.level,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matric: user.matric,
        level: user.level,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ME =================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matric: user.matric,
        level: user.level,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE PROFILE =================
// ALLOWED: name, email, avatar
// LOCKED: matric, level
exports.updateMe = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const updates = {};

    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }

    if (typeof email === "string" && email.trim()) {
      const newEmail = email.toLowerCase().trim();
      const exists = await User.findOne({
        email: newEmail,
        _id: { $ne: req.user.id },
      });
      if (exists) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updates.email = newEmail;
    }

    if (typeof avatar === "string") {
      if (avatar.length > 2_500_000) {
        return res.status(400).json({ message: "Avatar too large" });
      }
      updates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matric: user.matric,
        level: user.level,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Fill all fields" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(String(newPassword), salt);
    await user.save();

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= RECOVER PASSWORD (NEW) =================
// POST /api/auth/recover  body: { email }
exports.recoverPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const genericMsg = "If this email exists, a recovery link will be sent.";

    const user = await User.findOne({ email });

    // always same response (security)
    if (!user) return res.json({ message: genericMsg });

    // raw token -> user gets raw token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // store HASH in DB
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordTokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15mins
    await user.save();

    // link to client
    const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
    const link = `${clientBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // For now log it. Later you can email it.
    console.log("🔐 Password reset link:", link);

    return res.json({ message: genericMsg });
  } catch (err) {
    console.error("recoverPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= RESET PASSWORD (NEW) =================
// POST /api/auth/reset-password body: { email, token, newPassword }
exports.resetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const token = String(req.body.token || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "email, token and newPassword are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordTokenHash: tokenHash,
      resetPasswordTokenExp: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired recovery link" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    user.resetPasswordTokenHash = null;
    user.resetPasswordTokenExp = null;

    await user.save();

    // auto login after reset
    const jwtToken = signToken(user);

    return res.json({
      message: "Password reset successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matric: user.matric,
        level: user.level,
        role: user.role,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const Report = require("../models/Report");
const User = require("../models/User");

exports.createReport = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    // ✅ get matric from DB (token doesn't have it)
    const u = await User.findById(req.user.id).select("matric level");
    if (!u) return res.status(404).json({ message: "User not found" });

    const report = await Report.create({
      title: title.trim(),
      message: message.trim(),
      fromUser: req.user.id,
      fromMatric: u.matric,
      fromLevel: u.level,
      status: "unread",
    });

    // 🔥 Emit to all admins in real-time
    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("report:new", {
        id: report._id,
        title: report.title,
        message: report.message,
        fromMatric: report.fromMatric,
        fromLevel: report.fromLevel,
        status: report.status,
        createdAt: report.createdAt,
      });
    }

    return res.status(201).json({ message: "Report sent " });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getReportsAdmin = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(200);
    return res.json({ reports });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Report.findByIdAndUpdate(id, { status: "read" }, { new: true });
    if (!r) return res.status(404).json({ message: "Report not found" });
    return res.json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.archiveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Report.findByIdAndUpdate(id, { status: "archived" }, { new: true });
    if (!r) return res.status(404).json({ message: "Report not found" });
    return res.json({ message: "Archived " });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Report.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ message: "Report not found" });
    return res.json({ message: "Deleted " });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

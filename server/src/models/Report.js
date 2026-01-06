const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromMatric: { type: String, required: true, trim: true },
    fromLevel: { type: Number, required: true },

    status: { type: String, enum: ["unread", "read"], default: "unread" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);

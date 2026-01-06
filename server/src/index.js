// server/src/index.js
import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

// routes (ALL inside src/routes)
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import questionSetRoutes from "./routes/questionSetRoutes.js";

import questionRoutes from "./routes/questionRoutes.js";
import examRoutes from "./routes/examRoutes.js";

// leaderboard
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

dotenv.config();

const app = express();

// ---------- dirname (ESM) ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- security / parsing ----------
app.use(helmet());

// ---------- CORS (supports prod + local) ----------
const allowedOrigins = [
  process.env.CLIENT_URL, // e.g. https://yourapp.netlify.app
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, cb) {
      // allow requests with no origin (Postman, server-to-server)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

// ---------- health ----------
app.get("/", (req, res) => res.json({ message: "INIOLUWA PEACE CBT API" }));

// ---------- static uploads ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/question-sets", questionSetRoutes);

// CBT
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);

// leaderboard
app.use("/api/leaderboard", leaderboardRoutes);

// ---------- error handler (keeps errors clean for users) ----------
app.use((err, req, res, next) => {
  // common: cors blocked
  if (String(err?.message || "").includes("Not allowed by CORS")) {
    console.error("CORS ERROR:", err.message);
    return res.status(403).json({ message: "CORS blocked: update CLIENT_URL" });
  }

  console.error("SERVER ERROR:", err);
  return res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    // make io available in controllers: req.app.get("io")
    app.set("io", io);

    io.on("connection", (socket) => {
      // existing admin room join
      socket.on("join", ({ role }) => {
        if (role === "admin") socket.join("admins");
      });

      // leaderboard room join
      // room format: lb:<level>:<COURSECODE>
      socket.on("joinLeaderboard", ({ level, courseCode }) => {
        const lv = Number(level);
        const cc = String(courseCode || "").toUpperCase().trim();
        if (!lv || !cc) return;
        socket.join(`lb:${lv}:${cc}`);
      });

      socket.on("leaveLeaderboard", ({ level, courseCode }) => {
        const lv = Number(level);
        const cc = String(courseCode || "").toUpperCase().trim();
        if (!lv || !cc) return;
        socket.leave(`lb:${lv}:${cc}`);
      });

      socket.on("disconnect", () => {});
    });

    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log("✅ Allowed CORS origins:", allowedOrigins);
    });
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}

start();

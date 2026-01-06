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

// routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import questionSetRoutes from "./routes/questionSetRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** ✅ CORS (Netlify + localhost + any extra env origins) */
function buildAllowedOrigins() {
  const list = [];

  // frontend url from env (your netlify link)
  if (process.env.CLIENT_URL) list.push(process.env.CLIENT_URL);

  // optional extra allowed origins (comma separated)
  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((x) => list.push(x));
  }

  // local dev
  list.push("http://localhost:5173");

  // remove duplicates
  return [...new Set(list)];
}

const allowedOrigins = buildAllowedOrigins();

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser requests (like Render health checks, Postman)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

/** ✅ Health */
app.get("/", (req, res) => res.json({ message: "INIOLUWA PEACE CBT API ✅" }));
app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * ✅ uploads folder
 * IMPORTANT:
 * Put uploads at: server/uploads (NOT inside src)
 * because Render deploy/build is cleaner that way.
 */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/** ✅ API routes */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/question-sets", questionSetRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

/** ✅ Error handler (so CORS error shows clearly) */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err?.message || err);
  res.status(500).json({ message: err?.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    const server = http.createServer(app);

    // ✅ Socket.IO (optional, safe)
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      socket.on("join", ({ role }) => {
        if (role === "admin") socket.join("admins");
      });

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
    });

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log("✅ Allowed CORS origins:", allowedOrigins);
    });
  } catch (err) {
    console.error("❌ Start failed:", err?.message || err);
    process.exit(1);
  }
}

start();
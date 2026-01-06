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

// ✅ Helps when behind Render/Netlify proxies
app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** ✅ Build allowed origins for CORS */
function buildAllowedOrigins() {
  const list = [];

  // Primary frontend (Netlify)
  // Example: CLIENT_URL=https://inioluwa-peace-cbt.netlify.app
  if (process.env.CLIENT_URL) list.push(process.env.CLIENT_URL.trim());

  // Extra origins (comma separated)
  // Example: CORS_ORIGINS=https://something.netlify.app,http://localhost:5173
  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((x) => list.push(x));
  }

  // Local dev
  list.push("http://localhost:5173");

  // Remove duplicates
  return [...new Set(list)];
}

const allowedOrigins = buildAllowedOrigins();

/** ✅ Security + parsing */
app.use(helmet());
app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

/** ✅ CORS (Netlify + previews + allow-list) */
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server / health checks / Postman
      if (!origin) return cb(null, true);

      // Allow anything explicitly listed
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Allow ANY Netlify subdomain (including preview builds)
      try {
        const host = new URL(origin).host;
        if (host.endsWith(".netlify.app")) return cb(null, true);
      } catch (_) {}

      // Allow local dev (extra safety)
      if (origin === "http://localhost:5173") return cb(null, true);

      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  })
);

/** ✅ Health routes */
app.get("/", (req, res) => res.json({ message: "INIOLUWA PEACE CBT API ✅" }));
app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * ✅ Static uploads
 * Recommended folder: server/uploads (NOT inside src)
 * This points to: <projectRoot>/uploads
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

/** ✅ Not found fallback */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/** ✅ Error handler (CORS errors show here too) */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err?.message || err);
  res.status(500).json({ message: err?.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    const server = http.createServer(app);

    /** ✅ Socket.IO with same CORS rules */
    const io = new Server(server, {
      cors: {
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);

          if (allowedOrigins.includes(origin)) return cb(null, true);

          try {
            const host = new URL(origin).host;
            if (host.endsWith(".netlify.app")) return cb(null, true);
          } catch (_) {}

          if (origin === "http://localhost:5173") return cb(null, true);

          return cb(new Error("Socket CORS blocked: " + origin));
        },
        credentials: true,
      },
    });

    // Make io usable in controllers: req.app.get("io")
    app.set("io", io);

    io.on("connection", (socket) => {
      // Admin room
      socket.on("join", ({ role }) => {
        if (role === "admin") socket.join("admins");
      });

      // Leaderboard room format: lb:<level>:<COURSECODE>
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
      console.log("✅ Allowed origins:", allowedOrigins);
    });
  } catch (err) {
    console.error("❌ Start failed:", err?.message || err);
    process.exit(1);
  }
}

start();

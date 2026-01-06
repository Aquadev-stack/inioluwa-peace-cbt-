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
app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ allow local + production
const allowedOrigins = [
  process.env.CLIENT_URL,           // e.g. https://inioluwa-peace-cbt.netlify.app
  "http://localhost:5173",
].filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow curl/postman/no-origin + allow listed origins
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ message: "INIOLUWA PEACE CBT API ✅" }));
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ Static uploads (note: Render filesystem is not permanent)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/question-sets", questionSetRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

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

    server.listen(PORT, () => console.log(` API running on port ${PORT}`));
  } catch (err) {
    console.error(" Start failed:", err.message);
    process.exit(1);
  }
}

start();
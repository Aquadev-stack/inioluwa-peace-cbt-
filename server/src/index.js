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

/* ===================== SECURITY + MIDDLEWARE ===================== */

app.use(helmet());

// ✅ CORS (DEV + PROD)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server / Postman / curl
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

/* ===================== BASIC ROUTE ===================== */

app.get("/", (req, res) => {
  res.json({ message: "INIOLUWA PEACE CBT API" });
});

/* ===================== STATIC FILES ===================== */

// uploads folder (server/src/uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===================== API ROUTES ===================== */

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

/* ===================== SERVER + SOCKET ===================== */

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

    // make io available in controllers
    app.set("io", io);

    io.on("connection", (socket) => {
      // admin room
      socket.on("join", ({ role }) => {
        if (role === "admin") socket.join("admins");
      });

      // leaderboard rooms
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
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("Allowed CORS origins:", allowedOrigins);
    });
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}

start();

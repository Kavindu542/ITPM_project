const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const studyMaterialRoutes = require("./routes/studyMaterialRoutes");

// Import library routes
const libraryRoutes = require("./routes/libraryRoutes");

// All routes (merged correctly)
const adminClubRoutes = require("./routes/adminClubRoutes");
const leaderClubRoutes = require("./routes/leaderClubRoutes");
const clubFeedRoutes = require("./routes/clubFeedRoutes");
const clubPublicRoutes = require("./routes/clubPublicRoutes");
const hostelRoutes = require("./routes/hostelRoutes");

const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());

const clientOriginRaw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowedOrigins = clientOriginRaw
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

if (!allowedOrigins.includes("http://localhost:5173"))
  allowedOrigins.push("http://localhost:5173");

if (!allowedOrigins.includes("http://127.0.0.1:5173"))
  allowedOrigins.push("http://127.0.0.1:5173");

// Vercel domains
if (!allowedOrigins.includes("https://itpm-project-orpin.vercel.app"))
  allowedOrigins.push("https://itpm-project-orpin.vercel.app");

if (!allowedOrigins.includes("https://itpm-project-jd11.vercel.app"))
  allowedOrigins.push("https://itpm-project-jd11.vercel.app");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isLocalDevOrigin(origin)) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/study-material", studyMaterialRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/library", libraryRoutes);

app.use("/api/admin", adminClubRoutes);
app.use("/api/leader", leaderClubRoutes);
app.use("/api/club-feed", clubFeedRoutes);
app.use("/api/clubs", clubPublicRoutes);
app.use("/api/hostel", hostelRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
const listenRetryLimit = 8;
const listenRetryBaseDelayMs = 300;

let httpServer = null;
let listenAttempts = 0;
let isShuttingDown = false;

const shutdown = async ({ signal, exitCode, relaySignal } = {}) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (signal) {
    console.log(`Received ${signal}. Shutting down gracefully...`);
  }

  await new Promise((resolve) => {
    if (!httpServer) return resolve();
    httpServer.close(() => resolve());
  });

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (relaySignal) {
    if (process.platform === "win32") {
      process.exit(exitCode ?? 0);
      return;
    }

    process.kill(process.pid, relaySignal);
    return;
  }

  process.exit(exitCode ?? 0);
};

process.once("SIGINT", () => shutdown({ signal: "SIGINT", exitCode: 0 }));

process.once("SIGTERM", () => shutdown({ signal: "SIGTERM", exitCode: 0 }));

process.once("SIGUSR2", () =>
  shutdown({ signal: "SIGUSR2", relaySignal: "SIGUSR2" }),
);

const startListening = () => {
  const server = app.listen(port, () => {
    httpServer = server;
    listenAttempts = 0;
    console.log(`Server running on port ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && listenAttempts < listenRetryLimit) {
      listenAttempts += 1;
      const retryDelay = listenRetryBaseDelayMs * listenAttempts;

      console.warn(
        `Port ${port} busy. Retry ${listenAttempts}/${listenRetryLimit} in ${retryDelay}ms...`,
      );

      setTimeout(startListening, retryDelay);
      return;
    }

    console.error("Failed to bind server:", error.message);
    process.exit(1);
  });
};

// Export app for Vercel serverless runtime
module.exports = app;

if (require.main === module) {
  // Running directly (local dev): connect DB then start HTTP server
  connectDB(process.env.MONGODB_URI)
    .then(() => startListening())
    .catch((err) => {
      console.error("Failed to start server:", err.message);
      console.warn(
        "Starting server without database connection (degraded mode)",
      );
      try {
        startListening();
      } catch (e) {
        console.error("Unable to start HTTP server:", e.message);
        process.exit(1);
      }
    });
} else {
  // Serverless cold start: connect DB eagerly without starting a listener
  connectDB(process.env.MONGODB_URI).catch((err) =>
    console.error("DB connection error on cold start:", err.message),
  );
}

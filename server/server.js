const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

app.use(morgan("dev"));
// Allow larger JSON bodies for profile images stored as data URLs.
// Note: base64 expands size (~33%), so 10MB image may be ~13-14MB in JSON.
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());

const clientOriginRaw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowedOrigins = clientOriginRaw
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Always allow localhost + 127.0.0.1 for local dev
const isLocalDevOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

if (!allowedOrigins.includes("http://localhost:5173"))
  allowedOrigins.push("http://localhost:5173");
if (!allowedOrigins.includes("http://127.0.0.1:5173"))
  allowedOrigins.push("http://127.0.0.1:5173");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl/postman) with no Origin header
      if (!origin) return callback(null, true);
      if (isLocalDevOrigin(origin)) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);

app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });

// Basic error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const message = err?.message || "Server error";

  // Multer errors (file upload)
  // https://github.com/expressjs/multer#error-handling
  const isMulterError =
    err &&
    (err.name === "MulterError" ||
      String(err?.code || "").startsWith("LIMIT_"));

  if (isMulterError) {
    const code = String(err.code || "");
    if (code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large" });
    }
    if (code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Too many files" });
    }
    if (code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected file field" });
    }
    return res.status(400).json({ message });
  }

  // If the API is running without a MongoDB connection, fail gracefully.
  const isDbUnavailable =
    message === "MONGODB_URI is missing" ||
    /buffering timed out/i.test(message) ||
    /before initial connection is complete/i.test(message) ||
    /not connected/i.test(message) ||
    /Topology is closed/i.test(message);

  const status = err.statusCode || (isDbUnavailable ? 503 : 500);

  // eslint-disable-next-line no-console
  if (isDbUnavailable) {
    console.warn("DB unavailable:", message);
  } else if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message: isDbUnavailable
      ? "Database unavailable. Set MONGODB_URI and restart the server."
      : message,
  });
};

module.exports = { errorHandler };

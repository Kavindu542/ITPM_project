// Basic error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const message = err?.message || "Server error";
  const isMulterError = err?.name === "MulterError";

  // If the API is running without a MongoDB connection, fail gracefully.
  const isDbUnavailable =
    message === "MONGODB_URI is missing" ||
    /buffering timed out/i.test(message) ||
    /before initial connection is complete/i.test(message) ||
    /not connected/i.test(message) ||
    /Topology is closed/i.test(message);

  const uploadStatus =
    isMulterError && err?.code === "LIMIT_FILE_SIZE"
      ? 413
      : isMulterError
        ? 400
        : null;

  const status = err.statusCode || uploadStatus || (isDbUnavailable ? 503 : 500);

  const resolvedMessage =
    isMulterError && err?.code === "LIMIT_FILE_SIZE"
      ? "Uploaded file is too large for this environment."
      : message;

  // eslint-disable-next-line no-console
  if (status >= 500 && !isDbUnavailable) console.error(err);

  res.status(status).json({
    message: isDbUnavailable
      ? "Database unavailable. Set MONGODB_URI and restart the server."
      : resolvedMessage,
  });
};

module.exports = { errorHandler };

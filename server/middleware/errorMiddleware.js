// Basic error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const message = err?.message || "Server error";

  // If the API is running without a MongoDB connection, fail gracefully.
  const isDbUnavailable =
    message === "MONGODB_URI is missing" ||
    /buffering timed out/i.test(message) ||
    /before initial connection is complete/i.test(message) ||
    /not connected/i.test(message) ||
    /Topology is closed/i.test(message);

  const status = err.statusCode || (isDbUnavailable ? 503 : 500);

  // eslint-disable-next-line no-console
  if (status >= 500 && !isDbUnavailable) console.error(err);

  res.status(status).json({
    message: isDbUnavailable
      ? "Database unavailable. Set MONGODB_URI and restart the server."
      : message,
  });
};

module.exports = { errorHandler };

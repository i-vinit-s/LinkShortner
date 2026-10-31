function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isServerError = status >= 500;
  const message = isServerError ? "Internal server error" : err.message;

  console.error(
    JSON.stringify({
      level: "error",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      error: err.name,
      message: err.message,
      stack: isServerError ? err.stack : undefined,
    }),
  );

  res.status(status).json({
    error: message,
    requestId: req.requestId,
  });
}

module.exports = errorHandler;

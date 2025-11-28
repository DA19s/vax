const errorHandler = (error, _req, res, _next) => {
  console.error("Error:", error);
  console.error("Stack:", error.stack);
  
  const status = error.status || 500;
  const message =
    status >= 500 ? "Internal server error" : error.message || "Error";

  res.status(status).json({
    success: false,
    ok: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { error: error.message, stack: error.stack }),
  });
};

module.exports = errorHandler;


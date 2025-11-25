const errorHandler = (error, _req, res, _next) => {
  console.error(error);
  const status = error.status || 500;
  const message =
    status >= 500 ? "Internal server error" : error.message || "Error";

  res.status(status).json({
    ok: false,
    message,
  });
};

module.exports = errorHandler;


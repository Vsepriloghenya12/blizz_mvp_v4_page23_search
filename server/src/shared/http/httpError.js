class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details || null;
  }
}

function notFoundHandler(_req, _res, next) {
  next(new HttpError(404, 'NOT_FOUND', 'Маршрут не найден'));
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'Внутренняя ошибка сервера' : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: error.details || null
    }
  });
}

module.exports = { HttpError, notFoundHandler, errorHandler };

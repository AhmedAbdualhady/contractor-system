import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  err.isOperational = true;
  next(err);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  let details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'بيانات غير صحيحة';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'الجلسة غير صالحة، سجّل الدخول من جديد';
  } else if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'هذه القيمة موجودة مسبقاً';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) message = 'حدث خطأ في الخادم';
  }

  res.status(status).json({ success: false, message, ...(details && { details }) });
};

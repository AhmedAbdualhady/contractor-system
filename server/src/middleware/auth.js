import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token =
    req.cookies?.token || (header?.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) throw new AppError('يجب تسجيل الدخول أولاً', 401);

  const payload = jwt.verify(token, env.jwtSecret);
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, is_active FROM users WHERE id = ? LIMIT 1',
    [payload.id]
  );
  const user = rows[0];
  if (!user || !user.is_active) throw new AppError('الحساب غير متاح', 401);

  req.user = user;
  next();
});

// Usage: authorize('admin', 'accountant')
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('ليس لديك صلاحية لهذا الإجراء', 403));
    }
    next();
  };

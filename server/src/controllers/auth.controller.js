import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('بريد غير صحيح'),
  password: z.string().min(6, 'كلمة المرور قصيرة'),
});

// If the API and the website end up on different domains in production,
// change sameSite to 'none' (requires secure: true).
const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export async function login(req, res) {
  const { email, password } = req.body;

  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  const user = rows[0];
  const ok = user && user.is_active && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new AppError('البريد أو كلمة المرور غير صحيحة', 401);

  res.cookie('token', signToken(user), cookieOptions);
  res.json({ success: true, user: publicUser(user) });
}

export async function me(req, res) {
  res.json({ success: true, user: publicUser(req.user) });
}

export async function logout(_req, res) {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
}

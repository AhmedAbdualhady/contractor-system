import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const pwd = z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(100);

export const accountSchema = z.object({
  client_id: z.number().int().positive(),
  email: z.string().trim().toLowerCase().email('بريد غير صحيح'),
  password: pwd,
});
export const passwordSchema = z.object({ password: pwd });

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};

// العميل المرتبط بحساب الدخول الحالي
async function myClientId(userId) {
  const [r] = await pool.execute('SELECT id FROM clients WHERE user_id = ? LIMIT 1', [userId]);
  if (!r[0]) throw new AppError('لا يوجد عميل مرتبط بهذا الحساب', 403);
  return r[0].id;
}

export async function myProjects(req, res) {
  const cid = await myClientId(req.user.id);
  const [rows] = await pool.execute(
    `SELECT p.id, p.title, p.type, p.status, p.location, p.progress, p.start_date, p.end_date,
            p.budget, p.currency,
            (SELECT COALESCE(SUM(a.amount), 0) FROM payments a
              WHERE a.project_id = p.id AND a.currency = p.currency) AS paid
     FROM projects p WHERE p.client_id = ? ORDER BY p.created_at DESC`,
    [cid]
  );
  res.json({ success: true, projects: rows });
}

export async function myProject(req, res) {
  const cid = await myClientId(req.user.id);
  const id = idOf(req.params.id);

  const [rows] = await pool.execute(
    `SELECT id, title, type, status, location, description, progress, start_date, end_date, budget, currency
     FROM projects WHERE id = ? AND client_id = ? LIMIT 1`,
    [id, cid]
  );
  const project = rows[0];
  if (!project) throw new AppError('المشروع غير موجود', 404);

  const [phases] = await pool.execute(
    `SELECT id, title, status, progress, start_date, end_date
     FROM project_phases WHERE project_id = ? ORDER BY sort_order, id`,
    [id]
  );
  const [payments] = await pool.execute(
    `SELECT id, amount, currency, method, paid_at, notes
     FROM payments WHERE project_id = ? AND client_id = ? ORDER BY paid_at DESC, id DESC`,
    [id, cid]
  );
  const [media] = await pool.execute(
    `SELECT id, url, kind, stage, caption FROM project_media WHERE project_id = ? ORDER BY id DESC`,
    [id]
  );
  const paid = payments.filter((p) => p.currency === project.currency).reduce((s, p) => s + p.amount, 0);

  res.json({ success: true, project, phases, payments, media, paid });
}

// ---- يستخدمها المدير من لوحة التحكم ----
export async function createAccount(req, res) {
  const { client_id, email, password } = req.body;
  const [c] = await pool.execute('SELECT id, name, user_id FROM clients WHERE id = ? LIMIT 1', [client_id]);
  if (!c[0]) throw new AppError('العميل غير موجود', 404);
  if (c[0].user_id) throw new AppError('هذا العميل لديه حساب بالفعل', 409);

  const hash = await bcrypt.hash(password, 12);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'client')",
      [c[0].name, email, hash]
    );
    await conn.execute('UPDATE clients SET user_id = ? WHERE id = ?', [u.insertId, client_id]);
    await conn.commit();
    res.status(201).json({ success: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function resetPassword(req, res) {
  const clientId = idOf(req.params.clientId);
  const [c] = await pool.execute('SELECT user_id FROM clients WHERE id = ? LIMIT 1', [clientId]);
  if (!c[0]?.user_id) throw new AppError('هذا العميل ليس لديه حساب بوابة', 404);
  const hash = await bcrypt.hash(req.body.password, 12);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, c[0].user_id]);
  res.json({ success: true });
}

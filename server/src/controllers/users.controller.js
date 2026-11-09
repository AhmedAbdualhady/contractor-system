import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const ROLES = ['admin', 'accountant', 'site_engineer'];
const pwd = z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(100);

export const createSchema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير').max(120),
  email: z.string().trim().toLowerCase().email('بريد غير صحيح'),
  password: pwd,
  role: z.enum(ROLES),
});
export const updateSchema = z
  .object({
    name: z.string().trim().min(2, 'الاسم قصير').max(120).optional(),
    role: z.enum(ROLES).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'لا توجد بيانات للتحديث' });
export const passwordSchema = z.object({ password: pwd });

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};

// الموظفون فقط. حسابات العملاء تُدار من صفحة العملاء
async function staffTarget(id) {
  const [r] = await pool.execute('SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1', [id]);
  if (!r[0] || r[0].role === 'client') throw new AppError('المستخدم غير موجود', 404);
  return r[0];
}

export async function listUsers(_req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, is_active, created_at FROM users
     WHERE role <> 'client' ORDER BY is_active DESC, FIELD(role, 'admin', 'accountant', 'site_engineer'), name`
  );
  res.json({ success: true, users: rows });
}

export async function createUser(req, res) {
  const b = req.body;
  const hash = await bcrypt.hash(b.password, 12);
  try {
    const [r] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [b.name, b.email, hash, b.role]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new AppError('هذا البريد مستخدم من قبل', 409);
    throw e;
  }
}

export async function updateUser(req, res) {
  const id = idOf(req.params.id);
  const t = await staffTarget(id);
  const b = req.body;

  const changesRole = b.role !== undefined && b.role !== t.role;
  const changesActive = b.is_active !== undefined && Boolean(b.is_active) !== Boolean(t.is_active);
  if (id === req.user.id && (changesRole || changesActive)) {
    throw new AppError('لا يمكنك تغيير دورك أو تعطيل حسابك بنفسك', 400);
  }
  if (t.role === 'admin' && t.is_active && ((changesRole && b.role !== 'admin') || b.is_active === false)) {
    const [[c]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND is_active = 1 AND id <> ?", [id]);
    if (c.n < 1) throw new AppError('لازم يفضل مدير واحد نشط على الأقل', 409);
  }

  const sets = [], vals = [];
  if (b.name !== undefined) { sets.push('name = ?'); vals.push(b.name); }
  if (b.role !== undefined) { sets.push('role = ?'); vals.push(b.role); }
  if (b.is_active !== undefined) { sets.push('is_active = ?'); vals.push(b.is_active ? 1 : 0); }
  await pool.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
  res.json({ success: true }); // التعطيل والدور يسريان فوراً: السيرفر يقرأهما من القاعدة في كل طلب
}

export async function resetPassword(req, res) {
  const id = idOf(req.params.id);
  await staffTarget(id);
  const hash = await bcrypt.hash(req.body.password, 12);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
  res.json({ success: true });
}

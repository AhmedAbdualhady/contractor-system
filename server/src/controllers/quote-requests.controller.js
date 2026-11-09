import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};

export const submitSchema = z.object({
  name: z.string().trim().min(2, 'اكتب اسمك').max(150),
  phone: z.string().trim().regex(/^[+\d\s\-()]{7,30}$/, 'رقم الهاتف غير صحيح'),
  email: z.union([z.string().trim().email('بريد غير صحيح'), z.literal('')]).optional().default(''),
  project_type: z.string().trim().max(60).optional().default(''),
  location: z.string().trim().max(200).optional().default(''),
  budget_range: z.string().trim().max(60).optional().default(''),
  message: z.string().trim().max(2000).optional().default(''),
  website: z.string().optional().default(''), // خانة مخفية: البوتات فقط تملأها
});

export const statusSchema = z.object({ status: z.enum(['new', 'contacted', 'quoted', 'closed']) });

const cleanPhone = (p) => p.replace(/[\s\-()]/g, '');

// عام (بدون تسجيل دخول): من فورم الموقع
export async function submit(req, res) {
  const b = req.body;
  if (b.website) return res.status(201).json({ success: true }); // بوت: نتجاهل بصمت
  await pool.execute(
    `INSERT INTO quote_requests (name, phone, email, project_type, location, budget_range, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [b.name, cleanPhone(b.phone), b.email || null, b.project_type || null, b.location || null, b.budget_range || null, b.message || null]
  );
  res.status(201).json({ success: true });
}

export async function list(_req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, phone, email, project_type, location, budget_range, message, status, created_at
     FROM quote_requests ORDER BY (status = 'new') DESC, id DESC LIMIT 200`
  );
  res.json({ success: true, requests: rows });
}

export async function setStatus(req, res) {
  const [r] = await pool.execute('UPDATE quote_requests SET status = ? WHERE id = ?', [req.body.status, idOf(req.params.id)]);
  if (!r.affectedRows) throw new AppError('الطلب غير موجود', 404);
  res.json({ success: true });
}

// يجهّز العميل (ينشئه إن لم يكن موجوداً بنفس الرقم) ليبدأ عرض السعر
export async function convert(req, res) {
  const id = idOf(req.params.id);
  const [r] = await pool.execute('SELECT * FROM quote_requests WHERE id = ? LIMIT 1', [id]);
  const q = r[0];
  if (!q) throw new AppError('الطلب غير موجود', 404);

  const [c] = await pool.execute('SELECT id FROM clients WHERE phone = ? LIMIT 1', [q.phone]);
  let clientId = c[0]?.id;
  if (!clientId) {
    const [ins] = await pool.execute(
      'INSERT INTO clients (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)',
      [q.name, q.phone, q.email || null, q.location || null, q.message || null]
    );
    clientId = ins.insertId;
  }
  if (q.status === 'new') await pool.execute("UPDATE quote_requests SET status = 'contacted' WHERE id = ?", [id]);
  res.json({ success: true, client_id: clientId });
}

export async function remove(req, res) {
  const [r] = await pool.execute('DELETE FROM quote_requests WHERE id = ?', [idOf(req.params.id)]);
  if (!r.affectedRows) throw new AppError('الطلب غير موجود', 404);
  res.json({ success: true });
}

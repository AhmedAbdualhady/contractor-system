import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const categories = ['materials', 'labor', 'equipment', 'transport', 'other'];

export const expenseSchema = z.object({
  project_id: z.number().int().positive().nullable().optional(), // بدون مشروع = مصروف عام
  category: z.enum(categories).default('other'),
  description: z.string().trim().min(1, 'اكتب وصف المصروف').max(255),
  amount: z.number().positive('المبلغ غير صحيح'),
  currency: z.enum(['SDG', 'USD']).default('SDG'),
  spent_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
});

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};

export async function listExpenses(req, res) {
  const where = [], params = [];
  if (req.query.project_id) { where.push('e.project_id = ?'); params.push(idOf(req.query.project_id)); }
  if (req.query.category) {
    if (!categories.includes(req.query.category)) throw new AppError('تصنيف غير صحيح', 400);
    where.push('e.category = ?'); params.push(req.query.category);
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT e.id, e.category, e.description, e.amount, e.currency, e.spent_at, p.title AS project_title
     FROM expenses e LEFT JOIN projects p ON p.id = e.project_id
     ${w} ORDER BY e.spent_at DESC, e.id DESC LIMIT 500`, params
  );
  const [totals] = await pool.query(`SELECT e.currency, SUM(e.amount) AS total FROM expenses e ${w} GROUP BY e.currency`, params);
  res.json({ success: true, expenses: rows, totals });
}

export async function createExpense(req, res) {
  const b = req.body;
  try {
    const [r] = await pool.execute(
      `INSERT INTO expenses (project_id, category, description, amount, currency, spent_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [b.project_id ?? null, b.category, b.description, b.amount, b.currency, b.spent_at, req.user.id]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') throw new AppError('المشروع غير موجود', 400);
    throw e;
  }
}

export async function deleteExpense(req, res) {
  const [r] = await pool.execute('DELETE FROM expenses WHERE id = ?', [idOf(req.params.id)]);
  if (!r.affectedRows) throw new AppError('المصروف غير موجود', 404);
  res.json({ success: true }); // لو كان أجوراً، تعود أيام العمل المرتبطة به "غير مدفوعة"
}

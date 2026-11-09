import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export const workerSchema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير').max(150),
  phone: z.string().trim().max(30).optional().default(''),
  trade: z.string().trim().max(80).optional().default(''),
  daily_wage: z.number().min(0, 'الأجر غير صحيح'),
  currency: z.enum(['SDG', 'USD']).default('SDG'),
  is_active: z.boolean().default(true),
});
export const payDuesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح').optional(),
});

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};

export async function listWorkers(_req, res) {
  const [rows] = await pool.query(
    `SELECT w.id, w.name, w.phone, w.trade, w.daily_wage, w.currency, w.is_active,
            COALESCE(SUM(CASE WHEN d.expense_id IS NULL THEN d.days END), 0) AS unpaid_days,
            COALESCE(SUM(CASE WHEN d.expense_id IS NULL THEN d.days * d.wage END), 0) AS unpaid_amount
     FROM workers w LEFT JOIN work_days d ON d.worker_id = w.id
     GROUP BY w.id ORDER BY w.is_active DESC, w.name`
  );
  res.json({ success: true, workers: rows });
}

export async function createWorker(req, res) {
  const b = req.body;
  const [r] = await pool.execute(
    'INSERT INTO workers (name, phone, trade, daily_wage, currency, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [b.name, b.phone || null, b.trade || null, b.daily_wage, b.currency, b.is_active ? 1 : 0]
  );
  res.status(201).json({ success: true, id: r.insertId });
}

export async function updateWorker(req, res) {
  const b = req.body;
  const [r] = await pool.execute(
    'UPDATE workers SET name = ?, phone = ?, trade = ?, daily_wage = ?, currency = ?, is_active = ? WHERE id = ?',
    [b.name, b.phone || null, b.trade || null, b.daily_wage, b.currency, b.is_active ? 1 : 0, idOf(req.params.id)]
  );
  if (!r.affectedRows) throw new AppError('العامل غير موجود', 404);
  res.json({ success: true });
}

export async function deleteWorker(req, res) {
  try {
    const [r] = await pool.execute('DELETE FROM workers WHERE id = ?', [idOf(req.params.id)]);
    if (!r.affectedRows) throw new AppError('العامل غير موجود', 404);
    res.json({ success: true });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') throw new AppError('لديه سجل حضور. عطّله بدل حذفه', 409);
    throw e;
  }
}

// يحوّل أيام العمل غير المدفوعة إلى مصروف أجور (مصروف لكل مشروع)
export async function payDues(req, res) {
  const id = idOf(req.params.id);
  const [w] = await pool.execute('SELECT name FROM workers WHERE id = ? LIMIT 1', [id]);
  if (!w[0]) throw new AppError('العامل غير موجود', 404);
  const date = req.body.date || new Date().toISOString().slice(0, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [groups] = await conn.query(
      `SELECT project_id, currency, SUM(days) AS days, SUM(days * wage) AS amount
       FROM work_days WHERE worker_id = ? AND expense_id IS NULL GROUP BY project_id, currency`,
      [id]
    );
    if (groups.length === 0) throw new AppError('لا توجد أجور مستحقة لهذا العامل', 400);

    for (const g of groups) {
      const [e] = await conn.execute(
        `INSERT INTO expenses (project_id, category, description, amount, currency, spent_at, created_by)
         VALUES (?, 'labor', ?, ?, ?, ?, ?)`,
        [g.project_id, `أجور ${w[0].name} (${g.days} يوم)`, g.amount, g.currency, date, req.user.id]
      );
      await conn.execute(
        'UPDATE work_days SET expense_id = ? WHERE worker_id = ? AND expense_id IS NULL AND project_id = ? AND currency = ?',
        [e.insertId, id, g.project_id, g.currency]
      );
    }
    await conn.commit();
    res.json({ success: true, count: groups.length });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

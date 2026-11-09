import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export const attendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  project_id: z.number().int().positive('اختر المشروع'),
  entries: z.array(z.object({
    worker_id: z.number().int().positive(),
    days: z.number().min(0.5).max(3),
  })).max(200),
});

export async function listDay(req, res) {
  const date = String(req.query.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new AppError('تاريخ غير صحيح', 400);
  const [rows] = await pool.execute(
    'SELECT id, worker_id, project_id, days, expense_id FROM work_days WHERE work_date = ?',
    [date]
  );
  res.json({ success: true, records: rows });
}

// يحفظ حضور اليوم لمشروع معيّن: الأيام المدفوعة سابقاً لا تتغير
export async function saveDay(req, res) {
  const { date, project_id, entries } = req.body;
  const [p] = await pool.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [project_id]);
  if (!p[0]) throw new AppError('المشروع غير موجود', 404);

  const seen = new Set();
  const unique = entries.filter((e) => !seen.has(e.worker_id) && seen.add(e.worker_id));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM work_days WHERE work_date = ? AND project_id = ? AND expense_id IS NULL', [date, project_id]);
    const [paid] = await conn.execute('SELECT worker_id FROM work_days WHERE work_date = ? AND project_id = ?', [date, project_id]);
    const paidSet = new Set(paid.map((r) => r.worker_id));
    const todo = unique.filter((e) => !paidSet.has(e.worker_id));

    if (todo.length) {
      const [ws] = await conn.query('SELECT id, daily_wage, currency FROM workers WHERE id IN (?)', [todo.map((e) => e.worker_id)]);
      const byId = new Map(ws.map((w) => [w.id, w]));
      const rows = todo.filter((e) => byId.has(e.worker_id)).map((e) => {
        const w = byId.get(e.worker_id);
        return [e.worker_id, project_id, date, e.days, w.daily_wage, w.currency, req.user.id];
      });
      if (rows.length) {
        await conn.query('INSERT INTO work_days (worker_id, project_id, work_date, days, wage, currency, created_by) VALUES ?', [rows]);
      }
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};
const round2 = (n) => Math.round(n * 100) / 100;

const itemSchema = z.object({
  description: z.string().trim().min(1, 'وصف البند مطلوب').max(255),
  quantity: z.number().positive('الكمية غير صحيحة'),
  unit: z.string().trim().max(30).optional().default(''),
  unit_price: z.number().min(0, 'السعر غير صحيح'),
});
const base = {
  client_id: z.number().int().positive('اختر العميل'),
  project_id: z.number().int().positive().nullable().optional(),
  currency: z.enum(['SDG', 'USD']).default('SDG'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح').nullable().optional(),
  notes: z.string().trim().max(2000).optional().default(''),
  items: z.array(itemSchema).min(1, 'أضف بنداً واحداً على الأقل').max(100),
};

// عروض الأسعار والفواتير تتشارك نفس المنطق، والفرق في هذه الإعدادات فقط
function make(cfg) {
  const schema = z.object({ ...base, ...(cfg.discount ? { discount: z.number().min(0).default(0), request_id: z.number().int().positive().nullable().optional() } : {}) });
  const statusSchema = z.object({ status: z.enum(cfg.manual) });

  const totalOf = (b) =>
    round2(Math.max(b.items.reduce((s, i) => s + i.quantity * i.unit_price, 0) - (cfg.discount ? b.discount : 0), 0));

  const fieldsOf = (b) => ({
    client_id: b.client_id,
    project_id: b.project_id ?? null,
    currency: b.currency,
    total: totalOf(b),
    [cfg.date]: b.date ?? null,
    notes: b.notes || null,
    ...(cfg.discount ? { discount: b.discount } : {}),
  });

  async function saveItems(conn, id, items) {
    await conn.query(`DELETE FROM ${cfg.items} WHERE ${cfg.fk} = ?`, [id]);
    await conn.query(
      `INSERT INTO ${cfg.items} (${cfg.fk}, description, quantity, unit, unit_price) VALUES ?`,
      [items.map((i) => [id, i.description, i.quantity, i.unit || null, i.unit_price])]
    );
  }

  async function list(_req, res) {
    const [rows] = await pool.query(
      `SELECT x.id, x.number, x.status, x.currency, x.total, x.${cfg.date} AS date, x.client_id, x.project_id,
              x.created_at, c.name AS client_name, p.title AS project_title
              ${cfg.paid ? ', (SELECT COALESCE(SUM(a.amount), 0) FROM payments a WHERE a.invoice_id = x.id) AS paid' : ''}
       FROM ${cfg.table} x JOIN clients c ON c.id = x.client_id
       LEFT JOIN projects p ON p.id = x.project_id ORDER BY x.id DESC`
    );
    res.json({ success: true, rows });
  }

  async function get(req, res) {
    const id = idOf(req.params.id);
    const [r] = await pool.execute(
      `SELECT x.*, c.name AS client_name, c.phone AS client_phone, c.address AS client_address, p.title AS project_title
       FROM ${cfg.table} x JOIN clients c ON c.id = x.client_id
       LEFT JOIN projects p ON p.id = x.project_id WHERE x.id = ? LIMIT 1`,
      [id]
    );
    if (!r[0]) throw new AppError('المستند غير موجود', 404);
    const [items] = await pool.execute(
      `SELECT id, description, quantity, unit, unit_price FROM ${cfg.items} WHERE ${cfg.fk} = ? ORDER BY id`,
      [id]
    );
    let paid = 0;
    if (cfg.paid) {
      const [[s]] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = ?', [id]);
      paid = s.paid;
    }
    res.json({ success: true, doc: { ...r[0], date: r[0][cfg.date] }, items, paid });
  }

  async function create(req, res) {
    const b = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[{ n }]] = await conn.query(`SELECT COALESCE(MAX(id), 0) + 1 AS n FROM ${cfg.table}`);
      const number = `${cfg.prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
      const fields = { number, ...fieldsOf(b), ...(cfg.discount && b.request_id ? { request_id: b.request_id } : {}) };
      const keys = Object.keys(fields);
      const [r] = await conn.execute(
        `INSERT INTO ${cfg.table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
        keys.map((k) => fields[k])
      );
      await saveItems(conn, r.insertId, b.items);
      if (cfg.discount && b.request_id) {
        await conn.execute("UPDATE quote_requests SET status = 'quoted' WHERE id = ? AND status IN ('new', 'contacted')", [b.request_id]);
      }
      await conn.commit();
      res.status(201).json({ success: true, id: r.insertId, number });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async function update(req, res) {
    const id = idOf(req.params.id);
    const [cur] = await pool.execute(`SELECT status FROM ${cfg.table} WHERE id = ? LIMIT 1`, [id]);
    if (!cur[0]) throw new AppError('المستند غير موجود', 404);
    if (cfg.locked.includes(cur[0].status)) throw new AppError('لا يمكن تعديل مستند بهذه الحالة', 409);

    const fields = fieldsOf(req.body);
    const keys = Object.keys(fields);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(`UPDATE ${cfg.table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => fields[k]), id]);
      await saveItems(conn, id, req.body.items);
      await conn.commit();
      res.json({ success: true });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async function setStatus(req, res) {
    const [r] = await pool.execute(`UPDATE ${cfg.table} SET status = ? WHERE id = ?`, [req.body.status, idOf(req.params.id)]);
    if (!r.affectedRows) throw new AppError('المستند غير موجود', 404);
    res.json({ success: true });
  }

  async function remove(req, res) {
    const id = idOf(req.params.id);
    if (cfg.paid) {
      const [[s]] = await pool.query('SELECT COUNT(*) AS n FROM payments WHERE invoice_id = ?', [id]);
      if (s.n > 0) throw new AppError('لا يمكن حذف فاتورة عليها دفعات. احذف الدفعات أولاً', 409);
    }
    const [r] = await pool.execute(`DELETE FROM ${cfg.table} WHERE id = ?`, [id]);
    if (!r.affectedRows) throw new AppError('المستند غير موجود', 404);
    res.json({ success: true });
  }

  return { schema, statusSchema, list, get, create, update, setStatus, remove };
}

export const quotes = make({
  table: 'quotes', items: 'quote_items', fk: 'quote_id', prefix: 'Q', date: 'valid_until',
  discount: true, paid: false, locked: ['accepted'],
  manual: ['draft', 'sent', 'accepted', 'rejected'],
});
export const invoices = make({
  table: 'invoices', items: 'invoice_items', fk: 'invoice_id', prefix: 'INV', date: 'due_date',
  discount: false, paid: true, locked: ['paid', 'partial'],
  manual: ['draft', 'sent', 'overdue'], // paid/partial تتحدد تلقائياً من الدفعات
});

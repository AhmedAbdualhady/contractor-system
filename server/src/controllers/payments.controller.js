import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export const paymentSchema = z.object({
  project_id: z.number().int().positive('اختر المشروع'),
  invoice_id: z.number().int().positive().nullable().optional(),
  amount: z.number().positive('المبلغ غير صحيح'),
  currency: z.enum(['SDG', 'USD']).default('SDG'),
  method: z.enum(['cash', 'bank', 'transfer', 'mobile_money']).default('cash'),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  reference: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(255).optional().default(''),
});

// يحدّث حالة الفاتورة (مدفوعة / جزئية) حسب مجموع الدفعات
async function refreshInvoice(invoiceId) {
  if (!invoiceId) return;
  const [[inv]] = await pool.query('SELECT status, total FROM invoices WHERE id = ?', [invoiceId]);
  if (!inv) return;
  const [[s]] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = ?', [invoiceId]);
  let status = inv.status;
  if (inv.total > 0 && s.paid >= inv.total) status = 'paid';
  else if (s.paid > 0) status = 'partial';
  else if (['paid', 'partial'].includes(inv.status)) status = 'sent';
  if (status !== inv.status) await pool.execute('UPDATE invoices SET status = ? WHERE id = ?', [status, invoiceId]);
}

export async function listPayments(_req, res) {
  const [rows] = await pool.query(
    `SELECT pay.id, pay.amount, pay.currency, pay.method, pay.paid_at, pay.reference, pay.notes,
            p.title AS project_title, c.name AS client_name, i.number AS invoice_number
     FROM payments pay
     JOIN projects p ON p.id = pay.project_id
     LEFT JOIN clients c ON c.id = pay.client_id
     LEFT JOIN invoices i ON i.id = pay.invoice_id
     ORDER BY pay.paid_at DESC, pay.id DESC LIMIT 300`
  );
  const [totals] = await pool.query('SELECT currency, SUM(amount) AS total FROM payments GROUP BY currency');
  res.json({ success: true, payments: rows, totals });
}

export async function createPayment(req, res) {
  const b = req.body;
  const [pr] = await pool.execute('SELECT client_id FROM projects WHERE id = ? LIMIT 1', [b.project_id]);
  if (!pr[0]) throw new AppError('المشروع غير موجود', 404);
  if (!pr[0].client_id) throw new AppError('اربط المشروع بعميل أولاً', 400);

  let currency = b.currency;
  if (b.invoice_id) {
    const [inv] = await pool.execute('SELECT client_id, currency FROM invoices WHERE id = ? LIMIT 1', [b.invoice_id]);
    if (!inv[0]) throw new AppError('الفاتورة غير موجودة', 404);
    if (inv[0].client_id !== pr[0].client_id) throw new AppError('الفاتورة لا تخص عميل هذا المشروع', 400);
    currency = inv[0].currency;
  }

  const [r] = await pool.execute(
    `INSERT INTO payments (client_id, project_id, invoice_id, amount, currency, method, reference, paid_at, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [pr[0].client_id, b.project_id, b.invoice_id ?? null, b.amount, currency, b.method,
     b.reference || null, b.paid_at, b.notes || null, req.user.id]
  );
  await refreshInvoice(b.invoice_id);
  res.status(201).json({ success: true, id: r.insertId });
}

export async function deletePayment(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new AppError('معرّف غير صحيح', 400);
  const [cur] = await pool.execute('SELECT invoice_id FROM payments WHERE id = ? LIMIT 1', [id]);
  if (!cur[0]) throw new AppError('الدفعة غير موجودة', 404);
  await pool.execute('DELETE FROM payments WHERE id = ?', [id]);
  await refreshInvoice(cur[0].invoice_id);
  res.json({ success: true });
}

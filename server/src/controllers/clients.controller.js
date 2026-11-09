import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { nn, intParam, patchRow } from '../utils/update.js';

const text = (max = 255) => z.string().trim().max(max).optional().or(z.literal(''));

export const clientSchema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير'),
  phone: text(30),
  email: z.string().trim().email('بريد غير صحيح').optional().or(z.literal('')),
  address: text(),
  notes: text(2000),
});
export const clientPatchSchema = clientSchema.partial();

export async function listClients(_req, res) {
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS projects_count
     FROM clients c ORDER BY c.created_at DESC`
  );
  res.json({ success: true, clients: rows });
}

export async function createClient(req, res) {
  const b = req.body;
  const [r] = await pool.execute(
    'INSERT INTO clients (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)',
    [b.name, nn(b.phone), nn(b.email), nn(b.address), nn(b.notes)]
  );
  res.status(201).json({ success: true, id: r.insertId });
}

export async function updateClient(req, res) {
  await patchRow('clients', intParam(req), req.body, ['name', 'phone', 'email', 'address', 'notes']);
  res.json({ success: true });
}

export async function deleteClient(req, res) {
  const id = intParam(req);
  try {
    const [r] = await pool.execute('DELETE FROM clients WHERE id = ?', [id]);
    if (!r.affectedRows) throw new AppError('العميل غير موجود', 404);
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new AppError('لا يمكن حذف عميل لديه عروض أسعار أو فواتير أو دفعات', 409);
    }
    throw e;
  }
  res.json({ success: true });
}

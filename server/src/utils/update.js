import { pool } from '../config/db.js';
import { AppError } from './AppError.js';

export const nn = (v) => (v === '' || v === undefined ? null : v);

export function intParam(req, name = 'id') {
  const n = Number(req.params[name]);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
}

// UPDATE table SET a=?, b=? WHERE id=?  (only columns listed in `allowed`)
export async function patchRow(table, id, data, allowed) {
  const keys = Object.keys(data).filter((k) => allowed.includes(k));
  if (!keys.length) throw new AppError('لا توجد بيانات للتحديث', 400);
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const vals = keys.map((k) => nn(data[k]));
  const [r] = await pool.execute(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...vals, id]);
  if (!r.affectedRows) throw new AppError('العنصر غير موجود', 404);
}

import { pool } from '../config/db.js';

export async function stats(req, res) {
  const [[counts]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM projects WHERE status = 'in_progress') AS active_projects,
       (SELECT COUNT(*) FROM projects WHERE status = 'completed') AS completed_projects,
       (SELECT COUNT(*) FROM clients) AS clients,
       (SELECT COUNT(*) FROM quote_requests WHERE status = 'new') AS new_requests`
  );
  const [recent] = await pool.query(
    `SELECT p.id, p.title, p.status, p.progress, c.name AS client_name
     FROM projects p LEFT JOIN clients c ON c.id = p.client_id
     ORDER BY p.updated_at DESC LIMIT 5`
  );
  const out = { success: true, counts, recent };

  // الماليات للمدير والمحاسب فقط
  if (['admin', 'accountant'].includes(req.user.role)) {
    [out.income] = await pool.query('SELECT currency, SUM(amount) AS total FROM payments GROUP BY currency');
    [out.spend] = await pool.query('SELECT currency, SUM(amount) AS total FROM expenses GROUP BY currency');
  }
  res.json(out);
}

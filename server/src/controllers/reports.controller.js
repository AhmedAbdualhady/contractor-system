import { pool } from '../config/db.js';

// ربح كل مشروع بعملة المشروع: المحصّل - المصروف
export async function projectsProfit(_req, res) {
  const [projects] = await pool.query(
    `SELECT p.id, p.title, p.status, p.currency, p.budget, c.name AS client_name,
       (SELECT COALESCE(SUM(a.amount), 0) FROM payments a WHERE a.project_id = p.id AND a.currency = p.currency) AS collected,
       (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.project_id = p.id AND e.currency = p.currency) AS spent,
       (SELECT COALESCE(SUM(d.days * d.wage), 0) FROM work_days d WHERE d.project_id = p.id AND d.expense_id IS NULL AND d.currency = p.currency) AS unpaid_wages,
       ((SELECT COUNT(*) FROM payments a WHERE a.project_id = p.id AND a.currency <> p.currency)
        + (SELECT COUNT(*) FROM expenses e WHERE e.project_id = p.id AND e.currency <> p.currency)) AS other_currency
     FROM projects p LEFT JOIN clients c ON c.id = p.client_id ORDER BY p.id DESC`
  );
  const [overhead] = await pool.query(
    'SELECT currency, SUM(amount) AS total FROM expenses WHERE project_id IS NULL GROUP BY currency'
  );
  res.json({ success: true, projects, overhead });
}

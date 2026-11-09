import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { nn, intParam, patchRow } from '../utils/update.js';

const DEFAULT_PHASES = ['الأساسات', 'الهيكل الإنشائي', 'التشطيبات', 'التسليم'];
const date = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'), z.literal(''), z.null()]).optional();

export const projectSchema = z.object({
  title: z.string().trim().min(2, 'اسم المشروع قصير'),
  client_id: z.coerce.number().int().positive().nullish(),
  type: z.enum(['residential', 'commercial', 'government', 'renovation', 'other']).default('residential'),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed']).default('planning'),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  budget: z.coerce.number().min(0).default(0),
  currency: z.enum(['SDG', 'USD']).default('SDG'),
  start_date: date,
  end_date: date,
});
export const projectPatchSchema = projectSchema.partial();
export const phaseSchema = z.object({ title: z.string().trim().min(2, 'اسم المرحلة قصير') });
export const phasePatchSchema = z.object({
  title: z.string().trim().min(2, 'اسم المرحلة قصير').optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
});

const slugify = (t) =>
  `${t.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'project'}-${Date.now().toString(36)}`;

// project progress = average of its phases; status follows progress
async function recalc(db, projectId) {
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS n, COALESCE(ROUND(AVG(progress)), 0) AS avg FROM project_phases WHERE project_id = ?',
    [projectId]
  );
  const progress = row.n ? Number(row.avg) : 0;
  await db.execute(
    `UPDATE projects SET progress = ?,
       status = CASE WHEN ? >= 100 THEN 'completed'
                     WHEN ? > 0 AND status = 'planning' THEN 'in_progress'
                     ELSE status END
     WHERE id = ?`,
    [progress, progress, progress, projectId]
  );
  return progress;
}

export async function listProjects(_req, res) {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS client_name FROM projects p
     LEFT JOIN clients c ON c.id = p.client_id ORDER BY p.created_at DESC`
  );
  res.json({ success: true, projects: rows });
}

export async function getProject(req, res) {
  const id = intParam(req);
  const [rows] = await pool.execute(
    `SELECT p.*, c.name AS client_name FROM projects p
     LEFT JOIN clients c ON c.id = p.client_id WHERE p.id = ?`,
    [id]
  );
  if (!rows[0]) throw new AppError('المشروع غير موجود', 404);
  const [phases] = await pool.execute(
    'SELECT * FROM project_phases WHERE project_id = ? ORDER BY sort_order, id',
    [id]
  );
  res.json({ success: true, project: rows[0], phases });
}

export async function createProject(req, res) {
  const b = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      `INSERT INTO projects (client_id, title, slug, type, status, location, description, budget, currency, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.client_id ?? null, b.title, slugify(b.title), b.type, b.status, nn(b.location), nn(b.description),
       b.budget, b.currency, nn(b.start_date), nn(b.end_date)]
    );
    for (let i = 0; i < DEFAULT_PHASES.length; i++) {
      await conn.execute('INSERT INTO project_phases (project_id, title, sort_order) VALUES (?, ?, ?)', [r.insertId, DEFAULT_PHASES[i], i]);
    }
    await conn.commit();
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function updateProject(req, res) {
  await patchRow('projects', intParam(req), req.body,
    ['client_id', 'title', 'type', 'status', 'location', 'description', 'budget', 'currency', 'start_date', 'end_date']);
  res.json({ success: true });
}

export async function deleteProject(req, res) {
  const [r] = await pool.execute('DELETE FROM projects WHERE id = ?', [intParam(req)]);
  if (!r.affectedRows) throw new AppError('المشروع غير موجود', 404);
  res.json({ success: true });
}

export async function addPhase(req, res) {
  const id = intParam(req);
  const [p] = await pool.execute('SELECT id FROM projects WHERE id = ?', [id]);
  if (!p[0]) throw new AppError('المشروع غير موجود', 404);
  const [[m]] = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM project_phases WHERE project_id = ?', [id]);
  await pool.execute('INSERT INTO project_phases (project_id, title, sort_order) VALUES (?, ?, ?)', [id, req.body.title, m.next]);
  res.status(201).json({ success: true, project_progress: await recalc(pool, id) });
}

export async function updatePhase(req, res) {
  const id = intParam(req);
  const phaseId = intParam(req, 'phaseId');
  const { title, progress } = req.body;
  const sets = [], vals = [];
  if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
  if (progress !== undefined) {
    sets.push('progress = ?', 'status = ?');
    vals.push(progress, progress >= 100 ? 'done' : progress > 0 ? 'in_progress' : 'pending');
  }
  if (!sets.length) throw new AppError('لا توجد بيانات للتحديث', 400);
  const [r] = await pool.execute(`UPDATE project_phases SET ${sets.join(', ')} WHERE id = ? AND project_id = ?`, [...vals, phaseId, id]);
  if (!r.affectedRows) throw new AppError('المرحلة غير موجودة', 404);
  res.json({ success: true, project_progress: await recalc(pool, id) });
}

export async function deletePhase(req, res) {
  const id = intParam(req);
  const [r] = await pool.execute('DELETE FROM project_phases WHERE id = ? AND project_id = ?', [intParam(req, 'phaseId'), id]);
  if (!r.affectedRows) throw new AppError('المرحلة غير موجودة', 404);
  res.json({ success: true, project_progress: await recalc(pool, id) });
}

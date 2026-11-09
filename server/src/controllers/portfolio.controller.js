import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};

// عام (بدون تسجيل دخول): الحقول الآمنة فقط، لا ميزانية ولا اسم عميل
const HAS_IMAGE = `(p.cover_image IS NOT NULL OR EXISTS
  (SELECT 1 FROM project_media m WHERE m.project_id = p.id AND m.kind = 'image'))`;

export async function listPublic(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 50);
  const [rows] = await pool.query(
    `SELECT p.id, p.slug, p.title, p.type, p.status, p.location, p.description,
            YEAR(COALESCE(p.end_date, p.start_date, p.created_at)) AS year,
            COALESCE(p.cover_image,
              (SELECT m.url FROM project_media m WHERE m.project_id = p.id AND m.kind = 'image' ORDER BY m.id LIMIT 1)) AS cover
     FROM projects p WHERE p.is_public = 1 AND ${HAS_IMAGE}
     ORDER BY p.updated_at DESC LIMIT ?`,
    [limit]
  );
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, projects: rows });
}

export async function getPublic(req, res) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.slug, p.title, p.type, p.status, p.location, p.description,
            YEAR(COALESCE(p.end_date, p.start_date, p.created_at)) AS year, p.cover_image
     FROM projects p WHERE p.slug = ? AND p.is_public = 1 LIMIT 1`,
    [req.params.slug]
  );
  const project = rows[0];
  if (!project) throw new AppError('المشروع غير موجود', 404);
  const [media] = await pool.execute(
    'SELECT id, url, kind, stage, caption FROM project_media WHERE project_id = ? ORDER BY id',
    [project.id]
  );
  const cover = project.cover_image || media.find((m) => m.kind === 'image')?.url || null;
  delete project.cover_image;
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, project: { ...project, cover }, media });
}

// للمهندس / مهندس الموقع: نشر المشروع في المعرض واختيار الغلاف
export const publishSchema = z
  .object({
    is_public: z.boolean().optional(),
    cover_image: z.string().max(255).nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'لا توجد بيانات للتحديث' });

export async function updatePortfolio(req, res) {
  const id = idOf(req.params.id);
  const b = req.body;
  const [p] = await pool.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [id]);
  if (!p[0]) throw new AppError('المشروع غير موجود', 404);

  if (b.cover_image) {
    const [m] = await pool.execute(
      "SELECT id FROM project_media WHERE project_id = ? AND url = ? AND kind = 'image' LIMIT 1",
      [id, b.cover_image]
    );
    if (!m[0]) throw new AppError('الصورة ليست من صور هذا المشروع', 400);
  }

  const sets = [], vals = [];
  if (b.is_public !== undefined) { sets.push('is_public = ?'); vals.push(b.is_public ? 1 : 0); }
  if (b.cover_image !== undefined) { sets.push('cover_image = ?'); vals.push(b.cover_image); }
  await pool.execute(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
  res.json({ success: true });
}

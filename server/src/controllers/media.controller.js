import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { UPLOAD_DIR } from '../config/uploads.js';
import { AppError } from '../utils/AppError.js';

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'video/mp4': '.mp4' };
const MAX_MB = 40;

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new AppError('نوع الملف غير مدعوم (صور JPG أو PNG أو WebP، أو فيديو MP4)', 400)),
}).array('files', 10);

export const uploadFiles = (req, res, next) =>
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(new AppError(err.code === 'LIMIT_FILE_SIZE' ? `حجم الملف كبير (الحد ${MAX_MB}MB)` : 'تعذّر رفع الملفات', 400));
    }
    next(err);
  });

const metaSchema = z.object({
  stage: z.enum(['before', 'during', 'after']).default('during'),
  caption: z.string().trim().max(200).optional().default(''),
});

const idOf = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError('معرّف غير صحيح', 400);
  return n;
};

export async function listMedia(req, res) {
  const [rows] = await pool.execute(
    'SELECT id, url, kind, stage, caption FROM project_media WHERE project_id = ? ORDER BY id DESC',
    [idOf(req.params.projectId)]
  );
  res.json({ success: true, media: rows });
}

export async function addMedia(req, res) {
  const projectId = idOf(req.params.projectId);
  const files = req.files || [];
  const cleanup = () => Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));

  try {
    if (files.length === 0) throw new AppError('اختر ملفاً واحداً على الأقل', 400);
    const [p] = await pool.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [projectId]);
    if (!p[0]) throw new AppError('المشروع غير موجود', 404);
    const { stage, caption } = metaSchema.parse(req.body);

    await pool.query(
      'INSERT INTO project_media (project_id, url, kind, stage, caption) VALUES ?',
      [files.map((f) => [projectId, `/api/uploads/${f.filename}`, f.mimetype.startsWith('video') ? 'video' : 'image', stage, caption || null])]
    );
    res.status(201).json({ success: true, count: files.length });
  } catch (e) {
    await cleanup();
    throw e;
  }
}

export async function removeMedia(req, res) {
  const id = idOf(req.params.id);
  const [r] = await pool.execute('SELECT url FROM project_media WHERE id = ? LIMIT 1', [id]);
  if (!r[0]) throw new AppError('الملف غير موجود', 404);
  await pool.execute('DELETE FROM project_media WHERE id = ?', [id]);
  if (r[0].url.startsWith('/api/uploads/')) {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(r[0].url))).catch(() => {});
  }
  res.json({ success: true });
}

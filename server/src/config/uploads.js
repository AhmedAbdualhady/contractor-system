import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// server/uploads
export const UPLOAD_DIR = fileURLToPath(new URL('../../uploads', import.meta.url));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

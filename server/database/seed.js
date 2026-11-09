// Creates the first admin account: npm run db:seed
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

const name = process.env.ADMIN_NAME || 'Admin';
const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
if (exists.length) {
  console.log('Admin already exists:', email);
} else {
  const hash = await bcrypt.hash(password, 12);
  await pool.execute(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    [name, email, hash]
  );
  console.log('Admin created:', email);
}
await pool.end();

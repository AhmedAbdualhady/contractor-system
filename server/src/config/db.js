import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  decimalNumbers: true, // DECIMAL -> number
  dateStrings: true, // DATE -> 'YYYY-MM-DD' (no timezone shifts)
});

export async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

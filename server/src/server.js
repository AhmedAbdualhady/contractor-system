import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';

async function start() {
  try {
    await testConnection();
    console.log('MySQL connected');
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }
  app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`));
}

start();


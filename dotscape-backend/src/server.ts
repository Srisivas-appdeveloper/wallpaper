import { buildApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { startScheduler } from './jobs/scheduler.js';

const app = await buildApp();
const stopScheduler = startScheduler(app.log);

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received — shutting down`);
  stopScheduler();
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: env.HOST, port: env.PORT });

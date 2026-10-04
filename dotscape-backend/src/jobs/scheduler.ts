import type { FastifyBaseLogger } from 'fastify';
import { query } from '../db/pool.js';

/** Promotes scheduled wallpapers once their publish time arrives (spec §27). */
export function startScheduler(log: FastifyBaseLogger): () => void {
  const tick = async () => {
    try {
      const rows = await query<{ id: string }>(
        `UPDATE wallpapers SET status = 'published', updated_at = now()
         WHERE status = 'scheduled' AND published_at <= now() RETURNING id`,
      );
      if (rows.length) log.info({ count: rows.length }, 'Published scheduled wallpapers');
    } catch (error) {
      log.error({ err: error }, 'Scheduler tick failed');
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), 60_000);
  return () => clearInterval(timer);
}

import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import { query } from '../../db/pool.js';

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/categories', async () => {
    const rows = await query<{ id: string; name: string; wallpaper_count: number }>(
      `SELECT c.id, c.name, COUNT(w.id) FILTER (WHERE w.status = 'published')::int AS wallpaper_count
       FROM categories c LEFT JOIN wallpapers w ON w.category_id = c.id
       GROUP BY c.id ORDER BY c.sort_order, c.name`,
    );
    return { items: rows.map((r) => ({ id: r.id, name: r.name, wallpaperCount: r.wallpaper_count })) };
  });

  /** Remote config: toggle features without shipping a new APK (spec §53). */
  app.get('/config', async () => {
    const flags = await query<{ key: string; enabled: boolean }>('SELECT key, enabled FROM feature_flags');
    return {
      flags: Object.fromEntries(flags.map((f) => [f.key, f.enabled])),
      limits: { dailyGenerations: env.DAILY_GENERATION_LIMIT },
    };
  });
};

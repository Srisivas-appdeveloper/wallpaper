import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { notFound } from '../../shared/errors.js';
import { getInstallId } from '../../shared/http.js';
import { findVisible } from '../wallpapers/wallpaper.repository.js';

const EVENT_TYPES = [
  'app_open', 'device_detected', 'view', 'download', 'apply', 'share', 'favorite', 'search',
] as const;

/** Static whitelist → safe to interpolate. */
const COUNTER_COLUMN: Partial<Record<(typeof EVENT_TYPES)[number], string>> = {
  view: 'view_count',
  download: 'download_count',
  apply: 'apply_count',
};

const eventBody = z.object({ type: z.enum(EVENT_TYPES), wallpaperId: z.string().uuid().optional() });
const reportBody = z.object({
  wallpaperId: z.string().uuid(),
  reason: z.enum(['copyright', 'inappropriate', 'low_quality', 'other']),
  details: z.string().trim().max(500).default(''),
});

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.post('/events', async (request, reply) => {
    const installId = getInstallId(request);
    const body = eventBody.parse(request.body);
    await query('INSERT INTO interaction_events (type, wallpaper_id, install_id) VALUES ($1, $2, $3)', [
      body.type, body.wallpaperId ?? null, installId,
    ]);
    const column = COUNTER_COLUMN[body.type];
    if (column && body.wallpaperId) {
      await query(`UPDATE wallpapers SET ${column} = ${column} + 1 WHERE id = $1`, [body.wallpaperId]);
    }
    return reply.status(202).send({ accepted: true });
  });

  app.post('/reports', { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } }, async (request, reply) => {
    const installId = getInstallId(request);
    const body = reportBody.parse(request.body);
    if (!(await findVisible(body.wallpaperId, installId))) throw notFound('Wallpaper');
    await query('INSERT INTO reports (wallpaper_id, install_id, reason, details) VALUES ($1, $2, $3, $4)', [
      body.wallpaperId, installId, body.reason, body.details,
    ]);
    return reply.status(201).send({ received: true });
  });
};

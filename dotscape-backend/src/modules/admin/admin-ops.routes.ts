import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../../db/pool.js';
import { notFound } from '../../shared/errors.js';
import { idParams, pageQuery } from '../../shared/http.js';
import { recordAudit } from './audit.js';
import { ADMIN_ROLES, requireRole } from './auth.js';

export const adminOpsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stats', { preHandler: requireRole(...ADMIN_ROLES) }, async () => {
    const totals = await queryOne<Record<string, number>>(`SELECT
      (SELECT COUNT(DISTINCT install_id) FROM interaction_events)::int AS users,
      (SELECT COUNT(DISTINCT install_id) FROM interaction_events WHERE created_at > now() - interval '1 day')::int AS active_today,
      (SELECT COUNT(*) FROM wallpapers WHERE status = 'published')::int AS published,
      (SELECT COUNT(*) FROM wallpapers WHERE status IN ('draft', 'review'))::int AS in_review,
      (SELECT COUNT(*) FROM wallpapers WHERE status = 'scheduled')::int AS scheduled,
      (SELECT COUNT(*) FROM generations WHERE status = 'completed')::int AS generations,
      (SELECT COUNT(*) FROM generations WHERE status = 'failed')::int AS failed_generations,
      (SELECT COUNT(*) FROM interaction_events WHERE type = 'download')::int AS downloads,
      (SELECT COUNT(*) FROM interaction_events WHERE type = 'apply')::int AS applies,
      (SELECT COUNT(*) FROM reports WHERE status = 'open')::int AS open_reports`);
    const top = await query<{ id: string; title: string; apply_count: number; download_count: number }>(
      `SELECT id, title, apply_count, download_count FROM wallpapers WHERE status = 'published'
       ORDER BY apply_count DESC, download_count DESC LIMIT 10`,
    );
    return { totals, topWallpapers: top };
  });

  app.get('/reports', { preHandler: requireRole('admin', 'moderator') }, async (request) => {
    const q = z.object({ ...pageQuery, status: z.enum(['open', 'dismissed', 'actioned']).default('open') }).parse(request.query);
    const items = await query(
      `SELECT r.id, r.wallpaper_id, w.title AS wallpaper_title, r.reason, r.details, r.status, r.created_at
       FROM reports r JOIN wallpapers w ON w.id = r.wallpaper_id
       WHERE r.status = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
      [q.status, q.limit, q.offset],
    );
    return { items };
  });

  app.post('/reports/:id/resolve', { preHandler: requireRole('admin', 'moderator') }, async (request) => {
    const { id } = idParams.parse(request.params);
    const { action } = z.object({ action: z.enum(['dismiss', 'unpublish']) }).parse(request.body);
    const report = await queryOne<{ wallpaper_id: string }>('SELECT wallpaper_id FROM reports WHERE id = $1', [id]);
    if (!report) throw notFound('Report');
    if (action === 'unpublish') {
      await query(`UPDATE wallpapers SET status = 'unpublished', updated_at = now() WHERE id = $1`, [report.wallpaper_id]);
    }
    await query('UPDATE reports SET status = $2, resolved_by = $3, resolved_at = now() WHERE id = $1', [
      id, action === 'dismiss' ? 'dismissed' : 'actioned', request.user.sub,
    ]);
    await recordAudit(request, { action: `report_${action}`, entity: 'report', entityId: id });
    return { resolved: true };
  });

  app.get('/audit-logs', { preHandler: requireRole('admin') }, async (request) => {
    const q = z.object(pageQuery).parse(request.query);
    const items = await query(
      `SELECT l.*, a.email AS admin_email FROM admin_audit_logs l
       LEFT JOIN admin_users a ON a.id = l.admin_id ORDER BY l.created_at DESC LIMIT $1 OFFSET $2`,
      [q.limit, q.offset],
    );
    return { items };
  });
};

import type { MultipartFields } from '@fastify/multipart';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { query, withTransaction } from '../../db/pool.js';
import { AppError, notFound } from '../../shared/errors.js';
import { csv, idParams, pageQuery } from '../../shared/http.js';
import { findDevice } from '../devices/device.repository.js';
import { runGeneration } from '../generation/generation.service.js';
import { MOODS, STYLES, createDna } from '../generation/procedural/dna.js';
import { COLOR_NAMES } from '../generation/procedural/palette.js';
import { toAdminWallpaper } from '../wallpapers/wallpaper.mapper.js';
import { findById, listForAdmin } from '../wallpapers/wallpaper.repository.js';
import {
  assertCategoryExists, assertDevicesExist, createWallpaperFromImage, replaceDeviceTargets,
} from '../wallpapers/wallpaper.service.js';
import { recordAudit } from './audit.js';
import { ADMIN_ROLES, requireRole } from './auth.js';

const STATUS = z.enum(['draft', 'review', 'scheduled', 'published', 'unpublished']);
const tagList = z.array(z.string().trim().toLowerCase().min(1).max(30)).max(20);

const uploadMeta = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().max(500).default(''),
  categoryId: z.string().max(40).optional(),
  tags: tagList.default([]),
  colors: tagList.default([]),
  deviceIds: z.array(z.string().max(64)).max(20).default([]),
  isAmoled: z.boolean().default(false),
});

const batchBody = z.object({
  count: z.number().int().min(1).max(24),
  styles: z.array(z.enum(STYLES)).min(1),
  colors: z.array(z.enum(COLOR_NAMES)).min(1),
  moods: z.array(z.enum(MOODS)).min(1).default(['dream', 'calm', 'energy']),
  deviceId: z.string().max(64).optional(),
  amoled: z.boolean().default(false),
});

const patchBody = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  categoryId: z.string().max(40).nullable().optional(),
  tags: tagList.optional(),
  isFeatured: z.boolean().optional(),
  isEditorPick: z.boolean().optional(),
  isAmoled: z.boolean().optional(),
  deviceIds: z.array(z.string().max(64)).max(20).optional(),
}).strict();

const COLUMN_MAP = {
  title: 'title', description: 'description', categoryId: 'category_id', tags: 'tags',
  isFeatured: 'is_featured', isEditorPick: 'is_editor_pick', isAmoled: 'is_amoled',
} as const;

function fieldValue(fields: MultipartFields, name: string): string | undefined {
  const entry = fields[name];
  const single = Array.isArray(entry) ? entry[0] : entry;
  return single && single.type === 'field' ? String(single.value) : undefined;
}

async function loadOr404(id: string) {
  const row = await findById(id);
  if (!row || row.status === 'private') throw notFound('Wallpaper');
  return row;
}

export const adminWallpaperRoutes: FastifyPluginAsync = async (app) => {
  app.get('/wallpapers', { preHandler: requireRole(...ADMIN_ROLES) }, async (request) => {
    const q = z.object({ ...pageQuery, status: STATUS.optional() }).parse(request.query);
    return { items: (await listForAdmin(q.status, q.limit, q.offset)).map(toAdminWallpaper) };
  });

  app.get('/wallpapers/:id', { preHandler: requireRole(...ADMIN_ROLES) }, async (request) => {
    const { id } = idParams.parse(request.params);
    return { wallpaper: toAdminWallpaper(await loadOr404(id)) };
  });

  // Multipart: send text fields BEFORE the file part.
  app.post('/wallpapers/upload', { preHandler: requireRole('admin', 'editor') }, async (request, reply) => {
    const file = await request.file();
    if (!file) throw new AppError(400, 'missing_file', 'Attach an image in the "file" field');
    const image = await file.toBuffer();
    const meta = uploadMeta.parse({
      title: fieldValue(file.fields, 'title'),
      description: fieldValue(file.fields, 'description'),
      categoryId: fieldValue(file.fields, 'categoryId') || undefined,
      tags: csv(fieldValue(file.fields, 'tags')),
      colors: csv(fieldValue(file.fields, 'colors')),
      deviceIds: csv(fieldValue(file.fields, 'deviceIds')),
      isAmoled: fieldValue(file.fields, 'isAmoled') === 'true',
    });
    await assertCategoryExists(meta.categoryId);
    const row = await createWallpaperFromImage({
      image, ...meta, sourceType: 'upload', status: 'review', createdBy: request.user.sub,
      deviceIds: await assertDevicesExist(meta.deviceIds),
    });
    await recordAudit(request, { action: 'upload', entity: 'wallpaper', entityId: row.id, after: toAdminWallpaper(row) });
    return reply.status(201).send({ wallpaper: toAdminWallpaper(row) });
  });

  app.post('/wallpapers/generate-batch', { preHandler: requireRole('admin', 'ai_creator', 'editor') }, async (request) => {
    const body = batchBody.parse(request.body);
    const device = body.deviceId ? await findDevice(body.deviceId) : null;
    if (body.deviceId && !device) throw new AppError(422, 'unknown_device', 'Device does not exist');
    const target = device ? { width: device.screen_width, height: device.screen_height } : { width: 1080, height: 2400 };

    const created: string[] = [];
    let failed = 0;
    for (let i = 0; i < body.count; i++) {
      const primary = body.colors[i % body.colors.length];
      const secondary = body.colors[(i + 1) % body.colors.length] === primary
        ? COLOR_NAMES[(COLOR_NAMES.indexOf(primary) + 3) % COLOR_NAMES.length]
        : body.colors[(i + 1) % body.colors.length];
      const dna = createDna({
        style: body.styles[i % body.styles.length], mood: body.moods[i % body.moods.length],
        primary, secondary, amoled: body.amoled, safeArea: true,
      });
      try {
        const row = await runGeneration({
          installId: null, kind: 'admin_batch', dna, target, request: body, status: 'review',
          sourceType: 'procedural', deviceIds: device && !device.is_generic ? [device.id] : [],
          createdBy: request.user.sub,
        });
        created.push(row.id);
      } catch (error) {
        failed++;
        request.log.warn({ err: error }, 'batch item failed');
      }
    }
    await recordAudit(request, { action: 'generate_batch', entity: 'wallpaper', after: { ...body, created, failed } });
    return { requested: body.count, completed: created.length, failed, wallpaperIds: created };
  });

  app.patch('/wallpapers/:id', { preHandler: requireRole('admin', 'editor') }, async (request) => {
    const { id } = idParams.parse(request.params);
    const body = patchBody.parse(request.body);
    const before = await loadOr404(id);
    await assertCategoryExists(body.categoryId);
    const deviceIds = body.deviceIds ? await assertDevicesExist(body.deviceIds) : undefined;

    await withTransaction(async (client) => {
      const sets: string[] = [];
      const params: unknown[] = [id];
      for (const [key, column] of Object.entries(COLUMN_MAP)) {
        const value = body[key as keyof typeof COLUMN_MAP];
        if (value !== undefined) {
          params.push(value);
          sets.push(`${column} = $${params.length}`);
        }
      }
      if (sets.length) await client.query(`UPDATE wallpapers SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, params);
      if (deviceIds) await replaceDeviceTargets(client, id, deviceIds);
    });

    const after = await loadOr404(id);
    await recordAudit(request, {
      action: 'update', entity: 'wallpaper', entityId: id, before: toAdminWallpaper(before), after: toAdminWallpaper(after),
    });
    return { wallpaper: toAdminWallpaper(after) };
  });

  app.post('/wallpapers/:id/publish', { preHandler: requireRole('admin') }, async (request) => {
    const { id } = idParams.parse(request.params);
    const { publishAt } = z.object({ publishAt: z.string().datetime({ offset: true }).optional() }).parse(request.body ?? {});
    const before = await loadOr404(id);
    const when = publishAt ? new Date(publishAt) : new Date();
    const status = when.getTime() > Date.now() ? 'scheduled' : 'published';
    await query('UPDATE wallpapers SET status = $2, published_at = $3, updated_at = now() WHERE id = $1', [id, status, when]);
    await recordAudit(request, {
      action: status === 'scheduled' ? 'schedule' : 'publish', entity: 'wallpaper', entityId: id,
      before: { status: before.status }, after: { status, publishedAt: when.toISOString() },
    });
    return { wallpaper: toAdminWallpaper(await loadOr404(id)) };
  });

  app.post('/wallpapers/bulk-publish', { preHandler: requireRole('admin') }, async (request) => {
    const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }).parse(request.body);
    const rows = await query<{ id: string }>(
      `UPDATE wallpapers SET status = 'published', published_at = now(), updated_at = now()
       WHERE id = ANY($1) AND status IN ('draft', 'review', 'unpublished') RETURNING id`,
      [ids],
    );
    await recordAudit(request, { action: 'bulk_publish', entity: 'wallpaper', after: { ids: rows.map((r) => r.id) } });
    return { published: rows.length };
  });

  app.post('/wallpapers/:id/unpublish', { preHandler: requireRole('admin', 'moderator') }, async (request) => {
    const { id } = idParams.parse(request.params);
    const before = await loadOr404(id);
    await query(`UPDATE wallpapers SET status = 'unpublished', updated_at = now() WHERE id = $1`, [id]);
    await recordAudit(request, {
      action: 'unpublish', entity: 'wallpaper', entityId: id, before: { status: before.status }, after: { status: 'unpublished' },
    });
    return { wallpaper: toAdminWallpaper(await loadOr404(id)) };
  });
};

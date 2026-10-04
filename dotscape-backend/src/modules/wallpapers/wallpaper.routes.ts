import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { notFound } from '../../shared/errors.js';
import { idParams, pageQuery, queryBool, tryGetInstallId } from '../../shared/http.js';
import { toPublicWallpaper } from './wallpaper.mapper.js';
import { findVisible, listPublished } from './wallpaper.repository.js';

const listQuery = z.object({
  ...pageQuery,
  sort: z.enum(['new', 'trending']).default('new'),
  categoryId: z.string().max(40).optional(),
  color: z.string().max(20).optional(),
  q: z.string().trim().max(60).optional(),
  amoled: queryBool,
  deviceId: z.string().max(64).optional(),
  deviceStrict: queryBool,
});

export const wallpaperRoutes: FastifyPluginAsync = async (app) => {
  app.get('/wallpapers', async (request) => {
    const f = listQuery.parse(request.query);
    const rows = await listPublished({ ...f, q: f.q || undefined, limit: f.limit + 1 });
    const hasMore = rows.length > f.limit;
    return {
      items: rows.slice(0, f.limit).map(toPublicWallpaper),
      nextOffset: hasMore ? f.offset + f.limit : null,
    };
  });

  app.get('/wallpapers/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    const row = await findVisible(id, tryGetInstallId(request));
    if (!row) throw notFound('Wallpaper');
    return { wallpaper: toPublicWallpaper(row) };
  });
};

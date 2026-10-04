import type { FastifyPluginAsync } from 'fastify';
import { adminOpsRoutes } from './admin-ops.routes.js';
import { adminAuthRoutes } from './auth.routes.js';
import { adminWallpaperRoutes } from './admin-wallpapers.routes.js';
import { studioHtml } from './studio.html.js';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_req, reply) => {
    return reply.type('text/html').send(studioHtml);
  });
  app.get('/studio', async (_req, reply) => {
    return reply.type('text/html').send(studioHtml);
  });

  await app.register(adminAuthRoutes);
  await app.register(adminWallpaperRoutes);
  await app.register(adminOpsRoutes);
};

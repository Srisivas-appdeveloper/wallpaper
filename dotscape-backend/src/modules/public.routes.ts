import type { FastifyPluginAsync } from 'fastify';
import { catalogRoutes } from './catalog/catalog.routes.js';
import { deviceRoutes } from './devices/device.routes.js';
import { eventRoutes } from './events/events.routes.js';
import { generationRoutes } from './generation/generation.routes.js';
import { homeRoutes } from './home/home.routes.js';
import { wallpaperRoutes } from './wallpapers/wallpaper.routes.js';

export const publicRoutes: FastifyPluginAsync = async (app) => {
  await app.register(catalogRoutes);
  await app.register(deviceRoutes);
  await app.register(homeRoutes);
  await app.register(wallpaperRoutes);
  await app.register(eventRoutes);
  await app.register(generationRoutes);
};

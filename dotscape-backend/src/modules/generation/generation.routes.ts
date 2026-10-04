import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getInstallId } from '../../shared/http.js';
import { toPublicWallpaper } from '../wallpapers/wallpaper.mapper.js';
import { generateForInstall, remixForInstall } from './generation.service.js';
import { MOODS, REMIX_OPERATIONS, STYLES } from './procedural/dna.js';
import { COLOR_NAMES } from './procedural/palette.js';

const generateBody = z.object({
  style: z.enum(STYLES),
  mood: z.enum(MOODS).default('dream'),
  primary: z.enum(COLOR_NAMES),
  secondary: z.enum(COLOR_NAMES),
  complexity: z.number().min(0).max(1).optional(),
  amoled: z.boolean().default(false),
  safeArea: z.boolean().default(true),
  deviceId: z.string().max(64).optional(),
  screenWidth: z.number().int().min(320).max(4000).optional(),
  screenHeight: z.number().int().min(320).max(4000).optional(),
});

const remixBody = z.object({
  wallpaperId: z.string().uuid(),
  operations: z.array(z.enum(REMIX_OPERATIONS)).default([]),
  primary: z.enum(COLOR_NAMES).optional(),
  secondary: z.enum(COLOR_NAMES).optional(),
});

const strict = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

export const generationRoutes: FastifyPluginAsync = async (app) => {
  app.post('/generate', strict, async (request, reply) => {
    const row = await generateForInstall(getInstallId(request), generateBody.parse(request.body));
    return reply.status(201).send({ wallpaper: toPublicWallpaper(row) });
  });

  app.post('/remix', strict, async (request, reply) => {
    const row = await remixForInstall(getInstallId(request), remixBody.parse(request.body));
    return reply.status(201).send({ wallpaper: toPublicWallpaper(row) });
  });
};

import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { mkdir } from 'node:fs/promises';
import { env, isProduction } from './config/env.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { publicRoutes } from './modules/public.routes.js';
import { storageRoot } from './modules/storage/storage.js';
import { errorHandler } from './shared/errors.js';

export async function buildApp() {
  const app = Fastify({
    logger: { level: isProduction ? 'info' : 'debug' },
    trustProxy: true,
    bodyLimit: 1_048_576,
  });

  await app.register(cors, { origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()) });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024, files: 1 } });

  await mkdir(storageRoot, { recursive: true });
  // Local media serving for development. In production put object storage + CDN in front.
  await app.register(fastifyStatic, { root: storageRoot, prefix: '/media/', maxAge: '7d', immutable: true });

  app.setErrorHandler(errorHandler);
  app.get('/health', async () => ({ status: 'ok' }));
  await app.register(publicRoutes, { prefix: '/v1' });
  await app.register(adminRoutes, { prefix: '/admin' });
  return app;
}

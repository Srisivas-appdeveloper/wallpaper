import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { clampScreen, listDevices, resolveDevice, toDeviceDto } from './device.repository.js';

const resolveQuery = z.object({
  manufacturer: z.string().max(64).default(''),
  model: z.string().max(64).default(''),
  screenWidth: z.coerce.number().int().min(320).max(4000).optional(),
  screenHeight: z.coerce.number().int().min(320).max(4000).optional(),
});

export const deviceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices', async () => ({ items: (await listDevices()).map((d) => toDeviceDto(d)) }));

  app.get('/devices/resolve', async (request) => {
    const q = resolveQuery.parse(request.query);
    const { device, match } = await resolveDevice(q.manufacturer, q.model);
    const screen = device.is_generic && q.screenWidth && q.screenHeight
      ? clampScreen(q.screenWidth, q.screenHeight)
      : undefined;
    return { device: toDeviceDto(device, screen), match };
  });
};

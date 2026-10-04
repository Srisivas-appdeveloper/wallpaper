import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { findDevice } from '../devices/device.repository.js';
import { toPublicWallpaper } from '../wallpapers/wallpaper.mapper.js';
import { listPublished } from '../wallpapers/wallpaper.repository.js';

/** Editorial home feed (spec §8 / §28): predictable sections, not a black-box algorithm. */
export const homeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/home', async (request) => {
    const { deviceId } = z.object({ deviceId: z.string().max(64).optional() }).parse(request.query);
    const device = deviceId ? await findDevice(deviceId) : null;
    const base = { offset: 0, limit: 12 };

    const [featured, trending, fresh, forDevice, picks, amoled] = await Promise.all([
      listPublished({ ...base, limit: 1, sort: 'new', featured: true }),
      listPublished({ ...base, sort: 'trending', deviceId }),
      listPublished({ ...base, sort: 'new', deviceId }),
      device && !device.is_generic
        ? listPublished({ ...base, sort: 'new', deviceId: device.id, deviceStrict: true })
        : Promise.resolve([]),
      listPublished({ ...base, sort: 'new', editorPick: true, deviceId }),
      listPublished({ ...base, sort: 'trending', amoled: true, deviceId }),
    ]);

    const hero = featured[0] ?? fresh[0] ?? null;
    const sections = [
      { id: 'trending', title: 'Trending now', items: trending },
      { id: 'new', title: 'New drops', items: fresh },
      { id: 'for_device', title: device ? `Made for ${device.marketing_name}` : 'Made for your phone', items: forDevice },
      { id: 'editors_choice', title: "Editor's choice", items: picks },
      { id: 'amoled', title: 'AMOLED', items: amoled },
    ]
      .filter((s) => s.items.length > 0)
      .map((s) => ({ ...s, items: s.items.map(toPublicWallpaper) }));

    return { hero: hero ? toPublicWallpaper(hero) : null, sections };
  });
};

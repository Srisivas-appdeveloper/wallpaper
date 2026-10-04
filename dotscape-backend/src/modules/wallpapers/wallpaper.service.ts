import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../db/pool.js';
import { AppError } from '../../shared/errors.js';
import type { WallpaperDna } from '../generation/procedural/dna.js';
import { processWallpaperImage } from '../media/image-pipeline.js';
import { storage } from '../storage/storage.js';
import { findById } from './wallpaper.repository.js';
import type { SourceType, WallpaperRow, WallpaperStatus } from './wallpaper.types.js';

export interface CreateWallpaperInput {
  image: Buffer;
  title: string;
  description?: string;
  sourceType: SourceType;
  status: WallpaperStatus;
  categoryId?: string | null;
  style?: string | null;
  mood?: string | null;
  colors?: string[];
  tags?: string[];
  dna?: WallpaperDna | null;
  parentId?: string | null;
  ownerInstallId?: string | null;
  createdBy?: string | null;
  deviceIds?: string[];
  isAmoled?: boolean;
  publishedAt?: Date | null;
}

/** Single entry point for every new wallpaper: upload, admin batch, user generation, remix. */
export async function createWallpaperFromImage(input: CreateWallpaperInput): Promise<WallpaperRow> {
  const processed = await processWallpaperImage(input.image);
  const id = randomUUID();
  const keys = {
    full: `wallpapers/${id}/full.jpg`,
    preview: `wallpapers/${id}/preview.webp`,
    thumbnail: `wallpapers/${id}/thumb.webp`,
  };
  await Promise.all([
    storage.put(keys.full, processed.full, 'image/jpeg'),
    storage.put(keys.preview, processed.preview, 'image/webp'),
    storage.put(keys.thumbnail, processed.thumbnail, 'image/webp'),
  ]);

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO wallpapers (id, title, description, status, source_type, category_id, style, mood, colors, tags,
         dna, parent_id, thumbnail_key, preview_key, full_key, width, height, is_amoled, owner_install_id,
         created_by, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        id, input.title, input.description ?? '', input.status, input.sourceType, input.categoryId ?? null,
        input.style ?? null, input.mood ?? null, input.colors ?? [], input.tags ?? [],
        input.dna ? JSON.stringify(input.dna) : null, input.parentId ?? null,
        keys.thumbnail, keys.preview, keys.full, processed.width, processed.height,
        input.isAmoled ?? false, input.ownerInstallId ?? null, input.createdBy ?? null, input.publishedAt ?? null,
      ],
    );
    await replaceDeviceTargets(client, id, input.deviceIds ?? []);
  });

  const created = await findById(id);
  if (!created) throw new Error(`Wallpaper ${id} vanished after insert`);
  return created;
}

export async function replaceDeviceTargets(client: PoolClient, wallpaperId: string, deviceIds: string[]) {
  await client.query('DELETE FROM wallpaper_devices WHERE wallpaper_id = $1', [wallpaperId]);
  for (const deviceId of new Set(deviceIds)) {
    await client.query('INSERT INTO wallpaper_devices (wallpaper_id, device_id) VALUES ($1, $2)', [wallpaperId, deviceId]);
  }
}

export async function assertDevicesExist(deviceIds: string[]): Promise<string[]> {
  if (deviceIds.length === 0) return [];
  const rows = await query<{ id: string }>('SELECT id FROM devices WHERE id = ANY($1)', [deviceIds]);
  if (rows.length !== new Set(deviceIds).size) throw new AppError(422, 'unknown_device', 'One or more devices do not exist');
  return rows.map((r) => r.id);
}

export async function assertCategoryExists(categoryId?: string | null): Promise<void> {
  if (!categoryId) return;
  const rows = await query('SELECT 1 FROM categories WHERE id = $1', [categoryId]);
  if (rows.length === 0) throw new AppError(422, 'unknown_category', 'Category does not exist');
}

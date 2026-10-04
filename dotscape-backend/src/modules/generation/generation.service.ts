import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { query, queryOne } from '../../db/pool.js';
import { AppError, notFound } from '../../shared/errors.js';
import { clampScreen, findDevice } from '../devices/device.repository.js';
import { findVisible } from '../wallpapers/wallpaper.repository.js';
import { createWallpaperFromImage } from '../wallpapers/wallpaper.service.js';
import type { WallpaperRow } from '../wallpapers/wallpaper.types.js';
import {
  applyRemix, createDna, titleFor, type Mood, type RemixOperation, type WallpaperDna, type WallpaperStyle,
} from './procedural/dna.js';
import type { ColorName } from './procedural/palette.js';
import { imageProvider, type RenderTarget } from './provider.js';

export interface GenerateInput {
  style: WallpaperStyle;
  mood: Mood;
  primary: ColorName;
  secondary: ColorName;
  complexity?: number;
  amoled: boolean;
  safeArea: boolean;
  deviceId?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface RemixInput {
  wallpaperId: string;
  operations: RemixOperation[];
  primary?: ColorName;
  secondary?: ColorName;
}

const DEFAULT_TARGET: RenderTarget = { width: 1080, height: 2400 };

async function assertWithinDailyLimit(installId: string): Promise<void> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM generations
     WHERE install_id = $1 AND created_at > now() - interval '24 hours' AND status <> 'failed'`,
    [installId],
  );
  if ((row?.count ?? 0) >= env.DAILY_GENERATION_LIMIT) {
    throw new AppError(429, 'daily_limit_reached', "You've reached today's creation limit. Come back tomorrow.");
  }
}

async function resolveTarget(input: GenerateInput): Promise<{ target: RenderTarget; deviceId?: string }> {
  const device = input.deviceId ? await findDevice(input.deviceId) : null;
  if (device && !device.is_generic) {
    return { target: { width: device.screen_width, height: device.screen_height }, deviceId: device.id };
  }
  if (input.screenWidth && input.screenHeight) return { target: clampScreen(input.screenWidth, input.screenHeight) };
  return { target: DEFAULT_TARGET };
}

interface RunArgs {
  installId: string | null;
  kind: 'generate' | 'remix' | 'admin_batch';
  dna: WallpaperDna;
  target: RenderTarget;
  request: unknown;
  status: 'private' | 'review';
  sourceType: 'user_generated' | 'procedural';
  parentId?: string | null;
  categoryId?: string | null;
  deviceIds?: string[];
  createdBy?: string | null;
}

/** Records every generation (cost/abuse tracking, spec §46-47) and turns DNA into a stored wallpaper. */
export async function runGeneration(args: RunArgs): Promise<WallpaperRow> {
  const generationId = randomUUID();
  await query(
    `INSERT INTO generations (id, install_id, kind, source_wallpaper_id, request, provider, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'processing')`,
    [generationId, args.installId, args.kind, args.parentId ?? null, JSON.stringify(args.request), imageProvider.name],
  );
  try {
    const image = await imageProvider.render(args.dna, args.target);
    const wallpaper = await createWallpaperFromImage({
      image,
      title: titleFor(args.dna),
      sourceType: args.sourceType,
      status: args.status,
      categoryId: args.categoryId ?? args.dna.style,
      style: args.dna.style,
      mood: args.dna.mood,
      colors: [...args.dna.colorNames],
      tags: [args.dna.style, args.dna.mood, ...args.dna.colorNames, ...(args.dna.amoled ? ['amoled'] : [])],
      dna: args.dna,
      parentId: args.parentId ?? null,
      ownerInstallId: args.status === 'private' ? args.installId : null,
      createdBy: args.createdBy ?? null,
      deviceIds: args.deviceIds ?? [],
      isAmoled: args.dna.amoled,
    });
    await query(`UPDATE generations SET status = 'completed', wallpaper_id = $2, completed_at = now() WHERE id = $1`, [
      generationId, wallpaper.id,
    ]);
    return wallpaper;
  } catch (error) {
    await query(`UPDATE generations SET status = 'failed', error_message = $2, completed_at = now() WHERE id = $1`, [
      generationId, String(error).slice(0, 500),
    ]);
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'generation_failed', "We couldn't create this one. Try another style.");
  }
}

export async function generateForInstall(installId: string, input: GenerateInput): Promise<WallpaperRow> {
  await assertWithinDailyLimit(installId);
  const { target, deviceId } = await resolveTarget(input);
  const dna = createDna(input);
  return runGeneration({
    installId, kind: 'generate', dna, target, request: input, status: 'private', sourceType: 'user_generated',
    deviceIds: deviceId ? [deviceId] : [],
  });
}

export async function remixForInstall(installId: string, input: RemixInput): Promise<WallpaperRow> {
  if (input.operations.length === 0 && !input.primary && !input.secondary) {
    throw new AppError(400, 'empty_remix', 'Pick at least one remix option');
  }
  await assertWithinDailyLimit(installId);
  const source = await findVisible(input.wallpaperId, installId);
  if (!source) throw notFound('Wallpaper');
  if (!source.dna) throw new AppError(422, 'not_remixable', 'This wallpaper cannot be remixed yet');

  const dna = applyRemix(source.dna, input.operations, { primary: input.primary, secondary: input.secondary });
  return runGeneration({
    installId, kind: 'remix', dna, target: { width: source.width, height: source.height }, request: input,
    status: 'private', sourceType: 'user_generated', parentId: source.id, categoryId: source.category_id,
    deviceIds: source.device_ids,
  });
}

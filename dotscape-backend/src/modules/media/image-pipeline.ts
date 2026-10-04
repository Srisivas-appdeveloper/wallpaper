import sharp from 'sharp';
import { AppError } from '../../shared/errors.js';

export interface ProcessedImage {
  full: Buffer;
  preview: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
}

const MIN_WIDTH = 720;
const MIN_HEIGHT = 1280;
const ACCEPTED = new Set(['jpeg', 'png', 'webp']);

/** Validate → normalize → produce full / preview / thumbnail variants. Never ship originals to devices. */
export async function processWallpaperImage(input: Buffer): Promise<ProcessedImage> {
  const meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  if (!meta.format || !ACCEPTED.has(meta.format)) {
    throw new AppError(422, 'unsupported_format', 'Only JPEG, PNG or WebP images are supported');
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    throw new AppError(422, 'image_too_small', `Image must be at least ${MIN_WIDTH}×${MIN_HEIGHT}`);
  }
  if (height <= width) {
    throw new AppError(422, 'not_portrait', 'Wallpapers must be portrait');
  }

  const base = sharp(input).rotate();
  const [full, preview, thumbnail] = await Promise.all([
    base.clone().jpeg({ quality: 92, mozjpeg: true }).toBuffer(),
    base.clone().resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    base.clone().resize({ width: 360 }).webp({ quality: 72 }).toBuffer(),
  ]);
  return { full, preview, thumbnail, width, height };
}

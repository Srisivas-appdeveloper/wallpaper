import { query, queryOne } from '../../db/pool.js';
import type { WallpaperRow, WallpaperStatus } from './wallpaper.types.js';

const SELECT = `SELECT w.*,
  ARRAY(SELECT wd.device_id FROM wallpaper_devices wd WHERE wd.wallpaper_id = w.id ORDER BY wd.device_id) AS device_ids
  FROM wallpapers w`;

export interface PublishedQuery {
  limit: number;
  offset: number;
  sort: 'new' | 'trending';
  categoryId?: string;
  color?: string;
  q?: string;
  amoled?: boolean;
  featured?: boolean;
  editorPick?: boolean;
  deviceId?: string;
  /** true → only wallpapers explicitly targeted at deviceId; false → targeted + universal */
  deviceStrict?: boolean;
}

export async function listPublished(f: PublishedQuery): Promise<WallpaperRow[]> {
  const where: string[] = [`w.status = 'published'`];
  const params: unknown[] = [];
  const p = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (f.categoryId) where.push(`w.category_id = ${p(f.categoryId)}`);
  if (f.color) where.push(`${p(f.color)} = ANY(w.colors)`);
  if (f.amoled !== undefined) where.push(`w.is_amoled = ${p(f.amoled)}`);
  if (f.featured) where.push('w.is_featured');
  if (f.editorPick) where.push('w.is_editor_pick');
  if (f.q) {
    const like = p(`%${f.q.replace(/[%_\\]/g, '\\$&')}%`);
    const tag = p(f.q.toLowerCase());
    where.push(`(w.title ILIKE ${like} OR ${tag} = ANY(w.tags))`);
  }
  if (f.deviceId) {
    const targeted = `EXISTS (SELECT 1 FROM wallpaper_devices wd WHERE wd.wallpaper_id = w.id AND wd.device_id = ${p(f.deviceId)})`;
    const universal = 'NOT EXISTS (SELECT 1 FROM wallpaper_devices wd2 WHERE wd2.wallpaper_id = w.id)';
    where.push(f.deviceStrict ? targeted : `(${targeted} OR ${universal})`);
  }

  const order = f.sort === 'trending'
    ? '(w.apply_count * 3 + w.download_count * 2 + w.view_count) DESC, w.published_at DESC'
    : 'w.published_at DESC';

  return query<WallpaperRow>(
    `${SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order}, w.id LIMIT ${p(f.limit)} OFFSET ${p(f.offset)}`,
    params,
  );
}

export const findById = (id: string) => queryOne<WallpaperRow>(`${SELECT} WHERE w.id = $1`, [id]);

/** Published wallpapers, or private creations owned by this install. */
export const findVisible = (id: string, installId?: string) =>
  queryOne<WallpaperRow>(
    `${SELECT} WHERE w.id = $1 AND (w.status = 'published' OR (w.status = 'private' AND w.owner_install_id = $2))`,
    [id, installId ?? null],
  );

export const listForAdmin = (status: WallpaperStatus | undefined, limit: number, offset: number) =>
  query<WallpaperRow>(
    `${SELECT} WHERE ($1::text IS NULL OR w.status = $1) AND w.status <> 'private'
     ORDER BY w.created_at DESC LIMIT $2 OFFSET $3`,
    [status ?? null, limit, offset],
  );

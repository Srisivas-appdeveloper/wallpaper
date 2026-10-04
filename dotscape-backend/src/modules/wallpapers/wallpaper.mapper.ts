import { storage } from '../storage/storage.js';
import type { WallpaperRow } from './wallpaper.types.js';

export function toPublicWallpaper(row: WallpaperRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    style: row.style,
    mood: row.mood,
    colors: row.colors,
    tags: row.tags,
    sourceType: row.source_type,
    isAmoled: row.is_amoled,
    isFeatured: row.is_featured,
    isEditorPick: row.is_editor_pick,
    remixable: row.dna !== null,
    width: row.width,
    height: row.height,
    thumbnailUrl: storage.publicUrl(row.thumbnail_key),
    previewUrl: storage.publicUrl(row.preview_key),
    fullUrl: storage.publicUrl(row.full_key),
    downloadCount: row.download_count,
    applyCount: row.apply_count,
    deviceIds: row.device_ids,
    publishedAt: row.published_at?.toISOString() ?? null,
  };
}

export function toAdminWallpaper(row: WallpaperRow) {
  return {
    ...toPublicWallpaper(row),
    status: row.status,
    dna: row.dna,
    parentId: row.parent_id,
    viewCount: row.view_count,
    createdAt: row.created_at.toISOString(),
  };
}

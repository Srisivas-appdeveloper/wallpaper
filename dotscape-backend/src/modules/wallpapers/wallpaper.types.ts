import type { WallpaperDna } from '../generation/procedural/dna.js';

export type WallpaperStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'unpublished' | 'private';
export type SourceType = 'upload' | 'procedural' | 'ai' | 'user_generated';

export type WallpaperRow = {
  id: string;
  title: string;
  description: string;
  status: WallpaperStatus;
  source_type: SourceType;
  category_id: string | null;
  style: string | null;
  mood: string | null;
  colors: string[];
  tags: string[];
  dna: WallpaperDna | null;
  parent_id: string | null;
  thumbnail_key: string;
  preview_key: string;
  full_key: string;
  width: number;
  height: number;
  is_amoled: boolean;
  is_featured: boolean;
  is_editor_pick: boolean;
  owner_install_id: string | null;
  download_count: number;
  apply_count: number;
  view_count: number;
  published_at: Date | null;
  created_at: Date;
  device_ids: string[];
};

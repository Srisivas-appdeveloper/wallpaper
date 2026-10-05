export interface Wallpaper {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  style: string | null;
  mood: string | null;
  colors: string[];
  tags: string[];
  source_type: 'upload' | 'procedural' | 'ai' | 'user_generated';
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'unpublished' | 'private';
  thumbnail_key: string;
  preview_key: string;
  full_key: string;
  width: number;
  height: number;
  is_amoled: boolean;
  is_featured: boolean;
  is_editor_pick: boolean;
  download_count: number;
  apply_count: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  // Computed / client helpers:
  thumbnailUrl?: string;
  previewUrl?: string;
  fullUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

export interface Device {
  id: string;
  brand: string;
  model: string;
  screen_width: number;
  screen_height: number;
  aspect_ratio: string;
}

export interface DashboardStats {
  totalWallpapers: number;
  publishedWallpapers: number;
  totalAmoled: number;
  totalCategories: number;
  totalDownloads: number;
  totalViews: number;
}

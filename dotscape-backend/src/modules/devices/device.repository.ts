import { query, queryOne } from '../../db/pool.js';

export type DeviceRow = {
  id: string;
  brand: string;
  model: string;
  marketing_name: string;
  model_codes: string[];
  screen_width: number;
  screen_height: number;
  safe_top: string;
  safe_bottom: string;
  supports_live_wallpaper: boolean;
  supports_glyph: boolean;
  glyph_type: string | null;
  is_generic: boolean;
};

export interface ScreenSize { width: number; height: number }

export function toDeviceDto(row: DeviceRow, screen?: ScreenSize) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    marketingName: row.marketing_name,
    screenWidth: screen?.width ?? row.screen_width,
    screenHeight: screen?.height ?? row.screen_height,
    safeTop: Number(row.safe_top),
    safeBottom: Number(row.safe_bottom),
    supportsLiveWallpaper: row.supports_live_wallpaper,
    supportsGlyph: row.supports_glyph,
    isGeneric: row.is_generic,
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));

/** Keeps client-reported sizes sane and portrait. */
export function clampScreen(width: number, height: number): ScreenSize {
  const [w, h] = width > height ? [height, width] : [width, height];
  return { width: clamp(w, 720, 1600), height: clamp(h, 1280, 3600) };
}

export const listDevices = () =>
  query<DeviceRow>('SELECT * FROM devices WHERE active ORDER BY sort_order, marketing_name');

export const findDevice = (id: string) =>
  queryOne<DeviceRow>('SELECT * FROM devices WHERE id = $1 AND active', [id]);

export async function resolveDevice(manufacturer: string, model: string) {
  const exact = await queryOne<DeviceRow>(
    'SELECT * FROM devices WHERE active AND $1 = ANY(model_codes) LIMIT 1',
    [model.trim().toUpperCase()],
  );
  if (exact) return { device: exact, match: 'exact' as const };

  const isNothing = manufacturer.trim().toLowerCase() === 'nothing';
  const generic = await findDevice(isNothing ? 'nothing_generic' : 'android_generic');
  if (!generic) throw new Error('Generic device profiles are missing — run `npm run seed`.');
  return { device: generic, match: isNothing ? ('brand' as const) : ('generic' as const) };
}

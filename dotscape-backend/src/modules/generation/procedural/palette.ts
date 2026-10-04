export const COLOR_NAMES = ['purple', 'blue', 'cyan', 'green', 'lime', 'orange', 'red', 'pink', 'white'] as const;
export type ColorName = (typeof COLOR_NAMES)[number];

const BASE_HEX: Record<ColorName, string> = {
  purple: '#8B7CFF',
  blue: '#3D7BFF',
  cyan: '#5CE1E6',
  green: '#3DDC97',
  lime: '#D4FF4F',
  orange: '#FF8A3D',
  red: '#FF4D4D',
  pink: '#FF78D2',
  white: '#F2F2F2',
};

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function rgbToHex(rgb: Rgb): string {
  return '#' + rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

/** [primary, secondary, accent] */
export function buildPalette(primary: ColorName, secondary: ColorName): [string, string, string] {
  const p = BASE_HEX[primary];
  const s = BASE_HEX[secondary];
  return [p, s, mix(mix(p, s, 0.5), '#ffffff', 0.35)];
}

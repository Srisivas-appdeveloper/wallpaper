import { randomInt } from 'node:crypto';
import { COLOR_NAMES, buildPalette, type ColorName } from './palette.js';

export const STYLES = ['liquid', 'aurora', 'minimal', 'dots', 'cyber'] as const;
export type WallpaperStyle = (typeof STYLES)[number];

export const MOODS = ['calm', 'focus', 'energy', 'dream', 'night', 'weird'] as const;
export type Mood = (typeof MOODS)[number];

export const REMIX_OPERATIONS = [
  'new_composition', 'new_colors', 'darker', 'brighter', 'amoled', 'more_minimal', 'more_detail',
] as const;
export type RemixOperation = (typeof REMIX_OPERATIONS)[number];

export const STYLE_LABELS: Record<WallpaperStyle, string> = {
  liquid: 'Liquid', aurora: 'Aurora', minimal: 'Minimal', dots: 'Dot Matrix', cyber: 'Cyber',
};

/** Structured, reproducible description of a wallpaper. Remixing = editing DNA, not pixels. */
export interface WallpaperDna {
  version: 1;
  seed: number;
  style: WallpaperStyle;
  mood: Mood;
  colorNames: [ColorName, ColorName];
  palette: [string, string, string];
  amoled: boolean;
  intensity: number;   // 0.15 – 1   overall brightness
  complexity: number;  // 0 – 1      amount of detail
  safeArea: boolean;   // keep top area calm for clock/icons
}

const MOOD_PRESETS: Record<Mood, { intensity: number; complexity: number }> = {
  calm: { intensity: 0.55, complexity: 0.3 },
  focus: { intensity: 0.5, complexity: 0.2 },
  energy: { intensity: 0.95, complexity: 0.75 },
  dream: { intensity: 0.75, complexity: 0.5 },
  night: { intensity: 0.4, complexity: 0.45 },
  weird: { intensity: 0.9, complexity: 0.9 },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const randomSeed = () => randomInt(1, 2_147_483_647);

export interface DnaInput {
  style: WallpaperStyle;
  mood: Mood;
  primary: ColorName;
  secondary: ColorName;
  amoled: boolean;
  safeArea: boolean;
  complexity?: number;
  seed?: number;
}

export function createDna(input: DnaInput): WallpaperDna {
  const preset = MOOD_PRESETS[input.mood];
  return {
    version: 1,
    seed: input.seed ?? randomSeed(),
    style: input.style,
    mood: input.mood,
    colorNames: [input.primary, input.secondary],
    palette: buildPalette(input.primary, input.secondary),
    amoled: input.amoled,
    intensity: preset.intensity,
    complexity: clamp(input.complexity ?? preset.complexity, 0, 1),
    safeArea: input.safeArea,
  };
}

function withColors(dna: WallpaperDna, primary: ColorName, secondary: ColorName): WallpaperDna {
  return { ...dna, colorNames: [primary, secondary], palette: buildPalette(primary, secondary) };
}

function randomColorPair(): [ColorName, ColorName] {
  const a = COLOR_NAMES[randomInt(0, COLOR_NAMES.length)];
  let b = COLOR_NAMES[randomInt(0, COLOR_NAMES.length)];
  while (b === a) b = COLOR_NAMES[randomInt(0, COLOR_NAMES.length)];
  return [a, b];
}

export function applyRemix(
  source: WallpaperDna,
  operations: readonly RemixOperation[],
  recolor: { primary?: ColorName; secondary?: ColorName } = {},
): WallpaperDna {
  let dna: WallpaperDna = { ...source };
  for (const op of operations) {
    switch (op) {
      case 'new_composition': dna = { ...dna, seed: randomSeed() }; break;
      case 'new_colors': dna = withColors(dna, ...randomColorPair()); break;
      case 'darker': dna = { ...dna, intensity: clamp(dna.intensity - 0.2, 0.15, 1) }; break;
      case 'brighter': dna = { ...dna, intensity: clamp(dna.intensity + 0.2, 0.15, 1) }; break;
      case 'amoled': dna = { ...dna, amoled: true }; break;
      case 'more_minimal': dna = { ...dna, complexity: clamp(dna.complexity - 0.25, 0, 1) }; break;
      case 'more_detail': dna = { ...dna, complexity: clamp(dna.complexity + 0.25, 0, 1) }; break;
    }
  }
  if (recolor.primary || recolor.secondary) {
    dna = withColors(dna, recolor.primary ?? dna.colorNames[0], recolor.secondary ?? dna.colorNames[1]);
  }
  return dna;
}

export function titleFor(dna: WallpaperDna): string {
  const mood = dna.mood.charAt(0).toUpperCase() + dna.mood.slice(1);
  return `${mood} ${STYLE_LABELS[dna.style]} ${dna.seed % 1000}`;
}

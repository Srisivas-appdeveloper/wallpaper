import sharp from 'sharp';
import { env } from '../../config/env.js';
import type { WallpaperDna } from './procedural/dna.js';
import { renderSvg } from './procedural/renderer.js';

export interface RenderTarget { width: number; height: number }

/**
 * Provider abstraction (spec §63). Add an external AI adapter (DNA → prompt → image)
 * by implementing this interface and registering it in createImageProvider().
 * API keys stay on the server — never in the APK.
 */
export interface WallpaperImageProvider {
  readonly name: string;
  render(dna: WallpaperDna, target: RenderTarget): Promise<Buffer>;
}

class ProceduralImageProvider implements WallpaperImageProvider {
  readonly name = 'procedural';

  async render(dna: WallpaperDna, target: RenderTarget): Promise<Buffer> {
    const svg = renderSvg(dna, target.width, target.height);
    return sharp(Buffer.from(svg)).png({ compressionLevel: 2 }).toBuffer();
  }
}

function createImageProvider(): WallpaperImageProvider {
  switch (env.AI_PROVIDER) {
    case 'procedural':
    default:
      return new ProceduralImageProvider();
  }
}

export const imageProvider = createImageProvider();

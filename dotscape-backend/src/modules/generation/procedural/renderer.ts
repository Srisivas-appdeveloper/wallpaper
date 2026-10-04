import type { WallpaperDna } from './dna.js';
import { mix } from './palette.js';
import { mulberry32, type Random } from './prng.js';

interface Ctx { w: number; h: number; rand: Random; dna: WallpaperDna; bg: string }
interface Layer { defs: string; body: string }

const f = (n: number) => n.toFixed(1);

function radial(id: string, color: string, opacity: number): string {
  return `<radialGradient id="${id}"><stop offset="0%" stop-color="${color}" stop-opacity="${opacity.toFixed(2)}"/>`
    + `<stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
}

function liquid({ w, h, rand, dna }: Ctx): Layer {
  const count = 3 + Math.round(dna.complexity * 7);
  let defs = '';
  let body = '';
  for (let i = 0; i < count; i++) {
    const r = w * (0.35 + rand() * 0.5);
    const cx = rand() * w;
    const cy = dna.safeArea ? h * (0.3 + rand() * 0.75) : rand() * h;
    defs += radial(`l${i}`, dna.palette[i % 3], 0.55 + dna.intensity * 0.4);
    body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#l${i})"/>`;
  }
  return { defs, body };
}

function aurora({ w, h, rand, dna }: Ctx): Layer {
  const bands = 2 + Math.round(dna.complexity * 4);
  let defs = `<linearGradient id="floor" x1="0" y1="1" x2="0" y2="0">`
    + `<stop offset="0%" stop-color="${dna.palette[1]}" stop-opacity="0.35"/>`
    + `<stop offset="60%" stop-color="${dna.palette[1]}" stop-opacity="0"/></linearGradient>`;
  let body = `<rect width="${w}" height="${h}" fill="url(#floor)"/>`;
  for (let i = 0; i < bands; i++) {
    const cx = w * (0.2 + rand() * 0.6);
    const cy = h * ((dna.safeArea ? 0.35 : 0.1) + rand() * 0.45);
    const rx = w * (0.6 + rand() * 0.7);
    const ry = h * (0.05 + rand() * 0.09);
    const rot = -40 + rand() * 80;
    defs += radial(`a${i}`, dna.palette[i % 3], 0.6 + dna.intensity * 0.35);
    body += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" `
      + `transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})" fill="url(#a${i})"/>`;
  }
  return { defs, body };
}

function minimal({ w, h, rand, dna }: Ctx): Layer {
  const [p, s, a] = dna.palette;
  const cx = w * (0.3 + rand() * 0.4);
  const cy = h * (dna.safeArea ? 0.74 + rand() * 0.1 : 0.35 + rand() * 0.4);
  const r = w * (0.4 + rand() * 0.2);
  const defs = `<linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${p}"/>`
    + `<stop offset="100%" stop-color="${s}"/></linearGradient>` + radial('mg', p, 0.45);
  let body = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 1.8)}" fill="url(#mg)"/>`
    + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#m)"/>`;
  if (dna.complexity > 0.35) {
    body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 1.25)}" fill="none" stroke="${a}" `
      + `stroke-opacity="0.5" stroke-width="${f(w * 0.004)}"/>`;
  }
  if (dna.complexity > 0.65) {
    body += `<circle cx="${f(cx + r * 0.95)}" cy="${f(cy - r * 1.15)}" r="${f(w * 0.028)}" fill="${a}"/>`;
  }
  return { defs, body };
}

function dots({ w, h, rand, dna }: Ctx): Layer {
  const [p, s] = dna.palette;
  const cols = Math.round(14 + dna.complexity * 20);
  const step = w / cols;
  const rows = Math.ceil(h / step);
  const [fx, fy, fz] = [rand() * 6, rand() * 6, rand() * 6];
  const freq = 1.5 + rand() * 2.5;
  let body = '';
  for (let y = 0; y < rows; y++) {
    const ny = y / rows;
    const color = mix(p, s, ny);
    for (let x = 0; x < cols; x++) {
      const nx = x / cols;
      let v = (Math.sin(nx * freq * Math.PI * 2 + fx)
        + Math.sin(ny * freq * Math.PI * 1.3 + fy)
        + Math.sin((nx + ny) * freq * Math.PI + fz)) / 3;
      v = (v + 1) / 2;
      if (dna.safeArea && ny < 0.18) v *= 0.25;
      const radius = step * 0.45 * Math.pow(v, 1.6);
      if (radius < step * 0.04) continue;
      body += `<circle cx="${f((x + 0.5) * step)}" cy="${f((y + 0.5) * step)}" r="${f(radius)}" fill="${color}"/>`;
    }
  }
  return { defs: '', body };
}

function cyber({ w, h, rand, dna, bg }: Ctx): Layer {
  const [p, s, a] = dna.palette;
  const horizon = h * (0.6 + rand() * 0.08);
  const sunR = w * (0.26 + rand() * 0.12);
  const sunCy = horizon - sunR * 0.35;
  const cx = w / 2;
  const defs = `<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${a}"/>`
    + `<stop offset="100%" stop-color="${p}"/></linearGradient>` + radial('glow', p, 0.5);
  let body = `<circle cx="${f(cx)}" cy="${f(sunCy)}" r="${f(sunR * 2.4)}" fill="url(#glow)"/>`
    + `<circle cx="${f(cx)}" cy="${f(sunCy)}" r="${f(sunR)}" fill="url(#sun)"/>`;
  for (let k = 0; k < 6; k++) {
    const y = sunCy + sunR * (0.05 + k * 0.16);
    body += `<rect x="${f(cx - sunR)}" y="${f(y)}" width="${f(sunR * 2)}" height="${f(2 + k * 3)}" fill="${bg}"/>`;
  }
  body += `<rect x="0" y="${f(horizon)}" width="${w}" height="${f(h - horizon)}" fill="${bg}"/>`;
  const stroke = `stroke="${s}" stroke-opacity="0.65" stroke-width="${f(Math.max(1.5, w * 0.0022))}"`;
  const rows = 8 + Math.round(dna.complexity * 10);
  for (let i = 1; i <= rows; i++) {
    const t = i / rows;
    const y = horizon + (h - horizon) * t * t;
    body += `<line x1="0" y1="${f(y)}" x2="${w}" y2="${f(y)}" ${stroke}/>`;
  }
  for (let j = -10; j <= 10; j++) {
    body += `<line x1="${f(cx + j * w * 0.025)}" y1="${f(horizon)}" x2="${f(cx + j * w * 0.2)}" y2="${h}" ${stroke}/>`;
  }
  return { defs, body };
}

const RENDERERS: Record<WallpaperDna['style'], (ctx: Ctx) => Layer> = { liquid, aurora, minimal, dots, cyber };

export function renderSvg(dna: WallpaperDna, width: number, height: number): string {
  const bg = dna.amoled ? '#000000' : mix(dna.palette[0], '#050508', 0.9);
  const layer = RENDERERS[dna.style]({ w: width, h: height, rand: mulberry32(dna.seed), dna, bg });
  const dim = Math.min(0.6, Math.max(0, (1 - dna.intensity) * 0.55));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<defs>${layer.defs}</defs><rect width="${width}" height="${height}" fill="${bg}"/>${layer.body}`
    + `<rect width="${width}" height="${height}" fill="#000000" opacity="${dim.toFixed(2)}"/></svg>`;
}

import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { runGeneration } from '../modules/generation/generation.service.js';
import { STYLES, createDna, type Mood } from '../modules/generation/procedural/dna.js';
import type { ColorName } from '../modules/generation/procedural/palette.js';
import { pool, query, queryOne } from './pool.js';

// ⚠️ model_codes are PLACEHOLDERS — read Build.MODEL on each real device and update.
const DEVICES = [
  { id: 'nothing_phone_3', brand: 'Nothing', model: 'Phone (3)', name: 'Nothing Phone (3)', codes: ['A024'], w: 1260, h: 2800, glyph: 'matrix', order: 1 },
  { id: 'nothing_phone_3a', brand: 'Nothing', model: 'Phone (3a)', name: 'Nothing Phone (3a)', codes: ['A059'], w: 1080, h: 2392, glyph: 'interface', order: 2 },
  { id: 'nothing_phone_2a', brand: 'Nothing', model: 'Phone (2a)', name: 'Nothing Phone (2a)', codes: ['A142'], w: 1084, h: 2412, glyph: 'interface', order: 3 },
  { id: 'nothing_phone_2', brand: 'Nothing', model: 'Phone (2)', name: 'Nothing Phone (2)', codes: ['A065'], w: 1080, h: 2412, glyph: 'interface', order: 4 },
  { id: 'nothing_phone_1', brand: 'Nothing', model: 'Phone (1)', name: 'Nothing Phone (1)', codes: ['A063'], w: 1080, h: 2400, glyph: 'interface', order: 5 },
  { id: 'nothing_generic', brand: 'Nothing', model: 'Nothing phone', name: 'your Nothing phone', codes: [], w: 1080, h: 2400, glyph: null, order: 90, generic: true },
  { id: 'android_generic', brand: 'Android', model: 'Android phone', name: 'your phone', codes: [], w: 1080, h: 2400, glyph: null, order: 99, generic: true },
];

const CATEGORIES: Array<[string, string, number]> = [
  ['liquid', 'Liquid', 1], ['aurora', 'Aurora', 2], ['minimal', 'Minimal', 3], ['dots', 'Dot Matrix', 4], ['cyber', 'Cyber', 5], ['abstract', 'Abstract', 6], ['nature', 'Nature', 7],
];

const FLAGS: Array<[string, boolean, string]> = [
  ['ai_generation', true, 'Create tab generation'],
  ['remix', true, 'Remix on wallpaper detail'],
  ['live_wallpaper', false, 'Phase 2'],
  ['phone_dna', false, 'Phase 2'],
  ['glyph', false, 'Device/API dependent'],
];

const PAIRS: Array<[ColorName, ColorName]> = [
  ['purple', 'cyan'], ['blue', 'pink'], ['orange', 'red'], ['green', 'lime'], ['pink', 'purple'], ['white', 'blue'],
];
const MOODS: Mood[] = ['dream', 'calm', 'energy', 'night', 'focus', 'weird'];

async function seed(): Promise<void> {
  for (const d of DEVICES) {
    await query(
      `INSERT INTO devices (id, brand, model, marketing_name, model_codes, screen_width, screen_height,
         supports_glyph, glyph_type, is_generic, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model,
         marketing_name = EXCLUDED.marketing_name, model_codes = EXCLUDED.model_codes,
         screen_width = EXCLUDED.screen_width, screen_height = EXCLUDED.screen_height,
         supports_glyph = EXCLUDED.supports_glyph, glyph_type = EXCLUDED.glyph_type,
         is_generic = EXCLUDED.is_generic, sort_order = EXCLUDED.sort_order`,
      [d.id, d.brand, d.model, d.name, d.codes, d.w, d.h, d.glyph !== null, d.glyph, d.generic ?? false, d.order],
    );
  }
  for (const [id, name, order] of CATEGORIES) {
    await query(
      'INSERT INTO categories (id, name, sort_order) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order',
      [id, name, order],
    );
  }
  for (const [key, enabled, description] of FLAGS) {
    await query('INSERT INTO feature_flags (key, enabled, description) VALUES ($1,$2,$3) ON CONFLICT (key) DO NOTHING', [key, enabled, description]);
  }

  const email = env.SEED_ADMIN_EMAIL.toLowerCase();
  if (!(await queryOne('SELECT 1 FROM admin_users WHERE email = $1', [email]))) {
    const hash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
    await query(`INSERT INTO admin_users (email, password_hash, display_name, role) VALUES ($1,$2,'Owner','super_admin')`, [email, hash]);
    console.log(`✔ super admin created: ${email}`);
  }

  const existing = await queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM wallpapers WHERE source_type <> 'user_generated'`);
  if ((existing?.count ?? 0) > 0) {
    console.log('Catalog already seeded — skipping wallpapers.');
    return;
  }

  console.log('Rendering starter catalog (30 wallpapers)…');
  let i = 0;
  for (const style of STYLES) {
    for (const [primary, secondary] of PAIRS) {
      const targetPhone3 = i % 3 === 0;
      const dna = createDna({
        style, primary, secondary, mood: MOODS[i % MOODS.length], amoled: i % 4 === 0, safeArea: true, seed: 1000 + i * 7919,
      });
      const row = await runGeneration({
        installId: null, kind: 'admin_batch', dna, request: { seed: true },
        target: targetPhone3 ? { width: 1260, height: 2800 } : { width: 1080, height: 2400 },
        status: 'review', sourceType: 'procedural', deviceIds: targetPhone3 ? ['nothing_phone_3'] : [],
      });
      await query(
        `UPDATE wallpapers SET status = 'published', published_at = now() - ($2 || ' minutes')::interval,
           is_featured = $3, is_editor_pick = $4 WHERE id = $1`,
        [row.id, String(i * 37), i === 0, i % 5 === 0],
      );
      i++;
      process.stdout.write(`\r  ${i}/30`);
    }
  }
  console.log('\n✔ catalog seeded');
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });

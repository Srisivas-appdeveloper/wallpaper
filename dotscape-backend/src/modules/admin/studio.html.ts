import { readFileSync } from 'node:fs';

export const studioHtml = readFileSync(new URL('./studio.html', import.meta.url), 'utf8');

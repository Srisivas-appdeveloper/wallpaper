import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcegfuwlunoxmeffarhu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_L7Rz-0zLSzXvxNmJTSqP-w_sK6R1hS9';

// Public browser client (Anon). The service-role key stays server-only and is read
// in API routes from SUPABASE_SERVICE_ROLE_KEY — never imported into client pages.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getPublicStorageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.replace(/^wallpapers\//, '');
  return `${supabaseUrl}/storage/v1/object/public/wallpapers/${clean}`;
}

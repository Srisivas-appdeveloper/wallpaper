import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [counts] = await sql`
      SELECT 
        count(*)::int as total,
        count(*) FILTER (WHERE is_amoled = true)::int as amoled,
        count(*) FILTER (WHERE status = 'published')::int as published,
        coalesce(sum(download_count), 0)::int as downloads,
        coalesce(sum(view_count), 0)::int as views
      FROM wallpapers;
    `;

    const [catCount] = await sql`SELECT count(*)::int as count FROM categories;`;

    return NextResponse.json({
      totalWallpapers: counts.total,
      publishedWallpapers: counts.published,
      totalAmoled: counts.amoled,
      totalCategories: catCount.count,
      totalDownloads: counts.downloads,
      totalViews: counts.views,
    });
  } catch (err: any) {
    console.error('Stats query failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

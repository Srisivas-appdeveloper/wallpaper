import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const amoled = searchParams.get('amoled');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const rows = await sql`
      SELECT * FROM wallpapers
      WHERE 1=1
        ${category && category !== 'all' ? sql`AND category_id = ${category}` : sql``}
        ${status && status !== 'all' ? sql`AND status = ${status}` : sql``}
        ${amoled === 'true' ? sql`AND is_amoled = true` : sql``}
        ${search ? sql`AND (lower(title) LIKE ${`%${search.toLowerCase()}%`} OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE lower(tag) LIKE ${`%${search.toLowerCase()}%`}))` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;


    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Wallpapers query failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      categoryId,
      thumbnailKey,
      previewKey,
      fullKey,
      width,
      height,
      isAmoled,
      tags,
      deviceIds,
    } = body;

    const [inserted] = await sql`
      INSERT INTO wallpapers (
        id, title, description, category_id, source_type, status,
        thumbnail_key, preview_key, full_key, width, height,
        is_amoled, tags, colors, published_at
      ) VALUES (
        ${id || sql`gen_random_uuid()`},
        ${title},
        ${description || ''},
        ${categoryId || null},
        'upload',
        'published',
        ${thumbnailKey},
        ${previewKey},
        ${fullKey},
        ${width || 1080},
        ${height || 2400},
        ${isAmoled || false},
        ${tags || []},
        ${isAmoled ? ['black', 'dark'] : ['monochrome']},
        now()
      )
      RETURNING *;
    `;

    if (deviceIds && Array.isArray(deviceIds) && deviceIds.length > 0) {
      for (const devId of deviceIds) {
        await sql`
          INSERT INTO wallpaper_devices (wallpaper_id, device_id)
          VALUES (${inserted.id}, ${devId})
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    return NextResponse.json(inserted);
  } catch (err: any) {
    console.error('Wallpaper creation failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, is_featured, is_editor_pick, status } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updates: any = {};
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (is_editor_pick !== undefined) updates.is_editor_pick = is_editor_pick;
    if (status !== undefined) {
      updates.status = status;
      updates.published_at = status === 'published' ? new Date().toISOString() : null;
    }
    updates.updated_at = new Date().toISOString();

    const [updated] = await sql`
      UPDATE wallpapers SET ${sql(updates)}
      WHERE id = ${id}
      RETURNING *;
    `;

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Wallpaper update failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await sql`DELETE FROM wallpapers WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Wallpaper deletion failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

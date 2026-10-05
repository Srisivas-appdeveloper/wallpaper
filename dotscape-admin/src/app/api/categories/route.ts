import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM categories ORDER BY display_order ASC;
    `;
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Categories query failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();
    if (!name || !slug) return NextResponse.json({ error: 'Missing name or slug' }, { status: 400 });

    const [maxOrder] = await sql`SELECT coalesce(max(display_order), 0)::int as max_order FROM categories;`;

    const [inserted] = await sql`
      INSERT INTO categories (id, name, slug, display_order, is_active)
      VALUES (${slug}, ${name}, ${slug}, ${maxOrder.max_order + 1}, true)
      RETURNING *;
    `;

    return NextResponse.json(inserted);
  } catch (err: any) {
    console.error('Category creation failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await sql`DELETE FROM categories WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Category deletion failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

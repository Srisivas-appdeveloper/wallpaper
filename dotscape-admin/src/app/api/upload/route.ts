import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const wallpaperId = (formData.get('wallpaperId') as string) || crypto.randomUUID();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcegfuwlunoxmeffarhu.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'jpg';
    const fullKey = `wallpapers/${wallpaperId}/full.${ext}`;
    const previewKey = `wallpapers/${wallpaperId}/preview.webp`;
    const thumbKey = `wallpapers/${wallpaperId}/thumb.webp`;

    // Upload to Supabase Storage REST API
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/wallpapers/${wallpaperId}/full.${ext}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': file.type || 'image/jpeg',
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Upload failed: ${uploadRes.status} ${err}`);
    }

    // Also upload preview and thumb
    await Promise.all([
      fetch(`${supabaseUrl}/storage/v1/object/wallpapers/${wallpaperId}/preview.webp`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'image/webp',
          'x-upsert': 'true',
        },
        body: buffer,
      }),
      fetch(`${supabaseUrl}/storage/v1/object/wallpapers/${wallpaperId}/thumb.webp`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'image/webp',
          'x-upsert': 'true',
        },
        body: buffer,
      }),
    ]);

    return NextResponse.json({
      wallpaperId,
      fullKey,
      previewKey,
      thumbKey,
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

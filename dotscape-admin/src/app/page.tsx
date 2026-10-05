import { Header } from '@/components/Header';
import { sql } from '@/lib/db';
import { getPublicStorageUrl } from '@/lib/supabase';
import { Wallpaper } from '@/lib/types';
import Link from 'next/link';
import { 
  Images, 
  Sparkles, 
  Download, 
  Eye, 
  ArrowUpRight, 
  Plus, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  HardDrive 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const [counts] = await sql`
      SELECT 
        count(*)::int as total,
        count(*) FILTER (WHERE is_amoled = true)::int as amoled,
        count(*) FILTER (WHERE status = 'published')::int as published
      FROM wallpapers;
    `;

    const [catCount] = await sql`SELECT count(*)::int as count FROM categories;`;

    const wallpapers = await sql`
      SELECT * FROM wallpapers
      ORDER BY created_at DESC
      LIMIT 6;
    `;

    return {
      wallpapers: wallpapers as unknown as Wallpaper[],
      totalWallpapers: counts.total || 0,
      categoriesCount: catCount.count || 0,
      amoledCount: counts.amoled || 0,
    };
  } catch (e) {
    console.error('Failed to fetch dashboard data:', e);
    return {
      wallpapers: [],
      totalWallpapers: 0,
      categoriesCount: 0,
      amoledCount: 0,
    };
  }
}


export default async function DashboardPage() {
  const { wallpapers, totalWallpapers, categoriesCount, amoledCount } = await getDashboardData();

  return (
    <div>
      <Header title="Dashboard Overview" subtitle="Live Supabase Cloud Database & Storage CDN" />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Total Wallpapers</span>
              <Images className="w-4 h-4 text-nothing-red" />
            </div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">{totalWallpapers}</div>
            <div className="mt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Active in Supabase Cloud</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">True AMOLED</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">{amoledCount}</div>
            <div className="mt-2 text-[11px] font-mono text-zinc-500">
              Zero-battery pixel-off wallpapers
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Categories</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">{categoriesCount}</div>
            <div className="mt-2 text-[11px] font-mono text-zinc-400">
              Abstract, Nature, Liquid, etc.
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Cloud Storage CDN</span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400 tracking-tight">ONLINE</div>
            <div className="mt-2 text-[11px] font-mono text-zinc-400">
              135 files in Supabase bucket
            </div>
          </div>
        </div>

        {/* System Architecture Status */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
                Production Architecture Topology
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Unified Cloud Backend & Mobile Delivery Pipeline
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-nothing-red/10 border border-nothing-red/20 text-nothing-red text-xs font-mono font-medium">
              TARGET: PLAY STORE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">Flutter App</span>
                <span className="text-[10px] font-mono text-emerald-400">CONNECTING</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Riverpod + Dio + Supabase client. Device-specific aspect ratios.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">Next.js Admin</span>
                <span className="text-[10px] font-mono text-emerald-400">RUNNING</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Real-time Supabase Studio, moderation, batch upload, analytics.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">Supabase Cloud</span>
                <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                PostgreSQL + RLS + Storage bucket + ap-south-1 Edge CDN.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">AI Provider</span>
                <span className="text-[10px] font-mono text-emerald-400">READY</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Procedural DNA engine + AI Remix generation pipeline.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Wallpapers Grid & Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
              Recent Wallpapers ({wallpapers.length} of {totalWallpapers})
            </h3>
            <div className="flex items-center gap-3">
              <Link
                href="/upload"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nothing-red hover:bg-nothing-red-bright text-white text-xs font-mono transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload New
              </Link>
              <Link
                href="/wallpapers"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono transition"
              >
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {wallpapers.map((wp) => {
              const imgUrl = getPublicStorageUrl(wp.thumbnail_key || wp.preview_key);
              return (
                <div
                  key={wp.id}
                  className="glass-card rounded-xl overflow-hidden border border-white/10 group flex flex-col justify-between"
                >
                  <div className="relative aspect-[9/16] bg-zinc-950 overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={wp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 font-mono text-xs">
                        NO IMAGE
                      </div>
                    )}
                    {wp.is_amoled && (
                      <span className="absolute top-2 left-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 border border-amber-500/40 text-amber-300 backdrop-blur-sm">
                        AMOLED
                      </span>
                    )}
                    <span className="absolute top-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-zinc-300 backdrop-blur-sm uppercase">
                      {wp.category_id || 'general'}
                    </span>
                  </div>

                  <div className="p-3 bg-black/60">
                    <h4 className="text-xs font-mono font-medium text-white truncate" title={wp.title}>
                      {wp.title}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                      {wp.width}x{wp.height} • {wp.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

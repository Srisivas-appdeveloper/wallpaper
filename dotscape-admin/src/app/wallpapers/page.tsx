'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { supabase, getPublicStorageUrl } from '@/lib/supabase';
import { Wallpaper, Category } from '@/lib/types';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Star, 
  Eye, 
  Trash2, 
  ExternalLink,
  Check, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export default function WallpapersPage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [amoledOnly, setAmoledOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (amoledOnly) params.append('amoled', 'true');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const [wpRes, catRes] = await Promise.all([
        fetch(`/api/wallpapers?${params.toString()}`).then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]);

      if (Array.isArray(wpRes)) setWallpapers(wpRes as Wallpaper[]);
      if (Array.isArray(catRes)) setCategories(catRes as Category[]);
    } catch (e) {
      console.error('Error loading wallpapers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, amoledOnly, statusFilter]);

  const toggleFeatured = async (wp: Wallpaper) => {
    const nextVal = !wp.is_featured;
    const res = await fetch('/api/wallpapers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wp.id, is_featured: nextVal }),
    });

    if (res.ok) {
      setWallpapers(prev => prev.map(item => item.id === wp.id ? { ...item, is_featured: nextVal } : item));
    }
  };

  const togglePublishStatus = async (wp: Wallpaper) => {
    const nextStatus = wp.status === 'published' ? 'draft' : 'published';
    const res = await fetch('/api/wallpapers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wp.id, status: nextStatus }),
    });

    if (res.ok) {
      setWallpapers(prev => prev.map(item => item.id === wp.id ? { ...item, status: nextStatus as any } : item));
    }
  };

  const deleteWallpaper = async (wp: Wallpaper) => {
    if (!confirm(`Are you sure you want to delete "${wp.title}"?`)) return;

    const res = await fetch(`/api/wallpapers?id=${wp.id}`, { method: 'DELETE' });
    if (res.ok) {
      setWallpapers(prev => prev.filter(item => item.id !== wp.id));
      if (selectedWallpaper?.id === wp.id) setSelectedWallpaper(null);
    } else {
      alert('Failed to delete wallpaper');
    }
  };


  const filtered = wallpapers.filter(wp => {
    if (!search) return true;
    const s = search.toLowerCase();
    return wp.title.toLowerCase().includes(s) || wp.tags?.some(t => t.toLowerCase().includes(s));
  });

  return (
    <div>
      <Header title="Wallpaper Library" subtitle="Live Supabase Cloud Database & Storage" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Filter bar */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title or tag..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
              />
            </div>

            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Category dropdown */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-white/30"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-white/30"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
            </select>

            {/* AMOLED Filter */}
            <button
              onClick={() => setAmoledOnly(!amoledOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-mono border transition flex items-center gap-1.5 ${
                amoledOnly
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AMOLED Only</span>
            </button>
          </div>
        </div>

        {/* Wallpaper Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(wp => {
            const imgUrl = getPublicStorageUrl(wp.thumbnail_key || wp.preview_key);
            const isSelected = selectedWallpaper?.id === wp.id;

            return (
              <div
                key={wp.id}
                className={`glass-card rounded-xl overflow-hidden border transition flex flex-col justify-between cursor-pointer ${
                  isSelected ? 'border-nothing-red ring-1 ring-nothing-red' : 'border-white/10'
                }`}
                onClick={() => setSelectedWallpaper(wp)}
              >
                <div className="relative aspect-[9/16] bg-zinc-950 overflow-hidden">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={wp.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 font-mono text-xs">
                      NO IMAGE
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {wp.is_amoled && (
                      <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-black/80 border border-amber-500/40 text-amber-300 backdrop-blur-sm">
                        AMOLED
                      </span>
                    )}
                    {wp.is_featured && (
                      <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-nothing-red/80 border border-nothing-red text-white backdrop-blur-sm">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <span className={`absolute top-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm uppercase border ${
                    wp.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-800/80 text-zinc-400 border-white/10'
                  }`}>
                    {wp.status}
                  </span>
                </div>

                <div className="p-3 bg-black/60 space-y-2">
                  <h4 className="text-xs font-mono font-medium text-white truncate" title={wp.title}>
                    {wp.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>{wp.category_id || 'general'}</span>
                    <span>{wp.width}x{wp.height}</span>
                  </div>

                  {/* Quick Card Controls */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFeatured(wp); }}
                      className={`p-1 rounded hover:bg-white/10 transition ${wp.is_featured ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-300'}`}
                      title="Toggle Featured"
                    >
                      <Star className="w-3.5 h-3.5" fill={wp.is_featured ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); togglePublishStatus(wp); }}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono transition border ${
                        wp.status === 'published'
                          ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                          : 'border-zinc-700 text-zinc-400 hover:bg-white/10'
                      }`}
                      title="Toggle Publish Status"
                    >
                      {wp.status === 'published' ? 'UNPUBLISH' : 'PUBLISH'}
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteWallpaper(wp); }}
                      className="p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition"
                      title="Delete Wallpaper"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Wallpaper Inspection Modal / Drawer */}
        {selectedWallpaper && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel max-w-2xl w-full rounded-2xl border border-white/20 p-6 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-mono font-bold text-white">{selectedWallpaper.title}</h3>
                  <p className="text-xs font-mono text-zinc-400">ID: {selectedWallpaper.id}</p>
                </div>
                <button
                  onClick={() => setSelectedWallpaper(null)}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black border border-white/10">
                  <img
                    src={getPublicStorageUrl(selectedWallpaper.preview_key || selectedWallpaper.full_key)}
                    alt={selectedWallpaper.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 uppercase tracking-wider block mb-1">Description</span>
                    <p className="text-zinc-300 leading-relaxed bg-black/30 p-2.5 rounded border border-white/5">
                      {selectedWallpaper.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded bg-black/30 border border-white/5">
                      <span className="text-zinc-500 block">Dimensions</span>
                      <span className="text-white font-bold">{selectedWallpaper.width} x {selectedWallpaper.height}</span>
                    </div>
                    <div className="p-2.5 rounded bg-black/30 border border-white/5">
                      <span className="text-zinc-500 block">Category</span>
                      <span className="text-white font-bold">{selectedWallpaper.category_id || 'general'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 uppercase tracking-wider block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWallpaper.tags?.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                    <a
                      href={getPublicStorageUrl(selectedWallpaper.full_key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Full CDN Image
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

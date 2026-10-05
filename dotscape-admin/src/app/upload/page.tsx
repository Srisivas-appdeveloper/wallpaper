'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Category, Device } from '@/lib/types';
import { UploadCloud, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('abstract');
  const [tags, setTags] = useState('abstract, geometric, nothing, dark');
  const [isAmoled, setIsAmoled] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  // State
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      const [catRes, devRes] = await Promise.all([
        fetch('/api/categories').then(r => r.json()),
        supabase.from('devices').select('*').order('brand', { ascending: true })
      ]);
      if (Array.isArray(catRes)) {
        setCategories(catRes);
        if (catRes.length > 0) setCategoryId(catRes[0].id);
      }
      if (devRes.data) {
        setDevices(devRes.data);
        setSelectedDevices(devRes.data.map(d => d.id));
      }
    }
    loadMeta();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = e.target.files[0];
    setFile(selected);
    setError(null);
    setSuccess(false);

    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    if (!title) {
      const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDeviceToggle = (id: string) => {
    setSelectedDevices(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title for the wallpaper.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload to Supabase Storage via Next.js API
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload to Supabase Storage failed');
      }

      const { wallpaperId, fullKey, previewKey, thumbKey } = await uploadRes.json();

      // 2. Insert wallpaper record into PostgreSQL
      const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

      const dbRes = await fetch('/api/wallpapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: wallpaperId,
          title: title.trim(),
          description: description.trim(),
          categoryId,
          thumbnailKey: thumbKey,
          previewKey,
          fullKey,
          width: dimensions.width || 1080,
          height: dimensions.height || 2400,
          isAmoled,
          tags: tagList,
          deviceIds: selectedDevices,
        }),
      });

      if (!dbRes.ok) {
        const err = await dbRes.json();
        throw new Error(err.error || 'Database record creation failed');
      }

      setSuccess(true);
      setFile(null);
      setPreviewUrl(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload wallpaper.');
    } finally {
      setUploading(false);
    }
  };


  return (
    <div>
      <Header title="Studio Upload" subtitle="Direct High-Res Ingestion into Supabase Storage & DB" />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Link
          href="/wallpapers"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Wallpaper Library
        </Link>

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Wallpaper successfully uploaded and published to Supabase Cloud!
            </span>
            <Link href="/wallpapers" className="underline hover:text-white">
              View in Library
            </Link>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Dropzone & Preview */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              1. Image Asset
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="border-2 border-dashed border-white/10 hover:border-nothing-red/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-black/20 group">
                <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-nothing-red transition mb-3" />
                <span className="text-xs font-mono text-white font-medium mb-1">Click to select image</span>
                <span className="text-[10px] font-mono text-zinc-500">PNG, JPG, or WEBP up to 25MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="aspect-[9/16] max-h-[320px] rounded-xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 flex justify-between">
                      <span>{dimensions.width} x {dimensions.height}px</span>
                      <span>{(file?.size ? (file.size / 1024 / 1024).toFixed(2) : '0')} MB</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <span className="text-xs font-mono text-zinc-600 block">No image selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              2. Wallpaper Details
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wide">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Glyph Matrix Red Shift"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Cinematic description of the artwork..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1.5 uppercase tracking-wide">Category *</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-white/30"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1.5 uppercase tracking-wide">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="minimal, amoled, red, glyph"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* AMOLED Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAmoled}
                    onChange={e => setIsAmoled(e.target.checked)}
                    className="w-4 h-4 rounded bg-black/40 border-white/20 text-nothing-red focus:ring-0"
                  />
                  <span className="text-zinc-300">True AMOLED (#000000 Pixel-Off Optimized)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Target Devices */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              3. Target Device Aspect Ratios
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {devices.map(d => {
                const isSelected = selectedDevices.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDeviceToggle(d.id)}
                    className={`p-3 rounded-lg border text-left transition font-mono ${
                      isSelected
                        ? 'bg-nothing-red/10 border-nothing-red text-white'
                        : 'bg-black/30 border-white/10 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{d.model}</div>
                    <div className="text-[10px] text-zinc-400">{d.screen_width}x{d.screen_height} ({d.aspect_ratio})</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-3.5 rounded-xl bg-nothing-red hover:bg-nothing-red-bright disabled:opacity-50 text-white font-mono font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-nothing-red/30 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading to Supabase Cloud...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish to DOTSCAPE Cloud</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

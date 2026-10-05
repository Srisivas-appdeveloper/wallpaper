'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { supabase, getPublicStorageUrl } from '@/lib/supabase';
import { Wallpaper } from '@/lib/types';
import { Wand2, Sparkles, RefreshCw, Check, ArrowRight } from 'lucide-react';

const OPERATIONS = [
  { id: 'invert_colors', name: 'Invert Color Phase', desc: 'Flips RGB curves while keeping AMOLED blacks' },
  { id: 'dot_matrix_filter', name: 'Matrix Dotify', desc: 'Overlays Nothing OS circular glyph grid' },
  { id: 'red_tint_shift', name: 'Red Glyph Shift', desc: 'Injects iconic Nothing red accents (#d71921)' },
  { id: 'amoled_blacken', name: 'AMOLED Crush', desc: 'Thresholds dark tones to pure #000000' },
  { id: 'high_contrast', name: 'High Contrast', desc: 'Enhances dynamic range and crisp edges' },
  { id: 'grain_texture', name: 'Film Grain', desc: 'Adds organic analog texture' },
  { id: 'subtle_blur', name: 'Depth Glow', desc: 'Applies atmospheric diffuse glow' },
];

export default function RemixPage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [selectedWp, setSelectedWp] = useState<Wallpaper | null>(null);
  const [selectedOps, setSelectedOps] = useState<string[]>(['red_tint_shift', 'amoled_blacken']);
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('wallpapers').select('*').limit(12);
      if (data && data.length > 0) {
        setWallpapers(data as Wallpaper[]);
        setSelectedWp(data[0] as Wallpaper);
      }
    }
    load();
  }, []);

  const toggleOp = (id: string) => {
    setSelectedOps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!selectedWp) return;
    setGenerating(true);
    setResultUrl(null);

    try {
      // Call backend generation endpoint
      const res = await fetch('http://localhost:8080/v1/generate/remix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-install-id': '00000000-0000-0000-0000-000000000000',
        },
        body: JSON.stringify({
          sourceWallpaperId: selectedWp.id,
          operations: selectedOps,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // data.wallpaper contains the new wallpaper with previewUrl / thumbnailUrl
        setResultUrl(data.wallpaper.previewUrl || data.wallpaper.fullUrl);
      } else {
        const err = await res.json();
        alert('Generation failed: ' + (err.message || res.statusText));
      }
    } catch (e: any) {
      console.error(e);
      alert('Error triggering AI remix: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Header title="AI Provider & Remix Lab" subtitle="Procedural DNA engine & AI style transfer" />

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Source */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                Select Source Wallpaper
              </h3>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {wallpapers.map(wp => {
                  const isCur = selectedWp?.id === wp.id;
                  const thumb = getPublicStorageUrl(wp.thumbnail_key);
                  return (
                    <button
                      key={wp.id}
                      onClick={() => { setSelectedWp(wp); setResultUrl(null); }}
                      className={`aspect-[9/16] rounded-lg overflow-hidden border transition relative ${
                        isCur ? 'border-nothing-red ring-2 ring-nothing-red' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={thumb} alt={wp.title} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Remix Operations */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                Apply Style Transforms & AI Modifiers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {OPERATIONS.map(op => {
                  const active = selectedOps.includes(op.id);
                  return (
                    <button
                      key={op.id}
                      onClick={() => toggleOp(op.id)}
                      className={`p-3 rounded-xl border text-left transition font-mono ${
                        active
                          ? 'bg-nothing-red/10 border-nothing-red text-white'
                          : 'bg-black/30 border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>{op.name}</span>
                        {active && <Check className="w-3.5 h-3.5 text-nothing-red" />}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">{op.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedWp || selectedOps.length === 0}
              className="w-full py-3.5 rounded-xl bg-nothing-red hover:bg-nothing-red-bright disabled:opacity-50 text-white font-mono font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-nothing-red/30 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing via AI Engine...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Execute Neural Remix ({selectedOps.length} Ops)</span>
                </>
              )}
            </button>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 w-full text-left">
                Transformation Output
              </h3>

              <div className="w-full max-w-[280px] aspect-[9/16] rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl relative">
                {resultUrl ? (
                  <img src={resultUrl} alt="Remixed" className="w-full h-full object-cover animate-fade-in" />
                ) : selectedWp ? (
                  <div className="relative w-full h-full">
                    <img
                      src={getPublicStorageUrl(selectedWp.preview_key)}
                      alt="Source Preview"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <span className="text-xs font-mono text-zinc-300 text-center px-4">
                        Press "Execute Neural Remix" to synthesize new variant
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
                    Select a wallpaper
                  </div>
                )}
              </div>

              {resultUrl && (
                <div className="mt-4 text-center font-mono">
                  <span className="text-xs text-emerald-400 font-bold block">REMIX SYNTHESIZED!</span>
                  <span className="text-[10px] text-zinc-500">Saved to Supabase DB & Storage CDN</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

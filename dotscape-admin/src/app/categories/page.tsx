'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Category, Device } from '@/lib/types';
import { Plus, FolderTree, Smartphone, Check, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const [cRes, dRes] = await Promise.all([
      supabase.from('categories').select('*').order('display_order', { ascending: true }),
      supabase.from('devices').select('*').order('brand', { ascending: true })
    ]);
    if (cRes.data) setCategories(cRes.data);
    if (dRes.data) setDevices(dRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNameChange = (val: string) => {
    setNewCatName(val);
    setNewCatSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;

    setLoading(true);
    const { data, error } = await supabase.from('categories').insert({
      id: newCatSlug.trim(),
      name: newCatName.trim(),
      slug: newCatSlug.trim(),
      display_order: categories.length + 1,
      is_active: true,
    }).select();

    setLoading(false);
    if (error) {
      alert('Error creating category: ' + error.message);
    } else if (data) {
      setCategories(prev => [...prev, data[0] as Category]);
      setNewCatName('');
      setNewCatSlug('');
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id));
    } else {
      alert('Error deleting: ' + error.message);
    }
  };

  return (
    <div>
      <Header title="Categories & Target Devices" subtitle="Manage taxonomies across Flutter & Web" />

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-nothing-red" />
              Wallpaper Categories ({categories.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-2 glass-panel p-4 rounded-xl border border-white/10 space-y-2">
              <div className="divide-y divide-white/5">
                {categories.map((c) => (
                  <div key={c.id} className="py-3 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition font-mono">
                    <div>
                      <div className="text-xs font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-zinc-500">ID / slug: {c.slug} • Order: {c.display_order}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded border ${c.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                        {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <button
                        onClick={() => deleteCategory(c.id, c.name)}
                        className="p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Category Form */}
            <div className="glass-card p-5 rounded-xl border border-white/10 space-y-4">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Add New Category
              </h4>
              <form onSubmit={addCategory} className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block text-zinc-400 mb-1">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cyberpunk"
                    value={newCatName}
                    onChange={e => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. cyberpunk"
                    value={newCatSlug}
                    onChange={e => setNewCatSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-nothing-red hover:bg-nothing-red-bright text-white font-mono font-bold text-xs uppercase transition tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Devices Section */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Configured Device Profiles ({devices.length})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {devices.map(d => (
              <div key={d.id} className="glass-card p-4 rounded-xl border border-white/10 font-mono space-y-1">
                <div className="text-xs font-bold text-white">{d.model}</div>
                <div className="text-[10px] text-zinc-400">{d.brand}</div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                  {d.screen_width} x {d.screen_height} ({d.aspect_ratio})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  UploadCloud, 
  FolderTree, 
  Wand2, 
  Database,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Wallpapers', href: '/wallpapers', icon: ImageIcon },
  { name: 'Studio Upload', href: '/upload', icon: UploadCloud },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'AI / Remix Lab', href: '/remix', icon: Wand2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel flex flex-col justify-between z-40 border-r border-white/10">
      <div>
        {/* Brand / Logo */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-nothing-red flex items-center justify-center font-mono font-bold text-white text-xs tracking-wider shadow-lg shadow-nothing-red/30">
              DS
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-widest text-white uppercase">DOTSCAPE</h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-tight">STUDIO ADMIN</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Supabase Connected" />
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-wide transition-all ${
                  isActive
                    ? 'bg-white/10 text-white font-medium border border-white/15 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-nothing-red' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Cloud Info & Links */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Supabase Cloud
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono truncate">ap-south-1 (Mumbai)</p>
        </div>

        <a
          href="https://supabase.com/dashboard/project/rcegfuwlunoxmeffarhu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            Supabase Console
          </span>
          <ExternalLink className="w-3 h-3 text-zinc-600" />
        </a>
      </div>
    </aside>
  );
}

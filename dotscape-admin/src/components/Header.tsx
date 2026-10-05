'use client';

import { Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/10 glass-panel px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-mono font-bold tracking-wider text-white uppercase">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400 font-mono tracking-tight">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-nothing-red" />
          <span>PostgreSQL + Storage CDN</span>
        </div>

        <div className="flex items-center space-x-3 border-l border-white/10 pl-4">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-mono text-xs text-zinc-300">
            A
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-mono text-white leading-tight">Admin</p>
            <p className="text-[10px] font-mono text-zinc-500">dotscape.local</p>
          </div>
        </div>
      </div>
    </header>
  );
}

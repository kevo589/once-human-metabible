import React from 'react';
import { cn } from '../../utils/cn';
import type { Archetype, Rarity } from '../../types/game';

export const RARITY_STYLES: Record<Rarity, string> = {
  Legendary: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  Epic: 'border-purple-500/40 bg-purple-500/15 text-purple-300',
  Rare: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  Uncommon: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  Common: 'border-slate-500/40 bg-slate-500/15 text-slate-300',
};

export const RARITY_LEFT_BORDER: Record<Rarity, string> = {
  Legendary: 'border-l-amber-400/80 hover:border-l-amber-300',
  Epic: 'border-l-purple-400/80 hover:border-l-purple-300',
  Rare: 'border-l-sky-400/80 hover:border-l-sky-300',
  Uncommon: 'border-l-emerald-400/80 hover:border-l-emerald-300',
  Common: 'border-l-slate-400/80 hover:border-l-slate-300',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  Legendary: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/35',
  Epic: 'from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/35',
  Rare: 'from-sky-500/20 via-sky-500/5 to-transparent border-sky-500/35',
  Uncommon: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/35',
  Common: 'from-slate-500/20 via-slate-500/5 to-transparent border-slate-500/35',
};

const ARCHETYPE_STYLES: Record<Archetype, string> = {
  Shrapnel: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  'Frost Vortex': 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200',
  'Power Surge': 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200',
  Burn: 'border-orange-400/40 bg-orange-500/15 text-orange-200',
  'Unstable Bomber': 'border-rose-400/40 bg-rose-500/15 text-rose-200',
  "Bull's Eye": 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  'Fast Gunner': 'border-sky-400/40 bg-sky-500/15 text-sky-200',
  'Fortress Warfare': 'border-slate-400/40 bg-slate-500/15 text-slate-200',
  Standard: 'border-obsidian-700 bg-obsidian-800/80 text-slate-400',
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className={cn('inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', RARITY_STYLES[rarity])}>
      {rarity}
    </span>
  );
}

export function ArchetypeBadge({ archetype }: { archetype: Archetype }) {
  return (
    <span className={cn('inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium', ARCHETYPE_STYLES[archetype])}>
      {archetype}
    </span>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border border-obsidian-700 bg-obsidian-800 px-2 py-0.5 text-xs text-slate-300', className)}>
      {children}
    </span>
  );
}

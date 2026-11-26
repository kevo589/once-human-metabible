import React from 'react';
import { cn } from '../../utils/cn';
import type { Archetype, Rarity } from '../../types/game';

const RARITY_STYLES: Record<Rarity, string> = {
  Legendary: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  Epic: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  Rare: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
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
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className={cn('inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium', RARITY_STYLES[rarity])}>
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

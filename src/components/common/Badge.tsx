import React from 'react';
import { cn } from '../../utils/cn';
import type { Archetype, ElementType, Rarity } from '../../types/game';

export const RARITY_STYLES: Record<Rarity, string> = {
  Legendary: 'border-amber-500/25 bg-amber-500/5 text-amber-200/90',
  Epic: 'border-purple-500/25 bg-purple-500/5 text-purple-200/90',
  Rare: 'border-sky-500/25 bg-sky-500/5 text-sky-200/90',
  Uncommon: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-200/90',
  Common: 'border-slate-600/40 bg-slate-800/40 text-slate-300',
};

export const ELEMENT_TEXT: Record<ElementType, string> = {
  Blaze: 'text-orange-300/90',
  Frost: 'text-cyan-300/90',
  Shock: 'text-indigo-300/90',
  Blast: 'text-rose-300/90',
  Physical: 'text-slate-300',
  Universal: 'text-slate-400',
};

export const RARITY_TEXT: Record<Rarity, string> = {
  Legendary: 'text-amber-300/90',
  Epic: 'text-purple-300/90',
  Rare: 'text-sky-300/90',
  Uncommon: 'text-emerald-300/90',
  Common: 'text-slate-400',
};

export const RARITY_LEFT_BORDER: Record<Rarity, string> = {
  Legendary: 'border-l-amber-400/70 hover:border-l-amber-300',
  Epic: 'border-l-purple-400/70 hover:border-l-purple-300',
  Rare: 'border-l-sky-400/70 hover:border-l-sky-300',
  Uncommon: 'border-l-emerald-400/70 hover:border-l-emerald-300',
  Common: 'border-l-slate-500/70 hover:border-l-slate-400',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  Legendary: 'border-obsidian-700/80 bg-obsidian-950/90',
  Epic: 'border-obsidian-700/80 bg-obsidian-950/90',
  Rare: 'border-obsidian-700/80 bg-obsidian-950/90',
  Uncommon: 'border-obsidian-700/80 bg-obsidian-950/90',
  Common: 'border-obsidian-700/80 bg-obsidian-950/90',
};

const ARCHETYPE_STYLES: Record<Archetype, string> = {
  Shrapnel: 'border-obsidian-700 bg-obsidian-800/70 text-amber-200/85',
  'Frost Vortex': 'border-obsidian-700 bg-obsidian-800/70 text-cyan-200/85',
  'Power Surge': 'border-obsidian-700 bg-obsidian-800/70 text-indigo-200/85',
  Burn: 'border-obsidian-700 bg-obsidian-800/70 text-orange-200/85',
  'Unstable Bomber': 'border-obsidian-700 bg-obsidian-800/70 text-rose-200/85',
  Bounce: 'border-obsidian-700 bg-obsidian-800/70 text-teal-200/85',
  "Bull's Eye": 'border-obsidian-700 bg-obsidian-800/70 text-emerald-200/85',
  'Fast Gunner': 'border-obsidian-700 bg-obsidian-800/70 text-sky-200/85',
  'Fortress Warfare': 'border-obsidian-700 bg-obsidian-800/70 text-slate-200/85',
  Standard: 'border-obsidian-800 bg-obsidian-900 text-slate-400',
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider', RARITY_STYLES[rarity])}>
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
    <span className={cn('inline-flex items-center rounded border border-obsidian-700/80 bg-obsidian-800/60 px-2 py-0.5 text-[11px] text-slate-300', className)}>
      {children}
    </span>
  );
}

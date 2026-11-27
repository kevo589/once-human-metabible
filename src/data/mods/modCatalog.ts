import rawModCodex from './modCodex.json';
import rawModSubstats from './modSubstats.json';

export type ModSlotName =
  | 'Weapon'
  | 'Helmet'
  | 'Mask'
  | 'Top'
  | 'Bottoms'
  | 'Shoes'
  | 'Gloves';

export interface SubStatSetDef {
  id: string;
  name: string;
  stats: string[];
}

export interface SubStatLevelDef {
  label: string;
  statKey: string;
  display: string;
  condition?: 'resonance' | 'downstar' | 'aero';
  levels?: number[];
  perStack?: number[];
  maxStacks?: number;
  durationSec?: number;
  base?: number[];
  bonusMax?: number[];
  maxMeters?: number;
  aerialBonus?: number[];
}

export interface CodexModItem {
  id: string;
  name: string;
  slot: ModSlotName;
  archetypeTag: string;
  iconUrl: string;
  summary: string;
  obtain: string;
  mapLocationId: string | null;
  subStatSetIds: string[];
  coreEffectByLevel: Record<string, string>;
  dpsModifiersByLevel: Record<string, Record<string, number>>;
}

export interface ModSubstatConditionState {
  aeroAerialHit?: boolean;
  downstarMeters?: number; // 0..5
  resonanceMaxStacks?: boolean;
}

const subData = rawModSubstats as {
  subStatSets: SubStatSetDef[];
  subStatsPerLevel: Record<string, SubStatLevelDef>;
};

export const MOD_SUBSTAT_SETS: SubStatSetDef[] = subData.subStatSets;
export const MOD_SUBSTATS_PER_LEVEL: Record<string, SubStatLevelDef> = subData.subStatsPerLevel;
export const MOD_SUBSTAT_SET_BY_ID = new Map(MOD_SUBSTAT_SETS.map((s) => [s.id, s]));

export const MOD_CODEX: CodexModItem[] = rawModCodex as unknown as CodexModItem[];
export const MOD_CODEX_BY_ID = new Map(MOD_CODEX.map((m) => [m.id, m]));

export const MOD_SLOT_ORDER: ModSlotName[] = [
  'Weapon',
  'Helmet',
  'Mask',
  'Top',
  'Bottoms',
  'Shoes',
  'Gloves',
];

export function clampModLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  const rounded = Math.round(level);
  if (rounded <= 1) return 1;
  if (rounded >= 5) return 5;
  return rounded as 1 | 2 | 3 | 4 | 5;
}

/** Formats any Level 1-5 sub-stat into its exact readable sentence at a preview level. */
export function formatReadableSubstat(substatId: string, level: number): string {
  const def = MOD_SUBSTATS_PER_LEVEL[substatId];
  if (!def) return substatId;
  const idx = clampModLevel(level) - 1;

  if (def.levels && !def.maxStacks) {
    return `${def.label} +${def.levels[idx]}%`;
  }

  if (def.maxStacks && def.durationSec && def.levels) {
    return `${def.label}: +${def.levels[idx]}% DMG Reduction when hit (up to ${def.maxStacks} stacks, ${def.durationSec}s)`;
  }

  if (def.condition === 'resonance' && def.perStack) {
    const tokens = ['1', `+${def.perStack[idx]}%`, String(def.maxStacks ?? 5), String(def.durationSec ?? 6)];
    let i = 0;
    return def.label.replace(/\+?X%?/g, () => tokens[i++] ?? 'X');
  }

  if (def.condition === 'downstar' && def.base && def.bonusMax) {
    const tokens = [`+${def.base[idx]}%`, `${def.bonusMax[idx]}%`, String(def.maxMeters ?? 5)];
    let i = 0;
    return def.label.replace(/\+?X%?/g, () => tokens[i++] ?? 'X');
  }

  if (def.condition === 'aero' && def.base && def.aerialBonus) {
    const tokens = [`+${def.base[idx]}%`, `+${def.aerialBonus[idx]}%`];
    let i = 0;
    return def.label.replace(/\+?X%?/g, () => tokens[i++] ?? 'X');
  }

  return def.label;
}

/** Computes exact numeric contribution of one Level 1-5 sub-stat under active combat conditions. */
export function evaluateSubStatValue(
  substatId: string,
  level: number,
  conditions: ModSubstatConditionState = {},
): { statKey: string; value: number } | null {
  const def = MOD_SUBSTATS_PER_LEVEL[substatId];
  if (!def) return null;
  const idx = clampModLevel(level) - 1;

  if (def.levels) {
    return { statKey: def.statKey, value: def.levels[idx] };
  }

  if (def.condition === 'resonance' && def.perStack) {
    const stacks = conditions.resonanceMaxStacks ? (def.maxStacks ?? 5) : 1;
    return { statKey: def.statKey, value: Number((def.perStack[idx] * stacks).toFixed(2)) };
  }

  if (def.condition === 'downstar' && def.base && def.bonusMax) {
    const meters = Math.min(def.maxMeters ?? 5, Math.max(0, conditions.downstarMeters ?? 0));
    const bonus = (def.bonusMax[idx] * meters) / (def.maxMeters ?? 5);
    return { statKey: def.statKey, value: Number((def.base[idx] + bonus).toFixed(2)) };
  }

  if (def.condition === 'aero' && def.base && def.aerialBonus) {
    const bonus = conditions.aeroAerialHit ? def.aerialBonus[idx] : 0;
    return { statKey: def.statKey, value: Number((def.base[idx] + bonus).toFixed(2)) };
  }

  return null;
}

/** Resolves a codex mod by id, or falls back by name prefix for legacy mods.json variant IDs. */
export function resolveCodexMod(modIdOrName: string): CodexModItem | undefined {
  if (!modIdOrName) return undefined;
  const direct = MOD_CODEX_BY_ID.get(modIdOrName);
  if (direct) return direct;

  const clean = modIdOrName.toLowerCase().replace(/-[a-f0-9]{8,}$/, '');
  return MOD_CODEX.find((m) => {
    const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return clean === slug || clean.startsWith(`${slug}-`);
  });
}

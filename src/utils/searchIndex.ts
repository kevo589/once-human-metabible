import Fuse from 'fuse.js';
import { META_BUILDS } from '../data/buildsAndTimers';
import { DEVIATIONS, RECIPES } from '../data/deviationsAndChef';
import { ARMOR_SETS, MODS } from '../data/gearAndMods';
import { CLASS_SPECS, ENCOUNTERS } from '../data/mapsAndEncounters';
import { NALCOTT_POIS } from '../data/nalcottMap';
import { WEAPONS } from '../data/weapons';
import type { EncyclopediaSubTab, NavTab } from '../types/game';

export interface SearchEntry {
  id: string;
  title: string;
  subtitle: string;
  kind: 'Weapon' | 'Armor' | 'Mod' | 'Deviation' | 'Recipe' | 'Meta Build' | 'Map POI' | 'Encounter' | 'Specialization';
  targetTab: NavTab;
  targetSubTab?: EncyclopediaSubTab;
  targetId: string;
  imageUrl?: string;
  keywords: string;
}

export function buildSearchEntries(): SearchEntry[] {
  return [
    ...WEAPONS.map((w) => ({
      id: `w-${w.id}`,
      title: w.name,
      subtitle: `${w.rarity} ${w.category} • ${w.element} • ${w.archetype}`,
      kind: 'Weapon' as const,
      targetTab: 'encyclopedia' as const,
      targetSubTab: 'weapons' as const,
      targetId: w.id,
      imageUrl: w.imageUrl,
      keywords: `${w.trait} ${w.source} ${w.archetype} ${w.element} ${w.ammoType}`,
    })),
    ...ARMOR_SETS.map((a) => ({
      id: `a-${a.id}`,
      title: a.name,
      subtitle: `${a.rarity} ${a.slot} • ${a.setName ?? a.archetypes.join(', ')}`,
      kind: 'Armor' as const,
      targetTab: 'encyclopedia' as const,
      targetSubTab: 'armor' as const,
      targetId: a.id,
      imageUrl: a.imageUrl,
      keywords: `${a.effectSummary} ${a.source}`,
    })),
    ...MODS.map((m) => ({
      id: `m-${m.id}`,
      title: `${m.name} (${m.variant})`,
      subtitle: `${m.slot} Mod • ${m.element} • ${m.modCategory}`,
      kind: 'Mod' as const,
      targetTab: 'encyclopedia' as const,
      targetSubTab: 'mods' as const,
      targetId: m.id,
      imageUrl: m.imageUrl,
      keywords: `${m.primaryEffect} ${m.variant} ${m.element} ${m.archetype} ${m.dropSource}`,
    })),
    ...DEVIATIONS.map((d) => ({
      id: `d-${d.id}`,
      title: d.name,
      subtitle: `${d.type} Deviation • ${d.element}`,
      kind: 'Deviation' as const,
      targetTab: 'encyclopedia' as const,
      targetSubTab: 'deviations' as const,
      targetId: d.id,
      imageUrl: d.imageUrl,
      keywords: `${d.skillName} ${d.skillSummary} ${d.dropSource}`,
    })),
    ...RECIPES.map((r) => ({
      id: `r-${r.id}`,
      title: r.name,
      subtitle: `${r.category} • ${r.station}`,
      kind: 'Recipe' as const,
      targetTab: 'encyclopedia' as const,
      targetSubTab: 'chef' as const,
      targetId: r.id,
      keywords: `${r.effects} ${r.ingredients.join(' ')}`,
    })),
    ...META_BUILDS.map((b) => ({
      id: `b-${b.id}`,
      title: b.name,
      subtitle: `Tier ${b.tier} • ${b.archetype}`,
      kind: 'Meta Build' as const,
      targetTab: 'meta' as const,
      targetId: b.id,
      keywords: `${b.armorSetup} ${b.keyMods.join(' ')} ${b.playstyleNotes}`,
    })),
    ...NALCOTT_POIS.map((p) => ({
      id: `p-${p.id}`,
      scenario: p.scenario,
      title: p.name,
      subtitle: `${p.typeLabel} • ${p.region}${p.level ? ` • Lv ${p.level}` : ''}`,
      kind: 'Map POI' as const,
      targetTab: 'map' as const,
      targetId: p.id,
      keywords: `${p.typeLabel} ${p.region} ${p.near ?? ''} ${p.scenario}`,
    })),
    ...ENCOUNTERS.map((e) => ({
      id: `e-${e.id}`,
      title: e.name,
      subtitle: `${e.type} • Lv ${e.recommendedLevel}`,
      kind: 'Encounter' as const,
      targetTab: 'encyclopedia' as const,
      targetSubTab: 'encounters' as const,
      targetId: e.id,
      keywords: `${e.mechanicsSummary} ${e.keyDrops.join(' ')} ${e.weakElement}`,
    })),
    ...CLASS_SPECS.map((s) => ({
      id: `s-${s.id}`,
      title: s.name,
      subtitle: `Lv ${s.tierLevel} Memetic Specialization • ${s.category}`,
      kind: 'Specialization' as const,
      targetTab: 'encyclopedia' as const,
      targetSubTab: 'classes' as const,
      targetId: s.id,
      keywords: `${s.description} ${s.synergyNotes}`,
    })),
  ];
}

const ALL_ENTRIES = buildSearchEntries();

const fuse = new Fuse(ALL_ENTRIES, {
  keys: [
    { name: 'title', weight: 0.55 },
    { name: 'subtitle', weight: 0.25 },
    { name: 'keywords', weight: 0.2 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
});

export function searchCompanion(query: string, limit = 12): SearchEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return fuse.search(trimmed, { limit }).map((r) => r.item);
}

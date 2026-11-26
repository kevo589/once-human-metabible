import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { META_BUILDS, TIMER_EVENTS } from '../src/data/buildsAndTimers';
import { DEVIATIONS, RECIPES } from '../src/data/deviationsAndChef';
import { ARMOR_SETS, MODS } from '../src/data/gearAndMods';
import { CLASS_SPECS, ENCOUNTERS, MAP_MARKERS, MAP_SCENARIOS } from '../src/data/mapsAndEncounters';
import { WEAPONS } from '../src/data/weapons';
import {
  ArmorSetSchema,
  ClassSpecSchema,
  DeviationSchema,
  EncounterSchema,
  MapMarkerSchema,
  MapScenarioSchema,
  MetaBuildSchema,
  ModSchema,
  RecipeSchema,
  TimerEventSchema,
  WeaponSchema,
} from '../src/schemas/gameData';
import { calculateDps } from '../src/utils/dpsCalculator';
import { searchCompanion } from '../src/utils/searchIndex';
import { formatCountdown, getTimerStatus } from '../src/utils/timers';

describe('Once Human game data schemas', () => {
  it('validates all weapons, armor, mods, deviations, recipes, maps, builds, and timers', () => {
    for (const w of WEAPONS) WeaponSchema.parse(w);
    for (const a of ARMOR_SETS) ArmorSetSchema.parse(a);
    for (const m of MODS) ModSchema.parse(m);
    for (const d of DEVIATIONS) DeviationSchema.parse(d);
    for (const r of RECIPES) RecipeSchema.parse(r);
    for (const s of MAP_SCENARIOS) MapScenarioSchema.parse(s);
    for (const p of MAP_MARKERS) MapMarkerSchema.parse(p);
    for (const e of ENCOUNTERS) EncounterSchema.parse(e);
    for (const c of CLASS_SPECS) ClassSpecSchema.parse(c);
    for (const b of META_BUILDS) MetaBuildSchema.parse(b);
    for (const t of TIMER_EVENTS) TimerEventSchema.parse(t);

    expect(WEAPONS.length).toBeGreaterThanOrEqual(140);
    expect(MAP_SCENARIOS).toHaveLength(3);

    for (const w of WEAPONS) {
      const rel = w.imageUrl.replace(/^\.\//, '');
      const absPath = path.resolve(process.cwd(), 'public', rel);
      expect(fs.existsSync(absPath), `Missing image for ${w.id}: ${absPath}`).toBe(true);
    }
  });
});

describe('DPS Calculator', () => {
  it('calculates sustained DPS lower than burst DPS due to reload time', () => {
    const weapon = WEAPONS[0];
    const preset = META_BUILDS[0].preset;
    const res = calculateDps(weapon, preset);

    expect(res.burstDps).toBeGreaterThan(res.sustainedDps);
    expect(res.effectiveMagSize).toBeGreaterThanOrEqual(weapon.magSize);
    expect(res.effectiveCritRatePct).toBeLessThanOrEqual(100);
  });

  it('attributes elemental share on Frost Vortex builds', () => {
    const frostBuild = META_BUILDS.find((b) => b.archetype === 'Frost Vortex')!;
    const weapon = WEAPONS.find((w) => w.id === frostBuild.weaponId)!;
    const res = calculateDps(weapon, frostBuild.preset);

    expect(res.elementalSharePct).toBeGreaterThan(20);
  });
});

describe('Fuzzy Search & Timers', () => {
  it('finds weapons, POIs, and deviations with fuzzy queries', () => {
    const hits = searchCompanion('Last Valor');
    expect(hits.some((h) => h.title.includes('Last Valor'))).toBe(true);

    const blackfellHits = searchCompanion('Blackfell');
    expect(blackfellHits.some((h) => h.kind === 'Map POI')).toBe(true);
  });

  it('computes active and next intervals accurately', () => {
    const cargo = TIMER_EVENTS.find((e) => e.id === 'evt-cargo-scramble')!;
    const activeTime = new Date('2026-11-25T14:05:00Z');
    const activeStatus = getTimerStatus(cargo, activeTime);
    expect(activeStatus.isActive).toBe(true);
    expect(activeStatus.secondsRemainingActive).toBe(600);

    const waitingTime = new Date('2026-11-25T14:25:00Z');
    const waitingStatus = getTimerStatus(cargo, waitingTime);
    expect(waitingStatus.isActive).toBe(false);
    expect(formatCountdown(waitingStatus.secondsUntilNext)).toBe('00:35:00');
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculatePolylineMeters } from '../src/components/map/mapState';
import {
  aggregateCraftQueue,
  computeArmorCraft,
  computeWeaponCraft,
  GENE_FABRICS,
  HIDES_AND_WOOLS,
} from '../src/utils/craftingEngine';
import {
  aggregateLoadoutStats,
  calculateFullLoadoutDps,
  getStarterLoadouts,
} from '../src/data/dps/dpsEngine';
import materialImages from '../src/data/crafting/materialImages.json';
import {
  BUILT_IN_FILTER_PRESETS,
  MAP_CATEGORIES,
  MAP_DROP_TABLES,
  MAP_REGIONS,
  MAP_RESOURCE_AREAS,
} from '../src/data/mapCatalog';
import { META_BUILDS, TIMER_EVENTS } from '../src/data/buildsAndTimers';
import { DEVIATIONS, RECIPES } from '../src/data/deviationsAndChef';
import { ARMOR_SETS, MODS } from '../src/data/gearAndMods';
import { CLASS_SPECS, ENCOUNTERS, MAP_MARKERS, MAP_SCENARIOS } from '../src/data/mapsAndEncounters';
import { DEVIATION_MAP_SPAWNS } from '../src/data/deviationMapLinks';
import { ALL_MAP_MARKERS, NALCOTT_MAP, NALCOTT_POIS } from '../src/data/nalcottMap';
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
  NalcottMapDataSchema,
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
    NalcottMapDataSchema.parse(NALCOTT_MAP);
    for (const e of ENCOUNTERS) EncounterSchema.parse(e);
    for (const c of CLASS_SPECS) ClassSpecSchema.parse(c);
    for (const b of META_BUILDS) MetaBuildSchema.parse(b);
    for (const t of TIMER_EVENTS) TimerEventSchema.parse(t);

    expect(WEAPONS.length).toBeGreaterThanOrEqual(140);
    expect(ARMOR_SETS.length).toBeGreaterThanOrEqual(160);
    expect(MODS.length).toBeGreaterThanOrEqual(1400);
    expect(DEVIATIONS.length).toBeGreaterThanOrEqual(90);
    expect(MAP_SCENARIOS).toHaveLength(3);
    expect(NALCOTT_POIS.length).toBeGreaterThanOrEqual(5000);
    expect(ALL_MAP_MARKERS.length).toBeGreaterThanOrEqual(5000);
    expect(MAP_CATEGORIES.length).toBeGreaterThanOrEqual(30);
    expect(MAP_DROP_TABLES['car-trunk']?.some((d) => d.item === 'Portable Mixed Fuel')).toBe(true);
    expect(MAP_RESOURCE_AREAS.length).toBeGreaterThanOrEqual(5);
    expect(MAP_REGIONS.length).toBeGreaterThanOrEqual(9);
    expect(BUILT_IN_FILTER_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(DEVIATION_MAP_SPAWNS).length).toBeGreaterThanOrEqual(50);
    expect(
      DEVIATIONS.every((d) => d.dropSource && !d.dropSource.includes('(oncehumandb.com)')),
    ).toBe(true);
    const deviationPins = ALL_MAP_MARKERS.filter((m) => m.typeKey === 'deviation-spawn');
    expect(deviationPins.length).toBeGreaterThanOrEqual(100);
    expect(deviationPins.every((m) => Boolean(m.imageUrl))).toBe(true);
    expect(
      fs.existsSync(path.resolve(process.cwd(), 'public', 'maps', 'nalcott', 'overview-1024.webp')),
    ).toBe(true);

    const meters = calculatePolylineMeters([
      [-300, 300],
      [-300, 310],
    ]);
    expect(meters).toBe(250);

    for (const item of [...WEAPONS, ...ARMOR_SETS, ...MODS, ...DEVIATIONS]) {
      const rel = item.imageUrl.replace(/^\.\//, '');
      const absPath = path.resolve(process.cwd(), 'public', rel);
      expect(fs.existsSync(absPath), `Missing image for ${item.id}: ${absPath}`).toBe(true);
    }

    const materialMap = materialImages as Record<string, string>;
    for (const h of HIDES_AND_WOOLS) {
      expect(materialMap[h.name], `Missing hide image entry: ${h.name}`).toBeTruthy();
    }
    for (const gf of GENE_FABRICS.filter((g) => g.id !== 'none')) {
      expect(materialMap[gf.name], `Missing gene fabric image entry: ${gf.name}`).toBeTruthy();
    }
    for (const [matName, relUrl] of Object.entries(materialMap)) {
      const absPath = path.resolve(process.cwd(), 'public', relUrl.replace(/^\.\//, ''));
      expect(fs.existsSync(absPath), `Missing material PNG for ${matName}: ${absPath}`).toBe(true);
    }

    const validModSlots = new Set(['Weapon', 'Helmet', 'Mask', 'Top', 'Bottom', 'Gloves', 'Shoes']);
    for (const mod of MODS) {
      expect(validModSlots.has(mod.slot)).toBe(true);
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

describe('Gear Workbench tier recipes & star scaling', () => {
  it('computes exact Tier V Savior Top 6-star stats and materials', () => {
    const saviorTop = ARMOR_SETS.find((a) => a.id === 'savior-top')!;
    const craft = computeArmorCraft(saviorTop, 5, 6, 'golden_wool', 'extreme_gene_fabric');

    expect(craft.baseHp).toBe(1924);
    expect(craft.bonusHp).toBe(481);
    expect(craft.basePsiIntensity).toBe(64);
    expect(craft.bonusPsiIntensity).toBe(16);
    expect(craft.elCost).toBe(2100);
    expect(craft.workbench).toBe('Advanced Armor Workbench');
    expect(craft.materials).toEqual(
      expect.arrayContaining([
        { name: 'Stardust Source', qty: 35, kind: 'base' },
        { name: 'Tungsten Ingot', qty: 23, kind: 'base' },
        { name: 'Fiber', qty: 60, kind: 'base' },
        { name: 'Protective Lining V', qty: 1, kind: 'base' },
        { name: 'Golden Wool', qty: 4, kind: 'hide' },
        { name: 'Extreme Gene Fabric', qty: 1, kind: 'gene_fabric' },
      ]),
    );
  });

  it('aggregates Craft Queue totals cleanly across weapons and armor', () => {
    const saviorTop = ARMOR_SETS.find((a) => a.id === 'savior-top')!;
    const weapon = WEAPONS.find((w) => w.category === 'Assault Rifle')!;
    const ac = computeArmorCraft(saviorTop, 5, 6, 'golden_wool', 'none');
    const wc = computeWeaponCraft(weapon, 5, 5);

    const totals = aggregateCraftQueue([
      {
        queueId: 'q1',
        kind: 'armor',
        itemId: saviorTop.id,
        name: saviorTop.name,
        rarity: saviorTop.rarity,
        slotOrCategory: saviorTop.slot,
        imageUrl: saviorTop.imageUrl,
        tier: 5,
        stars: 6,
        elCost: ac.elCost,
        materials: ac.materials,
        workbench: ac.workbench,
      },
      {
        queueId: 'q2',
        kind: 'weapon',
        itemId: weapon.id,
        name: weapon.name,
        rarity: weapon.rarity,
        slotOrCategory: weapon.category,
        imageUrl: weapon.imageUrl,
        tier: 5,
        stars: 5,
        elCost: wc.elCost,
        materials: wc.materials,
        workbench: wc.workbench,
      },
    ]);

    expect(totals.totalEl).toBe(ac.elCost + wc.elCost);
    expect(totals.grouped.stardust[0].qty).toBeGreaterThan(100);
  });
});

describe('Loadout Builder & Multiplicative DPS Engine', () => {
  it('aggregates full 9-slot gear, sets, wools, mods, deviation, cradle, and food cleanly', () => {
    const [lastValor, abyssFrost, brahminyBounce] = getStarterLoadouts();

    const lvStats = aggregateLoadoutStats(lastValor);
    expect(lvStats.maxHp).toBeGreaterThan(12000);
    expect(lvStats.psiIntensity).toBeGreaterThan(200);
    expect(lvStats.activeSets.some((s) => s.setName === 'Lonewolf Set' && s.count === 4)).toBe(true);
    expect(lvStats.activeKeyArmors.some((k) => k.name === 'Beret')).toBe(true);
    expect(lvStats.statDetails.critRatePct.sources.length).toBeGreaterThanOrEqual(4);

    const lvDps = calculateFullLoadoutDps(lastValor, lvStats);
    expect(lvDps.burstDps).toBeGreaterThan(lvDps.sustainedDps);
    expect(lvDps.weakspotCritHit).toBeGreaterThan(lvDps.critHit);
    expect(lvDps.critHit).toBeGreaterThan(lvDps.normalHit);
    expect(lvDps.formula.keywordKind).toBe('physical');

    const frostStats = aggregateLoadoutStats(abyssFrost);
    const frostDps = calculateFullLoadoutDps(abyssFrost, frostStats);
    expect(frostDps.formula.keywordKind).toBe('elemental');
    expect(frostDps.elementalSharePct).toBeGreaterThan(10);

    // Conditional Treacherous Tides scales Weapon/Status DMG higher at low HP than 100% HP
    const lowHpBounce = { ...brahminyBounce, hpPct: 50 };
    const fullHpBounce = { ...brahminyBounce, hpPct: 100 };
    const lowStats = aggregateLoadoutStats(lowHpBounce);
    const fullStats = aggregateLoadoutStats(fullHpBounce);
    expect(lowStats.totals.weaponDmgPct).toBeGreaterThan(fullStats.totals.weaponDmgPct);
  });
});

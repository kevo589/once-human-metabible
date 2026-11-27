import type { ArmorSet, ModItem, Weapon } from '../../types/game';
import {
  computeArmorCraft,
  computeWeaponCraft,
  GENE_FABRICS,
  HIDES_AND_WOOLS,
  normalizeArmorSlotKey,
  type ArmorSlotKey,
  type CraftTier,
  type HideOrWoolDef,
} from '../../utils/craftingEngine';
import { DEVIATIONS } from '../deviationsAndChef';
import { ARMOR_SETS, MODS } from '../gearAndMods';
import { WEAPONS } from '../weapons';
import rawDpsData from './dpsData.json';

export type SubstatRarity = 'common' | 'fine' | 'epic' | 'legendary';
export type TargetType = 'normal' | 'elite' | 'great_one';
export type ActiveWeaponSlotKey = 'primary' | 'secondary';
export type EquipSlotId =
  | 'primary'
  | 'secondary'
  | 'melee'
  | 'helmet'
  | 'mask'
  | 'gloves'
  | 'shoes'
  | 'top'
  | 'bottoms';

export type StatKey =
  | 'attackPct'
  | 'flatAttack'
  | 'psiIntensity'
  | 'maxHpPct'
  | 'flatHp'
  | 'pollutionResist'
  | 'critRatePct'
  | 'critDmgPct'
  | 'weakspotDmgPct'
  | 'weakspotCritDmgPct'
  | 'weaponDmgPct'
  | 'statusDmgPct'
  | 'elementalDmgPct'
  | 'keywordDmgPct'
  | 'bounceDmgPct'
  | 'bounceCritDmgPct'
  | 'bounceExtraCount'
  | 'shrapnelDmgPct'
  | 'dmgVsNormalPct'
  | 'dmgVsElitesPct'
  | 'dmgVsGreatOnesPct'
  | 'weakspotVsMarkedPct'
  | 'vulnerabilityPct'
  | 'fireRatePct'
  | 'magCapPct'
  | 'reloadSpeedPct';

export interface SubstatEntry {
  stat: StatKey;
  rarity: SubstatRarity;
  overrideValue?: number;
}

export interface WeaponSlotConfig {
  weaponId: string;
  tier: CraftTier;
  stars: number;
  calibration: number; // 0-10
  calibrationStyleId: string;
  secondaryAttr1: string;
  secondaryAttr2: string;
  ammoId: string;
  opticId: string;
  muzzleId: string;
  tacticalId: string;
  magId: string;
  modId: string;
  substats: SubstatEntry[];
}

export interface ArmorSlotConfig {
  armorId: string;
  tier: CraftTier;
  stars: number;
  calibration: number; // 0-10
  hideId: string;
  geneFabricId: string;
  modId: string;
  substats: SubstatEntry[];
}

export interface CombatAssumptions {
  targetType: TargetType;
  weakspotHitRatePct: number;
  bullsEye: boolean;
  marked: boolean;
  fortressWarfare: boolean;
  shielded: boolean;
}

export interface LoadoutConfig {
  id: string;
  name: string;
  hpPct: number;
  sanityPct: number;
  activeWeaponSlot: ActiveWeaponSlotKey;
  primary: WeaponSlotConfig;
  secondary: WeaponSlotConfig;
  melee: WeaponSlotConfig;
  armor: Record<ArmorSlotKey, ArmorSlotConfig>;
  deviationId: string;
  deviationSkillRating: number;
  deviationActivityRating: number;
  cradleIds: string[];
  foodId: string;
  drinkId: string;
  whimId: string;
  assumptions: CombatAssumptions;
}

export interface StatSourceContribution {
  source: string;
  value: number;
  note?: string;
}

export interface StatEntry {
  key: StatKey;
  label: string;
  value: number;
  unit: '%' | '' | 'count';
  sources: StatSourceContribution[];
}

export interface ActiveSetSummary {
  setName: string;
  count: number;
  activeTiers: Array<{ count: number; desc: string; active: boolean }>;
}

export interface AggregatedStats {
  weaponAttack: number;
  fireRateRpm: number;
  magCapacity: number;
  reloadSeconds: number;
  baseCharAttack: number;
  psiIntensity: number;
  maxHp: number;
  currentHp: number;
  pollutionResist: number;
  gearScoreTotal: number;
  totals: Record<StatKey, number>;
  statDetails: Record<StatKey, StatEntry>;
  activeSets: ActiveSetSummary[];
  activeKeyArmors: Array<{ name: string; desc: string }>;
  activeWeapon: Weapon;
  activeWeaponSlotCfg: WeaponSlotConfig;
  secondaryWeapon: Weapon;
  meleeWeapon: Weapon;
  deviationCompanionDps: number;
  weaponAmmoMult: number;
  weaponCalibMult: number;
  weaponTierBaseAtk: number;
}

export interface DpsFormulaBreakdown {
  weaponTierStarAtk: number;
  calibrationMult: number;
  ammoMult: number;
  attackPctMult: number;
  effectiveAtk: number;
  motionValuePct: number;
  pellets: number;
  weaponDmgBucket: number;
  critRateClampedPct: number;
  weakspotRateClampedPct: number;
  normalHitMult: number;
  critHitMult: number;
  weakspotHitMult: number;
  weakspotCritHitMult: number;
  expectedCritWeakspotMult: number;
  enemyTypeLabel: string;
  enemyTypeBucket: number;
  vulnerabilityBucket: number;
  keywordKind: 'physical' | 'elemental' | 'none';
  keywordName: string;
  keywordScalingLabel: string;
  keywordProcChancePct: number;
  keywordDmgBucket: number;
  magDumpSeconds: number;
  effectiveReloadSeconds: number;
  cycleSeconds: number;
}

export interface FullDpsResult {
  burstDps: number;
  sustainedDps: number;
  weaponOnlySustainedDps: number;
  keywordProcDps: number;
  deviationDps: number;
  normalHit: number;
  critHit: number;
  weakspotHit: number;
  weakspotCritHit: number;
  avgBulletHit: number;
  avgKeywordProcPerShot: number;
  magazineTotalDamage: number;
  shotsPerSecond: number;
  elementalSharePct: number;
  formula: DpsFormulaBreakdown;
}

// Type-safe access to dpsData.json
export const DPS_DATA = rawDpsData as {
  baseCharacter: {
    level: number;
    baseAttack: number;
    baseHp: number;
    basePsiIntensity: number;
    basePollutionResist: number;
    baseCritRatePct: number;
    baseCritDmgPct: number;
    baseWeakspotDmgPct: number;
  };
  calibrationStyles: Array<{
    id: string;
    name: string;
    attackPct: number;
    fireRatePct: number;
    magCapPct: number;
    reloadSpeedPct: number;
    critRatePct: number;
    critDmgPct: number;
    weakspotDmgPct: number;
    notes: string;
  }>;
  calibrationSecondaryAttrs: Array<{ id: string; label: string; stat: string; value: number }>;
  ammoTypes: Array<{
    id: string;
    name: string;
    dmgMult: number;
    weakspotBonusPct: number;
    notes: string;
  }>;
  weaponAccessories: {
    optics: Array<{ id: string; name: string; critRatePct: number; weakspotDmgPct: number; critDmgPct: number }>;
    muzzles: Array<{ id: string; name: string; weaponDmgPct: number; critDmgPct: number; weakspotDmgPct: number }>;
    tacticals: Array<{ id: string; name: string; critRatePct: number; weakspotDmgPct: number; reloadSpeedPct: number }>;
    magazines: Array<{ id: string; name: string; magCapPct: number; reloadSpeedPct: number }>;
  };
  substatTypes: Array<{
    id: StatKey;
    label: string;
    values: Record<SubstatRarity, number>;
  }>;
  modSuffixBonuses: Record<string, Partial<Record<StatKey, number>> & { condition?: string }>;
  armorSetEffects: Record<
    string,
    Record<string, Partial<Record<StatKey, number>> & { condition?: string; desc: string }>
  >;
  keyArmorEffects: Record<string, Partial<Record<StatKey, number>> & { desc: string }>;
  combatDeviations: Array<{
    id: string;
    name: string;
    element: string;
    role: string;
    baseBonuses: Partial<Record<StatKey, number>>;
    companionBaseDps: number;
    summary: string;
  }>;
  cradleOverrides: Array<{
    id: string;
    name: string;
    category: string;
    effects: Partial<Record<StatKey, number>>;
    desc: string;
  }>;
  consumables: {
    foods: Array<{ id: string; name: string; effects: Partial<Record<StatKey, number>>; desc: string }>;
    drinks: Array<{ id: string; name: string; effects: Partial<Record<StatKey, number>>; desc: string }>;
    whims: Array<{ id: string; name: string; effects: Partial<Record<StatKey, number>>; desc: string }>;
  };
  starterLoadouts: LoadoutConfig[];
};

const WEAPON_BY_ID = new Map(WEAPONS.map((w) => [w.id, w]));
const ARMOR_BY_ID = new Map(ARMOR_SETS.map((a) => [a.id, a]));
const MOD_BY_ID = new Map(MODS.map((m) => [m.id, m]));
const HIDE_BY_ID = new Map(HIDES_AND_WOOLS.map((h) => [h.id, h]));
const GENE_BY_ID = new Map(GENE_FABRICS.map((g) => [g.id, g]));

export const STAT_DEFINITIONS: Array<{ key: StatKey; label: string; unit: '%' | '' | 'count' }> = [
  { key: 'flatAttack', label: 'Flat Attack Bonus', unit: '' },
  { key: 'attackPct', label: 'Attack % Bonus', unit: '%' },
  { key: 'critRatePct', label: 'Crit Rate', unit: '%' },
  { key: 'critDmgPct', label: 'Crit DMG', unit: '%' },
  { key: 'weakspotDmgPct', label: 'Weakspot DMG', unit: '%' },
  { key: 'weakspotCritDmgPct', label: 'Weakspot Crit DMG Bonus', unit: '%' },
  { key: 'weaponDmgPct', label: 'Weapon DMG Bonus', unit: '%' },
  { key: 'statusDmgPct', label: 'Status DMG Bonus', unit: '%' },
  { key: 'elementalDmgPct', label: 'Elemental DMG Bonus', unit: '%' },
  { key: 'keywordDmgPct', label: 'Keyword DMG Bonus', unit: '%' },
  { key: 'bounceDmgPct', label: 'Bounce DMG Bonus', unit: '%' },
  { key: 'bounceCritDmgPct', label: 'Bounce Crit DMG Bonus', unit: '%' },
  { key: 'bounceExtraCount', label: 'Extra Bounce Targets', unit: 'count' },
  { key: 'shrapnelDmgPct', label: 'Shrapnel DMG Bonus', unit: '%' },
  { key: 'dmgVsNormalPct', label: 'DMG Bonus vs Normal', unit: '%' },
  { key: 'dmgVsElitesPct', label: 'DMG Bonus vs Elites', unit: '%' },
  { key: 'dmgVsGreatOnesPct', label: 'DMG Bonus vs Great Ones', unit: '%' },
  { key: 'weakspotVsMarkedPct', label: 'Weakspot DMG vs Marked', unit: '%' },
  { key: 'vulnerabilityPct', label: 'Target Vulnerability Debuff', unit: '%' },
  { key: 'fireRatePct', label: 'Fire Rate Bonus', unit: '%' },
  { key: 'magCapPct', label: 'Mag Capacity Bonus', unit: '%' },
  { key: 'reloadSpeedPct', label: 'Reload Speed Bonus', unit: '%' },
  { key: 'psiIntensity', label: 'Psi Intensity Bonus', unit: '' },
  { key: 'maxHpPct', label: 'Max HP % Bonus', unit: '%' },
  { key: 'flatHp', label: 'Flat HP Bonus', unit: '' },
  { key: 'pollutionResist', label: 'Pollution Resist Bonus', unit: '' },
];

export function cloneLoadout(cfg: LoadoutConfig): LoadoutConfig {
  return JSON.parse(JSON.stringify(cfg)) as LoadoutConfig;
}

export function getStarterLoadouts(): LoadoutConfig[] {
  return DPS_DATA.starterLoadouts.map(cloneLoadout);
}

export function createLoadoutFromWeaponId(weaponId: string, buildName?: string): LoadoutConfig {
  const base = cloneLoadout(DPS_DATA.starterLoadouts[0]);
  const weapon = WEAPON_BY_ID.get(weaponId) ?? WEAPONS[0];
  const isElemental =
    weapon.archetype === 'Frost Vortex' ||
    weapon.archetype === 'Power Surge' ||
    weapon.archetype === 'Burn';

  if (isElemental) {
    const frostStarter = cloneLoadout(DPS_DATA.starterLoadouts[1]);
    frostStarter.id = `loadout-${Date.now()}`;
    frostStarter.name = buildName || `${weapon.name} Loadout`;
    frostStarter.primary.weaponId = weapon.id;
    frostStarter.primary.ammoId =
      weapon.category === 'Crossbow' ? 'arrow_tungsten' : 'tungsten';
    if (weapon.archetype === 'Power Surge') {
      frostStarter.armor.helmet.armorId = 'mayfly-goggles';
      frostStarter.deviationId = 'mini-feaster';
      frostStarter.cradleIds = ['status-enhancement', 'shock-resonance', 'deviation-master', 'bounty-hunter'];
    } else if (weapon.archetype === 'Burn') {
      frostStarter.armor.helmet.armorId = 'gas-tight-helmet';
      frostStarter.deviationId = 'pyro-dino';
      frostStarter.cradleIds = ['status-enhancement', 'blaze-overdrive', 'deviation-master', 'bounty-hunter'];
    }
    return frostStarter;
  }

  if (weapon.archetype === 'Bounce') {
    const bounceStarter = cloneLoadout(DPS_DATA.starterLoadouts[2]);
    bounceStarter.id = `loadout-${Date.now()}`;
    bounceStarter.name = buildName || `${weapon.name} Loadout`;
    bounceStarter.primary.weaponId = weapon.id;
    return bounceStarter;
  }

  base.id = `loadout-${Date.now()}`;
  base.name = buildName || `${weapon.name} Loadout`;
  base.primary.weaponId = weapon.id;
  base.primary.ammoId = weapon.category === 'Crossbow' ? 'arrow_tungsten' : 'tungsten_ap';
  if (weapon.archetype === 'Unstable Bomber') {
    base.armor.top.armorId = 'shaman-vulture-top';
    base.armor.helmet.armorId = 'lonewolf-hat';
  }
  return base;
}

const RARITY_RATING_BASE: Record<string, number> = {
  Legendary: 540,
  Epic: 450,
  Rare: 360,
  Common: 280,
};

export function computeWeaponRating(slot: WeaponSlotConfig, weapon: Weapon): number {
  const base = RARITY_RATING_BASE[weapon.rarity] ?? 360;
  const tierScore = slot.tier * 145;
  const starScore = (slot.stars - 1) * 48;
  const calScore = slot.calibration * 22;
  const modScore = slot.modId ? 105 : 0;
  return Math.round(base + tierScore + starScore + calScore + modScore);
}

export function computeArmorRating(slot: ArmorSlotConfig, armor: ArmorSet): number {
  const base = RARITY_RATING_BASE[armor.rarity] ?? 360;
  const tierScore = slot.tier * 118;
  const starScore = (slot.stars - 1) * 42;
  const calScore = slot.calibration * 18;
  const modScore = slot.modId ? 95 : 0;
  return Math.round(base + tierScore + starScore + calScore + modScore);
}

export function previewArmorSlotStats(slot: ArmorSlotConfig, armor: ArmorSet) {
  const craft = computeArmorCraft(
    armor,
    slot.tier,
    slot.stars,
    slot.hideId,
    slot.geneFabricId,
  );
  const calMult = 1 + slot.calibration * 0.03;
  const totalHp = Math.round((craft.baseHp + craft.bonusHp) * calMult);
  const totalPsi = Math.round((craft.basePsiIntensity + craft.bonusPsiIntensity) * calMult);
  const totalPoll = craft.basePollutionResist;
  return { totalHp, totalPsi, totalPoll, craft };
}

export function previewWeaponSlotStats(slot: WeaponSlotConfig, weapon: Weapon) {
  const craft = computeWeaponCraft(weapon, slot.tier, slot.stars);
  const calMult = 1 + slot.calibration * 0.035;
  const ammo = DPS_DATA.ammoTypes.find((a) => a.id === slot.ammoId) ?? DPS_DATA.ammoTypes[1];
  const style =
    DPS_DATA.calibrationStyles.find((s) => s.id === slot.calibrationStyleId) ??
    DPS_DATA.calibrationStyles[0];
  const tierStarAtk = craft.baseDamage + craft.bonusDamage;
  const atkAfterCalAmmo = Math.round(
    tierStarAtk * calMult * ammo.dmgMult * (1 + style.attackPct / 100),
  );
  const fireRate = Math.round(weapon.fireRateRpm * (1 + style.fireRatePct / 100));
  const magCap = Math.max(1, Math.round(weapon.magSize * (1 + style.magCapPct / 100)));
  return { tierStarAtk, atkAfterCalAmmo, fireRate, magCap, calMult, ammo, style };
}

/** Extracts stat bonuses from any mod's primaryEffect text + variant suffix. */
export function parseModEffects(mod: ModItem | undefined): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  if (!mod) return out;

  const text = mod.primaryEffect || '';
  const add = (k: StatKey, val: number) => {
    out[k] = (out[k] ?? 0) + val;
  };

  // Match patterns like "Crit DMG +25%", "+12% Weapon DMG", "Status DMG +10% ... stack up to 3 times"
  const stacksMatch = text.match(/up to\s+(\d+)\s*times|(\d+)\s*stacks/i);
  const stacks = stacksMatch ? Math.min(5, Math.max(1, Number(stacksMatch[1] || stacksMatch[2]))) : 1;

  const patterns: Array<[RegExp, StatKey]> = [
    [/Crit Rate\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Crit Rate/i, 'critRatePct'],
    [/Crit DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Crit DMG/i, 'critDmgPct'],
    [/Weakspot DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Weakspot DMG/i, 'weakspotDmgPct'],
    [/Weapon DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Weapon DMG/i, 'weaponDmgPct'],
    [/Status DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Status DMG/i, 'statusDmgPct'],
    [/Elemental DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Elemental DMG/i, 'elementalDmgPct'],
    [/(?:Frost|Blaze|Shock|Burn|Power Surge|Frost Vortex)\s*DMG\s*\+?(\d+(?:\.\d+)?)%/i, 'elementalDmgPct'],
    [/Bounce DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Bounce DMG/i, 'bounceDmgPct'],
    [/Shrapnel DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Shrapnel DMG/i, 'shrapnelDmgPct'],
    [/Unstable Bomber DMG\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*Unstable Bomber DMG/i, 'keywordDmgPct'],
    [/Magazine Capacity\s*\+?(\d+(?:\.\d+)?)%|Mag Capacity\s*\+?(\d+(?:\.\d+)?)%/i, 'magCapPct'],
    [/Reload (?:Speed|Efficiency)\s*\+?(\d+(?:\.\d+)?)%/i, 'reloadSpeedPct'],
    [/Fire Rate\s*\+?(\d+(?:\.\d+)?)%/i, 'fireRatePct'],
    [/Psi Intensity\s*\+?(\d+(?:\.\d+)?)%?/i, 'psiIntensity'],
    [/Max HP\s*\+?(\d+(?:\.\d+)?)%/i, 'maxHpPct'],
  ];

  let matchedAny = false;
  for (const [rx, key] of patterns) {
    const m = text.match(rx);
    if (m) {
      const raw = Number(m[1] || m[2] || 0);
      if (raw > 0) {
        const effective = stacks > 1 && text.toLowerCase().includes('stack') ? Math.min(45, raw * stacks) : raw;
        add(key, effective);
        matchedAny = true;
      }
    }
  }

  // Meaningful baseline if a utility/trigger mod didn't have numeric % in primaryEffect
  if (!matchedAny) {
    if (mod.slot === 'Weapon') add('weaponDmgPct', 10);
    else if (mod.slot === 'Mask') add('keywordDmgPct', 12);
    else if (mod.slot === 'Gloves') add('critDmgPct', 10);
    else add('weaponDmgPct', 6);
  }

  // Variant suffix bonus
  const variant = mod.variant || '';
  for (const [suffix, bonus] of Object.entries(DPS_DATA.modSuffixBonuses)) {
    if (variant.includes(suffix)) {
      for (const [k, v] of Object.entries(bonus)) {
        if (k !== 'condition' && typeof v === 'number') {
          add(k as StatKey, v);
        }
      }
    }
  }

  return out;
}

/** Extracts combat/survival stats from Hide/Wool slot-specific effects. */
export function parseHideEffects(
  hide: HideOrWoolDef,
  slotKey: ArmorSlotKey,
  hpPct: number,
): Partial<Record<StatKey, number>> {
  const text = hide.effects[slotKey] || '';
  const out: Partial<Record<StatKey, number>> = {};
  const lowHpDoubles = text.toLowerCase().includes('hp < 30%') && hpPct < 30;
  const mult = lowHpDoubles ? 2 : 1;

  const extract = (rx: RegExp, key: StatKey) => {
    const m = text.match(rx);
    if (m) out[key] = (out[key] ?? 0) + Number(m[1]) * mult;
  };

  extract(/Max HP\s*\+(\d+)/i, 'flatHp');
  extract(/Pollution Resist\s*\+(\d+)/i, 'pollutionResist');
  extract(/Weakspot DMG\s*\+(\d+)%/i, 'weakspotDmgPct');
  extract(/Crit DMG\s*\+(\d+)%/i, 'critDmgPct');
  extract(/Weapon DMG\s*\+(\d+)%/i, 'weaponDmgPct');
  extract(/(?:Status DMG|Frost|Blaze|Shock|Elemental)\s*(?:Elemental\s*)?DMG\s*\+(\d+)%/i, 'elementalDmgPct');
  extract(/Reload Speed\s*\+(\d+)%/i, 'reloadSpeedPct');
  return out;
}

export function getSubstatValue(entry: SubstatEntry): number {
  if (typeof entry.overrideValue === 'number' && !Number.isNaN(entry.overrideValue)) {
    return entry.overrideValue;
  }
  const def = DPS_DATA.substatTypes.find((s) => s.id === entry.stat);
  return def ? def.values[entry.rarity] : 0;
}

export function aggregateLoadoutStats(loadout: LoadoutConfig): AggregatedStats {
  const totals = {} as Record<StatKey, number>;
  const statDetails = {} as Record<StatKey, StatEntry>;

  for (const def of STAT_DEFINITIONS) {
    totals[def.key] = 0;
    statDetails[def.key] = {
      key: def.key,
      label: def.label,
      value: 0,
      unit: def.unit,
      sources: [],
    };
  }

  const addStat = (key: StatKey, value: number, source: string, note?: string) => {
    if (!value) return;
    totals[key] = Number((totals[key] + value).toFixed(2));
    statDetails[key].value = totals[key];
    statDetails[key].sources.push({ source, value: Number(value.toFixed(2)), note });
  };

  const applyMap = (map: Partial<Record<StatKey, number>>, source: string, note?: string) => {
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === 'number' && v !== 0 && k in totals) {
        addStat(k as StatKey, v, source, note);
      }
    }
  };

  // 1. Base Lv.50 Character
  const baseChar = DPS_DATA.baseCharacter;
  addStat('critRatePct', baseChar.baseCritRatePct, 'Character Base (Lv.50)');
  addStat('critDmgPct', baseChar.baseCritDmgPct, 'Character Base (Lv.50)');
  addStat('weakspotDmgPct', baseChar.baseWeakspotDmgPct, 'Character Base (Lv.50)');

  // 2. Equip Weapons & Active Weapon
  const primaryWeapon = WEAPON_BY_ID.get(loadout.primary.weaponId) ?? WEAPONS[0];
  const secondaryWeapon = WEAPON_BY_ID.get(loadout.secondary.weaponId) ?? WEAPONS[1] ?? WEAPONS[0];
  const meleeWeapon =
    WEAPON_BY_ID.get(loadout.melee.weaponId) ??
    WEAPONS.find((w) => w.category === 'Melee') ??
    WEAPONS[0];

  const activeWeaponSlotCfg =
    loadout.activeWeaponSlot === 'secondary' ? loadout.secondary : loadout.primary;
  const activeWeapon =
    loadout.activeWeaponSlot === 'secondary' ? secondaryWeapon : primaryWeapon;

  let gearScoreTotal =
    computeWeaponRating(loadout.primary, primaryWeapon) +
    computeWeaponRating(loadout.secondary, secondaryWeapon) +
    computeWeaponRating(loadout.melee, meleeWeapon);

  // Active Weapon Base Stats + Calibration + Ammo + Accessories + Mod + Substats
  const wPreview = previewWeaponSlotStats(activeWeaponSlotCfg, activeWeapon);
  addStat('critRatePct', Number((activeWeapon.critRate * 100).toFixed(1)), activeWeapon.name);
  addStat('critDmgPct', Number((activeWeapon.critDamage * 100).toFixed(1)), activeWeapon.name);
  addStat(
    'weakspotDmgPct',
    Number((activeWeapon.weakspotDamage * 100).toFixed(1)),
    activeWeapon.name,
  );
  if (activeWeapon.elementBonus > 0) {
    addStat(
      'elementalDmgPct',
      Number((activeWeapon.elementBonus * 100).toFixed(1)),
      `${activeWeapon.name} Intrinsic`,
    );
  }

  // Calibration style
  const style = wPreview.style;
  if (style.id !== 'none') {
    addStat('attackPct', style.attackPct, `Calibration (${style.name})`);
    addStat('fireRatePct', style.fireRatePct, `Calibration (${style.name})`);
    addStat('magCapPct', style.magCapPct, `Calibration (${style.name})`);
    addStat('reloadSpeedPct', style.reloadSpeedPct, `Calibration (${style.name})`);
    addStat('critRatePct', style.critRatePct, `Calibration (${style.name})`);
    addStat('critDmgPct', style.critDmgPct, `Calibration (${style.name})`);
    addStat('weakspotDmgPct', style.weakspotDmgPct, `Calibration (${style.name})`);
  }

  // Calibration secondary attributes
  for (const attrId of [activeWeaponSlotCfg.secondaryAttr1, activeWeaponSlotCfg.secondaryAttr2]) {
    const attr = DPS_DATA.calibrationSecondaryAttrs.find((a) => a.id === attrId);
    if (attr && attr.stat !== 'none' && attr.stat in totals) {
      addStat(attr.stat as StatKey, attr.value, `Calib Attr (${attr.label})`);
    }
  }

  if (wPreview.ammo.weakspotBonusPct) {
    addStat('weakspotDmgPct', wPreview.ammo.weakspotBonusPct, wPreview.ammo.name);
  }

  // Weapon Accessories
  const optic = DPS_DATA.weaponAccessories.optics.find((o) => o.id === activeWeaponSlotCfg.opticId);
  if (optic && optic.id !== 'none') {
    addStat('critRatePct', optic.critRatePct, optic.name);
    addStat('weakspotDmgPct', optic.weakspotDmgPct, optic.name);
    addStat('critDmgPct', optic.critDmgPct, optic.name);
  }
  const muzzle = DPS_DATA.weaponAccessories.muzzles.find((m) => m.id === activeWeaponSlotCfg.muzzleId);
  if (muzzle && muzzle.id !== 'none') {
    addStat('weaponDmgPct', muzzle.weaponDmgPct, muzzle.name);
    addStat('critDmgPct', muzzle.critDmgPct, muzzle.name);
    addStat('weakspotDmgPct', muzzle.weakspotDmgPct, muzzle.name);
  }
  const tactical = DPS_DATA.weaponAccessories.tacticals.find(
    (t) => t.id === activeWeaponSlotCfg.tacticalId,
  );
  if (tactical && tactical.id !== 'none') {
    addStat('critRatePct', tactical.critRatePct, tactical.name);
    addStat('weakspotDmgPct', tactical.weakspotDmgPct, tactical.name);
    addStat('reloadSpeedPct', tactical.reloadSpeedPct, tactical.name);
  }
  const mag = DPS_DATA.weaponAccessories.magazines.find((m) => m.id === activeWeaponSlotCfg.magId);
  if (mag && mag.id !== 'none') {
    addStat('magCapPct', mag.magCapPct, mag.name);
    addStat('reloadSpeedPct', mag.reloadSpeedPct, mag.name);
  }

  // Active Weapon Mod + Substats
  const activeWeaponMod = MOD_BY_ID.get(activeWeaponSlotCfg.modId);
  if (activeWeaponMod) {
    applyMap(parseModEffects(activeWeaponMod), `Weapon Mod (${activeWeaponMod.name})`);
  }
  for (const sub of activeWeaponSlotCfg.substats) {
    const val = getSubstatValue(sub);
    addStat(sub.stat, val, `Weapon Mod Substat (${sub.rarity})`);
  }

  // Melee passive / substats
  if (loadout.melee.modId) {
    const meleeMod = MOD_BY_ID.get(loadout.melee.modId);
    if (meleeMod) applyMap(parseModEffects(meleeMod), `Melee Mod (${meleeMod.name})`);
  }

  // 3. All 6 Armor Pieces + Hides/Wools + Gene Fabrics + Armor Mods + Set Bonuses
  let armorHpTotal = 0;
  let armorPsiTotal = 0;
  let armorPollTotal = 0;
  const setCounts = new Map<string, number>();
  const activeKeyArmors: Array<{ name: string; desc: string }> = [];

  const slotEntries = Object.entries(loadout.armor) as Array<[ArmorSlotKey, ArmorSlotConfig]>;
  for (const [slotKey, cfg] of slotEntries) {
    const armor = ARMOR_BY_ID.get(cfg.armorId);
    if (!armor) continue;

    gearScoreTotal += computeArmorRating(cfg, armor);
    const preview = previewArmorSlotStats(cfg, armor);
    armorHpTotal += preview.totalHp;
    armorPsiTotal += preview.totalPsi;
    armorPollTotal += preview.totalPoll;

    addStat('flatHp', preview.totalHp, `${armor.name} (T${cfg.tier} · ${cfg.stars}★ +${cfg.calibration})`);
    addStat('psiIntensity', preview.totalPsi, `${armor.name} (T${cfg.tier} · ${cfg.stars}★ +${cfg.calibration})`);
    addStat('pollutionResist', preview.totalPoll, armor.name);

    // Hide / Wool perk
    const hide = HIDE_BY_ID.get(cfg.hideId);
    if (hide) {
      applyMap(parseHideEffects(hide, slotKey, loadout.hpPct), `${hide.name} (${armor.slot})`);
    }

    // Tier V Gene Fabric
    if (cfg.tier === 5 && cfg.geneFabricId && cfg.geneFabricId !== 'none') {
      const gf = GENE_BY_ID.get(cfg.geneFabricId);
      if (gf && gf.id === 'fortress_gene_fabric') {
        addStat('maxHpPct', 4, gf.name);
      }
    }

    // Armor Mod + Substats
    const mod = MOD_BY_ID.get(cfg.modId);
    if (mod) {
      applyMap(parseModEffects(mod), `${armor.slot} Mod (${mod.name})`);
    }
    for (const sub of cfg.substats) {
      const val = getSubstatValue(sub);
      addStat(sub.stat, val, `${armor.slot} Mod Substat (${sub.rarity})`);
    }

    // Set tracking
    if (armor.setName) {
      setCounts.set(armor.setName, (setCounts.get(armor.setName) ?? 0) + 1);
    }

    // Key Armor Effect
    const keyEff = DPS_DATA.keyArmorEffects[armor.id];
    if (keyEff) {
      const { desc, ...bonuses } = keyEff;
      applyMap(bonuses as Partial<Record<StatKey, number>>, `Key Armor (${armor.name})`);
      activeKeyArmors.push({ name: armor.name, desc });
    }
  }

  // Evaluate Set Bonuses
  const activeSets: ActiveSetSummary[] = [];
  for (const [setName, count] of setCounts.entries()) {
    const def = DPS_DATA.armorSetEffects[setName];
    const tiers: ActiveSetSummary['activeTiers'] = [];
    if (def) {
      for (const reqStr of ['1', '2', '3', '4']) {
        const tierEff = def[reqStr];
        const req = Number(reqStr);
        if (!tierEff) continue;
        const cond = tierEff.condition;
        let conditionMet = true;
        if (cond === 'hpBelow70') conditionMet = loadout.hpPct < 70;
        else if (cond === 'hpAbove70') conditionMet = loadout.hpPct >= 70;
        else if (cond === 'shielded') conditionMet = loadout.assumptions.shielded;
        else if (cond === 'crouchedOrFortress') conditionMet = loadout.assumptions.fortressWarfare || loadout.hpPct >= 70;

        const isActive = count >= req && conditionMet;
        tiers.push({ count: req, desc: tierEff.desc, active: isActive });

        if (isActive) {
          const { desc, condition: _c, ...bonuses } = tierEff;
          if (cond === 'hpCurve') {
            // Treacherous Tides 3pc scales 8% at 100% HP up to 28% at <=60% HP
            const ratio = Math.min(1, Math.max(0, (100 - loadout.hpPct) / 40));
            const dynamicPct = Number((8 + ratio * 20).toFixed(1));
            addStat('weaponDmgPct', dynamicPct, `${setName} (${req}pc · ${loadout.hpPct}% HP)`);
            addStat('statusDmgPct', dynamicPct, `${setName} (${req}pc · ${loadout.hpPct}% HP)`);
          } else {
            applyMap(bonuses as Partial<Record<StatKey, number>>, `${setName} (${req}pc)`, desc);
          }
        }
      }
    }
    activeSets.push({ setName, count, activeTiers: tiers });
  }

  // 4. Combat Deviation
  const devCfg = DPS_DATA.combatDeviations.find((d) => d.id === loadout.deviationId);
  let deviationCompanionDps = 0;
  if (devCfg) {
    const skillMult = 0.7 + (loadout.deviationSkillRating - 1) * 0.15; // Skill 1 -> 0.7x, Skill 5 -> 1.3x
    const actMult = 0.8 + (loadout.deviationActivityRating - 1) * 0.08;
    const scaled: Partial<Record<StatKey, number>> = {};
    for (const [k, v] of Object.entries(devCfg.baseBonuses)) {
      if (typeof v === 'number') scaled[k as StatKey] = Number((v * skillMult).toFixed(1));
    }
    applyMap(
      scaled,
      `Deviation (${devCfg.name} · S${loadout.deviationSkillRating})`,
    );
    deviationCompanionDps = Math.round(devCfg.companionBaseDps * skillMult * actMult);
  }

  // 5. Cradle Overrides (max 4)
  for (const cid of loadout.cradleIds.slice(0, 4)) {
    const cradle = DPS_DATA.cradleOverrides.find((c) => c.id === cid);
    if (cradle) applyMap(cradle.effects, `Cradle (${cradle.name})`);
  }

  // 6. Food / Drink / Whim Buffs
  const food = DPS_DATA.consumables.foods.find((f) => f.id === loadout.foodId);
  if (food && food.id !== 'none') applyMap(food.effects, `Food (${food.name})`);

  const drink = DPS_DATA.consumables.drinks.find((d) => d.id === loadout.drinkId);
  if (drink && drink.id !== 'none') applyMap(drink.effects, `Drink (${drink.name})`);

  const whim = DPS_DATA.consumables.whims.find((w) => w.id === loadout.whimId);
  if (whim && whim.id !== 'none') applyMap(whim.effects, `Whim (${whim.name})`);

  // 7. Combat Assumptions (Debuffs / Team Buffs)
  if (loadout.assumptions.bullsEye) {
    addStat('vulnerabilityPct', 8, "The Bull's Eye Debuff (+8% Vuln)");
  }
  if (loadout.assumptions.marked) {
    addStat('weakspotVsMarkedPct', 10, 'Marked Weakspot Vulnerability');
  }
  if (loadout.assumptions.fortressWarfare) {
    addStat('weaponDmgPct', 20, 'Fortress Warfare Zone (+20% Weapon DMG)');
  }

  // Compute Core Readout
  const maxHp = Math.round(
    (baseChar.baseHp + totals.flatHp) * (1 + totals.maxHpPct / 100),
  );
  // Treacherous Tides 3pc low sanity caps current HP visual indicator cleanly
  const currentHp = Math.round(maxHp * (Math.min(100, Math.max(1, loadout.hpPct)) / 100));
  const psiIntensity = Math.round(baseChar.basePsiIntensity + totals.psiIntensity);
  const pollutionResist = Math.round(baseChar.basePollutionResist + totals.pollutionResist);
  const baseCharAttack = Math.round(baseChar.baseAttack + totals.flatAttack);

  const weaponAttack = Math.round(wPreview.atkAfterCalAmmo * (1 + totals.attackPct / 100));
  const fireRateRpm = Math.max(
    20,
    Math.round(activeWeapon.fireRateRpm * (1 + totals.fireRatePct / 100)),
  );
  const magCapacity = Math.max(
    1,
    Math.round(activeWeapon.magSize * (1 + totals.magCapPct / 100)),
  );
  const reloadSeconds = Math.max(
    0.35,
    Number((activeWeapon.reloadSeconds / (1 + totals.reloadSpeedPct / 100)).toFixed(2)),
  );

  return {
    weaponAttack,
    fireRateRpm,
    magCapacity,
    reloadSeconds,
    baseCharAttack,
    psiIntensity,
    maxHp,
    currentHp,
    pollutionResist,
    gearScoreTotal,
    totals,
    statDetails,
    activeSets,
    activeKeyArmors,
    activeWeapon,
    activeWeaponSlotCfg,
    secondaryWeapon,
    meleeWeapon,
    deviationCompanionDps,
    weaponAmmoMult: wPreview.ammo.dmgMult,
    weaponCalibMult: wPreview.calMult,
    weaponTierBaseAtk: wPreview.tierStarAtk,
  };
}

export function calculateFullLoadoutDps(
  loadout: LoadoutConfig,
  precomputedStats?: AggregatedStats,
): FullDpsResult {
  const stats = precomputedStats ?? aggregateLoadoutStats(loadout);
  const w = stats.activeWeapon;
  const t = stats.totals;
  const { targetType, weakspotHitRatePct } = loadout.assumptions;

  // Multi-pellet / Motion Value handling (Shotguns split or fire multiple pellets)
  const pellets = w.category === 'Shotgun' ? 6 : 1;
  const motionValue = w.category === 'Shotgun' ? 0.24 : 1.0;

  // 1. Effective ATK
  const effectiveAtk = stats.weaponAttack;

  // 2. Weapon DMG Bucket
  const weaponDmgBucket = 1 + t.weaponDmgPct / 100;

  // 3. Crit & Weakspot Bucket
  const critRate = Math.min(1, Math.max(0, t.critRatePct / 100));
  const wsRate = Math.min(1, Math.max(0, weakspotHitRatePct / 100));
  const critDmg = Math.max(0, t.critDmgPct / 100);
  const wsDmg =
    Math.max(0, t.weakspotDmgPct / 100) +
    (loadout.assumptions.marked ? t.weakspotVsMarkedPct / 100 : 0);
  const wsCritExtra = Math.max(0, t.weakspotCritDmgPct / 100);

  const normalHitMult = 1;
  const critHitMult = 1 + critDmg;
  const weakspotHitMult = 1 + wsDmg;
  const weakspotCritHitMult = 1 + critDmg + wsDmg + wsCritExtra;

  const expectedCritWeakspotMult =
    (1 - critRate) * (1 - wsRate) * normalHitMult +
    critRate * (1 - wsRate) * critHitMult +
    (1 - critRate) * wsRate * weakspotHitMult +
    critRate * wsRate * weakspotCritHitMult;

  // 4. Enemy Type Bucket
  const enemyTypePct =
    targetType === 'great_one'
      ? t.dmgVsGreatOnesPct
      : targetType === 'elite'
        ? t.dmgVsElitesPct
        : t.dmgVsNormalPct;
  const enemyTypeLabel =
    targetType === 'great_one' ? 'Great One' : targetType === 'elite' ? 'Elite' : 'Normal';
  const enemyTypeBucket = 1 + enemyTypePct / 100;

  // 5. Vulnerability / Debuff Bucket
  const vulnerabilityBucket = 1 + t.vulnerabilityPct / 100;

  // 6. Bullet Hits
  const baseScaledBullet = effectiveAtk * motionValue * pellets * weaponDmgBucket * enemyTypeBucket * vulnerabilityBucket;
  const normalHit = Math.round(baseScaledBullet * normalHitMult);
  const critHit = Math.round(baseScaledBullet * critHitMult);
  const weakspotHit = Math.round(baseScaledBullet * weakspotHitMult);
  const weakspotCritHit = Math.round(baseScaledBullet * weakspotCritHitMult);
  const avgBulletHit = Math.round(baseScaledBullet * expectedCritWeakspotMult);

  // 7. Keyword Proc DPS (Physical & Elemental)
  let keywordKind: 'physical' | 'elemental' | 'none' = 'none';
  let keywordName = w.archetype;
  let keywordScalingLabel = 'None';
  let keywordProcChancePct = 0;
  let keywordDmgBucket = 1;
  let avgKeywordProcPerShot = 0;

  if (w.archetype === 'Bounce') {
    keywordKind = 'physical';
    keywordScalingLabel = 'ATK × 65% Bounce';
    keywordProcChancePct = Math.min(100, 50 + (w.category === 'Sniper Rifle' ? 15 : 0));
    const procChance = keywordProcChancePct / 100;
    const extraTargets = 1 + t.bounceExtraCount;
    keywordDmgBucket = 1 + (t.keywordDmgPct + t.bounceDmgPct) / 100;
    const bounceCritMult = 1 + critRate * (critDmg + t.bounceCritDmgPct / 100);
    avgKeywordProcPerShot =
      effectiveAtk *
      0.65 *
      extraTargets *
      procChance *
      keywordDmgBucket *
      weaponDmgBucket *
      bounceCritMult *
      enemyTypeBucket *
      vulnerabilityBucket;
  } else if (w.archetype === 'Shrapnel') {
    keywordKind = 'physical';
    keywordScalingLabel = 'ATK × 50% Shrapnel';
    keywordProcChancePct = 42 + Math.round(critRate * 25);
    const procChance = Math.min(1, keywordProcChancePct / 100);
    keywordDmgBucket = 1 + (t.keywordDmgPct + t.shrapnelDmgPct) / 100;
    const shrapCritMult = 1 + critRate * critDmg;
    avgKeywordProcPerShot =
      effectiveAtk *
      0.5 *
      procChance *
      keywordDmgBucket *
      weaponDmgBucket *
      shrapCritMult *
      enemyTypeBucket *
      vulnerabilityBucket;
  } else if (w.archetype === 'Unstable Bomber') {
    keywordKind = 'physical';
    keywordScalingLabel = 'ATK × 80% Blast';
    keywordProcChancePct = 38;
    const procChance = keywordProcChancePct / 100;
    keywordDmgBucket = 1 + (t.keywordDmgPct + t.elementalDmgPct * 0.5) / 100;
    const bomberCritMult = 1 + critRate * critDmg * 0.85;
    avgKeywordProcPerShot =
      effectiveAtk *
      0.8 *
      procChance *
      keywordDmgBucket *
      weaponDmgBucket *
      bomberCritMult *
      enemyTypeBucket *
      vulnerabilityBucket;
  } else if (
    w.archetype === 'Frost Vortex' ||
    w.archetype === 'Power Surge' ||
    w.archetype === 'Burn'
  ) {
    keywordKind = 'elemental';
    const psiScale = w.archetype === 'Burn' ? 0.52 : w.archetype === 'Frost Vortex' ? 0.58 : 0.62;
    keywordScalingLabel = `Psi(${stats.psiIntensity}) × ${Math.round(psiScale * 100)}% ${w.element}`;
    keywordProcChancePct = w.category === 'Shotgun' ? 85 : 40;
    const procRate = keywordProcChancePct / 100;
    const elemBucket = 1 + t.elementalDmgPct / 100;
    const statusBucket = 1 + (t.statusDmgPct + t.keywordDmgPct) / 100;
    keywordDmgBucket = Number((elemBucket * statusBucket).toFixed(3));
    const canCrit = w.id.includes('corrosion') || t.keywordDmgPct > 15;
    const kwCritMult = canCrit ? 1 + critRate * 0.5 * critDmg : 1;
    avgKeywordProcPerShot =
      Math.max(120, stats.psiIntensity) *
      psiScale *
      procRate *
      elemBucket *
      statusBucket *
      kwCritMult *
      enemyTypeBucket *
      vulnerabilityBucket;
  }

  // 8. Final DPS Metrics
  const shotsPerSecond = stats.fireRateRpm / 60;
  const magDumpSeconds = stats.magCapacity / shotsPerSecond;
  const cycleSeconds = magDumpSeconds + stats.reloadSeconds;

  const avgTotalShot = avgBulletHit + avgKeywordProcPerShot;
  const keywordProcDps = Math.round(avgKeywordProcPerShot * shotsPerSecond);
  const weaponBurstDps = Math.round(avgTotalShot * shotsPerSecond);
  const magazineTotalDamage = Math.round(avgTotalShot * stats.magCapacity);
  const weaponOnlySustainedDps = Math.round(magazineTotalDamage / cycleSeconds);
  const deviationDps = stats.deviationCompanionDps;

  const burstDps = weaponBurstDps + deviationDps;
  const sustainedDps = weaponOnlySustainedDps + deviationDps;

  const elementalSharePct =
    avgTotalShot > 0 && keywordKind === 'elemental'
      ? Math.min(95, Math.round((avgKeywordProcPerShot / avgTotalShot) * 100))
      : 0;

  return {
    burstDps,
    sustainedDps,
    weaponOnlySustainedDps,
    keywordProcDps,
    deviationDps,
    normalHit,
    critHit,
    weakspotHit,
    weakspotCritHit,
    avgBulletHit,
    avgKeywordProcPerShot: Math.round(avgKeywordProcPerShot),
    magazineTotalDamage,
    shotsPerSecond: Number(shotsPerSecond.toFixed(2)),
    elementalSharePct,
    formula: {
      weaponTierStarAtk: stats.weaponTierBaseAtk,
      calibrationMult: Number(stats.weaponCalibMult.toFixed(3)),
      ammoMult: stats.weaponAmmoMult,
      attackPctMult: Number((1 + t.attackPct / 100).toFixed(3)),
      effectiveAtk,
      motionValuePct: Math.round(motionValue * 100),
      pellets,
      weaponDmgBucket: Number(weaponDmgBucket.toFixed(3)),
      critRateClampedPct: Math.round(critRate * 100),
      weakspotRateClampedPct: Math.round(wsRate * 100),
      normalHitMult: Number(normalHitMult.toFixed(2)),
      critHitMult: Number(critHitMult.toFixed(2)),
      weakspotHitMult: Number(weakspotHitMult.toFixed(2)),
      weakspotCritHitMult: Number(weakspotCritHitMult.toFixed(2)),
      expectedCritWeakspotMult: Number(expectedCritWeakspotMult.toFixed(3)),
      enemyTypeLabel,
      enemyTypeBucket: Number(enemyTypeBucket.toFixed(3)),
      vulnerabilityBucket: Number(vulnerabilityBucket.toFixed(3)),
      keywordKind,
      keywordName,
      keywordScalingLabel,
      keywordProcChancePct,
      keywordDmgBucket: Number(keywordDmgBucket.toFixed(3)),
      magDumpSeconds: Number(magDumpSeconds.toFixed(2)),
      effectiveReloadSeconds: stats.reloadSeconds,
      cycleSeconds: Number(cycleSeconds.toFixed(2)),
    },
  };
}

export function lookupEquipIcons(slot: WeaponSlotConfig | ArmorSlotConfig, isWeapon: boolean): {
  itemImg?: string;
  modImg?: string;
  rarity: string;
  name: string;
} {
  if (isWeapon) {
    const wCfg = slot as WeaponSlotConfig;
    const w = WEAPON_BY_ID.get(wCfg.weaponId);
    const mod = MOD_BY_ID.get(wCfg.modId);
    return {
      itemImg: w?.imageUrl,
      modImg: mod?.imageUrl,
      rarity: w?.rarity ?? 'Common',
      name: w?.name ?? 'Empty',
    };
  }
  const aCfg = slot as ArmorSlotConfig;
  const a = ARMOR_BY_ID.get(aCfg.armorId);
  const mod = MOD_BY_ID.get(aCfg.modId);
  return {
    itemImg: a?.imageUrl,
    modImg: mod?.imageUrl,
    rarity: a?.rarity ?? 'Common',
    name: a?.name ?? 'Empty',
  };
}

export function findDeviationImage(deviationId: string): string | undefined {
  return DEVIATIONS.find((d) => d.id === deviationId || d.id.startsWith(deviationId))?.imageUrl;
}

export function normalizeSlotForMod(slotId: EquipSlotId): string {
  switch (slotId) {
    case 'primary':
    case 'secondary':
    case 'melee':
      return 'Weapon';
    case 'helmet':
      return 'Helmet';
    case 'mask':
      return 'Mask';
    case 'gloves':
      return 'Gloves';
    case 'shoes':
      return 'Shoes';
    case 'top':
      return 'Top';
    case 'bottoms':
      return 'Bottom';
  }
}

export function normalizeSlotForArmorCatalog(slotId: ArmorSlotKey): ArmorSet['slot'] {
  switch (slotId) {
    case 'helmet':
      return 'Helmet';
    case 'mask':
      return 'Mask';
    case 'gloves':
      return 'Gloves';
    case 'shoes':
      return 'Shoes';
    case 'top':
      return 'Top';
    case 'bottoms':
      return 'Bottom';
  }
}

export { normalizeArmorSlotKey };

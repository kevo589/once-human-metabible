import rawHidesAndFabrics from '../data/crafting/hidesAndFabrics.json';
import rawTierRecipes from '../data/crafting/tierRecipes.json';
import type { ArmorSet, Rarity, Weapon } from '../types/game';

export type CraftTier = 1 | 2 | 3 | 4 | 5;
export type ArmorSlotKey = 'helmet' | 'top' | 'bottoms' | 'gloves' | 'shoes' | 'mask';
export type WeaponRecipeGroup =
  | 'pistol'
  | 'rifle_smg_lmg'
  | 'shotgun'
  | 'sniper'
  | 'crossbow_bow'
  | 'melee';

export interface MaterialEntry {
  name: string;
  qty: number;
  kind?: 'base' | 'hide' | 'gene_fabric';
}

export interface HideOrWoolDef {
  id: string;
  name: string;
  rarity: 'legendary' | 'epic' | 'fine' | 'common';
  tags: string[];
  effects: Record<ArmorSlotKey, string>;
}

export interface GeneFabricDef {
  id: string;
  name: string;
  rarity: 'legendary' | 'common';
  effect: string;
  topBonus: string | null;
}

interface ArmorTierRecipe {
  workbench: string;
  el: number;
  hideCount: number;
  supportsGeneFabric?: boolean;
  materials: Array<{ name: string; qty: number }>;
}

interface WeaponTierRecipe {
  workbench: string;
  el: number;
  materials: Array<{ name: string; qty: number }>;
}

interface TierRecipesData {
  starBonusPerLevel: number;
  rarityCostMultiplier: Record<'legendary' | 'epic' | 'fine' | 'common', number>;
  armor: Record<
    ArmorSlotKey,
    {
      slotMaterial: string;
      liningName: string;
      tiers: Record<string, ArmorTierRecipe>;
    }
  >;
  weapons: Record<
    WeaponRecipeGroup,
    {
      bodyPrefix: string;
      tiers: Record<string, WeaponTierRecipe>;
    }
  >;
}

export const TIER_RECIPES = rawTierRecipes as TierRecipesData;
export const HIDES_AND_WOOLS = (
  rawHidesAndFabrics as { hidesAndWools: HideOrWoolDef[]; geneFabrics: GeneFabricDef[] }
).hidesAndWools;
export const GENE_FABRICS = (
  rawHidesAndFabrics as { hidesAndWools: HideOrWoolDef[]; geneFabrics: GeneFabricDef[] }
).geneFabrics;

export const ROMAN_TIERS: Record<CraftTier, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
};

const ARMOR_HP_TIER_MULT: Record<CraftTier, number> = {
  1: 1.0,
  2: 2.6,
  3: 5.0,
  4: 8.4,
  5: 1924 / 156,
};

const ARMOR_PSI_TIER_MULT: Record<CraftTier, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.1,
  4: 4.4,
  5: 64 / 11,
};

const ARMOR_POLL_TIER_MULT: Record<CraftTier, number> = {
  1: 1.0,
  2: 1.35,
  3: 1.75,
  4: 2.2,
  5: 2.75,
};

const WEAPON_DMG_TIER_MULT: Record<CraftTier, number> = {
  1: 1.0,
  2: 1.85,
  3: 3.1,
  4: 4.7,
  5: 6.8,
};

export function normalizeRarityCostKey(
  rarity: Rarity,
): 'legendary' | 'epic' | 'fine' | 'common' {
  switch (rarity) {
    case 'Legendary':
      return 'legendary';
    case 'Epic':
      return 'epic';
    case 'Rare':
      return 'fine';
    default:
      return 'common';
  }
}

export function normalizeArmorSlotKey(slot: ArmorSet['slot']): ArmorSlotKey {
  switch (slot) {
    case 'Helmet':
      return 'helmet';
    case 'Top':
      return 'top';
    case 'Bottom':
      return 'bottoms';
    case 'Gloves':
      return 'gloves';
    case 'Shoes':
      return 'shoes';
    default:
      return 'mask';
  }
}

export function mapWeaponCategoryToRecipeGroup(cat: Weapon['category']): WeaponRecipeGroup {
  switch (cat) {
    case 'Pistol':
      return 'pistol';
    case 'Shotgun':
      return 'shotgun';
    case 'Sniper Rifle':
      return 'sniper';
    case 'Crossbow':
      return 'crossbow_bow';
    case 'Melee':
      return 'melee';
    default:
      // Assault Rifle, SMG, LMG, Flamethrower, Rocket Launcher
      return 'rifle_smg_lmg';
  }
}

export function getStarBonusMultiplier(stars: number): number {
  const clamped = Math.max(1, Math.min(6, stars));
  return (clamped - 1) * TIER_RECIPES.starBonusPerLevel;
}

export interface ComputedArmorCraft {
  tier: CraftTier;
  stars: number;
  baseHp: number;
  bonusHp: number;
  basePollutionResist: number;
  basePsiIntensity: number;
  bonusPsiIntensity: number;
  workbench: string;
  elCost: number;
  hideCount: number;
  supportsGeneFabric: boolean;
  materials: MaterialEntry[];
  selectedHide: HideOrWoolDef;
  selectedGeneFabric: GeneFabricDef;
}

export function computeArmorCraft(
  armor: ArmorSet,
  tier: CraftTier,
  stars: number,
  hideId: string,
  geneFabricId: string,
): ComputedArmorCraft {
  const slotKey = normalizeArmorSlotKey(armor.slot);
  const slotSpec = TIER_RECIPES.armor[slotKey];
  const recipe = slotSpec.tiers[String(tier)] ?? slotSpec.tiers['5'];
  const rarityMult =
    TIER_RECIPES.rarityCostMultiplier[normalizeRarityCostKey(armor.rarity)] ?? 1.0;

  const starMult = getStarBonusMultiplier(stars);
  const baseHp = Math.round(armor.hp * ARMOR_HP_TIER_MULT[tier]);
  const bonusHp = Math.round(baseHp * starMult);
  const basePsiIntensity = Math.round(armor.psiIntensity * ARMOR_PSI_TIER_MULT[tier]);
  const bonusPsiIntensity = Math.round(basePsiIntensity * starMult);
  const basePollutionResist = Math.round(armor.pollutionResist * ARMOR_POLL_TIER_MULT[tier]);

  const selectedHide =
    HIDES_AND_WOOLS.find((h) => h.id === hideId) ?? HIDES_AND_WOOLS[0];
  const selectedGeneFabric =
    (recipe.supportsGeneFabric
      ? GENE_FABRICS.find((g) => g.id === geneFabricId)
      : undefined) ?? GENE_FABRICS[0];

  const materials: MaterialEntry[] = recipe.materials.map((m) => ({
    name: m.name,
    qty:
      m.qty === 1
        ? 1
        : Math.max(1, Math.round(m.qty * rarityMult)),
    kind: 'base',
  }));

  materials.push({
    name: selectedHide.name,
    qty: recipe.hideCount,
    kind: 'hide',
  });

  if (recipe.supportsGeneFabric && selectedGeneFabric.id !== 'none') {
    materials.push({
      name: selectedGeneFabric.name,
      qty: 1,
      kind: 'gene_fabric',
    });
  }

  return {
    tier,
    stars,
    baseHp,
    bonusHp,
    basePollutionResist,
    basePsiIntensity,
    bonusPsiIntensity,
    workbench: recipe.workbench,
    elCost: Math.round(recipe.el * rarityMult),
    hideCount: recipe.hideCount,
    supportsGeneFabric: Boolean(recipe.supportsGeneFabric),
    materials,
    selectedHide,
    selectedGeneFabric,
  };
}

export interface ComputedWeaponCraft {
  tier: CraftTier;
  stars: number;
  baseDamage: number;
  bonusDamage: number;
  workbench: string;
  elCost: number;
  materials: MaterialEntry[];
}

export function computeWeaponCraft(
  weapon: Weapon,
  tier: CraftTier,
  stars: number,
): ComputedWeaponCraft {
  const grp = mapWeaponCategoryToRecipeGroup(weapon.category);
  const grpSpec = TIER_RECIPES.weapons[grp];
  const recipe = grpSpec.tiers[String(tier)] ?? grpSpec.tiers['5'];
  const rarityMult =
    TIER_RECIPES.rarityCostMultiplier[normalizeRarityCostKey(weapon.rarity)] ?? 1.0;

  const starMult = getStarBonusMultiplier(stars);
  const baseDamage = Math.round(weapon.baseDamage * WEAPON_DMG_TIER_MULT[tier]);
  const bonusDamage = Math.round(baseDamage * starMult);

  const materials: MaterialEntry[] = recipe.materials.map((m) => ({
    name: m.name,
    qty:
      m.qty === 1
        ? 1
        : Math.max(1, Math.round(m.qty * rarityMult)),
    kind: 'base',
  }));

  return {
    tier,
    stars,
    baseDamage,
    bonusDamage,
    workbench: recipe.workbench,
    elCost: Math.round(recipe.el * rarityMult),
    materials,
  };
}

export interface QueuedCraftItem {
  queueId: string;
  kind: 'armor' | 'weapon';
  itemId: string;
  name: string;
  rarity: Rarity;
  slotOrCategory: string;
  imageUrl: string;
  tier: CraftTier;
  stars: number;
  hideId?: string;
  hideName?: string;
  geneFabricId?: string;
  geneFabricName?: string;
  elCost: number;
  materials: MaterialEntry[];
  workbench: string;
}

export type MaterialBucketId =
  | 'stardust'
  | 'metals'
  | 'components'
  | 'parts_linings'
  | 'hides'
  | 'gene_fabrics';

export function classifyMaterialBucket(name: string, kind?: MaterialEntry['kind']): MaterialBucketId {
  if (kind === 'gene_fabric' || name.includes('Gene Fabric')) return 'gene_fabrics';
  if (kind === 'hide') return 'hides';
  if (name.includes('Stardust Source')) return 'stardust';
  if (
    name.includes('Ingot') ||
    name.includes('Ore') ||
    name === 'Wood'
  ) {
    return 'metals';
  }
  if (
    name.includes('Lining') ||
    name.includes('Body') ||
    name.includes('Frame')
  ) {
    return 'parts_linings';
  }
  return 'components';
}

export interface AggregatedCraftTotals {
  totalEl: number;
  grouped: Record<MaterialBucketId, Array<{ name: string; qty: number }>>;
}

export function aggregateCraftQueue(queue: QueuedCraftItem[]): AggregatedCraftTotals {
  const counts = new Map<string, { name: string; qty: number; bucket: MaterialBucketId }>();
  let totalEl = 0;

  for (const item of queue) {
    totalEl += item.elCost;
    for (const mat of item.materials) {
      const bucket = classifyMaterialBucket(mat.name, mat.kind);
      const existing = counts.get(mat.name);
      if (existing) {
        existing.qty += mat.qty;
      } else {
        counts.set(mat.name, { name: mat.name, qty: mat.qty, bucket });
      }
    }
  }

  const grouped: AggregatedCraftTotals['grouped'] = {
    stardust: [],
    metals: [],
    components: [],
    parts_linings: [],
    hides: [],
    gene_fabrics: [],
  };

  for (const entry of counts.values()) {
    grouped[entry.bucket].push({ name: entry.name, qty: entry.qty });
  }

  for (const key of Object.keys(grouped) as MaterialBucketId[]) {
    grouped[key].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
  }

  return { totalEl, grouped };
}

import { z } from 'zod';

export const RaritySchema = z.enum(['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']);

export const ElementSchema = z.enum([
  'Blaze',
  'Frost',
  'Shock',
  'Blast',
  'Physical',
  'Universal',
]);

export const ArchetypeSchema = z.enum([
  'Shrapnel',
  'Frost Vortex',
  'Power Surge',
  'Burn',
  'Unstable Bomber',
  'Bounce',
  "Bull's Eye",
  'Fast Gunner',
  'Fortress Warfare',
  'Standard',
]);

export const ScenarioIdSchema = z.enum(['manibus', 'way_of_winter', 'isles_of_abyss']);

export const WeaponCategorySchema = z.enum([
  'Assault Rifle',
  'SMG',
  'Sniper Rifle',
  'Shotgun',
  'LMG',
  'Pistol',
  'Crossbow',
  'Melee',
  'Flamethrower',
  'Rocket Launcher',
]);

export const WeaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: WeaponCategorySchema,
  rarity: RaritySchema,
  element: ElementSchema,
  archetype: ArchetypeSchema,
  baseDamage: z.number().positive(),
  fireRateRpm: z.number().positive(),
  magSize: z.number().int().positive(),
  reloadSeconds: z.number().positive(),
  critRate: z.number().min(0).max(1),
  critDamage: z.number().min(0),
  weakspotDamage: z.number().min(0),
  elementBonus: z.number().min(0),
  rangeScore: z.number().min(0),
  effectiveRangeMeters: z.number().min(0),
  mobility: z.number().min(0),
  ammoType: z.string(),
  fireMode: z.string(),
  imageUrl: z.string().min(1),
  referenceUrl: z.string().url(),
  trait: z.string(),
  source: z.string(),
});

export const ArmorSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  rarity: RaritySchema,
  isKeyPiece: z.boolean(),
  slot: z.enum(['Set', 'Helmet', 'Mask', 'Top', 'Bottom', 'Gloves', 'Shoes']),
  setName: z.string().optional(),
  hp: z.number().min(0).default(0),
  pollutionResist: z.number().min(0).default(0),
  psiIntensity: z.number().min(0).default(0),
  effectSummary: z.string(),
  onePieceBonus: z.string().optional(),
  twoPieceBonus: z.string().optional(),
  threePieceBonus: z.string().optional(),
  fourPieceBonus: z.string().optional(),
  archetypes: z.array(ArchetypeSchema),
  imageUrl: z.string().min(1),
  referenceUrl: z.string().url(),
  source: z.string(),
});

export const ModSchema = z.object({
  id: z.string(),
  name: z.string(),
  rarity: RaritySchema,
  modCategory: z.enum(['Weapon Mod', 'Armor Mod']),
  slot: z.enum(['Weapon', 'Helmet', 'Mask', 'Top', 'Bottom', 'Gloves', 'Shoes']),
  variant: z.string(),
  element: ElementSchema,
  archetype: z.union([ArchetypeSchema, z.literal('Universal')]),
  primaryEffect: z.string(),
  suffixes: z.array(z.string()).default([]),
  recommendedSubstats: z.array(z.string()),
  imageUrl: z.string().min(1),
  referenceUrl: z.string().url(),
  dropSource: z.string(),
});

export const DeviationSchema = z.object({
  id: z.string(),
  name: z.string(),
  rarity: RaritySchema,
  type: z.enum(['Combat', 'Territory', 'Crafting']),
  element: z.enum(['Physical', 'Frost', 'Shock', 'Blaze', 'Acid', 'Utility']),
  skillName: z.string(),
  skillSummary: z.string(),
  moodRequirement: z.string(),
  imageUrl: z.string().min(1),
  referenceUrl: z.string().url(),
  dropSource: z.string(),
});

export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['Combat Food', 'Survival Food', 'Brew', 'Stardust']),
  rarity: RaritySchema,
  durationMinutes: z.number().int().positive(),
  effects: z.string(),
  ingredients: z.array(z.string()),
  station: z.string(),
  damageBonusPct: z.number().min(0).default(0),
});

export const EncounterSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['Monolith Boss', 'Securement Silo', 'Prime War', 'Public Crisis']),
  scenario: ScenarioIdSchema,
  recommendedLevel: z.number().int().min(1).max(60),
  weakElement: z.string(),
  mechanicsSummary: z.string(),
  keyDrops: z.array(z.string()),
});

export const ClassSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['Combat', 'Craft', 'Gathering', 'Territory']),
  tierLevel: z.number().int().min(5).max(50),
  description: z.string(),
  synergyNotes: z.string(),
});

export const MapCategorySchema = z.enum([
  'Monolith',
  'Silo',
  'Teleport Tower',
  'Mystical Crate',
  'Resource Node',
  'Vendor',
  'Stronghold',
  'Prime War',
]);

export const MapMarkerSchema = z.object({
  id: z.string(),
  scenario: ScenarioIdSchema,
  name: z.string(),
  category: MapCategorySchema,
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
  level: z.number().int().min(1).max(60).optional(),
  region: z.string(),
  description: z.string(),
  loot: z.array(z.string()),
});

export const MapRegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  levelRange: z.string(),
  color: z.string(),
  bounds: z.tuple([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number()])]),
  notes: z.string(),
});

export const MapScenarioSchema = z.object({
  id: ScenarioIdSchema,
  name: z.string(),
  subtitle: z.string(),
  environment: z.string(),
  regions: z.array(MapRegionSchema),
});

export const NalcottMapTypeSchema = z.object({
  key: z.string(),
  label: z.string(),
  plural: z.string(),
  color: z.string(),
  defaultOn: z.boolean(),
  count: z.number().int().nonnegative(),
});

export const NalcottMapRegionSchema = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export const NalcottMapPointTupleSchema = z.tuple([
  z.string(),
  z.number().int().nonnegative(),
  z.string(),
  z.number().nullable(),
  z.number(),
  z.number(),
  z.string().nullable(),
]);

export const NalcottMapDataSchema = z.object({
  tileUrl: z.string().url(),
  tileSize: z.number().int().positive(),
  maxNativeZoom: z.number().int().nonnegative(),
  types: z.array(NalcottMapTypeSchema),
  regions: z.array(NalcottMapRegionSchema),
  points: z.array(NalcottMapPointTupleSchema),
});

export const CalculatorPresetSchema = z.object({
  weaponId: z.string(),
  weaponAttackBonusPct: z.number(),
  statusElementBonusPct: z.number(),
  critRateBonusPct: z.number(),
  critDamageBonusPct: z.number(),
  weakspotHitRatioPct: z.number(),
  weakspotDamageBonusPct: z.number(),
  fireRateBonusPct: z.number(),
  magSizeBonusPct: z.number(),
  reloadSpeedBonusPct: z.number(),
  vulnerableEnemyBonusPct: z.number(),
  cradleAndFoodBonusPct: z.number(),
  armorSetBonusPct: z.number(),
  archetypeProcMultiplier: z.number().min(1),
});

export const MetaBuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  archetype: ArchetypeSchema,
  tier: z.enum(['S+', 'S', 'A']),
  scenarioFit: z.array(ScenarioIdSchema),
  weaponId: z.string(),
  secondaryWeaponId: z.string(),
  armorSetup: z.string(),
  keyMods: z.array(z.string()),
  deviationId: z.string(),
  cradleOverrides: z.array(z.string()),
  foodBuffId: z.string(),
  playstyleNotes: z.string(),
  preset: CalculatorPresetSchema,
});

export const TimerEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['World Event', 'Prime War', 'Weekly Reset', 'Vendor Reset']),
  scheduleType: z.enum(['interval', 'daily', 'weekly']),
  intervalMinutes: z.number().int().positive().optional(),
  offsetMinutes: z.number().int().min(0).default(0),
  utcHour: z.number().int().min(0).max(23).optional(),
  utcWeekday: z.number().int().min(0).max(6).optional(),
  durationMinutes: z.number().int().positive(),
  scenario: z.union([ScenarioIdSchema, z.literal('all')]),
  rewards: z.array(z.string()),
  description: z.string(),
});

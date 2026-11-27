import { z } from 'zod';
import {
  ArchetypeSchema,
  ArmorSetSchema,
  CalculatorPresetSchema,
  ClassSpecSchema,
  DeviationSchema,
  ElementSchema,
  EncounterSchema,
  MapCategorySchema,
  MapMarkerSchema,
  MapRegionSchema,
  MapScenarioSchema,
  MetaBuildSchema,
  ModSchema,
  NalcottMapDataSchema,
  NalcottMapPointTupleSchema,
  NalcottMapRegionSchema,
  NalcottMapTypeSchema,
  RaritySchema,
  RecipeSchema,
  ScenarioIdSchema,
  TimerEventSchema,
  WeaponSchema,
} from '../schemas/gameData';

export type Rarity = z.infer<typeof RaritySchema>;
export type ElementType = z.infer<typeof ElementSchema>;
export type Archetype = z.infer<typeof ArchetypeSchema>;
export type ScenarioId = z.infer<typeof ScenarioIdSchema>;
export type Weapon = z.infer<typeof WeaponSchema>;
export type ArmorSet = z.infer<typeof ArmorSetSchema>;
export type ModItem = z.infer<typeof ModSchema>;
export type Deviation = z.infer<typeof DeviationSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type Encounter = z.infer<typeof EncounterSchema>;
export type ClassSpec = z.infer<typeof ClassSpecSchema>;
export type MapCategory = z.infer<typeof MapCategorySchema>;
export type MapMarker = z.infer<typeof MapMarkerSchema>;
export type MapRegion = z.infer<typeof MapRegionSchema>;
export type MapScenario = z.infer<typeof MapScenarioSchema>;
export type NalcottMapType = z.infer<typeof NalcottMapTypeSchema>;
export type NalcottMapRegion = z.infer<typeof NalcottMapRegionSchema>;
export type NalcottMapPointTuple = z.infer<typeof NalcottMapPointTupleSchema>;
export type NalcottMapData = z.infer<typeof NalcottMapDataSchema>;
export type CalculatorPreset = z.infer<typeof CalculatorPresetSchema>;
export type MetaBuild = z.infer<typeof MetaBuildSchema>;
export type TimerEvent = z.infer<typeof TimerEventSchema>;

export type NavTab =
  | 'calculator'
  | 'meta'
  | 'map'
  | 'encyclopedia'
  | 'timers';

export type EncyclopediaSubTab =
  | 'weapons'
  | 'armor'
  | 'mods'
  | 'deviations'
  | 'chef'
  | 'encounters'
  | 'classes';

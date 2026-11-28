import type { ScenarioId } from '../types/game';

export const MAP_LAST_UPDATED = '2026-11-27';

export type MapCategoryGroupId =
  | 'locations'
  | 'gathering'
  | 'loot_containers'
  | 'bosses_anomalies';

export interface MapDropEntry {
  item: string;
  quantity: string;
  chance: string;
  qualifier?: string;
}

export interface MapCategoryDef {
  key: string;
  label: string;
  group: MapCategoryGroupId;
  color: string;
  defaultOn: boolean;
  isNew?: boolean;
  isBossAnomaly?: boolean;
  description: string;
}

export interface MapRegionDef {
  id: string;
  name: string;
  scenario: 'all' | Extract<ScenarioId, 'manibus' | 'way_of_winter'>;
  bounds: [[number, number], [number, number]];
  levelRange?: string;
}

export interface MapScenarioDef {
  id: 'all' | ScenarioId;
  label: string;
  shortLabel: string;
  subtitle: string;
  bounds: [[number, number], [number, number]];
}

export interface ResourceAreaPolygon {
  id: string;
  name: string;
  kind: 'pollution' | 'oil' | 'tungsten' | 'stardust' | 'gold_silver' | 'wildlife';
  color: string;
  scenario: 'manibus' | 'way_of_winter';
  region: string;
  resources: string[];
  coordinates: [number, number][];
}

export interface FilterPresetDef {
  id: string;
  name: string;
  description: string;
  builtIn?: boolean;
  categories: string[];
  resourceAreaIds?: string[];
}

export const MAP_SCENARIOS: MapScenarioDef[] = [
  {
    id: 'all',
    label: "All Scenarios (Nalcott Island)",
    shortLabel: 'Nalcott',
    subtitle: 'Complete Nalcott Island · Manibus + Way of Winter',
    bounds: [
      [-492, 42],
      [-40, 492],
    ],
  },
  {
    id: 'manibus',
    label: "Manibus & Evolution's Call",
    shortLabel: 'Manibus',
    subtitle: 'Dayton Wetlands · Broken Delta · Iron River · Chalk Peak · Red Sands',
    bounds: [
      [-492, 260],
      [-230, 500],
    ],
  },
  {
    id: 'way_of_winter',
    label: 'The Way of Winter',
    shortLabel: 'Winter',
    subtitle: 'Vena Fjord · Onyx Tundra · Ember Strand · Blackheart',
    bounds: [
      [-245, 38],
      [-25, 488],
    ],
  },
  {
    id: 'isles_of_abyss',
    label: 'Isles of Abyss',
    shortLabel: 'Abyss',
    subtitle: 'High-Pollution Coastal & Outer Nalcott Sectors',
    bounds: [
      [-492, 300],
      [-190, 505],
    ],
  },
];

export const MAP_REGIONS: MapRegionDef[] = [
  {
    id: 'all',
    name: 'All regions',
    scenario: 'all',
    bounds: [
      [-492, 42],
      [-40, 492],
    ],
  },
  {
    id: 'Dayton Wetlands',
    name: 'Dayton Wetlands',
    scenario: 'manibus',
    levelRange: 'Lv 1–12',
    bounds: [
      [-442, 425],
      [-378, 495],
    ],
  },
  {
    id: 'Broken Delta',
    name: 'Broken Delta',
    scenario: 'manibus',
    levelRange: 'Lv 12–22',
    bounds: [
      [-495, 375],
      [-418, 472],
    ],
  },
  {
    id: 'Iron River',
    name: 'Iron River',
    scenario: 'manibus',
    levelRange: 'Lv 22–32',
    bounds: [
      [-392, 405],
      [-322, 492],
    ],
  },
  {
    id: 'Chalk Peak',
    name: 'Chalk Peak',
    scenario: 'manibus',
    levelRange: 'Lv 32–42',
    bounds: [
      [-455, 272],
      [-355, 392],
    ],
  },
  {
    id: 'Red Sands',
    name: 'Red Sands',
    scenario: 'manibus',
    levelRange: 'Lv 42–55',
    bounds: [
      [-342, 355],
      [-255, 465],
    ],
  },
  {
    id: 'Blackheart Region',
    name: 'Blackheart Region',
    scenario: 'way_of_winter',
    levelRange: 'Lv 38–52',
    bounds: [
      [-268, 345],
      [-185, 455],
    ],
  },
  {
    id: 'Vena Fjord',
    name: 'Vena Fjord',
    scenario: 'way_of_winter',
    levelRange: 'Lv 1–24',
    bounds: [
      [-125, 195],
      [-32, 320],
    ],
  },
  {
    id: 'Onyx Tundra',
    name: 'Onyx Tundra',
    scenario: 'way_of_winter',
    levelRange: 'Lv 24–40',
    bounds: [
      [-150, 325],
      [-45, 450],
    ],
  },
  {
    id: 'Ember Strand',
    name: 'Ember Strand',
    scenario: 'way_of_winter',
    levelRange: 'Lv 40–55',
    bounds: [
      [-145, 35],
      [-35, 165],
    ],
  },
];

export const MAP_CATEGORIES: MapCategoryDef[] = [
  // Locations
  {
    key: 'teleport-tower',
    label: 'Teleportation Towers',
    group: 'locations',
    color: '#06b6d4',
    defaultOn: true,
    description: 'Fast-travel network towers across Nalcott Island.',
  },
  {
    key: 'monolith',
    label: 'Monoliths',
    group: 'locations',
    color: '#f43f5e',
    defaultOn: true,
    description: 'Rift Monolith instances and Great One boss arenas.',
  },
  {
    key: 'securement-silo',
    label: 'Silos',
    group: 'locations',
    color: '#fb923c',
    defaultOn: true,
    description: 'Rosetta Securement Silos for legendary mod & deviation runs.',
  },
  {
    key: 'mayfly-stronghold',
    label: 'Strongholds',
    group: 'locations',
    color: '#2dd4bf',
    defaultOn: true,
    description: 'Major Mayfly hubs, Safe Zones, and NPC vendors.',
  },
  {
    key: 'extraction-site',
    label: 'Extraction Sites',
    group: 'locations',
    color: '#94a3b8',
    defaultOn: false,
    description: 'Stardust Pollution & Oil industrial resource extraction points.',
  },
  {
    key: 'contest-area',
    label: 'Contest Area',
    group: 'locations',
    color: '#eab308',
    defaultOn: false,
    description: 'Frontier PvP & territory control zones.',
  },
  {
    key: 'attackers-base',
    label: "Attacker's Base",
    group: 'locations',
    color: '#facc15',
    defaultOn: false,
    description: 'Raid staging and Rosetta assault forward camps.',
  },
  {
    key: 'birdview-camp',
    label: 'Birdview Camp',
    group: 'locations',
    color: '#cbd5e1',
    defaultOn: false,
    description: 'Scenic lookout camps and ridge forward outposts.',
  },
  {
    key: 'cave-base',
    label: 'Cave Base',
    group: 'locations',
    color: '#a78bfa',
    defaultOn: false,
    description: 'Subterranean cavern hideouts and hidden shelter caves.',
  },
  {
    key: 'settlement',
    label: 'Settlements',
    group: 'locations',
    color: '#a3e635',
    defaultOn: false,
    description: 'Occupied Rosetta/Deviant towns with crate exploration checklists.',
  },
  {
    key: 'mine-workshop',
    label: 'Mine Workshops',
    group: 'locations',
    color: '#d6a35c',
    defaultOn: false,
    description: 'Workshop defense nodes producing Mixed Fuel, Acid & Source.',
  },
  {
    key: 'harvesters-market',
    label: "Harvesters' Market",
    group: 'locations',
    color: '#86efac',
    defaultOn: false,
    description: 'Player vending hubs and seasonal supply markets.',
  },
  {
    key: 'worldstone',
    label: 'Worldstones',
    group: 'locations',
    color: '#818cf8',
    defaultOn: false,
    description: 'Stardust Worldstone waypoints and landmark beacons.',
  },
  {
    key: 'place',
    label: 'Named Regions',
    group: 'locations',
    color: '#64748b',
    defaultOn: false,
    description: 'Named points of interest, bridges, and junctions.',
  },

  // Gathering & Resources (Ores, Wildlife, Herbs, Sulfur/Salt)
  {
    key: 'ore-startrace',
    label: 'Startrace Ore Veins',
    group: 'gathering',
    color: '#a855f7',
    defaultOn: true,
    isNew: true,
    description: 'High-yield Startrace Ore crystal veins for Stardust Source smelting.',
  },
  {
    key: 'ore-tungsten',
    label: 'Tungsten & Aluminum Veins',
    group: 'gathering',
    color: '#38bdf8',
    defaultOn: true,
    isNew: true,
    description: 'Dense Tier IV–V Tungsten and Aluminum ore farming ridges.',
  },
  {
    key: 'ore-gold-silver',
    label: 'Gold & Silver Veins',
    group: 'gathering',
    color: '#eab308',
    defaultOn: true,
    isNew: true,
    description: 'High-value Gold & Silver ore runs for Energy Link ingot crafting.',
  },
  {
    key: 'ore-iron-copper',
    label: 'Copper, Tin & Iron Veins',
    group: 'gathering',
    color: '#d97706',
    defaultOn: false,
    description: 'Early-to-mid bulk Bronze, Steel & Iron smelting clusters.',
  },
  {
    key: 'hunting-grounds',
    label: 'Animal Hunting & Hides',
    group: 'gathering',
    color: '#22c55e',
    defaultOn: true,
    isNew: true,
    description: 'Dense wildlife habitats for Bear, Wolf, Golden Wool, Crocodile & Game Meat.',
  },
  {
    key: 'herbs-crops',
    label: 'Herbs, Mushrooms & Crops',
    group: 'gathering',
    color: '#10b981',
    defaultOn: false,
    description: 'Foraging runs for Scarlet Calamus, Morel, Honeysuckle, Aloe & Snow Lotus.',
  },
  {
    key: 'acid-salt-sulfur',
    label: 'Salt, Sulfur & Acid/Oil',
    group: 'gathering',
    color: '#f97316',
    defaultOn: true,
    description: 'Sulfur crystal mesas, Saltwater flats & Oil/Acid pump hotspots.',
  },

  // Loot Containers
  {
    key: 'mystical-crate',
    label: 'Mystical Crate',
    group: 'loot_containers',
    color: '#f59e0b',
    defaultOn: true,
    description: 'Unique golden settlement chests containing Blueprint Fragments.',
  },
  {
    key: 'weapon-crate',
    label: 'Weapon Crate',
    group: 'loot_containers',
    color: '#ef4444',
    defaultOn: false,
    description: 'Weapons, calibration blueprints, and weapon mods.',
  },
  {
    key: 'gear-crate',
    label: 'Gear Crate',
    group: 'loot_containers',
    color: '#3b82f6',
    defaultOn: false,
    description: 'Armor pieces, armor mods, and stardust scraps.',
  },
  {
    key: 'morphic-crate',
    label: 'Morphic Crate',
    group: 'loot_containers',
    color: '#c084fc',
    defaultOn: false,
    description: 'Disguised anomaly chests rewarding Starchrom & Planula.',
  },
  {
    key: 'echo-loot',
    label: 'Echo Loot',
    group: 'loot_containers',
    color: '#06b6d4',
    defaultOn: false,
    isNew: true,
    description: 'High-tier Echoes of Stardust caches and seasonal anomaly chests.',
  },
  {
    key: 'car-trunk',
    label: 'Car Trunk',
    group: 'loot_containers',
    color: '#22d3ee',
    defaultOn: false,
    description: 'Abandoned roadside trunks rich in Mixed Fuel, Scraps & Ingots.',
  },
  {
    key: 'ammo-box',
    label: 'Ammo Box',
    group: 'loot_containers',
    color: '#f97316',
    defaultOn: false,
    description: 'Tactical munitions crates with Gunpowder, Rounds & Parts.',
  },
  {
    key: 'basic-supply-crate',
    label: 'Basic Supply Crate',
    group: 'loot_containers',
    color: '#34d399',
    defaultOn: false,
    description: 'Everyday survival crates containing Food, Water, Bandages & Parts.',
  },
  {
    key: 'basic-crate',
    label: 'Basic Crate',
    group: 'loot_containers',
    color: '#94a3b8',
    defaultOn: false,
    description: 'Standard wooden storage crates across settlements.',
  },
  {
    key: 'dusty-loot-crate',
    label: 'Dusty Loot Crate',
    group: 'loot_containers',
    color: '#d97706',
    defaultOn: false,
    description: 'Arid-zone weathered crates holding Tungsten & Electronic Parts.',
  },
  {
    key: 'damp-crate',
    label: 'Damp Crate',
    group: 'loot_containers',
    color: '#38bdf8',
    defaultOn: false,
    description: 'Wetland and coastal salvage crates containing Adhesives & Fabrics.',
  },
  {
    key: 'broken-relic',
    label: 'Broken Relic',
    group: 'loot_containers',
    color: '#a855f7',
    defaultOn: false,
    description: 'Shattered Stardust relics yielding Cortexes & Energy Links.',
  },

  // Bosses, Lairs & Anomalies
  {
    key: 'rift-anchor',
    label: 'Rift Anchors',
    group: 'bosses_anomalies',
    color: '#f97316',
    defaultOn: true,
    isBossAnomaly: true,
    description: 'Area rift anchors needed to unlock zone Monolith challenges.',
  },
  {
    key: 'deviation-spawn',
    label: 'Deviation Spawns',
    group: 'bosses_anomalies',
    color: '#fb923c',
    defaultOn: true,
    isBossAnomaly: true,
    description: 'Known world spawns for Combat, Territory & Crafting Deviations.',
  },
  {
    key: 'prime-war',
    label: 'Prime Wars',
    group: 'bosses_anomalies',
    color: '#f97316',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Server co-op defense forts against Great One bosses.',
  },
  {
    key: 'public-crisis',
    label: 'Public Crisis Events',
    group: 'bosses_anomalies',
    color: '#fb7185',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Rotating hourly Public Crisis hubs (Chiron, Cargo Scramble, Dig to Hell).',
  },
  {
    key: 'fragrant-cape',
    label: 'Fragrant Cape',
    group: 'bosses_anomalies',
    color: '#f97316',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Coastal elite aberration lair & spore nest clusters.',
  },
  {
    key: 'frost-forge',
    label: 'Frost Forge',
    group: 'bosses_anomalies',
    color: '#fb923c',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Northern Chaosweaver frost forge & thermal anomaly citadel.',
  },
  {
    key: 'furnace-lair',
    label: 'Furnace Lair',
    group: 'bosses_anomalies',
    color: '#ea580c',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Volcanic Ember Strand thermal elite nest & Blaze boss lair.',
  },
  {
    key: 'gaia-military-base',
    label: 'Gaia Military Base',
    group: 'bosses_anomalies',
    color: '#f59e0b',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Heavy Rosetta armored garrison and elite commander perimeter.',
  },
  {
    key: 'gaia-research-center',
    label: 'Gaia Research Center',
    group: 'bosses_anomalies',
    color: '#fb923c',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'LEA Research Lab / Gaia anomalous containment sectors.',
  },
  {
    key: 'thermal-tower',
    label: 'Thermal Towers',
    group: 'bosses_anomalies',
    color: '#f87171',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Public Thermal Towers radiating temperature stabilization aura.',
  },
  {
    key: 'arena',
    label: 'Deviation Arenas',
    group: 'bosses_anomalies',
    color: '#fb7185',
    defaultOn: false,
    isBossAnomaly: true,
    description: 'Gym and arena combat challenge zones.',
  },
];

export const MAP_DROP_TABLES: Record<string, MapDropEntry[]> = {
  'car-trunk': [
    { item: 'Copper Ingot', quantity: '×15', chance: '100%', qualifier: 'some tiers' },
    { item: 'Glass', quantity: '×10', chance: '100%', qualifier: 'some tiers' },
    { item: 'Metal Scraps', quantity: '×20', chance: '100%', qualifier: 'some tiers' },
    { item: 'Portable Mixed Fuel', quantity: '×2-6', chance: '100%', qualifier: 'some tiers' },
    { item: 'Parts', quantity: '×4-10', chance: '40%-60%', qualifier: 'some tiers' },
    { item: 'Connector Firmware', quantity: '×1-2', chance: '8%-31%', qualifier: 'some tiers' },
    { item: 'Industrial Clicker', quantity: '×1-2', chance: '7%-21%', qualifier: 'some tiers' },
    { item: 'Paint Brush', quantity: '×1', chance: '6%-19%', qualifier: 'some tiers' },
    { item: 'Wrench', quantity: '×1', chance: '6%-19%', qualifier: 'some tiers' },
    { item: 'Wireless Router', quantity: '×1', chance: '9%-18%', qualifier: 'some tiers' },
    { item: 'Bearing', quantity: '×1-2', chance: '18%', qualifier: 'some tiers' },
    { item: 'Disinfectant', quantity: '×1', chance: '18%', qualifier: 'some tiers' },
  ],
  'mystical-crate': [
    { item: 'Weapon / Armor Blueprint Fragments', quantity: '×15-40', chance: '100%' },
    { item: 'Starchrom Voucher', quantity: '×50-100', chance: '100%', qualifier: 'first open' },
    { item: 'Epic Calibration Blueprint', quantity: '×1', chance: '35%', qualifier: 'Lv 30+ zones' },
    { item: 'Controller / Planula', quantity: '×2', chance: '100%' },
  ],
  'weapon-crate': [
    { item: 'Rare / Epic Dropped Weapon', quantity: '×1', chance: '100%' },
    { item: 'Weapon Calibration Blueprint', quantity: '×1', chance: '24%', qualifier: 'Lv 35+ zones' },
    { item: 'Gunpowder & Rifle Ammo', quantity: '×30-60', chance: '85%' },
    { item: 'High-Grade Weapons Mod', quantity: '×1', chance: '42%', qualifier: 'Hard/Pro regions' },
  ],
  'gear-crate': [
    { item: 'Armor Piece (Scrap / Calibration)', quantity: '×1', chance: '100%' },
    { item: 'Legendary Armor Mod Fragment', quantity: '×3-6', chance: '60%', qualifier: 'some tiers' },
    { item: 'Tanned Hide / Refined Fabric', quantity: '×6-12', chance: '100%' },
    { item: 'Stardust Source', quantity: '×8-18', chance: '75%' },
  ],
  'morphic-crate': [
    { item: 'Planula Essence', quantity: '×15-30', chance: '100%' },
    { item: 'Starchrom', quantity: '×40-80', chance: '100%', qualifier: 'first clear' },
    { item: 'Eclipse Cortex Lv.3', quantity: '×1-2', chance: '45%' },
    { item: 'Stellar Planula', quantity: '×2-5', chance: '100%' },
  ],
  'echo-loot': [
    { item: 'Echoes of Stardust Record', quantity: '×1', chance: '100%' },
    { item: 'Stardust Source', quantity: '×25-45', chance: '100%' },
    { item: 'Impure Acid', quantity: '×6-14', chance: '65%', qualifier: 'pollution zones' },
    { item: 'Epic Mod Crate Key', quantity: '×1', chance: '22%' },
  ],
  'ammo-box': [
    { item: 'Rifle / SMG AP Ammo', quantity: '×24-48', chance: '100%' },
    { item: 'Gunpowder', quantity: '×8-16', chance: '100%' },
    { item: 'Shattered Shell Casing', quantity: '×12', chance: '85%' },
    { item: 'Tactical Grenade', quantity: '×1-2', chance: '35%' },
  ],
  'basic-supply-crate': [
    { item: 'Metal Scraps', quantity: '×12-20', chance: '100%' },
    { item: 'Clean Water & Ration Cans', quantity: '×2-4', chance: '90%' },
    { item: 'Adhesive / Rubber', quantity: '×3-8', chance: '78%' },
    { item: 'Quick Activator', quantity: '×1-2', chance: '32%' },
  ],
  'basic-crate': [
    { item: 'Metal Scraps', quantity: '×10-16', chance: '100%' },
    { item: 'Standard Parts', quantity: '×4-8', chance: '75%' },
    { item: 'Wood / Charcoal', quantity: '×10-18', chance: '100%' },
  ],
  'dusty-loot-crate': [
    { item: 'Tungsten Ore / Ingot', quantity: '×6-14', chance: '100%', qualifier: 'Lv 40+ zones' },
    { item: 'Special Electronic Parts', quantity: '×3-6', chance: '82%' },
    { item: 'Platinum Crystal', quantity: '×1-2', chance: '38%', qualifier: 'Red Sands' },
    { item: 'Acid', quantity: '×3-7', chance: '50%' },
  ],
  'damp-crate': [
    { item: 'Shabby Fabric', quantity: '×8-14', chance: '100%' },
    { item: 'Adhesive', quantity: '×4-9', chance: '92%' },
    { item: 'Fine Leather', quantity: '×3-6', chance: '55%' },
    { item: 'Energy Link Pouch', quantity: '×150-300', chance: '100%' },
  ],
  'broken-relic': [
    { item: 'Eclipse Cortex', quantity: '×1-2', chance: '100%' },
    { item: 'Stardust Source', quantity: '×15-30', chance: '100%' },
    { item: 'Energy Links', quantity: '×250-500', chance: '100%' },
  ],
  monolith: [
    { item: 'Legendary Weapon / Armor Mod', quantity: '×2-3', chance: '100%' },
    { item: 'Mod Parts & Stardust Source', quantity: '×40-80', chance: '100%' },
    { item: 'Boss Combat Deviation', quantity: '×1', chance: '25%', qualifier: 'Hard / Pro' },
  ],
  'securement-silo': [
    { item: 'Legendary Suffix Mod (Burn/Vortex/Surge)', quantity: '×2-3', chance: '100%' },
    { item: 'Securement Deviation', quantity: '×1', chance: '20%-35%', qualifier: 'Silo clear' },
    { item: 'Cradle Upgrade Energy Links', quantity: '×1,200', chance: '100%' },
  ],
  'deviation-spawn': [
    { item: 'Wild Securable Deviation (Lv 1–5)', quantity: '×1', chance: '100%' },
    { item: 'Anomaly Mutation Trait', quantity: '×1', chance: '15%', qualifier: 'shiny variant' },
  ],
  'prime-war': [
    { item: 'Prime War Starchrom Box', quantity: '×600-1,000', chance: '100%', qualifier: 'first clear' },
    { item: 'Resonance / Keyword Mod Crate', quantity: '×2', chance: '100%' },
    { item: 'Platinum Crystal & Tungsten', quantity: '×12', chance: '100%' },
  ],
  'public-crisis': [
    { item: 'Controller / Sproutlet Cache', quantity: '×30-80', chance: '100%' },
    { item: 'Stardust Source & Acid', quantity: '×20-40', chance: '100%' },
    { item: 'Memetic Formula Page', quantity: '×1', chance: '18%' },
  ],
  'rift-anchor': [
    { item: 'Echoes of Stardust Unlock', quantity: '×1', chance: '100%' },
    { item: 'Energy Links', quantity: '×400', chance: '100%' },
  ],
  'fragrant-cape': [
    { item: 'Elite Aberration Mod', quantity: '×1', chance: '100%' },
    { item: 'Stardust Source & Herbs', quantity: '×25', chance: '100%' },
  ],
  'frost-forge': [
    { item: 'Frost Vortex Suffix Mod', quantity: '×1-2', chance: '100%' },
    { item: 'Cold Crystal / Thermal Core', quantity: '×8', chance: '85%' },
  ],
  'furnace-lair': [
    { item: 'Burn / Blaze Suffix Mod', quantity: '×1-2', chance: '100%' },
    { item: 'Chaosium Ore & Charcoal', quantity: '×15', chance: '100%' },
  ],
  'gaia-military-base': [
    { item: 'Rosetta Security Keycard & Mods', quantity: '×1-2', chance: '100%' },
    { item: 'Platinum Crystal', quantity: '×4', chance: '80%' },
  ],
  'gaia-research-center': [
    { item: 'Endgame Mod Parts & Cortex Lv.3', quantity: '×2-4', chance: '100%' },
    { item: 'Rare Deviation Capsule', quantity: '×1', chance: '25%' },
  ],
  'ore-startrace': [
    { item: 'Startrace Ore', quantity: '×20-38', chance: '100%', qualifier: 'Solar Drill + Digby' },
    { item: 'Tungsten Ore', quantity: '×12-24', chance: '100%' },
    { item: 'Stardust Source (Electric Furnace)', quantity: '×40-60', chance: '100%', qualifier: 'with Oil Processing' },
  ],
  'ore-tungsten': [
    { item: 'Tungsten Ore', quantity: '×25-48', chance: '100%' },
    { item: 'Aluminum Ore', quantity: '×20-40', chance: '85%' },
    { item: 'Sulfur & Crushed Stone', quantity: '×15-30', chance: '100%' },
  ],
  'ore-gold-silver': [
    { item: 'Gold Ore', quantity: '×8-18', chance: '35%', qualifier: 'Highland ridges / Red Sands' },
    { item: 'Silver Ore', quantity: '×12-28', chance: '65%', qualifier: 'Solar Drill + Canned Seafood' },
    { item: 'Tungsten / Iron Bonus Ore', quantity: '×20-35', chance: '100%' },
  ],
  'ore-iron-copper': [
    { item: 'Iron Ore', quantity: '×30-55', chance: '100%', qualifier: 'Iron River / Broken Delta' },
    { item: 'Copper & Tin Ore', quantity: '×30-50', chance: '100%', qualifier: 'Dayton Wetlands' },
    { item: 'Coal & Gravel', quantity: '×20-40', chance: '100%' },
  ],
  'hunting-grounds': [
    { item: 'Raw Hide / Bear / Wolf / Croc Skin', quantity: '×6-16', chance: '100%' },
    { item: 'Golden / Highland Sheep Wool', quantity: '×4-10', chance: '60%', qualifier: 'Red Sands & Onyx Tundra rams' },
    { item: 'Prime Game Meat & Animal Fat', quantity: '×8-20', chance: '100%' },
  ],
  'herbs-crops': [
    { item: 'Scarlet Calamus / Honeysuckle / Aloe', quantity: '×6-15', chance: '100%' },
    { item: 'Morel / Coneflower / Snow Lotus', quantity: '×4-10', chance: '75%' },
    { item: 'Crop Seeds (Deviated Chance)', quantity: '×2-5', chance: '45%' },
  ],
  'acid-salt-sulfur': [
    { item: 'Sulfur Crystals', quantity: '×25-50', chance: '100%', qualifier: 'Red Sands / Ember Strand' },
    { item: 'Seawater -> Sea Salt (Stove)', quantity: '×20-40', chance: '100%', qualifier: 'East Coast / Tidal Bore' },
    { item: 'Impure Acid / Crude Oil (Pump)', quantity: '×15-30/hr', chance: '100%' },
  ],
};

export const MAP_RESOURCE_AREAS: ResourceAreaPolygon[] = [
  {
    id: 'res-pollution-blackfell',
    name: 'Red Sands Pollution Belt',
    kind: 'pollution',
    color: '#a855f7',
    scenario: 'manibus',
    region: 'Red Sands',
    resources: ['Impure Acid', 'Startrace Ore', 'Stardust Pollution (100+)'],
    coordinates: [
      [-318, 372],
      [-282, 376],
      [-278, 434],
      [-322, 430],
    ],
  },
  {
    id: 'res-oil-blackfell',
    name: 'Blackfell Crude Oil Fields',
    kind: 'oil',
    color: '#f59e0b',
    scenario: 'manibus',
    region: 'Red Sands',
    resources: ['Crude Oil (Pump Zones)', 'Portable Mixed Fuel'],
    coordinates: [
      [-326, 408],
      [-288, 412],
      [-292, 452],
      [-330, 444],
    ],
  },
  {
    id: 'res-tungsten-chalk',
    name: 'Chalk Peak Tungsten & Silver Ridge',
    kind: 'tungsten',
    color: '#38bdf8',
    scenario: 'manibus',
    region: 'Chalk Peak',
    resources: ['Tungsten Ore', 'Aluminum Ore', 'Silver Veins'],
    coordinates: [
      [-435, 290],
      [-378, 294],
      [-382, 355],
      [-442, 348],
    ],
  },
  {
    id: 'res-gold-red-sands',
    name: 'Red Sands Gold & Startrace Veins',
    kind: 'gold_silver',
    color: '#eab308',
    scenario: 'manibus',
    region: 'Red Sands',
    resources: ['Gold Ore', 'Startrace Ore', 'Tungsten Ore'],
    coordinates: [
      [-342, 355],
      [-308, 360],
      [-310, 396],
      [-346, 390],
    ],
  },
  {
    id: 'res-wildlife-dayton',
    name: 'Dayton Deer & Boar Marshlands',
    kind: 'wildlife',
    color: '#22c55e',
    scenario: 'manibus',
    region: 'Dayton Wetlands',
    resources: ['Raw Meat', 'Raw Hide', 'Copper & Tin Ore'],
    coordinates: [
      [-434, 438],
      [-392, 442],
      [-395, 486],
      [-438, 480],
    ],
  },
  {
    id: 'res-stardust-ember',
    name: 'Ember Strand Thermal & Stardust Basin',
    kind: 'stardust',
    color: '#fb7185',
    scenario: 'way_of_winter',
    region: 'Ember Strand',
    resources: ['Startrace Ore', 'Tungsten Ore', 'Chaosium Fuel'],
    coordinates: [
      [-132, 55],
      [-56, 62],
      [-60, 145],
      [-136, 138],
    ],
  },
  {
    id: 'res-wildlife-tundra',
    name: 'Onyx Tundra Polar Bear & Wolf Range',
    kind: 'wildlife',
    color: '#2dd4bf',
    scenario: 'way_of_winter',
    region: 'Onyx Tundra',
    resources: ['Polar Bear Hide', 'Wolf Hide', 'Snow Lotus'],
    coordinates: [
      [-134, 342],
      [-68, 346],
      [-72, 422],
      [-138, 415],
    ],
  },
  {
    id: 'res-iron-river-veins',
    name: 'Iron River Winding Ridge Iron Belt',
    kind: 'tungsten',
    color: '#d97706',
    scenario: 'manibus',
    region: 'Iron River',
    resources: ['Dense Iron Ore', 'Coal', 'Calamus & Herbs'],
    coordinates: [
      [-378, 434],
      [-335, 438],
      [-338, 478],
      [-382, 472],
    ],
  },
  {
    id: 'res-blackheart-wolves',
    name: 'Blackheart Lunar Wolf & Sulfur Plains',
    kind: 'wildlife',
    color: '#c084fc',
    scenario: 'way_of_winter',
    region: 'Blackheart Region',
    resources: ['Lunar Wolf Skin', 'Sulfur', 'Startrace Ore'],
    coordinates: [
      [-262, 348],
      [-202, 355],
      [-206, 405],
      [-266, 398],
    ],
  },
  {
    id: 'res-delta-salt-copper',
    name: 'Broken Delta Silver, Tin & Salt Coast',
    kind: 'gold_silver',
    color: '#22c55e',
    scenario: 'manibus',
    region: 'Broken Delta',
    resources: ['Silver Ore', 'Tin Ore', 'Sea Salt', 'Crocodile Hide'],
    coordinates: [
      [-488, 365],
      [-455, 368],
      [-458, 468],
      [-492, 462],
    ],
  },
];

export const BUILT_IN_FILTER_PRESETS: FilterPresetDef[] = [
  {
    id: 'preset-core',
    name: 'Core Navigation & Gathering',
    description: 'Teleport Towers, Monoliths, Silos, Strongholds, Startrace/Tungsten/Gold Ores & Animals',
    builtIn: true,
    categories: [
      'teleport-tower',
      'monolith',
      'securement-silo',
      'mayfly-stronghold',
      'rift-anchor',
      'mystical-crate',
      'ore-startrace',
      'ore-tungsten',
      'ore-gold-silver',
      'hunting-grounds',
      'acid-salt-sulfur',
    ],
    resourceAreaIds: [],
  },
  {
    id: 'preset-gathering-all',
    name: 'Ores, Animals & Herbs Run',
    description: 'All Ore Veins, Animal Hunting Spots, Herbs/Crops, Salt/Sulfur & Teleport Towers',
    builtIn: true,
    categories: [
      'teleport-tower',
      'ore-startrace',
      'ore-tungsten',
      'ore-gold-silver',
      'ore-iron-copper',
      'hunting-grounds',
      'herbs-crops',
      'acid-salt-sulfur',
    ],
    resourceAreaIds: [
      'res-tungsten-chalk',
      'res-gold-red-sands',
      'res-wildlife-dayton',
      'res-wildlife-tundra',
      'res-iron-river-veins',
      'res-blackheart-wolves',
      'res-delta-salt-copper',
    ],
  },
  {
    id: 'preset-acid-fuel',
    name: 'Acid & Fuel Run',
    description: 'Car Trunks, Salt/Sulfur/Acid, Oil Fields, Pollution Zones & Mine Workshops',
    builtIn: true,
    categories: [
      'car-trunk',
      'acid-salt-sulfur',
      'mine-workshop',
      'extraction-site',
      'teleport-tower',
    ],
    resourceAreaIds: ['res-pollution-blackfell', 'res-oil-blackfell'],
  },
  {
    id: 'preset-crates',
    name: 'Mystical & Weapon Crates',
    description: 'Mystical, Weapon, Gear, Morphic & Echo Loot containers + Settlements',
    builtIn: true,
    categories: [
      'mystical-crate',
      'weapon-crate',
      'gear-crate',
      'morphic-crate',
      'echo-loot',
      'settlement',
    ],
    resourceAreaIds: [],
  },
  {
    id: 'preset-ore',
    name: 'Stardust & Gold Ore',
    description: 'Startrace, Tungsten, Gold/Silver Veins, Sulfur, Mine Workshops & Hotspot Zones',
    builtIn: true,
    categories: [
      'teleport-tower',
      'ore-startrace',
      'ore-tungsten',
      'ore-gold-silver',
      'ore-iron-copper',
      'acid-salt-sulfur',
      'mine-workshop',
    ],
    resourceAreaIds: [
      'res-tungsten-chalk',
      'res-gold-red-sands',
      'res-stardust-ember',
      'res-iron-river-veins',
      'res-delta-salt-copper',
    ],
  },
  {
    id: 'preset-deviations-bosses',
    name: 'Deviations & Bosses',
    description: 'Deviation Spawns, Monoliths, Silos, Prime Wars, Public Crises & Lairs',
    builtIn: true,
    categories: [
      'deviation-spawn',
      'monolith',
      'securement-silo',
      'prime-war',
      'public-crisis',
      'fragrant-cape',
      'frost-forge',
      'furnace-lair',
      'gaia-research-center',
    ],
    resourceAreaIds: [],
  },
];

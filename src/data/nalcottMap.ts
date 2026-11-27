import type { NalcottMapData, ScenarioId } from '../types/game';
import rawMapData from './nalcottMap.json';

export const NALCOTT_MAP = rawMapData as NalcottMapData;

export const NALCOTT_MAP_BOUNDS: [[number, number], [number, number]] = [
  [-512, 0],
  [0, 512],
];

export interface NalcottPoi {
  id: string;
  typeIndex: number;
  typeKey: string;
  typeLabel: string;
  color: string;
  name: string;
  level: number | null;
  lat: number;
  lng: number;
  near: string | null;
  region: string;
  scenario: Extract<ScenarioId, 'manibus' | 'way_of_winter'>;
}

const WINTER_REGIONS = new Set(['Onyx Tundra', 'Ember Strand', 'Vena Fjord']);

function inferNearestRegion(lat: number, lng: number): string {
  let bestName = NALCOTT_MAP.regions[0]?.name ?? 'Nalcott Island';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const r of NALCOTT_MAP.regions) {
    const dLat = lat - r.lat;
    const dLng = lng - r.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      bestName = r.name;
    }
  }
  return bestName;
}

export const NALCOTT_POIS: NalcottPoi[] = NALCOTT_MAP.points.map(
  ([id, typeIndex, name, level, lat, lng, near]) => {
    const typeMeta = NALCOTT_MAP.types[typeIndex] ?? {
      key: 'place',
      label: 'Point of Interest',
      color: '#cbd5e1',
    };
    const region = inferNearestRegion(lat, lng);
    const scenario = WINTER_REGIONS.has(region) || lat >= -190 ? 'way_of_winter' : 'manibus';
    return {
      id,
      typeIndex,
      typeKey: typeMeta.key,
      typeLabel: typeMeta.label,
      color: typeMeta.color,
      name,
      level,
      lat,
      lng,
      near,
      region,
      scenario,
    };
  },
);

export const NALCOTT_DEFAULT_TYPE_KEYS: string[] = NALCOTT_MAP.types
  .filter((t) => t.defaultOn)
  .map((t) => t.key);

export interface NalcottTypeGroup {
  id: string;
  label: string;
  keys: string[];
}

export const NALCOTT_TYPE_GROUPS: NalcottTypeGroup[] = [
  {
    id: 'world',
    label: 'World & Fast Travel',
    keys: ['teleport-tower', 'monolith', 'securement-silo', 'worldstone', 'rift-anchor'],
  },
  {
    id: 'settlements',
    label: 'Strongholds & Safe Zones',
    keys: [
      'mayfly-stronghold',
      'settlement',
      'harvesters-market',
      'camp',
      'arena',
      'contest-area',
      'attackers-base',
    ],
  },
  {
    id: 'resources',
    label: 'Resources, Labs & Regions',
    keys: ['extraction-site', 'mine-workshop', 'thermal-tower', 'research-lab', 'place'],
  },
];

export interface MapCameraPreset {
  id: 'all' | 'manibus' | 'way_of_winter';
  label: string;
  shortLabel: string;
  subtitle: string;
  center: [number, number];
  zoom: number;
}

export const NALCOTT_CAMERA_PRESETS: MapCameraPreset[] = [
  {
    id: 'all',
    label: 'All Nalcott',
    shortLabel: 'Nalcott',
    subtitle: 'Full Nalcott Island & Northern Sectors',
    center: [-265, 310],
    zoom: 0,
  },
  {
    id: 'manibus',
    label: "Manibus & Evolution's Call",
    shortLabel: 'Manibus',
    subtitle: 'Dayton Wetlands, Broken Delta, Iron River, Chalk Peak & Red Sands',
    center: [-375, 405],
    zoom: 1,
  },
  {
    id: 'way_of_winter',
    label: 'The Way of Winter',
    shortLabel: 'Winter',
    subtitle: 'Vena Fjord, Onyx Tundra, Ember Strand & Blackheart',
    center: [-110, 315],
    zoom: 1,
  },
];

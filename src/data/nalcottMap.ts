import type { NalcottMapData, ScenarioId } from '../types/game';
import { DEVIATIONS } from './deviationsAndChef';
import { MAP_CATEGORIES } from './mapCatalog';
import rawGeneratedData from './generatedMapMarkers.json';
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
  tierNote?: string;
  imageUrl?: string;
}

const DEVIATION_BY_ID = new Map(DEVIATIONS.map((d) => [d.id, d]));
const DEVIATION_BY_NAME = new Map(DEVIATIONS.map((d) => [d.name.toLowerCase(), d]));

function resolveDeviationImageUrl(id: string, label: string): string | undefined {
  const slug = id.replace(/^devspawn-/, '').replace(/-\d+$/, '');
  const titleName = label.split(' · ')[0]?.trim().toLowerCase() ?? '';
  return DEVIATION_BY_ID.get(slug)?.imageUrl ?? DEVIATION_BY_NAME.get(titleName)?.imageUrl;
}

const WINTER_REGIONS = new Set(['Onyx Tundra', 'Ember Strand', 'Vena Fjord']);

const RAW_KEY_REMAP: Record<string, string> = {
  camp: 'birdview-camp',
  'research-lab': 'gaia-research-center',
};

const CATEGORY_META_BY_KEY = new Map(MAP_CATEGORIES.map((c) => [c.key, c]));

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

const REAL_ANCHOR_POIS: NalcottPoi[] = NALCOTT_MAP.points.map(
  ([id, typeIndex, name, level, lat, lng, near]) => {
    const rawTypeMeta = NALCOTT_MAP.types[typeIndex] ?? {
      key: 'place',
      label: 'Point of Interest',
      color: '#cbd5e1',
    };
    const mappedKey = RAW_KEY_REMAP[rawTypeMeta.key] ?? rawTypeMeta.key;
    const catalogMeta = CATEGORY_META_BY_KEY.get(mappedKey);
    const region = inferNearestRegion(lat, lng);
    const scenario = WINTER_REGIONS.has(region) || lat >= -190 ? 'way_of_winter' : 'manibus';
    return {
      id,
      typeIndex,
      typeKey: mappedKey,
      typeLabel: catalogMeta?.label ?? rawTypeMeta.label,
      color: catalogMeta?.color ?? rawTypeMeta.color,
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

type GeneratedMarkerTuple = [
  string,
  string,
  string,
  number | null,
  number,
  number,
  string,
  Extract<ScenarioId, 'manibus' | 'way_of_winter'>,
  string | null,
];

const generatedList = (rawGeneratedData as { markers: GeneratedMarkerTuple[] }).markers;

const DENSE_POIS: NalcottPoi[] = generatedList.map(
  ([id, catKey, name, level, lat, lng, region, scenario, near], idx) => {
    const meta = CATEGORY_META_BY_KEY.get(catKey);
    const imageUrl =
      catKey === 'deviation-spawn' ? resolveDeviationImageUrl(id, name) : undefined;
    return {
      id,
      typeIndex: 100 + idx,
      typeKey: catKey,
      typeLabel: meta?.label ?? catKey,
      color: meta?.color ?? '#06b6d4',
      name,
      level,
      lat,
      lng,
      near,
      region,
      scenario,
      ...(imageUrl ? { imageUrl } : {}),
    };
  },
);

export const ALL_MAP_MARKERS: NalcottPoi[] = [...REAL_ANCHOR_POIS, ...DENSE_POIS];

// Preserve NALCOTT_POIS export for Global Search & companion.test.ts compatibility
export const NALCOTT_POIS: NalcottPoi[] = ALL_MAP_MARKERS;

export const NALCOTT_DEFAULT_TYPE_KEYS: string[] = MAP_CATEGORIES.filter(
  (c) => c.defaultOn,
).map((c) => c.key);

export const MAP_COUNTS_BY_CATEGORY: Map<string, number> = (() => {
  const counts = new Map<string, number>();
  for (const m of ALL_MAP_MARKERS) {
    counts.set(m.typeKey, (counts.get(m.typeKey) ?? 0) + 1);
  }
  return counts;
})();

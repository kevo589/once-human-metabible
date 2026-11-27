import type { AudioToneId } from '../../utils/mapAudio';
import type { LabelDisplayMode } from './TacticalCanvasLayer';

export interface CategoryPreference {
  iconScale: number;
  labelMode: LabelDisplayMode;
  audioEnabled: boolean;
  audioTone: AudioToneId;
}

export const DEFAULT_CATEGORY_PREF: CategoryPreference = {
  iconScale: 1.0,
  labelMode: 'hover',
  audioEnabled: false,
  audioTone: 'chime',
};

export type CustomMarkerIconId = 'place' | 'star' | 'mystical-crate' | 'skull' | 'flag' | 'mine-workshop';

export interface CustomMarkerItem {
  id: string;
  title: string;
  icon: CustomMarkerIconId;
  color: string;
  notes: string;
  lat: number;
  lng: number;
  visible: boolean;
  createdAt: string;
}

export type DrawingKind = 'polyline' | 'polygon';

export interface MapDrawingItem {
  id: string;
  title: string;
  kind: DrawingKind;
  color: string;
  points: [number, number][];
  visible: boolean;
  distanceMeters: number;
  createdAt: string;
}

export interface DevLogEntry {
  id: string;
  category: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  scenario: 'manibus' | 'way_of_winter';
}

export interface CustomPresetRecord {
  id: string;
  name: string;
  categories: string[];
  resourceAreaIds: string[];
}

export interface GlobalMapFlags {
  hideDiscovered: boolean;
  showGrid: boolean;
  devLoggerEnabled: boolean;
  resourceOpacity: number;
}

export const DEFAULT_GLOBAL_FLAGS: GlobalMapFlags = {
  hideDiscovered: false,
  showGrid: false,
  devLoggerEnabled: false,
  resourceOpacity: 0.24,
};

/** 1 map coordinate unit over 512 Nalcott width corresponds to ~25m in-world scale. */
export const METERS_PER_MAP_UNIT = 25;

export function calculatePolylineMeters(points: [number, number][], closed = false): number {
  if (points.length < 2) return 0;
  let totalUnits = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dLat = points[i][0] - points[i - 1][0];
    const dLng = points[i][1] - points[i - 1][1];
    totalUnits += Math.hypot(dLat, dLng);
  }
  if (closed && points.length >= 3) {
    const dLat = points[0][0] - points[points.length - 1][0];
    const dLng = points[0][1] - points[points.length - 1][1];
    totalUnits += Math.hypot(dLat, dLng);
  }
  return Math.round(totalUnits * METERS_PER_MAP_UNIT);
}

export function formatDistanceLabel(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters} m`;
}

export interface MapBackupPayload {
  version: 2;
  exportedAt: string;
  enabledCategories: string[];
  discoveredIds: string[];
  categoryPrefs: Record<string, CategoryPreference>;
  customMarkers: CustomMarkerItem[];
  drawings: MapDrawingItem[];
  customPresets: CustomPresetRecord[];
  enabledResourceAreaIds: string[];
  globalFlags: GlobalMapFlags;
}

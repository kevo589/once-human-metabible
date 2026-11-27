import L from 'leaflet';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  Crosshair,
  Eye,
  EyeOff,
  Link2,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageOverlay,
  MapContainer,
  Marker,
  Pane,
  Polygon,
  Polyline,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import {
  MAP_CATEGORIES,
  MAP_DROP_TABLES,
  MAP_REGIONS,
  MAP_RESOURCE_AREAS,
  MAP_SCENARIOS,
} from '../../data/mapCatalog';
import {
  ALL_MAP_MARKERS,
  NALCOTT_DEFAULT_TYPE_KEYS,
  NALCOTT_MAP,
  NALCOTT_MAP_BOUNDS,
  type NalcottPoi,
} from '../../data/nalcottMap';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { playMapAudioTone } from '../../utils/mapAudio';
import { buildMapShareUrl, readMapUrlParams, syncMapUrlParams } from '../../utils/mapUrlState';
import { CategorySettingsPopover } from './CategorySettingsPopover';
import { CategoryGlyph, PLAYER_POSITION_ICON, getCustomPinDivIcon } from './mapIcons';
import {
  DEFAULT_CATEGORY_PREF,
  DEFAULT_GLOBAL_FLAGS,
  calculatePolylineMeters,
  formatDistanceLabel,
  type CategoryPreference,
  type CustomMarkerItem,
  type CustomPresetRecord,
  type DevLogEntry,
  type DrawingKind,
  type GlobalMapFlags,
  type MapBackupPayload,
  type MapDrawingItem,
} from './mapState';
import { TacticalCanvasLayer, type CategoryVisualSetting } from './TacticalCanvasLayer';
import {
  CoordinateGridLayer,
  CustomMarkerModal,
  DevCoordinateLoggerDrawer,
  GlobalSettingsModal,
  PresetsManagerPopover,
} from './TacticalPopovers';
import { TacticalSidebar } from './TacticalSidebar';

interface InteractiveMapViewProps {
  focusedMarkerId?: string | null;
}

interface ContextMenuState {
  screenX: number;
  screenY: number;
  lat: number;
  lng: number;
}

const DRAWING_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];
const CATEGORY_MAP = new Map(MAP_CATEGORIES.map((c) => [c.key, c]));

function inferNearestRegion(lat: number, lng: number): string {
  let best = NALCOTT_MAP.regions[0]?.name ?? 'Nalcott Island';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const r of NALCOTT_MAP.regions) {
    const dl = lat - r.lat;
    const dg = lng - r.lng;
    const d = dl * dl + dg * dg;
    if (d < bestDist) {
      bestDist = d;
      best = r.name;
    }
  }
  return best;
}

function HybridNalcottTiles() {
  const map = useMap();

  useEffect(() => {
    const HybridLayer = L.TileLayer.extend({
      getTileUrl(coords: L.Coords) {
        if (coords.z >= 0 && coords.z <= 2) {
          return `./maps/nalcott/${coords.z}/${coords.x}/${coords.y}.webp`;
        }
        return NALCOTT_MAP.tileUrl
          .replace('{z}', String(coords.z))
          .replace('{x}', String(coords.x))
          .replace('{y}', String(coords.y));
      },
    });

    const layer = new (HybridLayer as unknown as new (
      url: string,
      opts: L.TileLayerOptions,
    ) => L.TileLayer)('', {
      tileSize: NALCOTT_MAP.tileSize,
      minZoom: -1,
      minNativeZoom: 0,
      maxZoom: 6,
      maxNativeZoom: NALCOTT_MAP.maxNativeZoom,
      bounds: NALCOTT_MAP_BOUNDS,
      noWrap: true,
      keepBuffer: 2,
      attribution: 'Map art © Starry Studio / NetEase Games',
    });

    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map]);

  return null;
}

function MapCameraAndEvents({
  flyRequest,
  fitBoundsRequest,
  drawingMode,
  placeMarkerMode,
  devLoggerEnabled,
  onTelemetry,
  onAddDrawingPoint,
  onPlaceMarkerCoords,
  onLogDevCoord,
  onOpenContextMenu,
}: {
  flyRequest: { lat: number; lng: number; zoom: number; seq: number } | null;
  fitBoundsRequest: { bounds: [[number, number], [number, number]]; seq: number } | null;
  drawingMode: boolean;
  placeMarkerMode: boolean;
  devLoggerEnabled: boolean;
  onTelemetry: (zoom: number, coords?: { lng: number; lat: number }) => void;
  onAddDrawingPoint: (lat: number, lng: number) => void;
  onPlaceMarkerCoords: (lat: number, lng: number) => void;
  onLogDevCoord: (lat: number, lng: number) => void;
  onOpenContextMenu: (ctx: ContextMenuState) => void;
}) {
  const map = useMap();
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (flyRequest) {
      map.flyTo([flyRequest.lat, flyRequest.lng], flyRequest.zoom, { duration: 0.55 });
    }
  }, [flyRequest, map]);

  useEffect(() => {
    if (fitBoundsRequest) {
      map.fitBounds(fitBoundsRequest.bounds, { padding: [24, 24], animate: true });
    }
  }, [fitBoundsRequest, map]);

  // Mobile long-press support (~480ms stationary touch)
  useEffect(() => {
    const el = map.getContainer();

    const cancelTimer = () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length !== 1) {
        cancelTimer();
        return;
      }
      const t = ev.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
      cancelTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        const rect = el.getBoundingClientRect();
        const pt = L.point(t.clientX - rect.left, t.clientY - rect.top);
        const ll = map.containerPointToLatLng(pt);
        onOpenContextMenu({
          screenX: t.clientX,
          screenY: t.clientY,
          lat: Math.max(-512, Math.min(0, Number(ll.lat.toFixed(2)))),
          lng: Math.max(0, Math.min(512, Number(ll.lng.toFixed(2)))),
        });
      }, 480);
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!touchStartRef.current || ev.touches.length !== 1) {
        cancelTimer();
        return;
      }
      const t = ev.touches[0];
      const moved = Math.hypot(t.clientX - touchStartRef.current.x, t.clientY - touchStartRef.current.y);
      if (moved > 8) cancelTimer();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', cancelTimer);
    el.addEventListener('touchcancel', cancelTimer);

    return () => {
      cancelTimer();
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', cancelTimer);
      el.removeEventListener('touchcancel', cancelTimer);
    };
  }, [map, onOpenContextMenu]);

  useMapEvents({
    zoomend() {
      onTelemetry(map.getZoom());
    },
    mousemove(e) {
      onTelemetry(map.getZoom(), {
        lng: Math.max(0, Math.min(512, Number(e.latlng.lng.toFixed(1)))),
        lat: Math.max(-512, Math.min(0, Number(e.latlng.lat.toFixed(1)))),
      });
    },
    click(e) {
      const lat = Math.max(-512, Math.min(0, Number(e.latlng.lat.toFixed(2))));
      const lng = Math.max(0, Math.min(512, Number(e.latlng.lng.toFixed(2))));
      if (drawingMode) {
        onAddDrawingPoint(lat, lng);
        return;
      }
      if (placeMarkerMode) {
        onPlaceMarkerCoords(lat, lng);
        return;
      }
      if (devLoggerEnabled) {
        onLogDevCoord(lat, lng);
      }
    },
    contextmenu(e) {
      L.DomEvent.preventDefault(e.originalEvent);
      const lat = Math.max(-512, Math.min(0, Number(e.latlng.lat.toFixed(2))));
      const lng = Math.max(0, Math.min(512, Number(e.latlng.lng.toFixed(2))));
      onOpenContextMenu({
        screenX: e.originalEvent.clientX,
        screenY: e.originalEvent.clientY,
        lat,
        lng,
      });
    },
  });

  return null;
}

function CustomZoomControls({ onReset }: { onReset: () => void }) {
  const map = useMap();
  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-[#27272a] bg-[#121214]/94 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => map.zoomIn(1)}
        className="flex h-9 w-9 items-center justify-center border-b border-[#27272a] text-zinc-200 transition hover:bg-[#18181b] hover:text-cyan-300"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut(1)}
        className="flex h-9 w-9 items-center justify-center border-b border-[#27272a] text-zinc-200 transition hover:bg-[#18181b] hover:text-cyan-300"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center text-zinc-300 transition hover:bg-[#18181b] hover:text-cyan-300"
        aria-label="Reset camera view"
        title="Reset camera view"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function InteractiveMapView({ focusedMarkerId }: InteractiveMapViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initialUrl = useMemo(() => readMapUrlParams(), []);

  const initialPinFocus = useMemo(() => {
    const targetId = focusedMarkerId ?? initialUrl.pin;
    if (!targetId) return null;
    return ALL_MAP_MARKERS.find((m) => m.id === targetId) ?? null;
  }, [focusedMarkerId, initialUrl.pin]);

  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );
  const [scenarioId, setScenarioId] = useState<string>(
    initialPinFocus?.scenario ?? initialUrl.scenario ?? 'all',
  );
  const [regionId, setRegionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persisted State
  const [enabledCategoriesList, setEnabledCategoriesList] = useLocalStorage<string[]>(
    'oh-map-enabled-cats-v2',
    NALCOTT_DEFAULT_TYPE_KEYS,
  );
  const [discoveredIdsList, setDiscoveredIdsList] = useLocalStorage<string[]>(
    'oh-found-map-pois',
    [],
  );
  const [categoryPrefs, setCategoryPrefs] = useLocalStorage<Record<string, CategoryPreference>>(
    'oh-map-cat-prefs-v2',
    {},
  );
  const [customMarkers, setCustomMarkers] = useLocalStorage<CustomMarkerItem[]>(
    'oh-map-custom-markers-v2',
    [],
  );
  const [drawings, setDrawings] = useLocalStorage<MapDrawingItem[]>('oh-map-drawings-v2', []);
  const [customPresets, setCustomPresets] = useLocalStorage<CustomPresetRecord[]>(
    'oh-map-presets-v2',
    [],
  );
  const [enabledResourceIdsList, setEnabledResourceIdsList] = useLocalStorage<string[]>(
    'oh-map-resources-v2',
    [],
  );
  const [flags, setFlags] = useLocalStorage<GlobalMapFlags>(
    'oh-map-global-flags-v2',
    DEFAULT_GLOBAL_FLAGS,
  );
  const [playerPosition, setPlayerPosition] = useLocalStorage<{ lng: number; lat: number } | null>(
    'oh-map-player-pos-v2',
    null,
  );

  // Ephemeral UI / Interaction States
  const [selectedPoi, setSelectedPoi] = useState<NalcottPoi | null>(initialPinFocus);
  const [settingsCatKey, setSettingsCatKey] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [placeMarkerMode, setPlaceMarkerMode] = useState(false);
  const [pendingMarkerModalCoords, setPendingMarkerModalCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [activeDrawingKind, setActiveDrawingKind] = useState<DrawingKind | null>(null);
  const [draftDrawingPoints, setDraftDrawingPoints] = useState<[number, number][]>([]);
  const [draftDrawingColor, setDraftDrawingColor] = useState(DRAWING_COLORS[0]);
  const [draftDrawingTitle, setDraftDrawingTitle] = useState('Farming Route');

  const [devLogs, setDevLogs] = useState<DevLogEntry[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [flyRequest, setFlyRequest] = useState<{
    lat: number;
    lng: number;
    zoom: number;
    seq: number;
  } | null>(() => {
    if (initialPinFocus) {
      return { lat: initialPinFocus.lat, lng: initialPinFocus.lng, zoom: 4, seq: 1 };
    }
    if (typeof initialUrl.x === 'number' && typeof initialUrl.y === 'number') {
      return {
        lat: initialUrl.y,
        lng: initialUrl.x,
        zoom: initialUrl.z ?? 3,
        seq: 1,
      };
    }
    return null;
  });
  const [fitBoundsRequest, setFitBoundsRequest] = useState<{
    bounds: [[number, number], [number, number]];
    seq: number;
  } | null>(null);

  const enabledCategories = useMemo(
    () => new Set(enabledCategoriesList),
    [enabledCategoriesList],
  );
  const discoveredSet = useMemo(() => new Set(discoveredIdsList), [discoveredIdsList]);
  const enabledResourceAreaIds = useMemo(
    () => new Set(enabledResourceIdsList),
    [enabledResourceIdsList],
  );

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2400);
  }, []);

  // Sync external search focus from App.tsx (Ctrl+K)
  useEffect(() => {
    if (!focusedMarkerId) return;
    const hit = ALL_MAP_MARKERS.find((m) => m.id === focusedMarkerId);
    if (!hit) return;
    setEnabledCategoriesList((prev) => (prev.includes(hit.typeKey) ? prev : [...prev, hit.typeKey]));
    setScenarioId(hit.scenario);
    setRegionId('all');
    setSelectedPoi(hit);
    setFlyRequest((prev) => ({ lat: hit.lat, lng: hit.lng, zoom: 4, seq: (prev?.seq ?? 0) + 1 }));
    syncMapUrlParams({
      scenario: hit.scenario,
      x: hit.lng,
      y: hit.lat,
      z: 4,
      pin: hit.id,
    });
  }, [focusedMarkerId, setEnabledCategoriesList]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await wrapperRef.current.requestFullscreen?.().catch(() => {});
    }
  };

  // Scenario + Region scoped POIs (regardless of checkbox state, used for counters & search)
  const scopedPois = useMemo(() => {
    return ALL_MAP_MARKERS.filter((poi) => {
      if (scenarioId === 'manibus' && poi.scenario !== 'manibus') return false;
      if (scenarioId === 'way_of_winter' && poi.scenario !== 'way_of_winter') return false;
      if (regionId !== 'all' && poi.region !== regionId) return false;
      return true;
    });
  }, [scenarioId, regionId]);

  const totalCountsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const poi of scopedPois) {
      map.set(poi.typeKey, (map.get(poi.typeKey) ?? 0) + 1);
    }
    return map;
  }, [scopedPois]);

  const discoveredCountsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const poi of scopedPois) {
      if (discoveredSet.has(poi.id)) {
        map.set(poi.typeKey, (map.get(poi.typeKey) ?? 0) + 1);
      }
    }
    return map;
  }, [scopedPois, discoveredSet]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchMatchedPois = useMemo(() => {
    if (!normalizedSearch) return [];
    const dropMatchingCats = new Set<string>();
    for (const cat of MAP_CATEGORIES) {
      const drops = MAP_DROP_TABLES[cat.key];
      if (drops && drops.some((d) => d.item.toLowerCase().includes(normalizedSearch))) {
        dropMatchingCats.add(cat.key);
      }
    }
    return scopedPois.filter(
      (poi) =>
        poi.name.toLowerCase().includes(normalizedSearch) ||
        poi.typeLabel.toLowerCase().includes(normalizedSearch) ||
        poi.region.toLowerCase().includes(normalizedSearch) ||
        (poi.near && poi.near.toLowerCase().includes(normalizedSearch)) ||
        dropMatchingCats.has(poi.typeKey),
    );
  }, [scopedPois, normalizedSearch]);

  // Final Canvas visible markers (supports all 5,606 simultaneous pins cleanly!)
  const visibleMarkers = useMemo(() => {
    if (normalizedSearch) {
      return flags.hideDiscovered
        ? searchMatchedPois.filter((p) => !discoveredSet.has(p.id))
        : searchMatchedPois;
    }
    return scopedPois.filter((poi) => {
      if (!enabledCategories.has(poi.typeKey)) return false;
      if (flags.hideDiscovered && discoveredSet.has(poi.id)) return false;
      return true;
    });
  }, [
    scopedPois,
    enabledCategories,
    flags.hideDiscovered,
    discoveredSet,
    normalizedSearch,
    searchMatchedPois,
  ]);

  const canvasVisualSettings = useMemo(() => {
    const record: Record<string, CategoryVisualSetting> = {};
    for (const cat of MAP_CATEGORIES) {
      const pref = categoryPrefs[cat.key];
      record[cat.key] = {
        iconScale: pref?.iconScale ?? DEFAULT_CATEGORY_PREF.iconScale,
        labelMode: pref?.labelMode ?? DEFAULT_CATEGORY_PREF.labelMode,
      };
    }
    return record;
  }, [categoryPrefs]);

  const regionIcons = useMemo(
    () =>
      NALCOTT_MAP.regions.map((r) => ({
        ...r,
        icon: L.divIcon({
          className: 'nalcott-region-badge',
          html: `<div class="whitespace-nowrap -translate-x-1/2 -translate-y-1/2 rounded border border-zinc-700/75 bg-[#121214]/82 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-100 shadow-sm backdrop-blur-[2px]">${r.name}</div>`,
          iconSize: [0, 0],
        }),
      })),
    [],
  );

  // Interactions
  const handleSelectPoi = useCallback(
    (poi: NalcottPoi, fly = false) => {
      setSelectedPoi(poi);
      setContextMenu(null);

      const pref = categoryPrefs[poi.typeKey];
      if (pref?.audioEnabled) {
        playMapAudioTone(pref.audioTone);
      }

      if (fly) {
        setFlyRequest((prev) => ({
          lat: poi.lat,
          lng: poi.lng,
          zoom: Math.max(zoomLevel, 4),
          seq: (prev?.seq ?? 0) + 1,
        }));
      }

      syncMapUrlParams({
        scenario: scenarioId,
        x: poi.lng,
        y: poi.lat,
        z: fly ? Math.max(zoomLevel, 4) : zoomLevel,
        pin: poi.id,
      });
    },
    [categoryPrefs, scenarioId, zoomLevel],
  );

  const toggleDiscovered = useCallback(
    (poiId: string) => {
      setDiscoveredIdsList((prev) =>
        prev.includes(poiId) ? prev.filter((id) => id !== poiId) : [...prev, poiId],
      );
    },
    [setDiscoveredIdsList],
  );

  const handleSetManualPlayerPos = useCallback(
    (lat: number, lng: number) => {
      setPlayerPosition({ lat, lng });
      setContextMenu(null);

      // Trigger audio alert chime if any enabled audio-alert category pin lies within ~18 map units (~450m)
      let triggeredTone: CategoryPreference['audioTone'] | null = null;
      let nearbyHits = 0;
      for (const poi of scopedPois) {
        if (!enabledCategories.has(poi.typeKey)) continue;
        const pref = categoryPrefs[poi.typeKey];
        if (!pref?.audioEnabled || pref.audioTone === 'muted') continue;
        const dist = Math.hypot(poi.lat - lat, poi.lng - lng);
        if (dist <= 18) {
          nearbyHits += 1;
          if (!triggeredTone) triggeredTone = pref.audioTone;
        }
      }
      if (triggeredTone) {
        playMapAudioTone(triggeredTone);
        showToast(`Player position set · ${nearbyHits} audio-alert POI(s) nearby!`);
      } else {
        showToast(`Player position set at (${lng.toFixed(1)}, ${lat.toFixed(1)})`);
      }
    },
    [categoryPrefs, enabledCategories, scopedPois, setPlayerPosition, showToast],
  );

  const handleStartDrawing = useCallback((kind: DrawingKind, seedPoint?: [number, number]) => {
    setActiveDrawingKind(kind);
    setDraftDrawingPoints(seedPoint ? [seedPoint] : []);
    setDraftDrawingTitle(kind === 'polyline' ? 'Farming Route' : 'Farm Zone');
    setPlaceMarkerMode(false);
    setContextMenu(null);
  }, []);

  const finishDrawing = () => {
    if (!activeDrawingKind) return;
    const minPts = activeDrawingKind === 'polyline' ? 2 : 3;
    if (draftDrawingPoints.length < minPts) {
      showToast(`Add at least ${minPts} points on the map.`);
      return;
    }
    const distanceMeters = calculatePolylineMeters(
      draftDrawingPoints,
      activeDrawingKind === 'polygon',
    );
    const next: MapDrawingItem = {
      id: `draw-${Date.now()}`,
      title: draftDrawingTitle.trim() || (activeDrawingKind === 'polyline' ? 'Route' : 'Zone'),
      kind: activeDrawingKind,
      color: draftDrawingColor,
      points: draftDrawingPoints,
      visible: true,
      distanceMeters,
      createdAt: new Date().toISOString(),
    };
    setDrawings((prev) => [...prev, next]);
    setActiveDrawingKind(null);
    setDraftDrawingPoints([]);
    showToast(`Saved ${next.title} (${formatDistanceLabel(distanceMeters)})`);
  };

  const handleChangeScenario = (nextScenario: string) => {
    setScenarioId(nextScenario);
    setRegionId('all');
    setSelectedPoi(null);
    const cfg = MAP_SCENARIOS.find((s) => s.id === nextScenario) ?? MAP_SCENARIOS[0];
    setFitBoundsRequest((prev) => ({ bounds: cfg.bounds, seq: (prev?.seq ?? 0) + 1 }));
    syncMapUrlParams({ scenario: nextScenario });
  };

  const handleChangeRegion = (nextRegion: string) => {
    setRegionId(nextRegion);
    setSelectedPoi(null);
    const regCfg = MAP_REGIONS.find((r) => r.id === nextRegion);
    if (regCfg) {
      setFitBoundsRequest((prev) => ({ bounds: regCfg.bounds, seq: (prev?.seq ?? 0) + 1 }));
    }
  };

  const handleExportFullBackup = () => {
    const payload: MapBackupPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      enabledCategories: enabledCategoriesList,
      discoveredIds: discoveredIdsList,
      categoryPrefs,
      customMarkers,
      drawings,
      customPresets,
      enabledResourceAreaIds: enabledResourceIdsList,
      globalFlags: flags,
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleImportFullBackup = (raw: string): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(raw) as Partial<MapBackupPayload>;
      if (!parsed || typeof parsed !== 'object') {
        return { ok: false, message: 'Invalid JSON object.' };
      }
      if (Array.isArray(parsed.enabledCategories)) setEnabledCategoriesList(parsed.enabledCategories);
      if (Array.isArray(parsed.discoveredIds)) setDiscoveredIdsList(parsed.discoveredIds);
      if (parsed.categoryPrefs && typeof parsed.categoryPrefs === 'object') {
        setCategoryPrefs(parsed.categoryPrefs);
      }
      if (Array.isArray(parsed.customMarkers)) setCustomMarkers(parsed.customMarkers);
      if (Array.isArray(parsed.drawings)) setDrawings(parsed.drawings);
      if (Array.isArray(parsed.customPresets)) setCustomPresets(parsed.customPresets);
      if (Array.isArray(parsed.enabledResourceAreaIds)) {
        setEnabledResourceIdsList(parsed.enabledResourceAreaIds);
      }
      if (parsed.globalFlags && typeof parsed.globalFlags === 'object') {
        setFlags({ ...DEFAULT_GLOBAL_FLAGS, ...parsed.globalFlags });
      }
      return { ok: true, message: 'Map progress & layers restored successfully.' };
    } catch {
      return { ok: false, message: 'Failed to parse JSON backup.' };
    }
  };

  const handleResetAllData = () => {
    setEnabledCategoriesList(NALCOTT_DEFAULT_TYPE_KEYS);
    setDiscoveredIdsList([]);
    setCategoryPrefs({});
    setCustomMarkers([]);
    setDrawings([]);
    setCustomPresets([]);
    setEnabledResourceIdsList([]);
    setFlags(DEFAULT_GLOBAL_FLAGS);
    setPlayerPosition(null);
    setSelectedPoi(null);
  };

  const activeSettingsCategory = settingsCatKey ? CATEGORY_MAP.get(settingsCatKey) ?? null : null;

  return (
    <div
      ref={wrapperRef}
      className="relative h-[calc(100dvh-132px)] min-h-[540px] w-full overflow-hidden bg-[#090d14] select-none lg:h-[100dvh]"
      onClick={() => {
        if (contextMenu) setContextMenu(null);
      }}
    >
      <MapContainer
        crs={L.CRS.Simple}
        bounds={NALCOTT_MAP_BOUNDS}
        maxBounds={[
          [-565, -55],
          [55, 567],
        ]}
        center={[-265, 310]}
        zoom={0}
        minZoom={-1}
        maxZoom={6}
        zoomSnap={0.5}
        zoomDelta={1}
        zoomControl={false}
        className={`h-full w-full ${
          activeDrawingKind || placeMarkerMode || flags.devLoggerEnabled ? '!cursor-crosshair' : ''
        }`}
      >
        {/* Preserved High-Res Imagery Base Layer + Tiles */}
        <Pane name="nalcott-overview" style={{ zIndex: 150 }}>
          <ImageOverlay
            url="./maps/nalcott/overview-1024.webp"
            bounds={NALCOTT_MAP_BOUNDS}
            pane="nalcott-overview"
          />
        </Pane>
        <HybridNalcottTiles />
        <CoordinateGridLayer enabled={flags.showGrid} />

        <MapCameraAndEvents
          flyRequest={flyRequest}
          fitBoundsRequest={fitBoundsRequest}
          drawingMode={Boolean(activeDrawingKind)}
          placeMarkerMode={placeMarkerMode}
          devLoggerEnabled={flags.devLoggerEnabled}
          onTelemetry={(z, c) => {
            setZoomLevel(z);
            if (c) setCursorCoords(c);
          }}
          onAddDrawingPoint={(lat, lng) => setDraftDrawingPoints((prev) => [...prev, [lat, lng]])}
          onPlaceMarkerCoords={(lat, lng) => {
            setPlaceMarkerMode(false);
            setPendingMarkerModalCoords({ lat, lng });
          }}
          onLogDevCoord={(lat, lng) => {
            const reg = inferNearestRegion(lat, lng);
            const scen =
              reg === 'Onyx Tundra' || reg === 'Ember Strand' || reg === 'Vena Fjord' || lat >= -190
                ? 'way_of_winter'
                : 'manibus';
            setDevLogs((prev) => [
              ...prev,
              {
                id: `dev-${Date.now()}-${prev.length + 1}`,
                category: 'car-trunk',
                name: `Captured POI #${prev.length + 1}`,
                lat,
                lng,
                region: reg,
                scenario: scen,
              },
            ]);
          }}
          onOpenContextMenu={(ctx) => setContextMenu(ctx)}
        />

        {/* Resource Area Geo Polygons */}
        {MAP_RESOURCE_AREAS.filter((a) => enabledResourceAreaIds.has(a.id)).map((area) => (
          <Polygon
            key={area.id}
            positions={area.coordinates}
            pathOptions={{
              color: area.color,
              weight: 1.5,
              fillColor: area.color,
              fillOpacity: flags.resourceOpacity,
              dashArray: '4 4',
            }}
          >
            <Tooltip sticky>
              <div className="space-y-0.5 text-xs">
                <div className="font-semibold text-white">{area.name}</div>
                <div className="text-[11px] text-cyan-300">{area.region}</div>
                <div className="text-[10px] text-zinc-300">{area.resources.join(' · ')}</div>
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* Saved User Drawings */}
        {drawings
          .filter((d) => d.visible)
          .map((d) =>
            d.kind === 'polyline' ? (
              <Polyline
                key={d.id}
                positions={d.points}
                pathOptions={{ color: d.color, weight: 3.5, opacity: 0.9 }}
              >
                <Tooltip sticky>
                  <div className="text-xs">
                    <div className="font-semibold text-white">{d.title}</div>
                    <div className="font-mono text-[10px] text-cyan-300">
                      Distance: {formatDistanceLabel(d.distanceMeters)}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            ) : (
              <Polygon
                key={d.id}
                positions={d.points}
                pathOptions={{ color: d.color, weight: 2, fillOpacity: 0.2 }}
              >
                <Tooltip sticky>
                  <div className="text-xs font-semibold text-white">{d.title}</div>
                </Tooltip>
              </Polygon>
            ),
          )}

        {/* Active Draft Drawing Preview */}
        {activeDrawingKind && draftDrawingPoints.length >= 2 &&
          (activeDrawingKind === 'polyline' ? (
            <Polyline
              positions={draftDrawingPoints}
              pathOptions={{ color: draftDrawingColor, weight: 3, dashArray: '6 4' }}
            />
          ) : (
            <Polygon
              positions={draftDrawingPoints}
              pathOptions={{
                color: draftDrawingColor,
                weight: 2,
                dashArray: '6 4',
                fillOpacity: 0.16,
              }}
            />
          ))}

        {/* High-Density 60fps Canvas Batch Layer for up to 5,606+ Markers */}
        <TacticalCanvasLayer
          markers={visibleMarkers}
          foundSet={discoveredSet}
          selectedId={selectedPoi?.id ?? null}
          categorySettings={canvasVisualSettings}
          suppressInteractions={Boolean(
            activeDrawingKind || placeMarkerMode || flags.devLoggerEnabled,
          )}
          onSelectMarker={(poi) => handleSelectPoi(poi, false)}
        />

        {/* Region Overlay Badges */}
        {regionIcons.map((r) => (
          <Marker key={r.name} position={[r.lat, r.lng]} icon={r.icon} interactive={false} />
        ))}

        {/* Custom User Markers */}
        {customMarkers
          .filter((m) => m.visible)
          .map((m) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={getCustomPinDivIcon(m.icon, m.color, m.title)}
              zIndexOffset={780}
            >
              <Popup>
                <div className="min-w-[190px] space-y-1.5 text-xs">
                  <div className="font-bold text-white">{m.title}</div>
                  {m.notes && <p className="text-[11px] text-zinc-300">{m.notes}</p>}
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-1.5">
                    <span className="font-mono text-[10px] text-zinc-400">
                      ({m.lng.toFixed(1)}, {m.lat.toFixed(1)})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMarkers((prev) => prev.filter((item) => item.id !== m.id))
                      }
                      className="inline-flex items-center gap-1 rounded bg-rose-950/50 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-950"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Manual Player Position Beacon */}
        {playerPosition && (
          <Marker
            position={[playerPosition.lat, playerPosition.lng]}
            icon={PLAYER_POSITION_ICON}
            zIndexOffset={900}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-cyan-300">Manual Player Position</div>
                <div className="font-mono text-[11px] text-zinc-400">
                  ({playerPosition.lng.toFixed(1)}, {playerPosition.lat.toFixed(1)})
                </div>
                <button
                  type="button"
                  onClick={() => setPlayerPosition(null)}
                  className="text-[11px] text-rose-300 hover:text-rose-200"
                >
                  Clear position
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Single Crisp Selected Pin Popup */}
        {selectedPoi && (
          <Popup
            key={selectedPoi.id}
            position={[selectedPoi.lat, selectedPoi.lng]}
            offset={[0, -10]}
            eventHandlers={{
              remove: () => setSelectedPoi(null),
            }}
          >
            <SelectedPoiPopupBody
              poi={selectedPoi}
              scenarioId={scenarioId}
              zoomLevel={zoomLevel}
              discovered={discoveredSet.has(selectedPoi.id)}
              onToggleDiscovered={() => toggleDiscovered(selectedPoi.id)}
              onToast={showToast}
            />
          </Popup>
        )}

        {/* Bottom-Right Tactical Zoom + / - / Reset HUD */}
        <div className="pointer-events-none absolute bottom-5 right-3 z-[1050]">
          <CustomZoomControls
            onReset={() => {
              setSelectedPoi(null);
              const cfg = MAP_SCENARIOS.find((s) => s.id === scenarioId) ?? MAP_SCENARIOS[0];
              setFitBoundsRequest((prev) => ({
                bounds: cfg.bounds,
                seq: (prev?.seq ?? 0) + 1,
              }));
            }}
          />
        </div>
      </MapContainer>

      {/* Left Collapsible Tactical Sidebar */}
      <TacticalSidebar
        open={sidebarOpen}
        onToggleOpen={setSidebarOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchMatchedPois={searchMatchedPois}
        onFocusPoi={(poi) => handleSelectPoi(poi, true)}
        cursorCoords={cursorCoords}
        playerPosition={playerPosition}
        onClearPlayerPosition={() => setPlayerPosition(null)}
        scenarioId={scenarioId}
        onChangeScenario={handleChangeScenario}
        regionId={regionId}
        onChangeRegion={handleChangeRegion}
        flags={flags}
        onChangeFlags={setFlags}
        onOpenGlobalSettings={() => setGlobalSettingsOpen(true)}
        onOpenPresets={() => {
          setSettingsCatKey(null);
          setPresetsOpen((v) => !v);
        }}
        enabledCategories={enabledCategories}
        onToggleCategory={(key) =>
          setEnabledCategoriesList((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
          )
        }
        onSetCategoriesGroup={(keys, enable) =>
          setEnabledCategoriesList((prev) => {
            const next = new Set(prev);
            for (const k of keys) {
              if (enable) next.add(k);
              else next.delete(k);
            }
            return Array.from(next);
          })
        }
        onBulkFilterAction={(mode) => {
          if (mode === 'all') {
            setEnabledCategoriesList(MAP_CATEGORIES.map((c) => c.key));
          } else if (mode === 'none') {
            setEnabledCategoriesList([]);
          } else {
            setEnabledCategoriesList(NALCOTT_DEFAULT_TYPE_KEYS);
          }
        }}
        onOpenCategorySettings={(key) => {
          setPresetsOpen(false);
          setSettingsCatKey((cur) => (cur === key ? null : key));
        }}
        totalCountsByCategory={totalCountsByCategory}
        discoveredCountsByCategory={discoveredCountsByCategory}
        customMarkers={customMarkers}
        onToggleCustomMarker={(id) =>
          setCustomMarkers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)),
          )
        }
        onToggleAllCustomMarkers={(visible) =>
          setCustomMarkers((prev) => prev.map((m) => ({ ...m, visible })))
        }
        onDeleteCustomMarker={(id) =>
          setCustomMarkers((prev) => prev.filter((m) => m.id !== id))
        }
        onFocusCoords={(lat, lng) =>
          setFlyRequest((prev) => ({ lat, lng, zoom: 4, seq: (prev?.seq ?? 0) + 1 }))
        }
        onStartAddMarkerMode={() => {
          setPlaceMarkerMode(true);
          setActiveDrawingKind(null);
          showToast('Click map to drop custom marker.');
        }}
        drawings={drawings}
        activeDrawingKind={activeDrawingKind}
        onStartDrawing={(kind) => handleStartDrawing(kind)}
        onToggleDrawing={(id) =>
          setDrawings((prev) =>
            prev.map((d) => (d.id === id ? { ...d, visible: !d.visible } : d)),
          )
        }
        onToggleAllDrawings={(visible) =>
          setDrawings((prev) => prev.map((d) => ({ ...d, visible })))
        }
        onDeleteDrawing={(id) => setDrawings((prev) => prev.filter((d) => d.id !== id))}
        onExportDrawingsJson={() => {
          const blob = new Blob([JSON.stringify(drawings, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nalcott-drawings-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('Drawings JSON exported.');
        }}
        enabledResourceAreaIds={enabledResourceAreaIds}
        onToggleResourceArea={(id) =>
          setEnabledResourceIdsList((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
        onToggleAllResourceAreas={(enable) =>
          setEnabledResourceIdsList(enable ? MAP_RESOURCE_AREAS.map((a) => a.id) : [])
        }
      />

      {/* Top-Right Compact Tactical Controls Pill */}
      <div className="pointer-events-none absolute right-3 top-3 z-[1050] flex items-center gap-1.5">
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-[#27272a] bg-[#121214]/94 p-1 shadow-2xl backdrop-blur-md">
          <span className="hidden px-2 font-mono text-[10px] text-zinc-400 md:inline">
            {visibleMarkers.length} pins
          </span>
          <button
            type="button"
            onClick={() => setFlags({ ...flags, hideDiscovered: !flags.hideDiscovered })}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
              flags.hideDiscovered
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-zinc-300 hover:bg-[#18181b] hover:text-white'
            }`}
            title="Hide discovered markers"
          >
            {flags.hideDiscovered ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">
              {flags.hideDiscovered ? 'Discovered Hidden' : 'Hide Discovered'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-[#18181b] hover:text-cyan-300"
            aria-label="Toggle fullscreen map"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Active Drawing Toolbar HUD */}
      {activeDrawingKind && (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-[1150] flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-xl border border-cyan-500/50 bg-[#121214]/96 px-3 py-2 text-xs shadow-2xl backdrop-blur-md">
          <input
            type="text"
            value={draftDrawingTitle}
            onChange={(e) => setDraftDrawingTitle(e.target.value)}
            className="w-28 rounded border border-[#27272a] bg-[#18181b] px-2 py-1 text-xs text-white outline-none focus:border-cyan-500"
          />
          <div className="flex gap-1">
            {DRAWING_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraftDrawingColor(c)}
                className={`h-4 w-4 rounded-full border ${
                  draftDrawingColor === c ? 'scale-110 border-white' : 'border-zinc-700'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] text-cyan-300">
            {formatDistanceLabel(
              calculatePolylineMeters(draftDrawingPoints, activeDrawingKind === 'polygon'),
            )}
          </span>
          <button
            type="button"
            onClick={() => setDraftDrawingPoints((p) => p.slice(0, -1))}
            disabled={draftDrawingPoints.length === 0}
            className="inline-flex items-center gap-1 rounded border border-[#27272a] bg-[#18181b] px-2 py-1 text-[11px] text-zinc-300 disabled:opacity-40"
          >
            <Undo2 className="h-3 w-3" /> Undo
          </button>
          <button
            type="button"
            onClick={finishDrawing}
            className="rounded bg-cyan-500 px-2.5 py-1 text-[11px] font-semibold text-zinc-950 hover:bg-cyan-400"
          >
            Finish
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveDrawingKind(null);
              setDraftDrawingPoints([]);
            }}
            className="rounded px-1.5 py-1 text-zinc-400 hover:text-white"
            aria-label="Cancel drawing"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Active Custom Marker Placement Banner */}
      {placeMarkerMode && (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-[1150] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-cyan-500/50 bg-[#121214]/96 px-3 py-2 text-xs text-cyan-200 shadow-2xl">
          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
          <span>Click anywhere on the map to place your marker</span>
          <button
            type="button"
            onClick={() => setPlaceMarkerMode(false)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Bottom-Left Zoom Readout HUD */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1050] hidden items-center gap-2 rounded-lg border border-[#27272a] bg-[#121214]/90 px-2.5 py-1 font-mono text-[10px] text-zinc-400 shadow-lg backdrop-blur-md sm:flex">
        <span className="text-zinc-200">
          Z{zoomLevel.toFixed(1)}
          {zoomLevel >= 3 ? ' HD' : ''}
        </span>
        <span>·</span>
        <span>{visibleMarkers.length} visible</span>
      </div>

      {/* Category Settings & Drops Popover */}
      {activeSettingsCategory && (
        <CategorySettingsPopover
          category={activeSettingsCategory}
          totalCount={totalCountsByCategory.get(activeSettingsCategory.key) ?? 0}
          discoveredCount={discoveredCountsByCategory.get(activeSettingsCategory.key) ?? 0}
          pref={categoryPrefs[activeSettingsCategory.key] ?? DEFAULT_CATEGORY_PREF}
          onChangePref={(next) =>
            setCategoryPrefs((prev) => ({ ...prev, [activeSettingsCategory.key]: next }))
          }
          onDiscoverAll={() => {
            const matchingIds = scopedPois
              .filter((p) => p.typeKey === activeSettingsCategory.key)
              .map((p) => p.id);
            setDiscoveredIdsList((prev) => Array.from(new Set([...prev, ...matchingIds])));
          }}
          onResetDiscovered={() => {
            const catIds = new Set(
              scopedPois
                .filter((p) => p.typeKey === activeSettingsCategory.key)
                .map((p) => p.id),
            );
            setDiscoveredIdsList((prev) => prev.filter((id) => !catIds.has(id)));
          }}
          onClose={() => setSettingsCatKey(null)}
        />
      )}

      {/* Filter Presets Popover */}
      {presetsOpen && (
        <PresetsManagerPopover
          customPresets={customPresets}
          onApplyPreset={(cats, resIds) => {
            setEnabledCategoriesList(cats);
            if (resIds) setEnabledResourceIdsList(resIds);
          }}
          onSaveCurrentAsPreset={(name) =>
            setCustomPresets((prev) => [
              ...prev,
              {
                id: `cp-${Date.now()}`,
                name,
                categories: enabledCategoriesList,
                resourceAreaIds: enabledResourceIdsList,
              },
            ])
          }
          onRenamePreset={(id, name) =>
            setCustomPresets((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
          }
          onDeletePreset={(id) =>
            setCustomPresets((prev) => prev.filter((p) => p.id !== id))
          }
          onClose={() => setPresetsOpen(false)}
        />
      )}

      {/* Global Map Settings & Backup Modal */}
      {globalSettingsOpen && (
        <GlobalSettingsModal
          flags={flags}
          discoveredCount={discoveredSet.size}
          customCount={customMarkers.length}
          drawingsCount={drawings.length}
          onChangeFlags={setFlags}
          onExportJson={handleExportFullBackup}
          onImportJson={handleImportFullBackup}
          onResetAllData={handleResetAllData}
          onClose={() => setGlobalSettingsOpen(false)}
        />
      )}

      {/* Custom Marker Creation Modal */}
      {pendingMarkerModalCoords && (
        <CustomMarkerModal
          initialLat={pendingMarkerModalCoords.lat}
          initialLng={pendingMarkerModalCoords.lng}
          onSave={(draft) => {
            setCustomMarkers((prev) => [
              ...prev,
              {
                ...draft,
                id: `cm-${Date.now()}`,
                visible: true,
                createdAt: new Date().toISOString(),
              },
            ]);
            setPendingMarkerModalCoords(null);
            showToast(`Added custom marker "${draft.title}"`);
          }}
          onClose={() => setPendingMarkerModalCoords(null)}
        />
      )}

      {/* Dev Coordinate Logger Drawer */}
      {flags.devLoggerEnabled && (
        <DevCoordinateLoggerDrawer
          entries={devLogs}
          onUpdateEntry={(id, patch) =>
            setDevLogs((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
          }
          onRemoveEntry={(id) => setDevLogs((prev) => prev.filter((e) => e.id !== id))}
          onClearEntries={() => setDevLogs([])}
          onClose={() => setFlags({ ...flags, devLoggerEnabled: false })}
        />
      )}

      {/* Right-Click / Long-Press Context Menu */}
      {contextMenu && (
        <div
          className="pointer-events-auto fixed z-[1400] w-56 overflow-hidden rounded-xl border border-[#27272a] bg-[#121214]/98 p-1 text-xs text-zinc-100 shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(contextMenu.screenX, (typeof window !== 'undefined' ? window.innerWidth : 400) - 236),
            top: Math.min(contextMenu.screenY, (typeof window !== 'undefined' ? window.innerHeight : 600) - 180),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-[#27272a] px-2.5 py-1.5 font-mono text-[10px] text-cyan-400">
            Coord ({contextMenu.lng.toFixed(1)}, {contextMenu.lat.toFixed(1)})
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard
                ?.writeText(`${contextMenu.lng.toFixed(1)}, ${contextMenu.lat.toFixed(1)}`)
                .catch(() => {});
              setContextMenu(null);
              showToast('Coordinates copied to clipboard');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[#18181b] hover:text-cyan-300"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-400" />
            Copy (X, Y) Coordinates
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingMarkerModalCoords({ lat: contextMenu.lat, lng: contextMenu.lng });
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[#18181b] hover:text-cyan-300"
          >
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            Add Custom Marker Here
          </button>
          <button
            type="button"
            onClick={() => handleSetManualPlayerPos(contextMenu.lat, contextMenu.lng)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[#18181b] hover:text-cyan-300"
          >
            <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
            Set Manual Player Position
          </button>
          <button
            type="button"
            onClick={() =>
              handleStartDrawing('polyline', [contextMenu.lat, contextMenu.lng])
            }
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[#18181b] hover:text-cyan-300"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            Start Farming Route Here
          </button>
        </div>
      )}

      {/* Subtle Toast Banner */}
      {toastMsg && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[1450] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-cyan-500/45 bg-[#121214]/95 px-3 py-1.5 text-xs font-medium text-cyan-200 shadow-2xl">
          <Check className="h-3.5 w-3.5 text-cyan-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

function SelectedPoiPopupBody({
  poi,
  scenarioId,
  zoomLevel,
  discovered,
  onToggleDiscovered,
  onToast,
}: {
  poi: NalcottPoi;
  scenarioId: string;
  zoomLevel: number;
  discovered: boolean;
  onToggleDiscovered: () => void;
  onToast: (msg: string) => void;
}) {
  const [dropsOpen, setDropsOpen] = useState(false);
  const drops = MAP_DROP_TABLES[poi.typeKey];

  const handleCopyCoords = async () => {
    await navigator.clipboard
      ?.writeText(`${poi.lng.toFixed(1)}, ${poi.lat.toFixed(1)}`)
      .catch(() => {});
    onToast('POI coordinates copied');
  };

  const handleCopyLink = async () => {
    const url = buildMapShareUrl({
      scenario: scenarioId,
      x: poi.lng,
      y: poi.lat,
      z: Math.max(zoomLevel, 3),
      pin: poi.id,
    });
    await navigator.clipboard?.writeText(url).catch(() => {});
    onToast('Pin share link copied!');
  };

  return (
    <div className="min-w-[235px] max-w-[280px] space-y-2 text-xs text-zinc-100">
      <div className="flex items-start gap-2">
        <CategoryGlyph typeKey={poi.typeKey} color={poi.color} />
        <div className="min-w-0 flex-1">
          <div className="font-bold leading-snug text-white">{poi.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-cyan-400">
            <span>{poi.typeLabel}</span>
            <span>·</span>
            <span className="text-zinc-300">{poi.region}</span>
            {poi.level !== null && (
              <>
                <span>·</span>
                <span className="rounded bg-amber-500/15 px-1 font-mono text-[10px] text-amber-300">
                  Lv {poi.level}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {poi.near && (
        <div className="rounded bg-[#18181b] px-2 py-1 text-[11px] text-zinc-300">
          Near: <span className="text-white">{poi.near}</span>
        </div>
      )}

      {/* Coordinates + Copy */}
      <div className="flex items-center justify-between gap-2 rounded border border-[#27272a] bg-[#18181b] px-2 py-1">
        <span className="font-mono text-[10px] text-zinc-300">
          ({poi.lng.toFixed(1)}, {poi.lat.toFixed(1)})
        </span>
        <button
          type="button"
          onClick={handleCopyCoords}
          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>

      {/* Collapsible Drops List */}
      {drops && drops.length > 0 && (
        <div className="rounded border border-[#27272a] bg-[#18181b]">
          <button
            type="button"
            onClick={() => setDropsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-medium text-zinc-200 hover:text-cyan-300"
          >
            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3 w-3 text-cyan-400" />
              Drops (per open) · {drops.length}
            </span>
            {dropsOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
            )}
          </button>
          {dropsOpen && (
            <div className="max-h-32 space-y-1 overflow-y-auto border-t border-[#27272a] p-2 text-[10px]">
              {drops.map((d) => (
                <div key={d.item} className="flex items-baseline justify-between gap-2">
                  <span className="text-zinc-200">
                    {d.item} {d.quantity ? <span className="text-cyan-300">{d.quantity}</span> : ''}
                  </span>
                  <span className="font-mono text-zinc-400">{d.chance}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Popup Action Row */}
      <div className="flex items-center gap-1.5 border-t border-[#27272a] pt-2">
        <button
          type="button"
          onClick={onToggleDiscovered}
          className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
            discovered
              ? 'border-cyan-500/45 bg-cyan-500/20 text-cyan-300'
              : 'border-[#27272a] bg-[#18181b] text-zinc-200 hover:border-cyan-500/50'
          }`}
        >
          {discovered ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Discovered
            </>
          ) : (
            <>
              <Circle className="h-3.5 w-3.5" />
              Mark Discovered
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1 rounded-md border border-[#27272a] bg-[#18181b] px-2 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-cyan-500/50 hover:text-cyan-300"
          title="Copy shareable link to this pin"
        >
          <Link2 className="h-3.5 w-3.5" />
          Link
        </button>
      </div>
    </div>
  );
}

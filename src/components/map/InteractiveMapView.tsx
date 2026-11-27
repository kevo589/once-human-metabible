import L from 'leaflet';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Crosshair,
  Eye,
  EyeOff,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleMarker,
  ImageOverlay,
  MapContainer,
  Marker,
  Pane,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import {
  NALCOTT_CAMERA_PRESETS,
  NALCOTT_DEFAULT_TYPE_KEYS,
  NALCOTT_MAP,
  NALCOTT_MAP_BOUNDS,
  NALCOTT_POIS,
  NALCOTT_TYPE_GROUPS,
  type MapCameraPreset,
  type NalcottPoi,
} from '../../data/nalcottMap';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CategoryGlyph, getCustomPinDivIcon, getMarkerDivIcon } from './mapIcons';

interface CustomPin {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface InteractiveMapViewProps {
  focusedMarkerId?: string | null;
}

const REGION_BOUNDS: Record<MapCameraPreset['id'], [[number, number], [number, number]]> = {
  all: [
    [-492, 42],
    [-40, 492],
  ],
  manibus: [
    [-492, 265],
    [-235, 498],
  ],
  way_of_winter: [
    [-245, 38],
    [-25, 488],
  ],
};

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

function MapController({
  focusPoi,
  presetId,
  resetSignal,
  onTelemetry,
}: {
  focusPoi: NalcottPoi | null;
  presetId: MapCameraPreset['id'];
  resetSignal: number;
  onTelemetry: (zoom: number, coords?: { lng: number; lat: number }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusPoi) {
      const targetZoom = Math.max(map.getZoom(), 4);
      map.setView([focusPoi.lat, focusPoi.lng], targetZoom, { animate: true });
    }
  }, [focusPoi, map]);

  useEffect(() => {
    if (!focusPoi) {
      map.fitBounds(REGION_BOUNDS[presetId], { padding: [24, 24], animate: true });
    }
  }, [presetId, resetSignal, focusPoi, map]);

  useMapEvents({
    zoomend() {
      onTelemetry(map.getZoom());
    },
    mousemove(e) {
      onTelemetry(map.getZoom(), {
        lng: Math.max(0, Math.min(512, Math.round(e.latlng.lng))),
        lat: Math.max(-512, Math.min(0, Math.round(e.latlng.lat))),
      });
    },
  });

  return null;
}

function CustomZoomControls({ onReset }: { onReset: () => void }) {
  const map = useMap();
  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-obsidian-700/85 bg-obsidian-950/90 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => map.zoomIn(1)}
        className="flex h-9 w-9 items-center justify-center border-b border-obsidian-800 text-slate-200 transition hover:bg-obsidian-800 hover:text-white"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut(1)}
        className="flex h-9 w-9 items-center justify-center border-b border-obsidian-800 text-slate-200 transition hover:bg-obsidian-800 hover:text-white"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center text-slate-300 transition hover:bg-obsidian-800 hover:text-white"
        aria-label="Reset camera view"
        title="Reset camera view"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PinDropHandler({
  enabled,
  onDrop,
}: {
  enabled: boolean;
  onDrop: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const lat = Math.max(-512, Math.min(0, Number(e.latlng.lat.toFixed(2))));
      const lng = Math.max(0, Math.min(512, Number(e.latlng.lng.toFixed(2))));
      onDrop(lat, lng);
    },
  });
  return null;
}

export function InteractiveMapView({ focusedMarkerId }: InteractiveMapViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const initialFocus = useMemo(
    () => (focusedMarkerId ? NALCOTT_POIS.find((p) => p.id === focusedMarkerId) ?? null : null),
    [focusedMarkerId],
  );

  const [drawerOpen, setDrawerOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(NALCOTT_TYPE_GROUPS.map((g) => g.id)),
  );
  const [presetId, setPresetId] = useState<MapCameraPreset['id']>(
    initialFocus?.scenario ?? 'all',
  );
  const [resetSignal, setResetSignal] = useState(0);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(() => {
    const initial = new Set(NALCOTT_DEFAULT_TYPE_KEYS);
    if (initialFocus) initial.add(initialFocus.typeKey);
    return initial;
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [hideFound, setHideFound] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [newPinLabel, setNewPinLabel] = useState('Custom Farm Spot');
  const [rawPins, setCustomPins] = useLocalStorage<CustomPin[]>('oh-custom-map-pins', []);
  const [foundIdsArray, setFoundIdsArray] = useLocalStorage<string[]>('oh-found-map-pois', []);
  const [selectedPoi, setSelectedPoi] = useState<NalcottPoi | null>(initialFocus);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [cursorCoords, setCursorCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const foundSet = useMemo(() => new Set(foundIdsArray), [foundIdsArray]);

  useEffect(() => {
    if (initialFocus) {
      setPresetId(initialFocus.scenario);
      setEnabledTypes((prev) => {
        if (prev.has(initialFocus.typeKey)) return prev;
        const next = new Set(prev);
        next.add(initialFocus.typeKey);
        return next;
      });
      setSelectedPoi(initialFocus);
    }
  }, [initialFocus]);

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

  const toggleFound = (poiId: string) => {
    setFoundIdsArray((prev) =>
      prev.includes(poiId) ? prev.filter((id) => id !== poiId) : [...prev, poiId],
    );
  };

  const customPins = useMemo(
    () =>
      rawPins.filter(
        (p) =>
          typeof p.lat === 'number' &&
          typeof p.lng === 'number' &&
          p.lat <= 0 &&
          p.lat >= -512 &&
          p.lng >= 0 &&
          p.lng <= 512,
      ),
    [rawPins],
  );

  const typeMetaByKey = useMemo(
    () => new Map(NALCOTT_MAP.types.map((t) => [t.key, t])),
    [],
  );

  const foundCountByType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const poi of NALCOTT_POIS) {
      if (foundSet.has(poi.id)) {
        counts.set(poi.typeKey, (counts.get(poi.typeKey) ?? 0) + 1);
      }
    }
    return counts;
  }, [foundSet]);

  const visiblePois = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return NALCOTT_POIS.filter((poi) => {
      if (hideFound && foundSet.has(poi.id)) return false;
      if (q) {
        return (
          poi.name.toLowerCase().includes(q) ||
          poi.region.toLowerCase().includes(q) ||
          poi.typeLabel.toLowerCase().includes(q) ||
          (poi.near && poi.near.toLowerCase().includes(q))
        );
      }
      if (!enabledTypes.has(poi.typeKey)) return false;
      if (presetId === 'manibus' && poi.scenario !== 'manibus') return false;
      if (presetId === 'way_of_winter' && poi.scenario !== 'way_of_winter') return false;
      return true;
    });
  }, [searchFilter, enabledTypes, presetId, hideFound, foundSet]);

  const searchResults = useMemo(() => {
    if (!searchFilter.trim()) return [];
    return visiblePois.slice(0, 12);
  }, [searchFilter, visiblePois]);

  const regionIcons = useMemo(
    () =>
      NALCOTT_MAP.regions.map((r) => ({
        ...r,
        icon: L.divIcon({
          className: 'nalcott-region-badge',
          html: `<div class="whitespace-nowrap -translate-x-1/2 -translate-y-1/2 rounded border border-slate-500/35 bg-obsidian-950/75 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-100 shadow-sm backdrop-blur-[2px]">${r.name}</div>`,
          iconSize: [0, 0],
        }),
      })),
    [],
  );

  const toggleType = (key: string) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const useCanvasFallback = visiblePois.length > 520;

  return (
    <div
      ref={wrapperRef}
      className="relative h-[calc(100dvh-132px)] min-h-[540px] w-full overflow-hidden bg-[#090d14] lg:h-[100dvh]"
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
        preferCanvas
        className={`h-full w-full ${pinMode ? '!cursor-crosshair' : ''}`}
      >
        <Pane name="nalcott-overview" style={{ zIndex: 150 }}>
          <ImageOverlay
            url="./maps/nalcott/overview-1024.webp"
            bounds={NALCOTT_MAP_BOUNDS}
            pane="nalcott-overview"
          />
        </Pane>
        <HybridNalcottTiles />

        <MapController
          focusPoi={selectedPoi}
          presetId={presetId}
          resetSignal={resetSignal}
          onTelemetry={(z, c) => {
            setZoomLevel(z);
            if (c) setCursorCoords(c);
          }}
        />

        <PinDropHandler
          enabled={pinMode}
          onDrop={(lat, lng) => {
            setCustomPins((prev) => [
              ...prev.filter(
                (p) => typeof p.lat === 'number' && p.lat <= 0 && p.lat >= -512,
              ),
              {
                id: `pin-${Date.now()}`,
                label: newPinLabel.trim() || 'Custom Pin',
                lat,
                lng,
              },
            ]);
            setPinMode(false);
          }}
        />

        {/* Region Labels */}
        {regionIcons.map((r) => (
          <Marker
            key={r.name}
            position={[r.lat, r.lng]}
            icon={r.icon}
            interactive={false}
          />
        ))}

        {/* Markers: Crisp SVG icon badges up to 520 active, canvas fallback above */}
        {useCanvasFallback
          ? visiblePois.map((poi) => {
              const isSelected = selectedPoi?.id === poi.id;
              const isFound = foundSet.has(poi.id);
              return (
                <CircleMarker
                  key={poi.id}
                  center={[poi.lat, poi.lng]}
                  radius={isSelected ? 8 : 5}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : '#07090d',
                    weight: isSelected ? 2.5 : 1.5,
                    fillColor: poi.color,
                    fillOpacity: isFound ? 0.32 : 0.92,
                  }}
                  eventHandlers={{ click: () => setSelectedPoi(poi) }}
                >
                  <Popup>
                    <PoiPopupContent
                      poi={poi}
                      found={isFound}
                      onToggleFound={() => toggleFound(poi.id)}
                    />
                  </Popup>
                </CircleMarker>
              );
            })
          : visiblePois.map((poi) => {
              const isSelected = selectedPoi?.id === poi.id;
              const isFound = foundSet.has(poi.id);
              return (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lng]}
                  icon={getMarkerDivIcon(poi.typeKey, poi.color, isFound, isSelected)}
                  zIndexOffset={isSelected ? 900 : isFound ? -100 : 100}
                  eventHandlers={{ click: () => setSelectedPoi(poi) }}
                >
                  <Popup>
                    <PoiPopupContent
                      poi={poi}
                      found={isFound}
                      onToggleFound={() => toggleFound(poi.id)}
                    />
                  </Popup>
                </Marker>
              );
            })}

        {/* Custom User Pins */}
        {customPins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={getCustomPinDivIcon()}
            zIndexOffset={800}
          >
            <Popup>
              <div className="min-w-[165px] space-y-1.5 text-xs">
                <div className="font-semibold text-emerald-300">{pin.label}</div>
                <div className="font-mono text-[11px] text-slate-400">
                  Coord ({Math.round(pin.lng)}, {Math.round(pin.lat)})
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCustomPins((prev) => prev.filter((p) => p.id !== pin.id))
                  }
                  className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-950/40 px-2 py-1 text-[11px] text-rose-300 hover:text-rose-200"
                >
                  <Trash2 className="h-3 w-3" /> Delete pin
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Bottom-Right Dark Glass Zoom & Reset Controls */}
        <div className="pointer-events-none absolute bottom-5 right-3 z-[1000]">
          <CustomZoomControls
            onReset={() => {
              setSelectedPoi(null);
              setResetSignal((n) => n + 1);
            }}
          />
        </div>
      </MapContainer>

      {/* Top-Left Floating TH.GL Sidebar / Collapse Toggle */}
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex max-h-[calc(100%-5.25rem)] flex-col items-start gap-2">
        {!drawerOpen ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-obsidian-700/85 bg-obsidian-950/90 px-3 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md transition hover:border-stardust-400/50"
          >
            <PanelLeftOpen className="h-4 w-4 text-stardust-400" />
            <span>Map Filters</span>
            <span className="rounded bg-obsidian-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              {visiblePois.length}
            </span>
          </button>
        ) : (
          <aside className="pointer-events-auto flex max-h-full w-[305px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-obsidian-700/85 bg-obsidian-950/92 shadow-2xl backdrop-blur-md">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-obsidian-800 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-stardust-400" />
                <span className="text-xs font-semibold tracking-wide text-white">
                  NALCOTT MAP
                </span>
                <span className="rounded bg-obsidian-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  {visiblePois.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-obsidian-800 hover:text-white"
                aria-label="Collapse map panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Scenario Preset Switcher */}
            <div className="grid grid-cols-3 gap-1 border-b border-obsidian-800 p-2">
              {NALCOTT_CAMERA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPoi(null);
                    setPresetId(preset.id);
                    setResetSignal((n) => n + 1);
                  }}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ${
                    presetId === preset.id
                      ? 'border-stardust-400/50 bg-obsidian-800 text-white'
                      : 'border-transparent bg-obsidian-900/70 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset.shortLabel}
                </button>
              ))}
            </div>

            {/* Search & Instant Jump List */}
            <div className="border-b border-obsidian-800 p-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search POIs, Blackfell, Silos..."
                  className="w-full rounded-lg border border-obsidian-800 bg-obsidian-900 py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-500 outline-none focus:border-stardust-400/50"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {searchFilter.trim() && (
                <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-0.5">
                  {searchResults.map((poi) => (
                    <button
                      key={poi.id}
                      type="button"
                      onClick={() => {
                        setSelectedPoi(poi);
                        if (window.innerWidth < 1024) setDrawerOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg border border-obsidian-800/80 bg-obsidian-900/80 px-2 py-1.5 text-left transition hover:border-stardust-400/40 hover:bg-obsidian-800"
                    >
                      <CategoryGlyph typeKey={poi.typeKey} color={poi.color} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-medium text-white">
                          {poi.name}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {poi.typeLabel} · {poi.region}
                          {poi.level ? ` · Lv ${poi.level}` : ''}
                        </div>
                      </div>
                      <Crosshair className="h-3 w-3 shrink-0 text-slate-500" />
                    </button>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="py-2 text-center text-[11px] text-slate-500">
                      No matching locations.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Bulk Controls & Found Progress */}
            <div className="flex items-center justify-between gap-2 border-b border-obsidian-800 px-3 py-2 text-[11px]">
              <span className="text-slate-400">
                Found:{' '}
                <strong className="font-mono text-emerald-400">{foundSet.size}</strong>
                <span className="text-slate-500">/{NALCOTT_POIS.length}</span>
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEnabledTypes(new Set(NALCOTT_DEFAULT_TYPE_KEYS))}
                  className="rounded border border-obsidian-800 bg-obsidian-900 px-1.5 py-0.5 text-slate-300 hover:text-white"
                >
                  Core
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEnabledTypes(new Set(NALCOTT_MAP.types.map((t) => t.key)))
                  }
                  className="rounded border border-obsidian-800 bg-obsidian-900 px-1.5 py-0.5 text-slate-300 hover:text-white"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setEnabledTypes(new Set())}
                  className="rounded border border-obsidian-800 bg-obsidian-900 px-1.5 py-0.5 text-slate-400 hover:text-white"
                >
                  None
                </button>
              </div>
            </div>

            {/* Grouped Category Checklists */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
              {NALCOTT_TYPE_GROUPS.map((group) => {
                const isOpen = expandedGroups.has(group.id);
                const groupTypes = group.keys
                  .map((k) => typeMetaByKey.get(k))
                  .filter((t): t is NonNullable<typeof t> => Boolean(t));

                return (
                  <div
                    key={group.id}
                    className="rounded-lg border border-obsidian-800/80 bg-obsidian-900/45"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-300 hover:text-white"
                    >
                      <span>{group.label}</span>
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="grid grid-cols-1 gap-1 border-t border-obsidian-800/70 p-1.5">
                        {groupTypes.map((t) => {
                          const active = enabledTypes.has(t.key);
                          const foundInType = foundCountByType.get(t.key) ?? 0;
                          return (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => toggleType(t.key)}
                              className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition ${
                                active
                                  ? 'bg-obsidian-800/80 text-slate-100'
                                  : 'text-slate-500 opacity-55 hover:bg-obsidian-800/35 hover:opacity-90'
                              }`}
                            >
                              <CategoryGlyph typeKey={t.key} color={t.color} />
                              <span className="flex-1 truncate text-[11px]">{t.label}</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {foundInType > 0 ? `${foundInType}/` : ''}
                                {t.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Top-Right Floating Quick Actions Bar */}
      <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-obsidian-700/85 bg-obsidian-950/90 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setHideFound((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              hideFound
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-300 hover:bg-obsidian-800 hover:text-white'
            }`}
            title="Hide markers marked as Found"
          >
            {hideFound ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{hideFound ? 'Found Hidden' : 'Hide Found'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPinMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              pinMode
                ? 'bg-emerald-500/25 text-emerald-200'
                : 'text-slate-300 hover:bg-obsidian-800 hover:text-white'
            }`}
            title="Drop custom pin"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{pinMode ? 'Tap Map' : 'Add Pin'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-obsidian-800 hover:text-white"
            aria-label="Toggle fullscreen map"
            title="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {pinMode && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-obsidian-950/95 p-2 shadow-2xl backdrop-blur-md">
            <input
              type="text"
              value={newPinLabel}
              onChange={(e) => setNewPinLabel(e.target.value)}
              placeholder="Pin label..."
              className="w-40 rounded-lg border border-obsidian-700 bg-obsidian-900 px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => setPinMode(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Cancel pin mode"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom-Left Coordinates & Zoom Telemetry HUD */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg border border-obsidian-700/80 bg-obsidian-950/85 px-2.5 py-1 text-[11px] font-mono text-slate-300 shadow-lg backdrop-blur-md">
        <span>
          Zoom {zoomLevel.toFixed(1)}
          {zoomLevel >= 3 ? ' HD' : ''}
        </span>
        {cursorCoords && (
          <>
            <span className="text-obsidian-600">|</span>
            <span>
              X {cursorCoords.lng}, Y {cursorCoords.lat}
            </span>
          </>
        )}
      </div>

      {/* Selected Location Floating Pill on Bottom-Center */}
      {selectedPoi && (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 z-[1000] hidden w-[340px] max-w-[calc(100vw-8rem)] -translate-x-1/2 items-center justify-between gap-2 rounded-xl border border-stardust-400/40 bg-obsidian-950/92 px-3 py-2 shadow-2xl backdrop-blur-md sm:flex">
          <div className="flex min-w-0 items-center gap-2">
            <CategoryGlyph typeKey={selectedPoi.typeKey} color={selectedPoi.color} />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">{selectedPoi.name}</div>
              <div className="truncate text-[10px] text-slate-400">
                {selectedPoi.typeLabel} · {selectedPoi.region}
                {selectedPoi.level ? ` · Lv ${selectedPoi.level}` : ''}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => toggleFound(selectedPoi.id)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                foundSet.has(selectedPoi.id)
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-obsidian-800 text-slate-300 hover:text-white'
              }`}
            >
              {foundSet.has(selectedPoi.id) ? 'Found ✓' : 'Mark Found'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedPoi(null)}
              className="rounded p-1 text-slate-400 hover:text-white"
              aria-label="Dismiss selected POI"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PoiPopupContent({
  poi,
  found,
  onToggleFound,
}: {
  poi: NalcottPoi;
  found: boolean;
  onToggleFound: () => void;
}) {
  return (
    <div className="min-w-[205px] space-y-2 text-xs">
      <div>
        <div className="font-bold text-white">{poi.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stardust-400">
          <span>{poi.typeLabel}</span>
          <span>·</span>
          <span>{poi.region}</span>
          {poi.level !== null && (
            <>
              <span>·</span>
              <span className="text-amber-300">Lv {poi.level}</span>
            </>
          )}
        </div>
      </div>

      {poi.near && <div className="text-[11px] text-slate-300">Near: {poi.near}</div>}

      <div className="flex items-center justify-between gap-2 border-t border-obsidian-800 pt-2">
        <span className="font-mono text-[10px] text-slate-400">
          Grid ({Math.round(poi.lng)}, {Math.round(poi.lat)})
        </span>
        <button
          type="button"
          onClick={onToggleFound}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
            found
              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
              : 'border-obsidian-700 bg-obsidian-800 text-slate-200 hover:border-stardust-400/50'
          }`}
        >
          {found ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Found
            </>
          ) : (
            <>
              <Circle className="h-3 w-3" />
              Mark Found
            </>
          )}
        </button>
      </div>
    </div>
  );
}

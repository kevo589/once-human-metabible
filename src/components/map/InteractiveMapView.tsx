import L from 'leaflet';
import { Crosshair, Filter, Layers, MapPin, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  type MapCameraPreset,
  type NalcottPoi,
} from '../../data/nalcottMap';
import { useLocalStorage } from '../../hooks/useLocalStorage';

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
}: {
  focusPoi: NalcottPoi | null;
  presetId: MapCameraPreset['id'];
  resetSignal: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusPoi) {
      const targetZoom = Math.max(map.getZoom(), 3);
      map.setView([focusPoi.lat, focusPoi.lng], targetZoom, { animate: true });
    }
  }, [focusPoi, map]);

  useEffect(() => {
    if (!focusPoi) {
      map.fitBounds(REGION_BOUNDS[presetId], { padding: [18, 18], animate: true });
    }
  }, [presetId, resetSignal, focusPoi, map]);

  return null;
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
  const initialFocus = useMemo(
    () => (focusedMarkerId ? NALCOTT_POIS.find((p) => p.id === focusedMarkerId) ?? null : null),
    [focusedMarkerId],
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
  const [layersExpanded, setLayersExpanded] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [pinMode, setPinMode] = useState(false);
  const [newPinLabel, setNewPinLabel] = useState('Custom Farm Spot');
  const [rawPins, setCustomPins] = useLocalStorage<CustomPin[]>('oh-custom-map-pins', []);
  const [selectedPoi, setSelectedPoi] = useState<NalcottPoi | null>(initialFocus);

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

  const activePreset = useMemo(
    () => NALCOTT_CAMERA_PRESETS.find((p) => p.id === presetId) ?? NALCOTT_CAMERA_PRESETS[0],
    [presetId],
  );

  const visiblePois = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return NALCOTT_POIS.filter((poi) => {
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
  }, [searchFilter, enabledTypes, presetId]);

  const regionIcons = useMemo(
    () =>
      NALCOTT_MAP.regions.map((r) => ({
        ...r,
        icon: L.divIcon({
          className: 'nalcott-region-badge',
          html: `<div class="whitespace-nowrap -translate-x-1/2 -translate-y-1/2 rounded border border-slate-500/35 bg-obsidian-950/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200/90 shadow-sm backdrop-blur-[2px]">${r.name}</div>`,
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

  const listPois = useMemo(() => visiblePois.slice(0, 100), [visiblePois]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-xl font-semibold text-white">Nalcott Interactive Map</h1>
          <p className="mt-0.5 text-xs text-slate-400">{activePreset.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {NALCOTT_CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPoi(null);
                setPresetId(preset.id);
                setResetSignal((n) => n + 1);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                presetId === preset.id
                  ? 'border-stardust-400/50 bg-obsidian-800 text-white'
                  : 'border-obsidian-800 bg-obsidian-900/60 text-slate-400 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Controls Bar */}
      <div className="space-y-2.5 rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search 966 POIs, Blackfell, Silos..."
              className="w-full rounded-lg border border-obsidian-800 bg-obsidian-950 py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-500 outline-none focus:border-obsidian-600"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                aria-label="Clear map search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLayersExpanded((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                layersExpanded
                  ? 'border-stardust-400/50 bg-obsidian-800 text-white'
                  : 'border-obsidian-800 bg-obsidian-950 text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-stardust-400" />
              Layers ({enabledTypes.size}/{NALCOTT_MAP.types.length})
            </button>

            <button
              type="button"
              onClick={() => setPinMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                pinMode
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-obsidian-800 bg-obsidian-800 text-slate-300 hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              {pinMode ? 'Tap Map to Pin' : 'Add Pin'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPoi(null);
                setResetSignal((n) => n + 1);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-obsidian-800 bg-obsidian-950 px-2.5 py-1.5 text-xs text-slate-400 transition hover:text-white"
              title="Reset zoom to region overview"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset View
            </button>
          </div>
        </div>

        {pinMode && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2">
            <span className="text-xs text-emerald-300">Pin Label:</span>
            <input
              type="text"
              value={newPinLabel}
              onChange={(e) => setNewPinLabel(e.target.value)}
              placeholder="Pin label..."
              className="min-w-[180px] flex-1 rounded border border-emerald-500/40 bg-obsidian-950 px-2.5 py-1 text-xs text-white outline-none sm:max-w-xs"
            />
            <span className="text-[11px] text-slate-400">Tap anywhere on Nalcott to place pin.</span>
          </div>
        )}

        {layersExpanded && (
          <div className="border-t border-obsidian-800 pt-2.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Filter className="h-3 w-3" />
                Toggle Marker Layers
              </span>
              <div className="flex gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setEnabledTypes(new Set(NALCOTT_DEFAULT_TYPE_KEYS))}
                  className="rounded border border-obsidian-700 bg-obsidian-950 px-2 py-0.5 text-slate-300 hover:text-white"
                >
                  Core
                </button>
                <button
                  type="button"
                  onClick={() => setEnabledTypes(new Set(NALCOTT_MAP.types.map((t) => t.key)))}
                  className="rounded border border-obsidian-700 bg-obsidian-950 px-2 py-0.5 text-slate-300 hover:text-white"
                >
                  Show All
                </button>
                <button
                  type="button"
                  onClick={() => setEnabledTypes(new Set())}
                  className="rounded border border-obsidian-700 bg-obsidian-950 px-2 py-0.5 text-slate-400 hover:text-white"
                >
                  Hide All
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {NALCOTT_MAP.types.map((t) => {
                const active = enabledTypes.has(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleType(t.key)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
                      active
                        ? 'border-obsidian-700 bg-obsidian-800/90 text-slate-200'
                        : 'border-transparent bg-obsidian-950/60 text-slate-500 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span>{t.label}</span>
                    <span className="font-mono text-[10px] text-slate-500">{t.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Map + Side Drawer */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="relative h-[540px] overflow-hidden rounded-xl border border-obsidian-700 sm:h-[600px] lg:col-span-3">
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
            preferCanvas
            className="h-full w-full"
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

            {/* Visible POIs (Canvas rendered for 60fps mobile & desktop pan/zoom) */}
            {visiblePois.map((poi) => {
              const isSelected = selectedPoi?.id === poi.id;
              return (
                <CircleMarker
                  key={poi.id}
                  center={[poi.lat, poi.lng]}
                  radius={isSelected ? 9 : 5.5}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : '#07090d',
                    weight: isSelected ? 2.5 : 1.5,
                    fillColor: poi.color,
                    fillOpacity: isSelected ? 1 : 0.92,
                  }}
                  eventHandlers={{
                    click: () => setSelectedPoi(poi),
                  }}
                >
                  <Popup>
                    <div className="min-w-[190px] space-y-1 text-xs">
                      <div className="font-bold text-white">{poi.name}</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stardust-400">
                        <span>{poi.typeLabel}</span>
                        <span>•</span>
                        <span>{poi.region}</span>
                        {poi.level !== null && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300">Lv {poi.level}</span>
                          </>
                        )}
                      </div>
                      {poi.near && (
                        <div className="text-[11px] text-slate-300">Near: {poi.near}</div>
                      )}
                      <div className="pt-0.5 font-mono text-[10px] text-slate-400">
                        Grid ({Math.round(poi.lng)}, {Math.round(poi.lat)})
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Custom User Pins */}
            {customPins.map((pin) => (
              <CircleMarker
                key={pin.id}
                center={[pin.lat, pin.lng]}
                radius={7}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: '#10b981',
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-emerald-300">{pin.label}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      Grid ({Math.round(pin.lng)}, {Math.round(pin.lat)})
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomPins((prev) => prev.filter((p) => p.id !== pin.id))
                      }
                      className="mt-1 inline-flex items-center gap-1 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" /> Remove pin
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* POI List & Inspector */}
        <div className="flex h-[460px] flex-col rounded-xl border border-obsidian-700 bg-obsidian-900 p-4 sm:h-[600px]">
          <div className="flex items-center justify-between border-b border-obsidian-800 pb-2.5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <MapPin className="h-4 w-4 text-stardust-400" />
              Locations ({visiblePois.length})
            </h2>
            {customPins.length > 0 && (
              <span className="text-[11px] text-emerald-400">{customPins.length} custom</span>
            )}
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {listPois.map((poi) => {
              const active = selectedPoi?.id === poi.id;
              return (
                <button
                  key={poi.id}
                  type="button"
                  onClick={() => setSelectedPoi(poi)}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    active
                      ? 'border-stardust-400/60 bg-stardust-500/10'
                      : 'border-obsidian-800 bg-obsidian-950/70 hover:border-obsidian-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-white">{poi.name}</span>
                    <Crosshair className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: poi.color }}
                    />
                    <span className="truncate">{poi.typeLabel}</span>
                    <span>•</span>
                    <span className="truncate">{poi.region}</span>
                    {poi.level !== null && (
                      <span className="ml-auto shrink-0 font-mono text-[10px] text-amber-300">
                        Lv {poi.level}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {visiblePois.length > listPois.length && (
              <div className="py-1 text-center text-[11px] text-slate-500">
                Showing {listPois.length} of {visiblePois.length} matching POIs — type to narrow search.
              </div>
            )}

            {visiblePois.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                No locations match the current filters.
              </div>
            )}
          </div>

          {selectedPoi && (
            <div className="mt-3 rounded-lg border border-stardust-400/30 bg-obsidian-950 p-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-white">{selectedPoi.name}</div>
                <button
                  type="button"
                  onClick={() => setSelectedPoi(null)}
                  className="text-slate-500 hover:text-white"
                  aria-label="Clear selected location"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {selectedPoi.typeLabel} • {selectedPoi.region}
                {selectedPoi.level !== null ? ` • Lv ${selectedPoi.level}` : ''}
              </div>
              {selectedPoi.near && (
                <div className="mt-1 text-[11px] text-slate-300">Near {selectedPoi.near}</div>
              )}
              <div className="mt-1 font-mono text-[10px] text-slate-500">
                Coords ({selectedPoi.lng.toFixed(1)}, {selectedPoi.lat.toFixed(1)})
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

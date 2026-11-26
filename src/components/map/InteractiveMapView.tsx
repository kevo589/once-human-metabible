import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, Rectangle, SVGOverlay, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, Filter, MapPin, Plus, Trash2 } from 'lucide-react';
import { MAP_MARKERS, MAP_SCENARIOS } from '../../data/mapsAndEncounters';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { MapCategory, MapMarker, ScenarioId } from '../../types/game';

interface CustomPin {
  id: string;
  scenario: ScenarioId;
  label: string;
  x: number;
  y: number;
}

interface InteractiveMapViewProps {
  focusedMarkerId?: string | null;
}

const CATEGORY_COLORS: Record<MapCategory, string> = {
  Monolith: '#f43f5e',
  Silo: '#38bdf8',
  'Teleport Tower': '#22d3ee',
  'Mystical Crate': '#f59e0b',
  'Resource Node': '#22c55e',
  Vendor: '#a855f7',
  Stronghold: '#fb923c',
  'Prime War': '#e879f9',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS) as MapCategory[];

function MapController({ focusMarker }: { focusMarker: MapMarker | null }) {
  const map = useMap();

  useEffect(() => {
    if (focusMarker) {
      map.setView([focusMarker.y, focusMarker.x], 1, { animate: true });
    } else {
      map.setView([500, 500], 0, { animate: true });
    }
  }, [focusMarker, map]);

  return null;
}

function PinDropHandler({
  enabled,
  onDrop,
}: {
  enabled: boolean;
  onDrop: (x: number, y: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const x = Math.max(0, Math.min(1000, Math.round(e.latlng.lng)));
      const y = Math.max(0, Math.min(1000, Math.round(e.latlng.lat)));
      onDrop(x, y);
    },
  });
  return null;
}

export function InteractiveMapView({ focusedMarkerId }: InteractiveMapViewProps) {
  const initialFocus = useMemo(
    () => MAP_MARKERS.find((m) => m.id === focusedMarkerId) ?? null,
    [focusedMarkerId],
  );

  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialFocus?.scenario ?? 'manibus');
  const [enabledCategories, setEnabledCategories] = useState<Set<MapCategory>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [pinMode, setPinMode] = useState(false);
  const [newPinLabel, setNewPinLabel] = useState('Custom Farm Spot');
  const [customPins, setCustomPins] = useLocalStorage<CustomPin[]>('oh-custom-map-pins', []);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(initialFocus);

  useEffect(() => {
    if (initialFocus) {
      setScenarioId(initialFocus.scenario);
      setSelectedMarker(initialFocus);
    }
  }, [initialFocus]);

  const scenario = useMemo(
    () => MAP_SCENARIOS.find((s) => s.id === scenarioId) ?? MAP_SCENARIOS[0],
    [scenarioId],
  );

  const visibleMarkers = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return MAP_MARKERS.filter((m) => {
      if (m.scenario !== scenarioId) return false;
      if (!enabledCategories.has(m.category)) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.region.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scenarioId, enabledCategories, searchFilter]);

  const scenarioPins = useMemo(
    () => customPins.filter((p) => p.scenario === scenarioId),
    [customPins, scenarioId],
  );

  const toggleCategory = (cat: MapCategory) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [1000, 1000],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-xl font-semibold text-white">Tactical Map</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            {scenario.name} — {scenario.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MAP_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setScenarioId(s.id);
                setSelectedMarker(null);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                scenarioId === s.id
                  ? 'border-obsidian-700 bg-obsidian-800 text-white'
                  : 'border-obsidian-800 bg-obsidian-900/60 text-slate-400 hover:text-white'
              }`}
            >
              {s.name.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Filter className="h-3 w-3" />
            Layers:
          </span>
          {ALL_CATEGORIES.map((cat) => {
            const active = enabledCategories.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
                  active
                    ? 'border-obsidian-700 bg-obsidian-800/80 text-slate-200'
                    : 'border-transparent bg-obsidian-950/60 text-slate-500 opacity-55'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter POIs..."
            className="rounded-lg border border-obsidian-800 bg-obsidian-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-obsidian-600"
          />
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
            {pinMode ? 'Click Map to Pin' : 'Add Pin'}
          </button>
          {pinMode && (
            <input
              type="text"
              value={newPinLabel}
              onChange={(e) => setNewPinLabel(e.target.value)}
              placeholder="Pin label..."
              className="w-36 rounded-lg border border-emerald-500/40 bg-obsidian-950 px-2 py-1.5 text-xs text-white outline-none"
            />
          )}
        </div>
      </div>

      {/* Map + Side Drawer */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="relative h-[520px] overflow-hidden rounded-xl border border-obsidian-700 lg:col-span-3">
          <MapContainer
            crs={L.CRS.Simple}
            bounds={bounds}
            maxBounds={[[-120, -120], [1120, 1120]]}
            center={[500, 500]}
            zoom={0}
            minZoom={-1}
            maxZoom={3}
            className="h-full w-full"
          >
            <MapController focusMarker={selectedMarker} />
            <PinDropHandler
              enabled={pinMode}
              onDrop={(x, y) => {
                setCustomPins((prev) => [
                  ...prev,
                  {
                    id: `pin-${Date.now()}`,
                    scenario: scenarioId,
                    label: newPinLabel.trim() || 'Custom Pin',
                    x,
                    y,
                  },
                ]);
                setPinMode(false);
              }}
            />

            {/* Procedural Tactical Grid Overlay */}
            <SVGOverlay bounds={bounds}>
              <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid100" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="1000" height="1000" fill="#090d14" />
                <rect width="1000" height="1000" fill="url(#grid100)" />
                <circle cx="500" cy="500" r="430" fill="none" stroke="#1e293b" strokeDasharray="6 6" />
              </svg>
            </SVGOverlay>

            {/* Scenario Regions */}
            {scenario.regions.map((region) => (
              <Rectangle
                key={region.id}
                bounds={region.bounds}
                pathOptions={{
                  color: region.color,
                  weight: 1.5,
                  fillOpacity: 0.08,
                  dashArray: '5 5',
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs">
                    <div className="font-bold text-white">
                      {region.name} ({region.levelRange})
                    </div>
                    <div className="text-slate-300">{region.notes}</div>
                  </div>
                </Tooltip>
              </Rectangle>
            ))}

            {/* Official POIs */}
            {visibleMarkers.map((marker) => (
              <CircleMarker
                key={marker.id}
                center={[marker.y, marker.x]}
                radius={selectedMarker?.id === marker.id ? 11 : 8}
                pathOptions={{
                  color: '#07090d',
                  weight: 2,
                  fillColor: CATEGORY_COLORS[marker.category],
                  fillOpacity: 0.92,
                }}
                eventHandlers={{
                  click: () => setSelectedMarker(marker),
                }}
              >
                <Popup>
                  <div className="min-w-[200px] space-y-1.5 text-xs">
                    <div className="font-bold text-white">{marker.name}</div>
                    <div className="text-[11px] text-stardust-400">
                      {marker.category} • {marker.region}
                      {marker.level ? ` • Lv ${marker.level}` : ''}
                    </div>
                    <p className="text-slate-300">{marker.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {marker.loot.map((l) => (
                        <span key={l} className="rounded bg-obsidian-800 px-1.5 py-0.5 text-[10px] text-slate-200">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Custom User Pins */}
            {scenarioPins.map((pin) => (
              <CircleMarker
                key={pin.id}
                center={[pin.y, pin.x]}
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
                      Coord ({pin.x}, {pin.y})
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomPins((prev) => prev.filter((p) => p.id !== pin.id))}
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
        <div className="flex h-[520px] flex-col rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
          <div className="flex items-center justify-between border-b border-obsidian-800 pb-2.5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <MapPin className="h-4 w-4 text-stardust-400" />
              Locations ({visibleMarkers.length})
            </h2>
            {scenarioPins.length > 0 && (
              <span className="text-[11px] text-emerald-400">{scenarioPins.length} custom</span>
            )}
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {visibleMarkers.map((marker) => {
              const active = selectedMarker?.id === marker.id;
              return (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => setSelectedMarker(marker)}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    active
                      ? 'border-stardust-400/60 bg-stardust-500/10'
                      : 'border-obsidian-800 bg-obsidian-950/70 hover:border-obsidian-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-white">{marker.name}</span>
                    <Crosshair className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[marker.category] }}
                    />
                    <span>{marker.category}</span>
                    <span>•</span>
                    <span>{marker.region}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedMarker && (
            <div className="mt-3 rounded-lg border border-stardust-400/30 bg-obsidian-950 p-3 text-xs">
              <div className="font-semibold text-white">{selectedMarker.name}</div>
              <p className="mt-1 text-slate-400">{selectedMarker.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

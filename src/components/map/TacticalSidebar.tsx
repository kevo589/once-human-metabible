import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Grid,
  MapPin,
  Pentagon,
  Plus,
  Route,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  MAP_CATEGORIES,
  MAP_DROP_TABLES,
  MAP_LAST_UPDATED,
  MAP_REGIONS,
  MAP_RESOURCE_AREAS,
  MAP_SCENARIOS,
  type MapCategoryDef,
  type MapCategoryGroupId,
} from '../../data/mapCatalog';
import type { NalcottPoi } from '../../data/nalcottMap';
import { CategoryGlyph } from './mapIcons';
import {
  formatDistanceLabel,
  type CustomMarkerItem,
  type DrawingKind,
  type GlobalMapFlags,
  type MapDrawingItem,
} from './mapState';

interface TacticalSidebarProps {
  open: boolean;
  onToggleOpen: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchMatchedPois: NalcottPoi[];
  onFocusPoi: (poi: NalcottPoi) => void;

  cursorCoords: { lng: number; lat: number } | null;
  playerPosition: { lng: number; lat: number } | null;
  onClearPlayerPosition: () => void;

  scenarioId: string;
  onChangeScenario: (id: string) => void;
  regionId: string;
  onChangeRegion: (id: string) => void;

  flags: GlobalMapFlags;
  onChangeFlags: (next: GlobalMapFlags) => void;
  onOpenGlobalSettings: () => void;
  onOpenPresets: () => void;

  enabledCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  onSetCategoriesGroup: (keys: string[], enable: boolean) => void;
  onBulkFilterAction: (mode: 'all' | 'none' | 'default') => void;
  onOpenCategorySettings: (categoryKey: string) => void;

  totalCountsByCategory: Map<string, number>;
  discoveredCountsByCategory: Map<string, number>;

  customMarkers: CustomMarkerItem[];
  onToggleCustomMarker: (id: string) => void;
  onToggleAllCustomMarkers: (visible: boolean) => void;
  onDeleteCustomMarker: (id: string) => void;
  onFocusCoords: (lat: number, lng: number) => void;
  onStartAddMarkerMode: () => void;

  drawings: MapDrawingItem[];
  activeDrawingKind: DrawingKind | null;
  onStartDrawing: (kind: DrawingKind) => void;
  onToggleDrawing: (id: string) => void;
  onToggleAllDrawings: (visible: boolean) => void;
  onDeleteDrawing: (id: string) => void;
  onExportDrawingsJson: () => void;

  enabledResourceAreaIds: Set<string>;
  onToggleResourceArea: (id: string) => void;
  onToggleAllResourceAreas: (enable: boolean) => void;
}

const ACCORDION_GROUPS: Array<{
  id: MapCategoryGroupId;
  title: string;
  anomalyStyled?: boolean;
}> = [
  { id: 'locations', title: 'Locations' },
  { id: 'loot_containers', title: 'Loot Containers' },
  { id: 'bosses_anomalies', title: 'Bosses, Lairs & Anomalies', anomalyStyled: true },
];

export function TacticalSidebar({
  open,
  onToggleOpen,
  searchQuery,
  onSearchChange,
  searchMatchedPois,
  onFocusPoi,
  cursorCoords,
  playerPosition,
  onClearPlayerPosition,
  scenarioId,
  onChangeScenario,
  regionId,
  onChangeRegion,
  flags,
  onChangeFlags,
  onOpenGlobalSettings,
  onOpenPresets,
  enabledCategories,
  onToggleCategory,
  onSetCategoriesGroup,
  onBulkFilterAction,
  onOpenCategorySettings,
  totalCountsByCategory,
  discoveredCountsByCategory,
  customMarkers,
  onToggleCustomMarker,
  onToggleAllCustomMarkers,
  onDeleteCustomMarker,
  onFocusCoords,
  onStartAddMarkerMode,
  drawings,
  activeDrawingKind,
  onStartDrawing,
  onToggleDrawing,
  onToggleAllDrawings,
  onDeleteDrawing,
  onExportDrawingsJson,
  enabledResourceAreaIds,
  onToggleResourceArea,
  onToggleAllResourceAreas,
}: TacticalSidebarProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
    () =>
      new Set([
        'my_markers',
        'drawings',
        'resource_areas',
        'locations',
        'loot_containers',
        'bosses_anomalies',
      ]),
  );

  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeCoords = playerPosition ?? cursorCoords ?? { lng: 383, lat: -302 };
  const coordLabelMode = playerPosition ? 'PLAYER POS' : 'CURSOR';

  const handleCopyCoords = async () => {
    await navigator.clipboard
      ?.writeText(`${activeCoords.lng}, ${activeCoords.lat}`)
      .catch(() => {});
    setCopiedCoords(true);
    window.setTimeout(() => setCopiedCoords(false), 1400);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const matchingCategories = useMemo(() => {
    const out = new Map<MapCategoryGroupId, MapCategoryDef[]>();
    for (const grp of ACCORDION_GROUPS) {
      const cats = MAP_CATEGORIES.filter((c) => c.group === grp.id).filter((cat) => {
        if (!normalizedSearch) return true;
        if (cat.label.toLowerCase().includes(normalizedSearch)) return true;
        if (cat.description.toLowerCase().includes(normalizedSearch)) return true;
        const drops = MAP_DROP_TABLES[cat.key];
        if (drops && drops.some((d) => d.item.toLowerCase().includes(normalizedSearch))) {
          return true;
        }
        return false;
      });
      out.set(grp.id, cats);
    }
    return out;
  }, [normalizedSearch]);

  const visibleCustomCount = customMarkers.filter((m) => m.visible).length;
  const visibleDrawingsCount = drawings.filter((d) => d.visible).length;

  const availableRegions = useMemo(
    () =>
      MAP_REGIONS.filter(
        (r) =>
          r.id === 'all' ||
          scenarioId === 'all' ||
          scenarioId === 'isles_of_abyss' ||
          r.scenario === scenarioId,
      ),
    [scenarioId],
  );

  if (!open) {
    return (
      <div className="pointer-events-none absolute left-3 top-3 z-[1100]">
        <button
          type="button"
          onClick={() => onToggleOpen(true)}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#121214]/95 px-3 py-2 text-xs font-semibold text-zinc-100 shadow-2xl backdrop-blur-md transition hover:border-cyan-500/60 hover:text-cyan-300"
          aria-label="Open map sidebar"
        >
          <ChevronRight className="h-4 w-4 text-cyan-400" />
          <span>Map Panel</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className="pointer-events-auto absolute inset-y-2 left-2 z-[1100] flex w-[328px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border border-[#27272a] bg-[#121214]/96 text-zinc-100 shadow-2xl backdrop-blur-md sm:inset-y-3 sm:left-3"
      aria-label="Map control sidebar"
    >
      {/* 1. Top Search & Controls Bar */}
      <div className="flex items-center gap-1.5 border-b border-[#27272a] bg-[#18181b]/90 px-2.5 py-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type to search..."
            className="w-full rounded-md border border-[#27272a] bg-[#121214] py-1.5 pl-2.5 pr-7 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleOpen(false)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#27272a] bg-[#121214] font-mono text-xs text-zinc-400 transition hover:border-cyan-500/50 hover:text-white"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Sidebar Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 text-xs">
        {/* Search Jump POIs if typing */}
        {normalizedSearch && searchMatchedPois.length > 0 && (
          <div className="mb-2.5 rounded-lg border border-cyan-500/35 bg-[#18181b] p-1.5">
            <div className="mb-1 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              <span>Matching Locations</span>
              <span>{searchMatchedPois.length}</span>
            </div>
            <div className="max-h-36 space-y-1 overflow-y-auto">
              {searchMatchedPois.slice(0, 12).map((poi) => (
                <button
                  key={poi.id}
                  type="button"
                  onClick={() => {
                    onFocusPoi(poi);
                    if (window.innerWidth < 768) onToggleOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left transition hover:bg-zinc-800"
                >
                  <CategoryGlyph typeKey={poi.typeKey} color={poi.color} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-white">{poi.name}</div>
                    <div className="truncate text-[10px] text-zinc-400">
                      {poi.typeLabel} · {poi.region}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Metadata & Coordinate Readout */}
        <div className="mb-2.5 space-y-1.5">
          <div className="px-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            LAST MAP UPDATE: {MAP_LAST_UPDATED}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#27272a] bg-[#18181b] px-2.5 py-1.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    playerPosition ? 'bg-cyan-400' : 'bg-zinc-500'
                  }`}
                />
                <span>{coordLabelMode}</span>
                {playerPosition && (
                  <button
                    type="button"
                    onClick={onClearPlayerPosition}
                    className="text-zinc-500 hover:text-rose-400"
                    title="Clear manual player position"
                  >
                    (clear)
                  </button>
                )}
              </div>
              <div className="font-mono text-xs font-semibold text-zinc-100">
                X {activeCoords.lng.toFixed(1)}, Y {activeCoords.lat.toFixed(1)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCoords}
              className="inline-flex items-center gap-1 rounded border border-[#27272a] bg-[#121214] px-2 py-1 text-[10px] font-medium text-zinc-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
            >
              <Copy className="h-3 w-3" />
              {copiedCoords ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* 3. Scenario & Region Selectors */}
        <div className="mb-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <select
              value={scenarioId}
              onChange={(e) => onChangeScenario(e.target.value)}
              aria-label="Scenario selector"
              className="min-w-0 flex-1 rounded-md border border-[#27272a] bg-[#18181b] px-2 py-1.5 text-xs font-medium text-zinc-100 outline-none focus:border-cyan-500"
            >
              {MAP_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onOpenGlobalSettings}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#27272a] bg-[#18181b] text-zinc-300 transition hover:border-cyan-500/60 hover:text-cyan-300"
              title="Global map settings & backup"
              aria-label="Global map settings"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          <select
            value={regionId}
            onChange={(e) => onChangeRegion(e.target.value)}
            aria-label="Region selector"
            className="w-full rounded-md border border-[#27272a] bg-[#18181b] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500"
          >
            {availableRegions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.levelRange ? ` (${r.levelRange})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Quick Filter Action Bar */}
        <div className="mb-3 grid grid-cols-4 gap-1 rounded-lg border border-[#27272a] bg-[#18181b] p-1 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => onBulkFilterAction('all')}
            className="rounded py-1 text-zinc-300 transition hover:bg-zinc-800 hover:text-cyan-300"
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => onBulkFilterAction('none')}
            className="rounded py-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            NONE
          </button>
          <button
            type="button"
            onClick={() => onBulkFilterAction('default')}
            className="rounded py-1 text-zinc-300 transition hover:bg-zinc-800 hover:text-cyan-300"
          >
            DEFAULT
          </button>
          <button
            type="button"
            onClick={onOpenPresets}
            className="rounded bg-cyan-500/15 py-1 text-cyan-300 transition hover:bg-cyan-500/25"
          >
            PRESETS &gt;
          </button>
        </div>

        {/* 5. Collapsible Category Accordions */}
        <div className="space-y-2 pb-2">
          {/* Group 1: My Markers */}
          <div className="rounded-lg border border-[#27272a] bg-[#18181b]/70">
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => toggleAccordion('my_markers')}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-semibold text-zinc-200 hover:text-white"
              >
                {expandedAccordions.has('my_markers') ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                )}
                <span className="truncate">My Markers</span>
                <span className="font-mono text-[10px] text-cyan-400">
                  ({visibleCustomCount}/{customMarkers.length})
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChangeFlags({ ...flags, showGrid: !flags.showGrid })}
                  className={`rounded p-1 transition ${
                    flags.showGrid
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                  title="Toggle Coordinate Grid (#)"
                  aria-label="Toggle coordinate grid"
                >
                  <Grid className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={onOpenGlobalSettings}
                  className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  title="JSON Import / Export"
                  aria-label="JSON Import or Export"
                >
                  <FileJson className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAllCustomMarkers(visibleCustomCount < customMarkers.length)}
                  className="rounded px-1 py-0.5 text-[9px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300"
                >
                  {visibleCustomCount < customMarkers.length ? 'ALL' : 'NONE'}
                </button>
              </div>
            </div>

            {expandedAccordions.has('my_markers') && (
              <div className="space-y-1 border-t border-[#27272a] p-1.5">
                <button
                  type="button"
                  onClick={onStartAddMarkerMode}
                  className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-cyan-500/40 bg-cyan-950/15 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-950/35"
                >
                  <Plus className="h-3 w-3" /> Click Map to Place Marker
                </button>
                {customMarkers.map((cm) => (
                  <div
                    key={cm.id}
                    className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-zinc-800/70"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleCustomMarker(cm.id)}
                      className="text-zinc-400 hover:text-cyan-300"
                      title={cm.visible ? 'Hide marker' : 'Show marker'}
                    >
                      {cm.visible ? (
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onFocusCoords(cm.lat, cm.lng)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    >
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: cm.color }} />
                      <span className="truncate text-[11px] text-zinc-200">{cm.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomMarker(cm.id)}
                      className="text-zinc-500 hover:text-rose-400"
                      aria-label={`Delete ${cm.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 2: Drawings */}
          <div className="rounded-lg border border-[#27272a] bg-[#18181b]/70">
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => toggleAccordion('drawings')}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-semibold text-zinc-200 hover:text-white"
              >
                {expandedAccordions.has('drawings') ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                )}
                <span className="truncate">Drawings</span>
                <span className="font-mono text-[10px] text-cyan-400">
                  ({visibleDrawingsCount}/{drawings.length})
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onExportDrawingsJson}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300"
                  title="Export Drawings JSON"
                  aria-label="Export drawings JSON"
                >
                  <Download className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAllDrawings(visibleDrawingsCount < drawings.length)}
                  className="rounded px-1 py-0.5 text-[9px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300"
                >
                  {visibleDrawingsCount < drawings.length ? 'ALL' : 'NONE'}
                </button>
              </div>
            </div>

            {expandedAccordions.has('drawings') && (
              <div className="space-y-1.5 border-t border-[#27272a] p-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onStartDrawing('polyline')}
                    className={`flex items-center justify-center gap-1 rounded border py-1 text-[11px] font-medium transition ${
                      activeDrawingKind === 'polyline'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-[#27272a] bg-[#121214] text-zinc-300 hover:border-cyan-500/50'
                    }`}
                  >
                    <Route className="h-3 w-3 text-cyan-400" /> Route
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartDrawing('polygon')}
                    className={`flex items-center justify-center gap-1 rounded border py-1 text-[11px] font-medium transition ${
                      activeDrawingKind === 'polygon'
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-[#27272a] bg-[#121214] text-zinc-300 hover:border-cyan-500/50'
                    }`}
                  >
                    <Pentagon className="h-3 w-3 text-cyan-400" /> Zone
                  </button>
                </div>

                {drawings.map((dw) => (
                  <div
                    key={dw.id}
                    className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-zinc-800/70"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleDrawing(dw.id)}
                      className="text-zinc-400 hover:text-cyan-300"
                    >
                      {dw.visible ? (
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </button>
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dw.color }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const first = dw.points[0];
                        if (first) onFocusCoords(first[0], first[1]);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-[11px] text-zinc-200">{dw.title}</div>
                      <div className="font-mono text-[9px] text-zinc-500">
                        {dw.kind === 'polyline'
                          ? `${formatDistanceLabel(dw.distanceMeters)} · ${dw.points.length} pts`
                          : `Perimeter ${formatDistanceLabel(dw.distanceMeters)}`}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDrawing(dw.id)}
                      className="text-zinc-500 hover:text-rose-400"
                      aria-label={`Delete ${dw.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 3: Resource Areas */}
          <div className="rounded-lg border border-[#27272a] bg-[#18181b]/70">
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => toggleAccordion('resource_areas')}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-semibold text-zinc-200 hover:text-white"
              >
                {expandedAccordions.has('resource_areas') ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                )}
                <span className="truncate">Resource Areas</span>
                <span className="font-mono text-[10px] text-cyan-400">
                  ({enabledResourceAreaIds.size}/{MAP_RESOURCE_AREAS.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onToggleAllResourceAreas(
                    enabledResourceAreaIds.size < MAP_RESOURCE_AREAS.length,
                  )
                }
                className="rounded px-1 py-0.5 text-[9px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300"
              >
                {enabledResourceAreaIds.size < MAP_RESOURCE_AREAS.length ? 'ALL' : 'NONE'}
              </button>
            </div>

            {expandedAccordions.has('resource_areas') && (
              <div className="space-y-1 border-t border-[#27272a] p-1.5">
                {MAP_RESOURCE_AREAS.map((area) => {
                  const active = enabledResourceAreaIds.has(area.id);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => onToggleResourceArea(area.id)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition ${
                        active
                          ? 'bg-zinc-800/85 text-zinc-100'
                          : 'text-zinc-400 opacity-65 hover:bg-zinc-800/40 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[11px]">{area.name}</span>
                    </button>
                  );
                })}
                <div className="flex items-center gap-2 px-2 pt-1 text-[10px] text-zinc-400">
                  <span>Opacity</span>
                  <input
                    type="range"
                    min={0.08}
                    max={0.7}
                    step={0.04}
                    value={flags.resourceOpacity}
                    onChange={(e) =>
                      onChangeFlags({ ...flags, resourceOpacity: Number(e.target.value) })
                    }
                    className="h-1 flex-1 cursor-pointer appearance-none rounded bg-zinc-700 accent-cyan-500"
                  />
                  <span className="font-mono text-cyan-300">
                    {Math.round(flags.resourceOpacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Groups 4, 5, 6: Locations, Loot Containers, Bosses/Lairs/Anomalies */}
          {ACCORDION_GROUPS.map((grp) => {
            const cats = matchingCategories.get(grp.id) ?? [];
            if (cats.length === 0) return null;
            const groupKeys = cats.map((c) => c.key);
            const activeCount = cats.filter((c) => enabledCategories.has(c.key)).length;
            const isOpen = expandedAccordions.has(grp.id) || Boolean(normalizedSearch);

            return (
              <div
                key={grp.id}
                className="rounded-lg border border-[#27272a] bg-[#18181b]/70"
              >
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => toggleAccordion(grp.id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] font-semibold text-zinc-200 hover:text-white"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    )}
                    <span className="truncate">{grp.title}</span>
                    <span className="font-mono text-[10px] text-cyan-400">
                      ({activeCount}/{cats.length})
                    </span>
                  </button>
                  <div className="flex items-center gap-1 text-[9px] font-semibold">
                    <button
                      type="button"
                      onClick={() => onSetCategoriesGroup(groupKeys, true)}
                      className="rounded px-1 py-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300"
                    >
                      ALL
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetCategoriesGroup(groupKeys, false)}
                      className="rounded px-1 py-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                    >
                      NONE
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-0.5 border-t border-[#27272a] p-1">
                    {cats.map((cat) => {
                      const active = enabledCategories.has(cat.key);
                      const total = totalCountsByCategory.get(cat.key) ?? 0;
                      const found = discoveredCountsByCategory.get(cat.key) ?? 0;
                      return (
                        <div
                          key={cat.key}
                          className={`group flex items-center gap-1 rounded-md px-1 py-0.5 transition ${
                            active
                              ? 'bg-zinc-800/80 text-zinc-100'
                              : 'text-zinc-400 opacity-60 hover:bg-zinc-800/40 hover:opacity-95'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleCategory(cat.key)}
                            className="flex min-w-0 flex-1 items-center gap-2 py-1 pl-1 text-left"
                          >
                            <CategoryGlyph
                              typeKey={cat.key}
                              color={cat.color}
                              variant={grp.anomalyStyled ? 'anomaly' : 'default'}
                            />
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                              {cat.label}
                            </span>
                            {cat.isNew && (
                              <span className="shrink-0 rounded bg-cyan-500/20 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                                NEW
                              </span>
                            )}
                            <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                              {found > 0 ? `${found}/` : ''}
                              {total}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenCategorySettings(cat.key)}
                            className="rounded p-1 text-zinc-500 transition hover:bg-zinc-700/70 hover:text-cyan-300"
                            title={`${cat.label} settings & drops`}
                            aria-label={`${cat.label} settings`}
                          >
                            <SlidersHorizontal className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

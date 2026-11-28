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
  { id: 'gathering', title: 'Gathering & Resources' },
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
        'locations',
        'gathering',
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
          className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-md border-2 border-sign-white bg-black px-3 text-[14px] font-semibold text-sign-white shadow-[0_4px_14px_rgba(0,0,0,0.6)] transition-colors hover:bg-sign-white hover:text-black"
          aria-label="Open map layers"
        >
          <ChevronRight className="h-4 w-4" />
          <span>Layers</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className="pointer-events-auto absolute inset-y-0 left-0 z-[1100] flex w-[328px] max-w-[88vw] flex-col overflow-hidden border-r border-sign-seam bg-sign-ground text-sign-white shadow-[8px_0_24px_rgba(0,0,0,0.5)]"
      aria-label="Map control sidebar"
    >
      {/* 1. Top Search & Controls Bar */}
      <div className="flex items-center gap-1.5 border-b border-sign-seam bg-sign-raised/90 px-2.5 py-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type to search..."
            className="w-full rounded-md border border-sign-seam bg-sign-black py-1.5 pl-2.5 pr-7 text-[13px] text-sign-white placeholder-sign-dim outline-none focus:border-line-map/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sign-dim hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleOpen(false)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sign-seam bg-sign-black font-mono text-[13px] text-sign-mute transition hover:border-line-map/50 hover:text-white"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Sidebar Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 text-[13px]">
        {/* Search Jump POIs if typing */}
        {normalizedSearch && searchMatchedPois.length > 0 && (
          <div className="mb-2.5 rounded-md border border-line-map/35 bg-sign-raised p-1.5">
            <div className="mb-1 flex items-center justify-between px-1 text-[12px] font-semibold uppercase tracking-wider text-line-map">
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
                  className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left transition hover:bg-sign-seam"
                >
                  {poi.imageUrl ? (
                    <img
                      src={poi.imageUrl}
                      alt={poi.name}
                      className="h-6 w-6 shrink-0 rounded-md border border-orange-500/45 bg-sign-raised object-cover"
                    />
                  ) : (
                    <CategoryGlyph typeKey={poi.typeKey} color={poi.color} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-white">{poi.name}</div>
                    <div className="truncate text-[12px] text-sign-mute">
                      {poi.typeLabel} · {poi.region}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Scenario & Region Selectors */}
        <div className="mb-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <select
              value={scenarioId}
              onChange={(e) => onChangeScenario(e.target.value)}
              aria-label="Scenario selector"
              className="min-w-0 flex-1 rounded-md border border-sign-seam bg-sign-raised px-2 py-1.5 text-[13px] font-medium text-sign-white outline-none focus:border-line-map"
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
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sign-seam bg-sign-raised text-sign-mute transition hover:border-line-map/60 hover:text-line-map"
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
            className="w-full rounded-md border border-sign-seam bg-sign-raised px-2 py-1.5 text-[13px] text-sign-white outline-none focus:border-line-map"
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
        <div className="mb-3 grid grid-cols-4 gap-1 rounded-md border border-sign-seam bg-sign-raised p-1 text-[12px] font-semibold">
          <button
            type="button"
            onClick={() => onBulkFilterAction('all')}
            className="rounded py-1 text-sign-mute transition hover:bg-sign-seam hover:text-line-map"
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => onBulkFilterAction('none')}
            className="rounded py-1 text-sign-mute transition hover:bg-sign-seam hover:text-white"
          >
            NONE
          </button>
          <button
            type="button"
            onClick={() => onBulkFilterAction('default')}
            className="rounded py-1 text-sign-mute transition hover:bg-sign-seam hover:text-line-map"
          >
            DEFAULT
          </button>
          <button
            type="button"
            onClick={onOpenPresets}
            className="rounded bg-line-map/15 py-1 text-line-map transition hover:bg-line-map/25"
          >
            PRESETS &gt;
          </button>
        </div>

        {/* 5. Collapsible Category Accordions */}
        <div className="space-y-2 pb-2">
          {/* Groups 4, 5, 6: Locations, Loot Containers, Bosses/Lairs/Anomalies */}
          {ACCORDION_GROUPS.map((grp) => {
            const cats = matchingCategories.get(grp.id) ?? [];
            if (cats.length === 0) return null;
            const groupKeys = cats.map((c) => c.key);
            const activeCount = cats.filter((c) => enabledCategories.has(c.key)).length;
            const isOpen = expandedAccordions.has(grp.id) || Boolean(normalizedSearch);

            return (
              <div key={grp.id} className="border-t border-sign-seam pt-1">
                <div className="flex items-center justify-between gap-1 px-1 py-1.5">
                  <button
                    type="button"
                    onClick={() => toggleAccordion(grp.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[12px] font-semibold uppercase tracking-[0.1em] text-sign-mute hover:text-sign-white"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                    )}
                    <span className="truncate">{grp.title}</span>
                    <span className="text-sign-dim">
                      {activeCount}/{cats.length}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 text-[12px] font-semibold">
                    <button
                      type="button"
                      onClick={() => onSetCategoriesGroup(groupKeys, true)}
                      className="rounded-sm px-1.5 py-1 text-sign-mute hover:bg-sign-seam hover:text-sign-white"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetCategoriesGroup(groupKeys, false)}
                      className="rounded-sm px-1.5 py-1 text-sign-dim hover:bg-sign-seam hover:text-sign-white"
                    >
                      None
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="relative pb-1">
                    {/* the line every stop sits on */}
                    <span aria-hidden className="absolute bottom-4 left-[13px] top-4 w-1 bg-line-map" />
                    {cats.map((cat) => {
                      const active = enabledCategories.has(cat.key);
                      const total = totalCountsByCategory.get(cat.key) ?? 0;
                      const found = discoveredCountsByCategory.get(cat.key) ?? 0;
                      return (
                        <div
                          key={cat.key}
                          className={`group relative flex items-center gap-1 rounded-sm transition-colors ${
                            active ? 'text-sign-white' : 'text-sign-dim hover:text-sign-mute'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleCategory(cat.key)}
                            aria-pressed={active}
                            className="flex min-h-[36px] min-w-0 flex-1 items-center gap-2.5 py-1 pl-[6px] text-left"
                          >
                            {/* stop: solid ring = shown, dashed ring = hidden */}
                            <span
                              aria-hidden
                              className={`relative z-[1] h-[17px] w-[17px] shrink-0 rounded-full border-[3px] bg-black ${
                                active ? 'border-solid' : 'border-dashed opacity-70'
                              }`}
                              style={{ borderColor: cat.color }}
                            />
                            <CategoryGlyph
                              typeKey={cat.key}
                              color={cat.color}
                              variant={grp.anomalyStyled ? 'anomaly' : 'default'}
                            />
                            <span className={`min-w-0 flex-1 truncate text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>
                              {cat.label}
                            </span>
                            {cat.isNew && (
                              <span className="shrink-0 rounded-sm bg-sign-white px-1 py-0.5 text-[12px] font-bold uppercase tracking-wider text-black">
                                New
                              </span>
                            )}
                            <span className="shrink-0 text-[12px] text-sign-mute">
                              {found > 0 ? `${found}/` : ''}
                              {total}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenCategorySettings(cat.key)}
                            className="grid h-8 w-8 place-items-center rounded-sm text-sign-dim transition-colors hover:bg-sign-seam hover:text-sign-white"
                            title={`${cat.label} settings & drops`}
                            aria-label={`${cat.label} settings`}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {/* Group 1: My Markers */}
          <div className="rounded-md border border-sign-seam bg-sign-raised/70">
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => toggleAccordion('my_markers')}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[12px] font-semibold text-sign-white hover:text-white"
              >
                {expandedAccordions.has('my_markers') ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                )}
                <span className="truncate">My Markers</span>
                <span className="font-mono text-[12px] text-line-map">
                  ({visibleCustomCount}/{customMarkers.length})
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChangeFlags({ ...flags, showGrid: !flags.showGrid })}
                  className={`rounded p-1 transition ${
                    flags.showGrid
                      ? 'bg-line-map/20 text-line-map'
                      : 'text-sign-mute hover:bg-sign-seam hover:text-white'
                  }`}
                  title="Toggle Coordinate Grid (#)"
                  aria-label="Toggle coordinate grid"
                >
                  <Grid className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={onOpenGlobalSettings}
                  className="rounded p-1 text-sign-mute transition hover:bg-sign-seam hover:text-white"
                  title="JSON Import / Export"
                  aria-label="JSON Import or Export"
                >
                  <FileJson className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAllCustomMarkers(visibleCustomCount < customMarkers.length)}
                  className="rounded px-1 py-0.5 text-[12px] font-semibold text-sign-mute hover:bg-sign-seam hover:text-line-map"
                >
                  {visibleCustomCount < customMarkers.length ? 'ALL' : 'NONE'}
                </button>
              </div>
            </div>

            {expandedAccordions.has('my_markers') && (
              <div className="space-y-1 border-t border-sign-seam p-1.5">
                <button
                  type="button"
                  onClick={onStartAddMarkerMode}
                  className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-line-map/40 bg-line-map/15 py-1 text-[12px] font-medium text-line-map hover:bg-line-map/35"
                >
                  <Plus className="h-3 w-3" /> Click Map to Place Marker
                </button>
                {customMarkers.map((cm) => (
                  <div
                    key={cm.id}
                    className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-sign-seam/70"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleCustomMarker(cm.id)}
                      className="text-sign-mute hover:text-line-map"
                      title={cm.visible ? 'Hide marker' : 'Show marker'}
                    >
                      {cm.visible ? (
                        <Eye className="h-3.5 w-3.5 text-line-map" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-sign-dim" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onFocusCoords(cm.lat, cm.lng)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    >
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: cm.color }} />
                      <span className="truncate text-[12px] text-sign-white">{cm.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomMarker(cm.id)}
                      className="text-sign-dim hover:text-rose-400"
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
          <div className="rounded-md border border-sign-seam bg-sign-raised/70">
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => toggleAccordion('drawings')}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[12px] font-semibold text-sign-white hover:text-white"
              >
                {expandedAccordions.has('drawings') ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                )}
                <span className="truncate">Drawings</span>
                <span className="font-mono text-[12px] text-line-map">
                  ({visibleDrawingsCount}/{drawings.length})
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onExportDrawingsJson}
                  className="rounded p-1 text-sign-mute hover:bg-sign-seam hover:text-line-map"
                  title="Export Drawings JSON"
                  aria-label="Export drawings JSON"
                >
                  <Download className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAllDrawings(visibleDrawingsCount < drawings.length)}
                  className="rounded px-1 py-0.5 text-[12px] font-semibold text-sign-mute hover:bg-sign-seam hover:text-line-map"
                >
                  {visibleDrawingsCount < drawings.length ? 'ALL' : 'NONE'}
                </button>
              </div>
            </div>

            {expandedAccordions.has('drawings') && (
              <div className="space-y-1.5 border-t border-sign-seam p-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onStartDrawing('polyline')}
                    className={`flex items-center justify-center gap-1 rounded border py-1 text-[12px] font-medium transition ${
                      activeDrawingKind === 'polyline'
                        ? 'border-line-map bg-line-map/20 text-line-map'
                        : 'border-sign-seam bg-sign-black text-sign-mute hover:border-line-map/50'
                    }`}
                  >
                    <Route className="h-3 w-3 text-line-map" /> Route
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartDrawing('polygon')}
                    className={`flex items-center justify-center gap-1 rounded border py-1 text-[12px] font-medium transition ${
                      activeDrawingKind === 'polygon'
                        ? 'border-line-map bg-line-map/20 text-line-map'
                        : 'border-sign-seam bg-sign-black text-sign-mute hover:border-line-map/50'
                    }`}
                  >
                    <Pentagon className="h-3 w-3 text-line-map" /> Zone
                  </button>
                </div>

                {drawings.map((dw) => (
                  <div
                    key={dw.id}
                    className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-sign-seam/70"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleDrawing(dw.id)}
                      className="text-sign-mute hover:text-line-map"
                    >
                      {dw.visible ? (
                        <Eye className="h-3.5 w-3.5 text-line-map" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-sign-dim" />
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
                      <div className="truncate text-[12px] text-sign-white">{dw.title}</div>
                      <div className="font-mono text-[12px] text-sign-dim">
                        {dw.kind === 'polyline'
                          ? `${formatDistanceLabel(dw.distanceMeters)} · ${dw.points.length} pts`
                          : `Perimeter ${formatDistanceLabel(dw.distanceMeters)}`}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDrawing(dw.id)}
                      className="text-sign-dim hover:text-rose-400"
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
          <div className="rounded-md border border-sign-seam bg-sign-raised/70">
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <button
                type="button"
                onClick={() => toggleAccordion('resource_areas')}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[12px] font-semibold text-sign-white hover:text-white"
              >
                {expandedAccordions.has('resource_areas') ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sign-dim" />
                )}
                <span className="truncate">Resource Areas</span>
                <span className="font-mono text-[12px] text-line-map">
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
                className="rounded px-1 py-0.5 text-[12px] font-semibold text-sign-mute hover:bg-sign-seam hover:text-line-map"
              >
                {enabledResourceAreaIds.size < MAP_RESOURCE_AREAS.length ? 'ALL' : 'NONE'}
              </button>
            </div>

            {expandedAccordions.has('resource_areas') && (
              <div className="space-y-1 border-t border-sign-seam p-1.5">
                {MAP_RESOURCE_AREAS.map((area) => {
                  const active = enabledResourceAreaIds.has(area.id);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => onToggleResourceArea(area.id)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition ${
                        active
                          ? 'bg-sign-seam/85 text-sign-white'
                          : 'text-sign-mute opacity-65 hover:bg-sign-seam/40 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12px]">{area.name}</span>
                    </button>
                  );
                })}
                <div className="flex items-center gap-2 px-2 pt-1 text-[12px] text-sign-mute">
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
                    className="h-1 flex-1 cursor-pointer appearance-none rounded bg-sign-seam accent-line-map"
                  />
                  <span className="font-mono text-line-map">
                    {Math.round(flags.resourceOpacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
        {/* 2. Metadata & Coordinate Readout */}
        <div className="mt-4 space-y-1.5">
          <div className="px-0.5 font-mono text-[12px] uppercase tracking-wider text-sign-dim">
            LAST MAP UPDATE: {MAP_LAST_UPDATED}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-sign-seam bg-sign-raised px-2.5 py-1.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-sign-mute">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    playerPosition ? 'bg-line-map' : 'bg-sign-dim'
                  }`}
                />
                <span>{coordLabelMode}</span>
                {playerPosition && (
                  <button
                    type="button"
                    onClick={onClearPlayerPosition}
                    className="text-sign-dim hover:text-rose-400"
                    title="Clear manual player position"
                  >
                    (clear)
                  </button>
                )}
              </div>
              <div className="font-mono text-[13px] font-semibold text-sign-white">
                X {activeCoords.lng.toFixed(1)}, Y {activeCoords.lat.toFixed(1)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCoords}
              className="inline-flex items-center gap-1 rounded border border-sign-seam bg-sign-black px-2 py-1 text-[12px] font-medium text-sign-mute transition hover:border-line-map/50 hover:text-line-map"
            >
              <Copy className="h-3 w-3" />
              {copiedCoords ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}

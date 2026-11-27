import { useMemo, useState } from 'react';
import { Award, ChefHat, Cpu, Crosshair, MapPin, Shield, Skull, Sparkles } from 'lucide-react';
import { DEVIATION_MAP_SPAWNS } from '../../data/deviationMapLinks';
import { DEVIATIONS, RECIPES } from '../../data/deviationsAndChef';
import { ARMOR_SETS, MODS } from '../../data/gearAndMods';
import { CLASS_SPECS, ENCOUNTERS } from '../../data/mapsAndEncounters';
import { WEAPONS } from '../../data/weapons';
import type {
  Deviation,
  EncyclopediaSubTab,
  Rarity,
  Weapon,
} from '../../types/game';
import { cn } from '../../utils/cn';
import { Pill, RARITY_LEFT_BORDER, RarityBadge } from '../common/Badge';
import { EntityDetailModal, EntityThumbnail, type InspectedEntity } from '../common/ItemVisuals';
import { GearWorkbenchView } from '../workbench/GearWorkbenchView';
import { ModsMatrixView } from './ModsMatrixView';

interface EncyclopediaViewProps {
  subTab: EncyclopediaSubTab;
  onChangeSubTab: (tab: EncyclopediaSubTab) => void;
  highlightedId?: string | null;
  onSimulateWeapon?: (weapon: Weapon) => void;
  onLocateOnMap?: (poiId: string) => void;
}

const SUB_TABS: Array<{ id: EncyclopediaSubTab; label: string; icon: typeof Crosshair }> = [
  { id: 'weapons', label: `Weapons (${WEAPONS.length})`, icon: Crosshair },
  { id: 'armor', label: `Armor (${ARMOR_SETS.length})`, icon: Shield },
  { id: 'mods', label: `Mods (${MODS.length})`, icon: Cpu },
  { id: 'deviations', label: `Deviations (${DEVIATIONS.length})`, icon: Sparkles },
  { id: 'chef', label: 'Chef', icon: ChefHat },
  { id: 'encounters', label: 'Encounters', icon: Skull },
  { id: 'classes', label: 'Specs', icon: Award },
];

const DEV_TYPES: Array<'All' | Deviation['type']> = ['All', 'Combat', 'Territory', 'Crafting'];
const RARITIES: Array<'All' | Rarity> = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

function groupBySection<T>(items: T[], getKey: (item: T) => string, preferredOrder?: string[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = getKey(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  const entries = Array.from(map.entries());
  if (preferredOrder) {
    entries.sort((a, b) => {
      const ia = preferredOrder.indexOf(a[0]);
      const ib = preferredOrder.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });
  } else {
    entries.sort((a, b) => a[0].localeCompare(b[0]));
  }
  return entries;
}

export function EncyclopediaView({
  subTab,
  onChangeSubTab,
  highlightedId,
  onSimulateWeapon,
  onLocateOnMap,
}: EncyclopediaViewProps) {
  const [filterText, setFilterText] = useState('');
  const [devType, setDevType] = useState<'All' | Deviation['type']>('All');
  const [rarityFilter, setRarityFilter] = useState<'All' | Rarity>('All');

  const [inspectedEntity, setInspectedEntity] = useState<InspectedEntity | null>(null);

  const q = filterText.trim().toLowerCase();

  const filteredDeviations = useMemo(
    () =>
      DEVIATIONS.filter((d) => {
        if (devType !== 'All' && d.type !== devType) return false;
        if (rarityFilter !== 'All' && d.rarity !== rarityFilter) return false;
        if (
          q &&
          !d.name.toLowerCase().includes(q) &&
          !d.type.toLowerCase().includes(q) &&
          !d.element.toLowerCase().includes(q) &&
          !d.skillSummary.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      }),
    [q, devType, rarityFilter],
  );

  const deviationSections = useMemo(
    () =>
      groupBySection(
        filteredDeviations,
        (d) => d.element,
        ['Blaze', 'Frost', 'Shock', 'Acid', 'Physical', 'Utility'],
      ),
    [filteredDeviations],
  );

  const filteredRecipes = useMemo(
    () =>
      RECIPES.filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.effects.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.toLowerCase().includes(q)),
      ),
    [q],
  );

  const filteredEncounters = useMemo(
    () =>
      ENCOUNTERS.filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.mechanicsSummary.toLowerCase().includes(q) ||
          e.weakElement.toLowerCase().includes(q),
      ),
    [q],
  );

  const filteredSpecs = useMemo(
    () =>
      CLASS_SPECS.filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q),
      ),
    [q],
  );

  const isWorkbenchSubTab = subTab === 'weapons' || subTab === 'armor';

  return (
    <div className="space-y-4">
      {/* Header + Toolbar */}
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-xl font-semibold text-white">Encyclopedia</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Gear Workbench crafting, mods, deviations, chef buffs, and encounters.
          </p>
        </div>

        {!isWorkbenchSubTab && (
          <div className="flex flex-wrap items-center gap-2">
            {subTab === 'deviations' && (
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value as 'All' | Rarity)}
                className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              >
                {RARITIES.map((rar) => (
                  <option key={rar} value={rar}>
                    {rar === 'All' ? 'All Rarities' : rar}
                  </option>
                ))}
              </select>
            )}

            {subTab !== 'mods' && (
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search..."
                className="w-40 rounded-lg border border-obsidian-800 bg-obsidian-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-obsidian-600 sm:w-48"
              />
            )}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSubTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                active
                  ? 'border-obsidian-700 bg-obsidian-800 text-white'
                  : 'border-transparent text-slate-400 hover:bg-obsidian-900 hover:text-slate-200',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* WEAPONS & ARMOR WORKBENCH */}
      {isWorkbenchSubTab && (
        <GearWorkbenchView
          initialTab={subTab === 'weapons' ? 'weapon' : 'armor'}
          highlightedId={highlightedId}
          onSimulateWeapon={onSimulateWeapon}
        />
      )}

      {/* MODS */}
      {subTab === 'mods' && <ModsMatrixView highlightedId={highlightedId} />}

      {/* DEVIATIONS */}
      {subTab === 'deviations' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-800/80 pb-3">
            <div className="flex flex-wrap gap-1">
              {DEV_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDevType(t)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-[11px] font-medium transition',
                    devType === t
                      ? 'border-obsidian-700 bg-obsidian-800 text-white'
                      : 'border-transparent text-slate-400 hover:bg-obsidian-900 hover:text-slate-200',
                  )}
                >
                  {t === 'All' ? 'All Types' : t}
                </button>
              ))}
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              {filteredDeviations.length} / {DEVIATIONS.length}
            </span>
          </div>

          {deviationSections.map(([elemTitle, list]) => (
            <section key={elemTitle} className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-obsidian-800/60 pb-1.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {elemTitle}
                </h2>
                <span className="font-mono text-[11px] text-slate-500">{list.length}</span>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {list.map((d) => {
                  const spawns = DEVIATION_MAP_SPAWNS[d.id];
                  return (
                    <div
                      key={d.id}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl border border-l-2 bg-obsidian-900/70 px-3.5 py-3 text-left transition hover:bg-obsidian-850',
                        RARITY_LEFT_BORDER[d.rarity],
                        highlightedId === d.id
                          ? 'border-stardust-400/60 ring-1 ring-stardust-400/30'
                          : 'border-obsidian-800',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setInspectedEntity({ kind: 'deviation', item: d })}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <EntityThumbnail
                          src={d.imageUrl}
                          alt={d.name}
                          rarity={d.rarity}
                          size="md"
                          fallbackKind="deviation"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm font-medium text-slate-100 group-hover:text-white">
                              {d.name}
                            </h3>
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              {d.type}
                            </span>
                          </div>

                          <div className="mt-1 truncate text-[11px] text-cyan-300/90">
                            {d.dropSource}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-400">
                            {d.skillSummary}
                          </div>
                        </div>
                      </button>

                      {spawns && spawns.length > 0 && onLocateOnMap && (
                        <button
                          type="button"
                          onClick={() => onLocateOnMap(spawns[0].poiId)}
                          className="inline-flex shrink-0 flex-col items-center justify-center rounded-lg border border-cyan-500/35 bg-cyan-950/30 px-2 py-1.5 text-[10px] font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                          title={`Show ${d.name} spawn on map (${spawns[0].label})`}
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="mt-0.5">Map</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* CHEF */}
      {subTab === 'chef' && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredRecipes.map((r) => (
            <div
              key={r.id}
              className={cn(
                'rounded-xl border bg-obsidian-900/70 p-4',
                highlightedId === r.id ? 'border-stardust-400/60' : 'border-obsidian-800',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{r.name}</h3>
                <div className="flex items-center gap-1.5">
                  <RarityBadge rarity={r.rarity} />
                  <Pill>{r.durationMinutes}m</Pill>
                </div>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{r.category} · {r.station}</div>
              <p className="mt-2 text-xs text-slate-300">{r.effects}</p>
              <div className="mt-2.5 text-[11px] text-slate-500">
                Ingredients: {r.ingredients.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ENCOUNTERS */}
      {subTab === 'encounters' && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredEncounters.map((e) => (
            <div
              key={e.id}
              className={cn(
                'rounded-xl border bg-obsidian-900/70 p-4',
                highlightedId === e.id ? 'border-stardust-400/60' : 'border-obsidian-800',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{e.name}</h3>
                <Pill>Lv {e.recommendedLevel} · {e.type}</Pill>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Weakness: {e.weakElement}</div>
              <p className="mt-2 text-xs text-slate-300">{e.mechanicsSummary}</p>
              <div className="mt-2.5 text-[11px] text-slate-500">
                Drops: {e.keyDrops.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SPECIALIZATIONS */}
      {subTab === 'classes' && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredSpecs.map((s) => (
            <div
              key={s.id}
              className={cn(
                'rounded-xl border bg-obsidian-900/70 p-4',
                highlightedId === s.id ? 'border-stardust-400/60' : 'border-obsidian-800',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                <Pill>Lv {s.tierLevel} · {s.category}</Pill>
              </div>
              <p className="mt-2 text-xs text-slate-300">{s.description}</p>
              <div className="mt-2 text-[11px] text-slate-500">Synergy: {s.synergyNotes}</div>
            </div>
          ))}
        </div>
      )}

      <EntityDetailModal
        entity={inspectedEntity}
        onClose={() => setInspectedEntity(null)}
        onLocateOnMap={onLocateOnMap}
        onSelectModVariant={(mod) =>
          setInspectedEntity((prev) =>
            prev && prev.kind === 'mod' ? { kind: 'mod', item: mod, variants: prev.variants } : prev,
          )
        }
      />
    </div>
  );
}

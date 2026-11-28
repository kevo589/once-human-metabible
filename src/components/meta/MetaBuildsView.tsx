import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpRight, X } from 'lucide-react';
import { META_BUILDS } from '../../data/buildsAndTimers';
import { DEVIATIONS, RECIPES } from '../../data/deviationsAndChef';
import {
  aggregateLoadoutStats,
  calculateFullLoadoutDps,
  createLoadoutFromMetaBuild,
  resolveDrinkBuff,
  resolveFoodBuff,
} from '../../data/dps/dpsEngine';
import { WEAPONS } from '../../data/weapons';
import type { Archetype, MetaBuild, ScenarioId } from '../../types/game';
import { CARD_SURFACE_GRADIENT } from '../calculator/GearConfigPanels';
import { EntityThumbnail } from '../common/ItemVisuals';
import { WeaponThumbnail } from '../weapons/WeaponVisuals';

interface MetaBuildsViewProps {
  onLoadInCalculator: (build: MetaBuild) => void;
}

type Stage = 'Early Game' | 'Mid Game' | 'End Game';
const STAGES: Stage[] = ['Early Game', 'Mid Game', 'End Game'];

const ARCHETYPES: Array<'All' | Archetype> = [
  'All',
  'Shrapnel',
  'Frost Vortex',
  'Power Surge',
  'Unstable Bomber',
  'Burn',
  'Bounce',
  "Bull's Eye",
  'Fast Gunner',
  'Fortress Warfare',
  'Standard',
];

const SCENARIOS: Array<{ id: 'all' | ScenarioId; label: string }> = [
  { id: 'all', label: 'All scenarios' },
  { id: 'manibus', label: 'Manibus' },
  { id: 'way_of_winter', label: 'Way of Winter' },
  { id: 'isles_of_abyss', label: 'Isles of Abyss' },
];

const stageOf = (b: MetaBuild): Stage => (b.gameStage as Stage | undefined) ?? 'End Game';
const weaponOf = (id?: string) => WEAPONS.find((w) => w.id === id);
const deviationOf = (id?: string) => DEVIATIONS.find((d) => d.id === id);

const selectCls =
  'h-10 rounded-md border-2 border-sign-seam bg-black px-2.5 text-[14px] text-sign-white outline-none focus:border-sign-white';

export function MetaBuildsView({ onLoadInCalculator }: MetaBuildsViewProps) {
  const [archetypeFilter, setArchetypeFilter] = useState<'All' | Archetype>('All');
  const [scenarioFilter, setScenarioFilter] = useState<'all' | ScenarioId>('all');
  const [selectedId, setSelectedId] = useState<string>(
    () => META_BUILDS.find((b) => stageOf(b) === 'End Game')?.id ?? META_BUILDS[0].id,
  );
  // Below xl the recipe is a modal bottom sheet, so it only shows once a card is tapped.
  const [sheetOpen, setSheetOpen] = useState(false);
  const isWide = useMediaQuery('(min-width: 1280px)');
  const isSheet = sheetOpen && !isWide;
  const lastCardRef = useRef<HTMLElement | null>(null);

  const filtered = useMemo(
    () =>
      META_BUILDS.filter(
        (b) =>
          (archetypeFilter === 'All' || b.archetype === archetypeFilter) &&
          (scenarioFilter === 'all' || b.scenarioFit.includes(scenarioFilter)),
      ),
    [archetypeFilter, scenarioFilter],
  );

  const dpsById = useMemo(
    () =>
      new Map(
        // Same engine and loadout the calculator opens, so the number matches after "Open in DPS calculator".
        META_BUILDS.map((b) => {
          const loadout = createLoadoutFromMetaBuild(b);
          return [b.id, calculateFullLoadoutDps(loadout, aggregateLoadoutStats(loadout)).sustainedDps];
        }),
      ),
    [],
  );

  const selected = META_BUILDS.find((b) => b.id === selectedId) ?? META_BUILDS[0];

  useEffect(() => {
    if (!isSheet) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastCardRef.current?.focus();
    };
  }, [isSheet]);

  return (
    <div className="space-y-5 text-sign-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.015em]">
            Meta Builds <span className="ml-1 text-[15px] font-semibold text-sign-mute">{filtered.length}</span>
          </h1>
          <p className="mt-1 text-[14px] text-sign-mute">
            {META_BUILDS.length} verified loadouts with Chef pairings, breakpoints and anti-synergy checks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={archetypeFilter}
            onChange={(e) => setArchetypeFilter(e.target.value as 'All' | Archetype)}
            aria-label="Filter by archetype"
            className={selectCls}
          >
            {ARCHETYPES.map((a) => (
              <option key={a} value={a}>
                {a === 'All' ? 'All archetypes' : a}
              </option>
            ))}
          </select>
          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value as 'all' | ScenarioId)}
            aria-label="Filter by scenario"
            className={selectCls}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <nav aria-label="Jump to stage" className="flex gap-1.5 md:hidden">
        {STAGES.map((st) => (
          <a
            key={st}
            href={`#stage-${st.split(' ')[0].toLowerCase()}`}
            className="h-9 whitespace-nowrap rounded-md border-2 border-sign-seam px-3 text-[13px] font-semibold leading-[32px] text-sign-mute hover:border-sign-white hover:text-sign-white"
          >
            {st.replace(' Game', '')}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_400px]">
        {STAGES.map((stage) => {
          const list = filtered.filter((b) => stageOf(b) === stage);
          return (
            <section
              key={stage}
              id={`stage-${stage.split(' ')[0].toLowerCase()}`}
              aria-label={stage}
              className="min-w-0 scroll-mt-[calc(var(--band-h)+12px)]"
            >
              <h2 className="mb-3 border-b-[3px] border-sign-white pb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">
                {stage} <span className="text-sign-white">{list.length}</span>
              </h2>
              <div className="space-y-2.5">
                {list.length === 0 && <p className="py-2 text-[14px] text-sign-dim">No builds match these filters.</p>}
                {list.map((b) => (
                  <BuildCard
                    key={b.id}
                    build={b}
                    dps={dpsById.get(b.id) ?? 0}
                    selected={b.id === selectedId}
                    onSelect={(el) => {
                      lastCardRef.current = el;
                      setSelectedId(b.id);
                      setSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {isSheet && (
          <div aria-hidden className="fixed inset-0 z-40 bg-black/70 xl:hidden" onClick={() => setSheetOpen(false)} />
        )}
        <BuildSign
          build={selected}
          dps={dpsById.get(selected.id) ?? 0}
          open={sheetOpen}
          asSheet={isSheet}
          onClose={() => setSheetOpen(false)}
          onLoadInCalculator={onLoadInCalculator}
        />
      </div>
    </div>
  );
}

function BuildCard({
  build,
  dps,
  selected,
  onSelect,
}: {
  build: MetaBuild;
  dps: number;
  selected: boolean;
  onSelect: (el: HTMLElement) => void;
}) {
  const weapon = weaponOf(build.weaponId);
  const deviation = deviationOf(build.deviationId);
  return (
    <button
      type="button"
      onClick={(e) => onSelect(e.currentTarget)}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-md border-2 bg-sign-panel p-2.5 text-left transition-colors md:block ${
        selected ? 'border-sign-white' : 'border-sign-seam hover:border-sign-mute'
      }`}
    >
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        {weapon && (
          <WeaponThumbnail
            weapon={weapon}
            className={`h-12 w-24 rounded-sm border-0 p-1 md:h-20 md:w-auto md:flex-1 ${
              CARD_SURFACE_GRADIENT[weapon.rarity] ?? CARD_SURFACE_GRADIENT.Common
            }`}
          />
        )}
        {deviation && (
          <EntityThumbnail
            src={deviation.imageUrl}
            alt={deviation.name}
            rarity={deviation.rarity}
            fallbackKind="deviation"
            className="h-11 w-11 rounded-full border-2 border-line-builds md:h-14 md:w-14"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold leading-snug md:mt-2">{build.name}</div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[13px]">
          <span className="text-sign-mute">{build.archetype}</span>
          <span className="shrink-0 font-bold" title="Estimated sustained DPS, the same number the calculator shows">
            {build.tier} · {dps.toLocaleString()} DPS
          </span>
        </div>
      </div>
    </button>
  );
}

function BuildSign({
  build,
  dps,
  open,
  asSheet,
  onClose,
  onLoadInCalculator,
}: {
  build: MetaBuild;
  dps: number;
  open: boolean;
  asSheet: boolean;
  onClose: () => void;
  onLoadInCalculator: (build: MetaBuild) => void;
}) {
  const primary = weaponOf(build.weaponId);
  const secondary = weaponOf(build.secondaryWeaponId);
  const deviation = deviationOf(build.deviationId);
  const foods = (build.recommendedFoods?.length ? build.recommendedFoods : [build.foodBuffId])
    .map((id) => resolveFoodBuff(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const drinks = (build.recommendedDrinks ?? [])
    .map((id) => resolveDrinkBuff(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const legacyFood = foods.length === 0 ? RECIPES.find((r) => r.id === build.foodBuffId) : undefined;
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (asSheet) closeRef.current?.focus();
  }, [asSheet]);

  return (
    <aside
      aria-label={`${build.name} setup`}
      role={asSheet ? 'dialog' : undefined}
      aria-modal={asSheet || undefined}
      className={`${
        open ? 'sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] rounded-t-md border-t-[3px] xl:inset-x-auto xl:bottom-auto' : 'hidden'
      } flex-col overflow-hidden border-sign-white bg-black md:col-span-3 xl:sticky xl:top-[calc(var(--band-h)+24px)] xl:col-span-1 xl:flex xl:max-h-[calc(100vh-var(--band-h)-48px)] xl:self-start xl:rounded-md xl:border xl:border-sign-seam`}
    >
      <div className="flex items-start gap-3 bg-sign-white px-4 py-3.5 text-black">
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.015em] [text-wrap:balance]">{build.name}</h2>
          <p className="mt-1 text-[14px] font-medium text-[#3a3b38]">
            {build.tier} · {stageOf(build)} · {build.archetype} ·{' '}
            <span className="whitespace-nowrap">{dps.toLocaleString()} sustained DPS</span>
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-sm hover:bg-black/10 xl:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[14px]">
        <button
          type="button"
          onClick={() => onLoadInCalculator(build)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border-2 border-sign-white text-[14px] font-semibold text-sign-white transition-colors hover:bg-sign-white hover:text-black"
        >
          Open in DPS calculator <ArrowUpRight className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="space-y-2">
            {primary && <Gear label="Primary" name={primary.name} />}
            {secondary && <Gear label="Secondary" name={secondary.name} />}
            {deviation && <Gear label="Deviation" name={deviation.name} />}
          </div>
          {deviation && (
            <EntityThumbnail
              src={deviation.imageUrl}
              alt=""
              rarity={deviation.rarity}
              fallbackKind="deviation"
              className="h-20 w-20 rounded-full border-2 border-line-builds"
            />
          )}
        </div>

        <Field label="Armor">{build.armorSetup}</Field>
        <Field label="Mods">{build.keyMods.join(' · ')}</Field>
        <Field label="Cradle">{build.cradleOverrides.join(' · ')}</Field>
        <Field label={build.recommendedChefMode ? 'Chef food & drink (2+2)' : 'Food & drink (1+1)'}>
          {[...foods.map((f) => `${f.name} (${f.summary})`), ...drinks.map((d) => d.name), legacyFood?.name]
            .filter(Boolean)
            .join(' · ') || '—'}
        </Field>

        {build.breakpoints?.map((bp, i) => (
          <p key={`bp-${i}`} className="rounded-md border-2 border-line-workbench px-3 py-2">
            {bp}
          </p>
        ))}
        {build.antiSynergies?.map((w, i) => (
          <p key={`as-${i}`} className="flex items-start gap-2 text-sign-mute">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-line-workbench" />
            <span>{w}</span>
          </p>
        ))}

        <Field label="Playstyle">{build.playstyleNotes}</Field>
        <Field label="Scenarios">{build.scenarioFit.map((s) => s.replace(/_/g, ' ')).join(' · ')}</Field>
      </div>
    </aside>
  );
}

function Gear({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-sign-seam pb-1.5">
      <span className="text-sign-mute">{label}</span>
      <span className="text-right font-semibold">{name}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">{label}</h3>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

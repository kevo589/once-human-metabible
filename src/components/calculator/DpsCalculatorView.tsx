import {
  AlertTriangle,
  BookmarkPlus,
  Calculator,
  ChefHat,
  ChevronDown,
  Download,
  Lightbulb,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  aggregateLoadoutStats,
  applyModToLoadout,
  calculateFullLoadoutDps,
  cloneLoadout,
  createLoadoutFromMetaBuild,
  createLoadoutFromWeaponId,
  detectLoadoutWarnings,
  getStarterLoadouts,
  resolveDrinkBuff,
  resolveFoodBuff,
  type ActiveWeaponSlotKey,
  type EquipSlotId,
  type FullDpsResult,
  type LoadoutConfig,
  type StatKey,
  type TargetType,
} from '../../data/dps/dpsEngine';
import type { CodexModItem } from '../../data/mods/modCatalog';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { CalculatorPreset, MetaBuild } from '../../types/game';
import { FormulaBreakdownModal } from './FormulaBreakdownModal';
import {
  CombatDeviationPanel,
  CradleAndFoodPanel,
  EquipmentGridPanel,
} from './GearConfigPanels';
import { SlotConfiguratorDrawer } from './SlotConfiguratorDrawer';

export interface EquippedModRequest {
  mod: CodexModItem;
  weaponSlot?: 'primary' | 'secondary' | 'melee';
  seq: number;
}

interface DpsCalculatorViewProps {
  preset: CalculatorPreset;
  onChangePreset: (next: CalculatorPreset) => void;
  activeBuildName?: string | null;
  activeMetaBuild?: MetaBuild | null;
  equippedModRequest?: EquippedModRequest | null;
}

type RailMode = 'gear' | 'deviation' | 'cradle_food';

const STARTER_LOADOUTS = getStarterLoadouts();

const BATTLE_STAT_KEYS: StatKey[] = [
  'critRatePct',
  'critDmgPct',
  'weakspotDmgPct',
  'weakspotCritDmgPct',
  'weaponDmgPct',
  'statusDmgPct',
  'elementalDmgPct',
  'keywordDmgPct',
  'bounceDmgPct',
  'bounceCritDmgPct',
  'bounceExtraCount',
  'shrapnelDmgPct',
  'dmgVsNormalPct',
  'dmgVsElitesPct',
  'dmgVsGreatOnesPct',
  'dmgVsMarkedPct',
  'weakspotVsMarkedPct',
  'vulnerabilityPct',
  'fireRatePct',
  'magCapPct',
  'reloadSpeedPct',
];


export function DpsCalculatorView({
  preset,
  onChangePreset,
  activeBuildName,
  activeMetaBuild,
  equippedModRequest,
}: DpsCalculatorViewProps) {
  const [savedLoadouts, setSavedLoadouts] = useLocalStorage<LoadoutConfig[]>(
    'oh-dps-gear-loadouts-v1',
    [],
  );
  const [loadout, setLoadout] = useLocalStorage<LoadoutConfig>(
    'oh-dps-active-loadout-v1',
    STARTER_LOADOUTS[0],
  );

  const [railMode, setRailMode] = useState<RailMode>('gear');
  const [drawerSlot, setDrawerSlot] = useState<EquipSlotId | null>(null);
  const [mathOpen, setMathOpen] = useState(false);
  const [inspectedStatKey, setInspectedStatKey] = useState<string | null>(null);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [baselineSnapshot, setBaselineSnapshot] = useState<{
    name: string;
    dps: FullDpsResult;
  } | null>(null);

  const lastExternalWeaponRef = useRef<string | null>(null);
  const lastModReqSeqRef = useRef<number | null>(null);

  useEffect(() => {
    const sig = `${preset.weaponId}|${activeBuildName ?? ''}|${activeMetaBuild?.id ?? ''}`;
    if (lastExternalWeaponRef.current === null) {
      lastExternalWeaponRef.current = sig;
      return;
    }
    if (lastExternalWeaponRef.current !== sig) {
      lastExternalWeaponRef.current = sig;
      const next = activeMetaBuild
        ? createLoadoutFromMetaBuild(activeMetaBuild)
        : createLoadoutFromWeaponId(preset.weaponId, activeBuildName ?? undefined);
      setLoadout(next);
    }
  }, [preset.weaponId, activeBuildName, activeMetaBuild, setLoadout]);

  useEffect(() => {
    if (!equippedModRequest || equippedModRequest.seq === lastModReqSeqRef.current) return;
    lastModReqSeqRef.current = equippedModRequest.seq;
    setLoadout((prev) =>
      applyModToLoadout(prev, equippedModRequest.mod, equippedModRequest.weaponSlot),
    );
    setRailMode('gear');
    const msg = `Equipped ${equippedModRequest.mod.name} (${equippedModRequest.mod.slot})`;
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200);
  }, [equippedModRequest, setLoadout]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200);
  };

  const stats = useMemo(() => aggregateLoadoutStats(loadout), [loadout]);
  const dps = useMemo(() => calculateFullLoadoutDps(loadout, stats), [loadout, stats]);
  const warnings = useMemo(() => detectLoadoutWarnings(loadout, stats), [loadout, stats]);
  const activeFoodsList = useMemo(
    () =>
      [
        resolveFoodBuff(loadout.foodId),
        loadout.chefClassEnabled ? resolveFoodBuff(loadout.foodId2) : undefined,
      ].filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [loadout.foodId, loadout.foodId2, loadout.chefClassEnabled],
  );
  const activeDrinksList = useMemo(
    () =>
      [
        resolveDrinkBuff(loadout.drinkId),
        loadout.chefClassEnabled ? resolveDrinkBuff(loadout.drinkId2) : undefined,
      ].filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [loadout.drinkId, loadout.drinkId2, loadout.chefClassEnabled],
  );

  const allPresets = useMemo(
    () => [...savedLoadouts, ...STARTER_LOADOUTS],
    [savedLoadouts],
  );

  const patchLoadout = (patch: Partial<LoadoutConfig>) => {
    setLoadout((prev) => ({ ...prev, ...patch }));
  };

  const handleSetActiveWeapon = (slot: ActiveWeaponSlotKey) => {
    const targetId = slot === 'primary' ? loadout.primary.weaponId : loadout.secondary.weaponId;
    setLoadout((prev) => ({ ...prev, activeWeaponSlot: slot }));
    if (targetId !== preset.weaponId) {
      onChangePreset({ ...preset, weaponId: targetId });
    }
  };

  const handleSaveSnapshot = () => {
    const cleanName =
      loadout.name.trim() || `${stats.activeWeapon.name.split('-')[0].trim()} Loadout`;
    const copy = cloneLoadout(loadout);
    copy.id = `user-${Date.now()}`;
    copy.name = cleanName;
    setSavedLoadouts((prev) => [copy, ...prev.filter((p) => p.name !== cleanName)]);
    setLoadout(copy);
    showToast(`Saved "${cleanName}"`);
  };

  const handleSelectPresetId = (id: string) => {
    const found = allPresets.find((p) => p.id === id);
    if (!found) return;
    const cloned = cloneLoadout(found);
    setLoadout(cloned);
    onChangePreset({ ...preset, weaponId: cloned.primary.weaponId });
    showToast(`Loaded "${cloned.name}"`);
  };

  const handleDeleteSavedPreset = (id: string) => {
    setSavedLoadouts((prev) => prev.filter((p) => p.id !== id));
    showToast('Deleted custom preset');
  };

  const handleOpenJsonModal = () => {
    setJsonText(JSON.stringify(loadout, null, 2));
    setJsonError(null);
    setJsonModalOpen(true);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<LoadoutConfig>;
      if (!parsed || !parsed.primary || !parsed.armor) {
        setJsonError('Invalid loadout JSON structure.');
        return;
      }
      const merged: LoadoutConfig = {
        ...cloneLoadout(STARTER_LOADOUTS[0]),
        ...parsed,
        id: `imported-${Date.now()}`,
      };
      setLoadout(merged);
      setJsonModalOpen(false);
      showToast(`Imported "${merged.name}"`);
    } catch {
      setJsonError('Failed to parse JSON.');
    }
  };

  const isCustomSaved = savedLoadouts.some((s) => s.id === loadout.id);

  type SheetRow =
    | { heading: string }
    | { id: string; label: string; value: string | number; sources: { source: string; value: number; unit: string }[] };
  const sheetRows = useMemo<SheetRow[]>(() => {
    const src = (...keys: StatKey[]) =>
      keys.flatMap((k) =>
        stats.statDetails[k].sources.map((x) => ({ ...x, unit: stats.statDetails[k].unit === '%' ? '%' : '' })),
      );
    return [
      { heading: 'Basic' },
      { id: 'weaponAttack', label: 'Weapon attack', value: stats.weaponAttack, sources: src('attackPct', 'flatAttack') },
      { id: 'fireRate', label: 'Fire rate', value: `${stats.fireRateRpm} rpm`, sources: src('fireRatePct') },
      { id: 'magazine', label: 'Magazine', value: stats.magCapacity, sources: src('magCapPct') },
      { id: 'charAttack', label: 'Attack', value: stats.baseCharAttack, sources: [] },
      { id: 'psi', label: 'Psi Intensity', value: stats.psiIntensity, sources: src('psiIntensity') },
      { id: 'hp', label: 'HP', value: `${stats.currentHp.toLocaleString()} / ${stats.maxHp.toLocaleString()}`, sources: src('flatHp', 'maxHpPct') },
      { id: 'pollution', label: 'Pollution Resist', value: stats.pollutionResist, sources: src('pollutionResist') },
      { heading: 'Battle' },
      ...BATTLE_STAT_KEYS.map((k) => {
        const e = stats.statDetails[k];
        return { id: k, label: e.label, value: e.unit === '%' ? `${e.value.toFixed(1)}%` : e.value, sources: src(k) };
      }),
    ];
  }, [stats]);

  const zones = [
    { id: 'gear', label: 'Gear' },
    { id: 'deviation', label: 'Deviation' },
    { id: 'cradle_food', label: 'Cradle & Food' },
  ] as const;

  const delta = (now: number, then?: number) =>
    then === undefined ? null : (
      <span className={now >= then ? 'text-line-map' : 'text-line-builds'}>
        {now >= then ? '+' : '−'}
        {Math.abs(now - then).toLocaleString()}
      </span>
    );

  const DpsReadout = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? 'flex items-baseline gap-5' : 'flex flex-wrap items-end gap-x-8 gap-y-2'}>
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">Sustained DPS</div>
        <div className={`${compact ? 'text-[22px]' : 'text-[34px]'} font-extrabold leading-none tracking-[-0.02em]`}>
          {dps.sustainedDps.toLocaleString()}
        </div>
        <div className="mt-1 text-[13px] font-semibold">{delta(dps.sustainedDps, baselineSnapshot?.dps.sustainedDps)}</div>
      </div>
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">Burst DPS</div>
        <div className={`${compact ? 'text-[22px]' : 'text-[34px]'} font-extrabold leading-none tracking-[-0.02em]`}>
          {dps.burstDps.toLocaleString()}
        </div>
        <div className="mt-1 text-[13px] font-semibold">{delta(dps.burstDps, baselineSnapshot?.dps.burstDps)}</div>
      </div>
    </div>
  );


  const chip = (on: boolean) =>
    `h-9 whitespace-nowrap rounded-md border-2 px-3 text-[13px] font-semibold transition-colors ${
      on ? 'border-sign-white bg-sign-white text-black' : 'border-sign-seam text-sign-mute hover:border-sign-white hover:text-sign-white'
    }`;

  return (
    <div className="space-y-4 text-sign-white">
      {/* Phone: DPS stays in view while you edit gear further down */}
      <div className="sticky top-[var(--band-h)] z-30 -mx-4 -mt-4 border-b border-sign-seam bg-black px-4 py-2.5 sm:-mx-6 sm:-mt-6 sm:px-6 lg:hidden">
        <DpsReadout compact />
      </div>

      {/* Loadout toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={loadout.name}
          onChange={(e) => patchLoadout({ name: e.target.value })}
          aria-label="Loadout name"
          className="-ml-2.5 h-10 min-w-0 flex-1 basis-56 rounded-md border-2 border-transparent bg-transparent px-2 text-[22px] font-extrabold tracking-[-0.015em] text-sign-white outline-none hover:border-sign-seam focus:border-sign-white"
        />
        <select
          value={allPresets.some((p) => p.id === loadout.id) ? loadout.id : ''}
          onChange={(e) => e.target.value && handleSelectPresetId(e.target.value)}
          aria-label="Load a saved or starter loadout"
          className="h-10 max-w-[260px] rounded-md border-2 border-sign-seam bg-black px-2.5 text-[14px] text-sign-white outline-none focus:border-sign-white"
        >
          {!allPresets.some((p) => p.id === loadout.id) && <option value="">Custom build</option>}
          {savedLoadouts.length > 0 && (
            <optgroup label="Saved loadouts">
              {savedLoadouts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Starter templates">
            {STARTER_LOADOUTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        </select>
        <button type="button" onClick={handleSaveSnapshot} className={`${chip(false)} inline-flex h-10 items-center gap-1.5`}>
          <Save className="h-4 w-4" /> Save
        </button>
        <button type="button" onClick={handleOpenJsonModal} className={`${chip(false)} inline-flex h-10 items-center gap-1.5`}>
          <Download className="h-4 w-4" /> JSON
        </button>
        <button
          type="button"
          onClick={() => {
            setLoadout(cloneLoadout(STARTER_LOADOUTS[0]));
            showToast('Reset to Lv.50 starter');
          }}
          className={`${chip(false)} grid h-10 w-10 place-items-center px-0`}
          title="Reset loadout"
          aria-label="Reset loadout"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        {isCustomSaved && (
          <button
            type="button"
            onClick={() => handleDeleteSavedPreset(loadout.id)}
            className={`${chip(false)} grid h-10 w-10 place-items-center px-0 hover:!border-line-builds hover:!text-line-builds`}
            title="Delete saved loadout"
            aria-label="Delete current saved loadout"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w) => (
            <div
              key={w.id}
              className={`flex items-center gap-2.5 rounded-md border-2 px-3 py-2 text-[14px] font-medium ${
                w.severity === 'warning' ? 'border-line-workbench text-sign-white' : 'border-sign-seam text-sign-mute'
              }`}
            >
              {w.severity === 'warning' ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-line-workbench" />
              ) : (
                <Lightbulb className="h-4 w-4 shrink-0" />
              )}
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Character screen: equipment left, character sheet right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <section aria-label="Equipment" className="lg:sticky lg:top-[calc(var(--band-h)+16px)] lg:self-start">
          <div role="tablist" aria-label="Equipment zone" className="mb-3 flex gap-1.5">
            {zones.map((z) => (
              <button
                key={z.id}
                type="button"
                role="tab"
                aria-selected={railMode === z.id}
                onClick={() => setRailMode(z.id)}
                className={chip(railMode === z.id)}
              >
                {z.label}
              </button>
            ))}
          </div>
          {railMode === 'gear' && (
            <EquipmentGridPanel loadout={loadout} onSelectSlot={(s) => setDrawerSlot(s)} onSetActiveDps={handleSetActiveWeapon} />
          )}
          {railMode === 'deviation' && (
            <CombatDeviationPanel loadout={loadout} deviationDps={dps.deviationDps} onChange={patchLoadout} />
          )}
          {railMode === 'cradle_food' && <CradleAndFoodPanel loadout={loadout} warnings={warnings} onChange={patchLoadout} />}
        </section>

        <section aria-label="Character sheet" className="min-w-0">
          <div className="hidden items-end justify-between gap-4 border-b-[3px] border-sign-white pb-4 lg:flex">
            <DpsReadout />
            <button
              type="button"
              onClick={() => setMathOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-sign-white px-4 text-[14px] font-semibold text-black hover:bg-white"
            >
              <Calculator className="h-4 w-4" /> Math
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-sign-seam py-3">
            <div className="flex items-center gap-1.5" role="group" aria-label="Weapon used for DPS">
              {(['primary', 'secondary'] as const).map((slot, i) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSetActiveWeapon(slot)}
                  aria-pressed={loadout.activeWeaponSlot === slot}
                  className={chip(loadout.activeWeaponSlot === slot)}
                >
                  Weapon {i + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[13px] text-sign-mute">
              <span>Lv 50 · Rating {stats.gearScoreTotal}</span>
              <button type="button" onClick={() => setMathOpen(true)} className={`${chip(false)} lg:hidden`}>
                Math
              </button>
            </div>
          </div>

          {/* Every stat, flowed across two columns so the whole sheet fits beside the gear grid */}
          <div className="mt-3 columns-1 gap-x-8 sm:columns-2">
            {sheetRows.map((row) =>
              'heading' in row ? (
                <h3
                  key={row.heading}
                  className="mb-1 mt-2 break-after-avoid text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute first:mt-0"
                >
                  {row.heading}
                </h3>
              ) : (
                <div key={row.id} className="break-inside-avoid">
                  {row.sources.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setInspectedStatKey(inspectedStatKey === row.id ? null : row.id)}
                      aria-expanded={inspectedStatKey === row.id}
                      className="group flex w-full items-center gap-2 border-b border-sign-seam/70 py-1.5 text-left text-[14px]"
                    >
                      <span className="min-w-0 flex-1 truncate text-sign-mute group-hover:text-sign-white">{row.label}</span>
                      <span className="shrink-0 font-bold">{row.value}</span>
                      <ChevronDown
                        aria-hidden
                        className={`h-3.5 w-3.5 shrink-0 text-sign-dim transition-transform group-hover:text-sign-white ${
                          inspectedStatKey === row.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 border-b border-sign-seam/70 py-1.5 text-[14px]">
                      <span className="min-w-0 flex-1 truncate text-sign-mute">{row.label}</span>
                      <span className="shrink-0 font-bold">{row.value}</span>
                      <span className="w-3.5 shrink-0" />
                    </div>
                  )}
                  {inspectedStatKey === row.id && (
                    <div className="space-y-1 border-b border-sign-seam/70 bg-sign-panel px-2.5 py-2 text-[13px]">
                      {row.sources.map((src, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <span className="truncate text-sign-mute">{src.source}</span>
                          <span className="font-semibold">
                            {src.value >= 0 ? '+' : ''}
                            {src.value}
                            {src.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {(stats.activeSets.length > 0 || stats.activeKeyArmors.length > 0) && (
            <div className="mt-5">
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">Set effects</h3>
              <div className="flex flex-wrap gap-1.5">
                {stats.activeSets.map((s) => (
                  <span
                    key={s.setName}
                    title={s.activeTiers.filter((t) => t.active).map((t) => `${t.count}pc: ${t.desc}`).join('\n')}
                    className="rounded-sm border border-sign-seam px-2 py-1 text-[13px]"
                  >
                    {s.setName.replace(' Set', '')} <span className="font-bold">{s.count}/4</span>
                  </span>
                ))}
                {stats.activeKeyArmors.map((k) => (
                  <span key={k.name} title={k.desc} className="rounded-sm border border-line-workbench px-2 py-1 text-[13px]">
                    {k.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setRailMode('cradle_food')}
            className="mt-5 flex w-full flex-wrap items-center gap-1.5 rounded-md border border-sign-seam px-3 py-2.5 text-left text-[13px] hover:border-sign-white"
            title="Configure food, drink and Chef buffs"
          >
            <ChefHat className="h-4 w-4 text-sign-mute" />
            {loadout.chefClassEnabled && (
              <span className="font-semibold">Chef{loadout.chefStoveBonusPct ? ` +${loadout.chefStoveBonusPct}%` : ''} ·</span>
            )}
            {[...activeFoodsList, ...activeDrinksList].map((f) => f.name.split('(')[0].trim()).join(' · ') || (
              <span className="text-sign-dim">No food or drink buffs</span>
            )}
          </button>

          {/* Target & assumptions: inline, collapsed by default */}
          <details className="group mt-5 rounded-md border border-sign-seam">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[14px] font-semibold">
              <span>
                Target & assumptions
                <span className="ml-2 font-normal text-sign-mute">
                  {loadout.assumptions.targetType === 'great_one'
                    ? 'Great One'
                    : loadout.assumptions.targetType === 'elite'
                      ? 'Elite'
                      : 'Normal'}{' '}
                  · WS {loadout.assumptions.weakspotHitRatePct}% · HP {loadout.hpPct}% · Sanity {loadout.sanityPct}%
                </span>
              </span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-4 border-t border-sign-seam px-3 py-3 text-[13px]">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'normal', label: 'Normal' },
                    { id: 'elite', label: 'Elite' },
                    { id: 'great_one', label: 'Great One' },
                  ] as const
                ).map((tt) => (
                  <button
                    key={tt.id}
                    type="button"
                    aria-pressed={loadout.assumptions.targetType === tt.id}
                    onClick={() => patchLoadout({ assumptions: { ...loadout.assumptions, targetType: tt.id as TargetType } })}
                    className={chip(loadout.assumptions.targetType === tt.id)}
                  >
                    {tt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: 'bullsEye', label: "Bull's Eye" },
                    { key: 'marked', label: 'Marked' },
                    { key: 'fortressWarfare', label: 'Fortress' },
                    { key: 'shielded', label: 'Shielded' },
                    { key: 'aeroAerialHit', label: 'Aero aerial' },
                    { key: 'resonanceMaxStacks', label: 'Resonance max' },
                  ] as const
                ).map((flag) => (
                  <button
                    key={flag.key}
                    type="button"
                    aria-pressed={Boolean(loadout.assumptions[flag.key])}
                    onClick={() =>
                      patchLoadout({ assumptions: { ...loadout.assumptions, [flag.key]: !loadout.assumptions[flag.key] } })
                    }
                    className={chip(Boolean(loadout.assumptions[flag.key]))}
                  >
                    {flag.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {(
                  [
                    { label: 'Weakspot hit rate', val: loadout.assumptions.weakspotHitRatePct, min: 0, max: 100, step: 1, unit: '%',
                      set: (v: number) => patchLoadout({ assumptions: { ...loadout.assumptions, weakspotHitRatePct: v } }) },
                    { label: 'Downstar elevation', val: loadout.assumptions.downstarMeters ?? 0, min: 0, max: 5, step: 0.5, unit: 'm',
                      set: (v: number) => patchLoadout({ assumptions: { ...loadout.assumptions, downstarMeters: v } }) },
                    { label: 'HP', val: loadout.hpPct, min: 1, max: 100, step: 1, unit: '%', set: (v: number) => patchLoadout({ hpPct: v }) },
                    { label: 'Sanity', val: loadout.sanityPct, min: 0, max: 100, step: 1, unit: '%', set: (v: number) => patchLoadout({ sanityPct: v }) },
                  ] as const
                ).map((r) => (
                  <label key={r.label} className="block">
                    <span className="flex justify-between text-sign-mute">
                      {r.label}
                      <b className="text-sign-white">
                        {r.val}
                        {r.unit}
                      </b>
                    </span>
                    <input
                      type="range"
                      min={r.min}
                      max={r.max}
                      step={r.step}
                      value={r.val}
                      onChange={(e) => r.set(Number(e.target.value))}
                      className="mt-1.5 h-1.5 w-full cursor-pointer accent-line-dps"
                    />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBaselineSnapshot({ name: loadout.name.slice(0, 24), dps })}
                  className={`${chip(false)} inline-flex items-center gap-1.5`}
                >
                  <BookmarkPlus className="h-4 w-4" /> Pin as baseline
                </button>
                <span className="text-sign-mute">
                  {baselineSnapshot
                    ? `DPS deltas compare against “${baselineSnapshot.name}”.`
                    : 'Pin a baseline to see DPS change as you swap gear.'}
                </span>
              </div>
              <div className="text-sign-dim">
                Weapon {dps.weaponOnlySustainedDps.toLocaleString()} + Deviation {dps.deviationDps.toLocaleString()} · Hit {dps.normalHit} · Crit{' '}
                {dps.critHit} · Weakspot crit {dps.weakspotCritHit}
              </div>
            </div>
          </details>
        </section>
      </div>

      {/* Click-to-Configure Slot Drawer */}
      <SlotConfiguratorDrawer
        slotId={drawerSlot}
        weaponCfg={
          drawerSlot === 'primary'
            ? loadout.primary
            : drawerSlot === 'secondary'
              ? loadout.secondary
              : drawerSlot === 'melee'
                ? loadout.melee
                : undefined
        }
        armorCfg={
          drawerSlot &&
          drawerSlot !== 'primary' &&
          drawerSlot !== 'secondary' &&
          drawerSlot !== 'melee'
            ? loadout.armor[drawerSlot]
            : undefined
        }
        isActiveDpsWeapon={
          drawerSlot === 'primary'
            ? loadout.activeWeaponSlot === 'primary'
            : drawerSlot === 'secondary'
              ? loadout.activeWeaponSlot === 'secondary'
              : false
        }
        hpPct={loadout.hpPct}
        shielded={loadout.assumptions.shielded}
        onSetActiveDpsWeapon={handleSetActiveWeapon}
        onUpdateWeapon={(nextW) => {
          if (drawerSlot === 'primary') patchLoadout({ primary: nextW });
          else if (drawerSlot === 'secondary') patchLoadout({ secondary: nextW });
          else if (drawerSlot === 'melee') patchLoadout({ melee: nextW });
        }}
        onUpdateArmor={(nextA) => {
          if (
            drawerSlot &&
            drawerSlot !== 'primary' &&
            drawerSlot !== 'secondary' &&
            drawerSlot !== 'melee'
          ) {
            patchLoadout({
              armor: { ...loadout.armor, [drawerSlot]: nextA },
            });
          }
        }}
        onClose={() => setDrawerSlot(null)}
      />

      {/* View Math Formula Audit Modal */}
      <FormulaBreakdownModal
        open={mathOpen}
        loadout={loadout}
        stats={stats}
        dps={dps}
        onClose={() => setMathOpen(false)}
      />

      {/* Export / Import Loadout JSON Modal */}
      {jsonModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setJsonModalOpen(false)}
        >
          <div
            className="w-full max-w-xl space-y-3 rounded-2xl border border-white/[0.12] bg-sign-panel p-5 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Upload className="h-4 w-4 text-line-dps" />
                <span>Export / Import Loadout JSON</span>
              </div>
              <button
                type="button"
                onClick={() => setJsonModalOpen(false)}
                className="text-sign-mute hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-white/[0.1] bg-sign-panel p-3 text-[12px] text-sign-white outline-none focus:border-line-dps"
            />
            {jsonError && <div className="text-rose-400">{jsonError}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard?.writeText(jsonText).catch(() => {});
                  showToast('Loadout JSON copied');
                }}
                className="rounded-lg border border-white/[0.12] bg-sign-raised px-3 py-1.5 font-semibold text-sign-white hover:border-line-dps"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                className="rounded-lg bg-line-dps px-4 py-1.5 font-bold text-black hover:bg-[#5df0d2]"
              >
                Import Loadout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line-dps/50 bg-sign-panel/95 px-3.5 py-1.5 text-xs font-semibold text-line-dps shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

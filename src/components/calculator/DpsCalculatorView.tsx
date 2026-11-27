import {
  Activity,
  BookmarkPlus,
  Calculator,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Download,
  Flame,
  Heart,
  Layers,
  Radiation,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  aggregateLoadoutStats,
  applyModToLoadout,
  calculateFullLoadoutDps,
  cloneLoadout,
  createLoadoutFromWeaponId,
  findDeviationImage,
  getStarterLoadouts,
  type ActiveWeaponSlotKey,
  type EquipSlotId,
  type FullDpsResult,
  type LoadoutConfig,
  type StatKey,
  type TargetType,
} from '../../data/dps/dpsEngine';
import type { CodexModItem } from '../../data/mods/modCatalog';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { CalculatorPreset } from '../../types/game';
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
  equippedModRequest?: EquippedModRequest | null;
}

type TopSubTab = 'simulator' | 'gear_config' | 'buffs';
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
  'weakspotVsMarkedPct',
  'vulnerabilityPct',
  'fireRatePct',
  'magCapPct',
  'reloadSpeedPct',
];

const CORE_ALWAYS_SHOW = new Set<StatKey>([
  'critRatePct',
  'critDmgPct',
  'weakspotDmgPct',
  'weakspotCritDmgPct',
  'weaponDmgPct',
  'statusDmgPct',
  'elementalDmgPct',
]);

export function DpsCalculatorView({
  preset,
  onChangePreset,
  activeBuildName,
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

  const [topTab, setTopTab] = useState<TopSubTab>('gear_config');
  const [railMode, setRailMode] = useState<RailMode>('gear');
  const [drawerSlot, setDrawerSlot] = useState<EquipSlotId | null>(null);
  const [mathOpen, setMathOpen] = useState(false);
  const [statsColumnOpen, setStatsColumnOpen] = useState(true);
  const [basicOpen, setBasicOpen] = useState(true);
  const [battleOpen, setBattleOpen] = useState(true);
  const [showZeroStats, setShowZeroStats] = useState(false);
  const [inspectedStatKey, setInspectedStatKey] = useState<StatKey | null>(null);
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
    const sig = `${preset.weaponId}|${activeBuildName ?? ''}`;
    if (lastExternalWeaponRef.current === null) {
      lastExternalWeaponRef.current = sig;
      return;
    }
    if (lastExternalWeaponRef.current !== sig) {
      lastExternalWeaponRef.current = sig;
      const next = createLoadoutFromWeaponId(preset.weaponId, activeBuildName ?? undefined);
      setLoadout(next);
    }
  }, [preset.weaponId, activeBuildName, setLoadout]);

  useEffect(() => {
    if (!equippedModRequest || equippedModRequest.seq === lastModReqSeqRef.current) return;
    lastModReqSeqRef.current = equippedModRequest.seq;
    setLoadout((prev) =>
      applyModToLoadout(prev, equippedModRequest.mod, equippedModRequest.weaponSlot),
    );
    setTopTab('gear_config');
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

  const activeRail = topTab === 'buffs' ? 'cradle_food' : railMode;
  const isCustomSaved = savedLoadouts.some((s) => s.id === loadout.id);
  const avatarImg = findDeviationImage(loadout.deviationId);

  const visibleBattleKeys = useMemo(() => {
    if (showZeroStats) return BATTLE_STAT_KEYS;
    return BATTLE_STAT_KEYS.filter(
      (k) => CORE_ALWAYS_SHOW.has(k) || Math.abs(stats.statDetails[k].value) > 0,
    );
  }, [showZeroStats, stats.statDetails]);

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#172326] via-[#0e1518] to-[#0a0e11] p-3 text-slate-100 shadow-2xl sm:p-5">
      {/* Sleek In-Game Style Top Header */}
      <header className="flex flex-col justify-between gap-2 border-b border-white/[0.06] pb-2.5 lg:flex-row lg:items-center">
        <nav className="flex items-center gap-6 overflow-x-auto px-1">
          {(
            [
              { id: 'simulator', label: 'DPS Simulator' },
              { id: 'gear_config', label: 'Gear Backpack' },
              { id: 'buffs', label: 'Food & Cradle' },
            ] as const
          ).map((tab) => {
            const active = topTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTopTab(tab.id)}
                className={`relative shrink-0 pb-2 text-sm font-medium tracking-wide transition ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#3ee6c5] shadow-[0_0_10px_#3ee6c5]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={allPresets.some((p) => p.id === loadout.id) ? loadout.id : ''}
            onChange={(e) => e.target.value && handleSelectPresetId(e.target.value)}
            aria-label="Loadout preset switcher"
            className="min-w-[180px] max-w-[250px] rounded border border-white/[0.08] bg-black/30 px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-[#3ee6c5]/60"
          >
            {!allPresets.some((p) => p.id === loadout.id) && (
              <option value="" className="bg-[#0e1518]">
                Custom Build
              </option>
            )}
            {savedLoadouts.length > 0 && (
              <optgroup label="Saved Loadouts">
                {savedLoadouts.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0e1518]">
                    ★ {s.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Starter Templates">
              {STARTER_LOADOUTS.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0e1518]">
                  {s.name}
                </option>
              ))}
            </optgroup>
          </select>

          {isCustomSaved && (
            <button
              type="button"
              onClick={() => handleDeleteSavedPreset(loadout.id)}
              className="rounded border border-white/[0.08] bg-black/30 p-1.5 text-slate-400 hover:text-rose-400"
              title="Delete saved loadout"
              aria-label="Delete current saved loadout"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenJsonModal}
            className="inline-flex items-center gap-1 rounded border border-white/[0.08] bg-black/30 px-2.5 py-1 text-xs text-slate-300 transition hover:border-white/25 hover:text-white"
          >
            <Download className="h-3 w-3" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoadout(cloneLoadout(STARTER_LOADOUTS[0]));
              showToast('Reset to Lv.50 Starter');
            }}
            className="rounded border border-white/[0.08] bg-black/30 p-1.5 text-slate-400 transition hover:text-white"
            title="Reset loadout"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* EXPANDED DPS SIMULATOR PANEL (Clean, shown on DPS Simulator tab) */}
      {topTab === 'simulator' && (
        <div className="grid gap-3 rounded-lg border border-white/[0.07] bg-black/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-[11px] text-slate-400">Sustained DPS (With Reload + Pet)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[#3ee6c5]">
              {dps.sustainedDps.toLocaleString()}
            </div>
            {baselineSnapshot ? (
              <div className="mt-0.5 font-mono text-[11px] text-slate-300">
                vs {baselineSnapshot.name}:{' '}
                <span
                  className={
                    dps.sustainedDps >= baselineSnapshot.dps.sustainedDps
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                >
                  {dps.sustainedDps >= baselineSnapshot.dps.sustainedDps ? '+' : ''}
                  {(dps.sustainedDps - baselineSnapshot.dps.sustainedDps).toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                Weapon {dps.weaponOnlySustainedDps.toLocaleString()} + Pet{' '}
                {dps.deviationDps.toLocaleString()}
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] text-slate-400">Burst DPS & Per-Shot Hits</div>
            <div className="mt-1 font-mono text-2xl font-bold text-white">
              {dps.burstDps.toLocaleString()}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-slate-400">
              Norm {dps.normalHit} · Crit {dps.critHit} · WS Crit {dps.weakspotCritHit}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">Combat Assumptions</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
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
                  onClick={() =>
                    patchLoadout({
                      assumptions: { ...loadout.assumptions, targetType: tt.id as TargetType },
                    })
                  }
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                    loadout.assumptions.targetType === tt.id
                      ? 'bg-[#3ee6c5] text-[#091214]'
                      : 'bg-white/[0.06] text-slate-300'
                  }`}
                >
                  {tt.label}
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px]">
              <span className="text-slate-400">WS {loadout.assumptions.weakspotHitRatePct}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={loadout.assumptions.weakspotHitRatePct}
                onChange={(e) =>
                  patchLoadout({
                    assumptions: {
                      ...loadout.assumptions,
                      weakspotHitRatePct: Number(e.target.value),
                    },
                  })
                }
                className="h-1 flex-1 cursor-pointer accent-[#3ee6c5]"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { key: 'bullsEye', label: "Bull's Eye" },
                  { key: 'marked', label: 'Marked' },
                  { key: 'fortressWarfare', label: 'Fortress' },
                  { key: 'shielded', label: 'Shielded' },
                  { key: 'aeroAerialHit', label: 'Aero Aerial' },
                  { key: 'resonanceMaxStacks', label: 'Resonance Max' },
                ] as const
              ).map((flag) => (
                <button
                  key={flag.key}
                  type="button"
                  onClick={() =>
                    patchLoadout({
                      assumptions: {
                        ...loadout.assumptions,
                        [flag.key]: !loadout.assumptions[flag.key],
                      },
                    })
                  }
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                    loadout.assumptions[flag.key]
                      ? 'bg-[#3ee6c5]/20 text-[#3ee6c5]'
                      : 'bg-white/[0.05] text-slate-400'
                  }`}
                >
                  {flag.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Downstar Elev {loadout.assumptions.downstarMeters ?? 0}m</span>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={loadout.assumptions.downstarMeters ?? 0}
                onChange={(e) =>
                  patchLoadout({
                    assumptions: {
                      ...loadout.assumptions,
                      downstarMeters: Number(e.target.value),
                    },
                  })
                }
                aria-label="Downstar elevation meters"
                className="h-1 flex-1 cursor-pointer accent-[#3ee6c5]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBaselineSnapshot({ name: loadout.name.slice(0, 18), dps })}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-white/[0.1] bg-black/30 py-1 text-[11px] font-medium text-slate-200 hover:border-white/30"
              >
                <BookmarkPlus className="h-3.5 w-3.5 text-[#3ee6c5]" />
                Pin Baseline
              </button>
              <button
                type="button"
                onClick={() => setMathOpen(true)}
                className="inline-flex items-center gap-1 rounded bg-[#3ee6c5] px-3 py-1 text-[11px] font-bold text-[#091214]"
              >
                <Calculator className="h-3.5 w-3.5" />
                Math
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN 4-COLUMN IN-GAME GEAR BACKPACK WORKSPACE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 1. Far-Left Vertical Mode Rail */}
        <nav
          aria-label="Config Mode Rail"
          className="flex flex-row gap-2 border-b border-white/[0.06] pb-2 lg:col-span-1 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-2"
        >
          {(
            [
              { id: 'gear', label: 'Gear Config' },
              { id: 'deviation', label: 'Combat Deviation' },
              { id: 'cradle_food', label: 'Cradle & Food' },
            ] as const
          ).map((item) => {
            const active = activeRail === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRailMode(item.id);
                  if (topTab === 'buffs' && item.id !== 'cradle_food') {
                    setTopTab('gear_config');
                  }
                }}
                className={`relative px-2 py-2 text-left text-xs transition lg:py-3 ${
                  active
                    ? 'font-semibold text-white'
                    : 'font-normal text-slate-500 hover:text-slate-200'
                }`}
              >
                {active && (
                  <span className="hidden lg:block absolute -right-[9px] top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-[#e5b84b] shadow-[0_0_8px_#e5b84b]" />
                )}
                <span className="leading-snug">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 2. Left-Center Profile & Clean Core Summary Strip */}
        <section className="flex flex-col justify-between gap-4 rounded-lg bg-black/20 p-3.5 lg:col-span-3">
          <div className="space-y-4">
            {/* Profile Avatar + Loadout Name + Lv. 50 */}
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-white/15 bg-[#0b1014]">
                {avatarImg ? (
                  <img
                    src={avatarImg}
                    alt="Active Deviation"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Sparkles className="m-2.5 h-5 w-5 text-[#3ee6c5]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={loadout.name}
                  onChange={(e) => patchLoadout({ name: e.target.value })}
                  aria-label="Loadout name"
                  className="w-full truncate bg-transparent text-xs font-semibold text-white outline-none focus:text-[#3ee6c5]"
                />
                <div className="mt-0.5 flex items-center justify-between font-mono text-[11px] text-slate-400">
                  <span>Lv. 50</span>
                  <span>Rating {stats.gearScoreTotal}</span>
                </div>
              </div>
            </div>

            {/* Active Weapon Inline Toggle + Open Stat Rows */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                <span className="text-xs font-semibold text-slate-200">
                  {loadout.activeWeaponSlot === 'primary' ? 'Primary Weapon' : 'Secondary Weapon'}
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSetActiveWeapon('primary')}
                    className={`rounded px-1.5 py-0.5 font-mono font-bold transition ${
                      loadout.activeWeaponSlot === 'primary'
                        ? 'bg-[#e5b84b] text-[#141004]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetActiveWeapon('secondary')}
                    className={`rounded px-1.5 py-0.5 font-mono font-bold transition ${
                      loadout.activeWeaponSlot === 'secondary'
                        ? 'bg-[#e5b84b] text-[#141004]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Crosshair className="h-3.5 w-3.5 text-slate-500" />
                    Attack
                  </span>
                  <span className="font-mono text-base font-semibold text-white">
                    {stats.weaponAttack}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Flame className="h-3.5 w-3.5 text-slate-500" />
                    Fire Rate
                  </span>
                  <span className="font-mono text-base font-semibold text-white">
                    {stats.fireRateRpm}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Layers className="h-3.5 w-3.5 text-slate-500" />
                    Magazine Capacity
                  </span>
                  <span className="font-mono text-base font-semibold text-white">
                    {stats.magCapacity}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Character Stats (Open Hairline List) */}
            <div className="space-y-2.5 border-t border-white/[0.06] pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Zap className="h-3.5 w-3.5 text-slate-500" />
                  Psi Intensity
                </span>
                <span className="font-mono text-base font-semibold text-white">
                  {stats.psiIntensity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Heart className="h-3.5 w-3.5 text-slate-500" />
                  Max HP
                </span>
                <span className="font-mono text-base font-semibold text-white">
                  {stats.maxHp}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Radiation className="h-3.5 w-3.5 text-slate-500" />
                  Pollution Resist
                </span>
                <span className="font-mono text-base font-semibold text-white">
                  {stats.pollutionResist}
                </span>
              </div>
            </div>

            {/* Compact Live DPS & HP%/Sanity% */}
            <div className="space-y-2 border-t border-white/[0.06] pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Activity className="h-3.5 w-3.5 text-[#3ee6c5]" />
                  Sustained DPS
                </span>
                <span className="font-mono text-base font-bold text-[#3ee6c5]">
                  {dps.sustainedDps.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Burst DPS</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-200">
                    {dps.burstDps.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMathOpen(true)}
                    className="text-[10px] text-[#3ee6c5] hover:underline"
                  >
                    Math
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-400">
                <label className="block">
                  <div className="flex justify-between">
                    <span>HP</span>
                    <span className="font-mono text-slate-200">{loadout.hpPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={loadout.hpPct}
                    onChange={(e) => patchLoadout({ hpPct: Number(e.target.value) })}
                    className="h-1 w-full cursor-pointer accent-[#3ee6c5]"
                  />
                </label>
                <label className="block">
                  <div className="flex justify-between">
                    <span>Sanity</span>
                    <span className="font-mono text-slate-200">{loadout.sanityPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={loadout.sanityPct}
                    onChange={(e) => patchLoadout({ sanityPct: Number(e.target.value) })}
                    className="h-1 w-full cursor-pointer accent-purple-400"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Bottom Clean Save + Stats Chevron Toggle */}
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5">
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-[#3ee6c5]"
            >
              <Save className="h-3.5 w-3.5 text-[#3ee6c5]" />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={() => setStatsColumnOpen((v) => !v)}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              title={statsColumnOpen ? 'Collapse Detailed Stats' : 'Expand Detailed Stats'}
              aria-label="Toggle Basic and Battle Stats sheet"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${statsColumnOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </section>

        {/* 3. Middle-Center Clean Stat Sheet (Basic Stats ^ & Battle Stats ^) */}
        {statsColumnOpen && (
          <section className="flex max-h-[615px] flex-col overflow-hidden rounded-lg bg-black/30 lg:col-span-3">
            <div className="flex-1 overflow-y-auto px-3.5 py-2 text-xs">
              {/* Basic Stats Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setBasicOpen((v) => !v)}
                  className="flex w-full items-center justify-between border-b border-white/[0.06] py-2 text-left text-xs font-semibold text-white"
                >
                  <span>Basic Stats</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      basicOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {basicOpen && (
                  <div className="divide-y divide-white/[0.05] text-xs">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-400">Attack</span>
                      <span className="font-mono text-white">{stats.baseCharAttack}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-400">Psi Intensity</span>
                      <span className="font-mono text-white">{stats.psiIntensity}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-400">HP</span>
                      <span className="font-mono text-white">
                        {stats.currentHp}/{stats.maxHp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-400">Pollution Resist</span>
                      <span className="font-mono text-white">{stats.pollutionResist}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Battle Stats Accordion */}
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setBattleOpen((v) => !v)}
                  className="flex w-full items-center justify-between border-b border-white/[0.06] py-2 text-left text-xs font-semibold text-white"
                >
                  <span>Battle Stats</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      battleOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {battleOpen && (
                  <div className="divide-y divide-white/[0.04]">
                    {visibleBattleKeys.map((key) => {
                      const entry = stats.statDetails[key];
                      const open = inspectedStatKey === key;
                      const formattedVal =
                        entry.unit === '%'
                          ? `${entry.value.toFixed(1)}%`
                          : `${entry.value}`;

                      return (
                        <div key={key}>
                          <button
                            type="button"
                            onClick={() => setInspectedStatKey(open ? null : key)}
                            className="flex w-full items-center justify-between gap-2 py-2 text-left text-xs transition hover:text-white"
                          >
                            <span className="truncate text-slate-300">{entry.label}</span>
                            <span className="shrink-0 font-mono text-white">{formattedVal}</span>
                          </button>

                          {open && (
                            <div className="mb-2 space-y-0.5 rounded bg-black/40 p-2 text-[10px]">
                              {entry.sources.length === 0 ? (
                                <div className="text-slate-500">No active sources.</div>
                              ) : (
                                entry.sources.map((src, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 text-slate-300"
                                  >
                                    <span className="truncate">{src.source}</span>
                                    <span className="font-mono text-[#3ee6c5]">
                                      {src.value >= 0 ? '+' : ''}
                                      {src.value}
                                      {entry.unit === '%' ? '%' : ''}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between py-2">
                      <button
                        type="button"
                        onClick={() => setShowZeroStats((v) => !v)}
                        className="text-[10px] font-medium text-[#3ee6c5] hover:underline"
                      >
                        {showZeroStats ? 'Hide 0.0% stats' : 'Show all stats (incl. 0.0%)'}
                      </button>
                      <span className="text-[10px] text-slate-500">Tap row for math</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Active Sets Summary */}
              {(stats.activeSets.length > 0 || stats.activeKeyArmors.length > 0) && (
                <div className="mt-2 space-y-1.5 border-t border-white/[0.06] py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Active Set Effects
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stats.activeSets.map((s) => (
                      <span
                        key={s.setName}
                        title={s.activeTiers
                          .filter((t) => t.active)
                          .map((t) => `${t.count}pc: ${t.desc}`)
                          .join('\n')}
                        className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-200"
                      >
                        {s.setName.replace(' Set', '')}{' '}
                        <span className="font-mono text-[#3ee6c5]">{s.count}/4</span>
                      </span>
                    ))}
                    {stats.activeKeyArmors.map((k) => (
                      <span
                        key={k.name}
                        title={k.desc}
                        className="rounded border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-200"
                      >
                        {k.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Right Clean Equipment / Deviation / Cradle & Food Zone */}
        <section
          className={`p-1 ${statsColumnOpen ? 'lg:col-span-5' : 'lg:col-span-8'}`}
        >
          {activeRail === 'gear' && (
            <EquipmentGridPanel
              loadout={loadout}
              onSelectSlot={(s) => setDrawerSlot(s)}
              onSetActiveDps={handleSetActiveWeapon}
            />
          )}

          {activeRail === 'deviation' && (
            <CombatDeviationPanel
              loadout={loadout}
              deviationDps={dps.deviationDps}
              onChange={patchLoadout}
            />
          )}

          {activeRail === 'cradle_food' && (
            <CradleAndFoodPanel loadout={loadout} onChange={patchLoadout} />
          )}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setJsonModalOpen(false)}
        >
          <div
            className="w-full max-w-xl space-y-3 rounded-2xl border border-white/[0.12] bg-[#0f161a] p-5 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Upload className="h-4 w-4 text-[#3ee6c5]" />
                <span>Export / Import Loadout JSON</span>
              </div>
              <button
                type="button"
                onClick={() => setJsonModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-white/[0.1] bg-[#0c1114] p-3 font-mono text-[11px] text-slate-200 outline-none focus:border-[#3ee6c5]"
            />
            {jsonError && <div className="text-rose-400">{jsonError}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard?.writeText(jsonText).catch(() => {});
                  showToast('Loadout JSON copied');
                }}
                className="rounded-lg border border-white/[0.12] bg-[#131a1e] px-3 py-1.5 font-semibold text-slate-200 hover:border-[#3ee6c5]"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                className="rounded-lg bg-[#3ee6c5] px-4 py-1.5 font-bold text-[#091214] hover:bg-[#5df0d2]"
              >
                Import Loadout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[#3ee6c5]/50 bg-[#0f161a]/95 px-3.5 py-1.5 text-xs font-semibold text-[#3ee6c5] shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

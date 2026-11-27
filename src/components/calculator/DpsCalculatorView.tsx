import {
  Activity,
  BookmarkPlus,
  Calculator,
  ChevronDown,
  ChevronRight,
  Download,
  Info,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  aggregateLoadoutStats,
  calculateFullLoadoutDps,
  cloneLoadout,
  createLoadoutFromWeaponId,
  getStarterLoadouts,
  type ActiveWeaponSlotKey,
  type EquipSlotId,
  type FullDpsResult,
  type LoadoutConfig,
  type StatKey,
  type TargetType,
} from '../../data/dps/dpsEngine';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { CalculatorPreset } from '../../types/game';
import { FormulaBreakdownModal } from './FormulaBreakdownModal';
import {
  CombatDeviationPanel,
  CradleAndFoodPanel,
  EquipmentGridPanel,
} from './GearConfigPanels';
import { SlotConfiguratorDrawer } from './SlotConfiguratorDrawer';

interface DpsCalculatorViewProps {
  preset: CalculatorPreset;
  onChangePreset: (next: CalculatorPreset) => void;
  activeBuildName?: string | null;
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

export function DpsCalculatorView({
  preset,
  onChangePreset,
  activeBuildName,
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

  // Sync external weapon/build selection (Meta Builds -> Load in Calculator, Workbench -> DPS)
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

  const activeRail =
    topTab === 'buffs' ? 'cradle_food' : railMode;

  const isCustomSaved = savedLoadouts.some((s) => s.id === loadout.id);

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0c1114] p-2.5 text-slate-100 shadow-2xl sm:p-4">
      {/* Top Navigation Bar */}
      <header className="flex flex-col justify-between gap-2.5 border-b border-white/[0.08] pb-2.5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: 'simulator', label: 'DPS Simulator' },
              { id: 'gear_config', label: 'Gear Config' },
              { id: 'buffs', label: 'Food & Cradle Buffs' },
            ] as const
          ).map((tab) => {
            const active = topTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTopTab(tab.id)}
                className={`relative shrink-0 px-3.5 py-2 text-xs font-semibold tracking-wide transition ${
                  active ? 'text-[#3ee6c5]' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-[#3ee6c5] shadow-[0_0_10px_#3ee6c5]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Preset Switcher & Export/Import */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={allPresets.some((p) => p.id === loadout.id) ? loadout.id : ''}
            onChange={(e) => e.target.value && handleSelectPresetId(e.target.value)}
            aria-label="Loadout preset switcher"
            className="min-w-[190px] max-w-[260px] rounded-lg border border-white/[0.1] bg-[#131a1e] px-2.5 py-1.5 text-xs font-medium text-slate-100 outline-none focus:border-[#3ee6c5]"
          >
            {!allPresets.some((p) => p.id === loadout.id) && (
              <option value="">Custom Unsaved Build</option>
            )}
            {savedLoadouts.length > 0 && (
              <optgroup label="Saved Loadouts">
                {savedLoadouts.map((s) => (
                  <option key={s.id} value={s.id}>
                    ★ {s.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Starter Meta Templates">
              {STARTER_LOADOUTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          </select>

          {isCustomSaved && (
            <button
              type="button"
              onClick={() => handleDeleteSavedPreset(loadout.id)}
              className="rounded-lg border border-rose-500/35 bg-rose-950/30 p-1.5 text-rose-300 transition hover:bg-rose-950/60"
              title="Delete saved loadout"
              aria-label="Delete current saved loadout"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenJsonModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#131a1e] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#3ee6c5]/60 hover:text-[#3ee6c5]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const reset = cloneLoadout(STARTER_LOADOUTS[0]);
              setLoadout(reset);
              showToast('Reset to Lv.50 Starter');
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-[#131a1e] px-2.5 py-1.5 text-xs text-slate-400 transition hover:text-white"
            title="Reset loadout"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* EXPANDED DPS SIMULATOR TOP STRIP WHEN ON SIMULATOR TAB */}
      {topTab === 'simulator' && (
        <div className="grid gap-3 rounded-xl border border-[#3ee6c5]/30 bg-[#101c20]/85 p-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/[0.08] bg-[#0c1114]/90 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sustained DPS (With Reload + Pet)
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-[#3ee6c5]">
              {dps.sustainedDps.toLocaleString()}
            </div>
            {baselineSnapshot ? (
              <div className="mt-1 font-mono text-[11px] text-slate-300">
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
              <div className="mt-1 text-[10px] text-slate-400">
                Weapon {dps.weaponOnlySustainedDps.toLocaleString()} + Pet{' '}
                {dps.deviationDps.toLocaleString()}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/[0.08] bg-[#0c1114]/90 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Burst DPS & Mag Damage
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-white">
              {dps.burstDps.toLocaleString()}
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">
              {dps.magazineTotalDamage.toLocaleString()} / mag ({dps.formula.magDumpSeconds}s +{' '}
              {dps.formula.effectiveReloadSeconds}s reload)
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.08] bg-[#0c1114]/90 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Keyword & Elemental Output
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-amber-300">
              +{dps.keywordProcDps.toLocaleString()} DPS
            </div>
            <div className="mt-1 text-[10px] text-slate-300">
              {dps.formula.keywordName} ({dps.formula.keywordProcChancePct}% proc ·{' '}
              {dps.elementalSharePct}% Elem)
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2 rounded-lg border border-white/[0.08] bg-[#0c1114]/90 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              A/B Compare & Audit
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setBaselineSnapshot({ name: loadout.name.slice(0, 18), dps })
                }
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/[0.12] bg-[#131a1e] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-[#3ee6c5]"
              >
                <BookmarkPlus className="h-3.5 w-3.5 text-[#3ee6c5]" />
                Pin Baseline
              </button>
              <button
                type="button"
                onClick={() => setMathOpen(true)}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#3ee6c5] px-3 py-1.5 text-[11px] font-bold text-[#091214] hover:bg-[#5df0d2]"
              >
                <Calculator className="h-3.5 w-3.5" />
                View Math
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4-ZONE GEAR CONFIG WORKSPACE */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* ZONE 1: Far-Left Vertical Mode Rail (col-span-1 on lg+) */}
        <nav
          aria-label="Config Mode Rail"
          className="flex flex-row gap-1.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0f161a]/90 p-1.5 lg:col-span-1 lg:flex-col lg:overflow-visible"
        >
          {(
            [
              { id: 'gear', label: 'Gear Config', icon: Shield },
              { id: 'deviation', label: 'Combat Deviation', icon: Sparkles },
              { id: 'cradle_food', label: 'Cradle & Food', icon: Utensils },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
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
                className={`relative flex shrink-0 flex-row items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center text-[11px] font-semibold transition lg:flex-col lg:gap-1.5 lg:px-1.5 lg:py-4 ${
                  active
                    ? 'bg-[#3ee6c5]/14 text-[#3ee6c5]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`}
              >
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#3ee6c5] lg:bottom-2 lg:left-0 lg:right-auto lg:top-2 lg:h-auto lg:w-1" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ZONE 2: Left-Center Summary & Live DPS Card (col-span-4 on lg+) */}
        <section className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0f161a]/85 p-3.5 backdrop-blur-md lg:col-span-4">
          <div className="space-y-3">
            {/* Profile & Build Header */}
            <div className="space-y-2 border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-[#e5b84b]/45 bg-[#e5b84b]/15 px-2 py-0.5 font-mono text-[11px] font-bold text-[#e5b84b]">
                  Lv. 50
                </span>
                <input
                  type="text"
                  value={loadout.name}
                  onChange={(e) => patchLoadout({ name: e.target.value })}
                  aria-label="Loadout name"
                  className="min-w-0 flex-1 rounded-md border border-white/[0.08] bg-[#0c1114] px-2.5 py-1 text-xs font-semibold text-white outline-none focus:border-[#3ee6c5]"
                />
              </div>

              {/* Current HP% & Sanity% Sliders */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <div className="mb-0.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Current HP%</span>
                    <span className="font-mono font-bold text-emerald-300">{loadout.hpPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={loadout.hpPct}
                    onChange={(e) => patchLoadout({ hpPct: Number(e.target.value) })}
                    aria-label="Current HP percent"
                    className="h-1 w-full cursor-pointer accent-emerald-400"
                  />
                </div>
                <div>
                  <div className="mb-0.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Sanity%</span>
                    <span className="font-mono font-bold text-purple-300">
                      {loadout.sanityPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={loadout.sanityPct}
                    onChange={(e) => patchLoadout({ sanityPct: Number(e.target.value) })}
                    aria-label="Current Sanity percent"
                    className="h-1 w-full cursor-pointer accent-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Active Weapon Quick Toggle & Readout */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/[0.08] bg-[#0c1114] p-1">
                <button
                  type="button"
                  onClick={() => handleSetActiveWeapon('primary')}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition ${
                    loadout.activeWeaponSlot === 'primary'
                      ? 'bg-[#3ee6c5]/20 text-[#3ee6c5]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="rounded bg-[#e5b84b] px-1 text-[9px] font-extrabold text-[#1a1304]">
                    1
                  </span>
                  <span className="truncate">Primary</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetActiveWeapon('secondary')}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition ${
                    loadout.activeWeaponSlot === 'secondary'
                      ? 'bg-[#3ee6c5]/20 text-[#3ee6c5]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="rounded bg-[#e5b84b] px-1 text-[9px] font-extrabold text-[#1a1304]">
                    2
                  </span>
                  <span className="truncate">Secondary</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg border border-white/[0.07] bg-[#131a1e] p-2">
                  <div className="text-[10px] text-slate-400">Attack</div>
                  <div className="font-mono text-sm font-bold text-white">
                    {stats.weaponAttack}
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.07] bg-[#131a1e] p-2">
                  <div className="text-[10px] text-slate-400">Fire Rate</div>
                  <div className="font-mono text-sm font-bold text-white">
                    {stats.fireRateRpm}
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.07] bg-[#131a1e] p-2">
                  <div className="text-[10px] text-slate-400">Mag Cap</div>
                  <div className="font-mono text-sm font-bold text-white">
                    {stats.magCapacity}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Character Readout */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg border border-white/[0.07] bg-[#131a1e] p-2">
                <div className="text-[10px] text-slate-400">Psi Intensity</div>
                <div className="font-mono text-sm font-bold text-[#3ee6c5]">
                  {stats.psiIntensity}
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#131a1e] p-2">
                <div className="text-[10px] text-slate-400">Max HP</div>
                <div className="font-mono text-sm font-bold text-emerald-300">
                  {stats.maxHp.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#131a1e] p-2">
                <div className="text-[10px] text-slate-400">Poll Res</div>
                <div className="font-mono text-sm font-bold text-sky-300">
                  {stats.pollutionResist}
                </div>
              </div>
            </div>

            {/* Live DPS Telemetry Block */}
            <div className="space-y-2.5 rounded-xl border border-[#3ee6c5]/30 bg-[#0c1114]/90 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#3ee6c5]">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Live DPS Telemetry</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMathOpen(true)}
                  className="rounded border border-[#3ee6c5]/40 bg-[#3ee6c5]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3ee6c5] transition hover:bg-[#3ee6c5]/20"
                >
                  View Math
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.07] bg-[#131a1e] p-2">
                  <div className="text-[10px] text-slate-400">Burst DPS</div>
                  <div className="font-mono text-lg font-extrabold text-white">
                    {dps.burstDps.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-[#3ee6c5]/25 bg-[#112322] p-2">
                  <div className="text-[10px] text-[#3ee6c5]">Sustained DPS</div>
                  <div className="font-mono text-lg font-extrabold text-[#3ee6c5]">
                    {dps.sustainedDps.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Per-Shot Breakdown */}
              <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                <div className="rounded bg-[#131a1e] p-1">
                  <div className="text-[9px] text-slate-500">Norm</div>
                  <div className="font-bold text-slate-200">{dps.normalHit}</div>
                </div>
                <div className="rounded bg-[#131a1e] p-1">
                  <div className="text-[9px] text-amber-300">Crit</div>
                  <div className="font-bold text-amber-300">{dps.critHit}</div>
                </div>
                <div className="rounded bg-[#131a1e] p-1">
                  <div className="text-[9px] text-sky-300">WS</div>
                  <div className="font-bold text-sky-300">{dps.weakspotHit}</div>
                </div>
                <div className="rounded bg-[#131a1e] p-1">
                  <div className="text-[9px] text-[#3ee6c5]">WS Crit</div>
                  <div className="font-bold text-[#3ee6c5]">{dps.weakspotCritHit}</div>
                </div>
                <div className="rounded bg-[#131a1e] p-1">
                  <div className="text-[9px] text-purple-300">Proc</div>
                  <div className="font-bold text-purple-300">+{dps.avgKeywordProcPerShot}</div>
                </div>
              </div>

              {/* Combat Assumptions Strip */}
              <div className="space-y-2 border-t border-white/[0.06] pt-2">
                <div className="grid grid-cols-3 gap-1">
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
                      className={`rounded py-1 text-[10px] font-semibold transition ${
                        loadout.assumptions.targetType === tt.id
                          ? 'bg-[#3ee6c5] text-[#091214]'
                          : 'bg-[#131a1e] text-slate-400 hover:text-white'
                      }`}
                    >
                      {tt.label}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="mb-0.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Weakspot Hit Rate</span>
                    <span className="font-mono font-bold text-sky-300">
                      {loadout.assumptions.weakspotHitRatePct}%
                    </span>
                  </div>
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
                    aria-label="Weakspot hit rate"
                    className="h-1 w-full cursor-pointer accent-sky-400"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { key: 'bullsEye', label: "Bull's Eye +8%" },
                      { key: 'marked', label: 'Marked' },
                      { key: 'fortressWarfare', label: 'Fortress Warfare' },
                      { key: 'shielded', label: 'Shielded' },
                    ] as const
                  ).map((flag) => {
                    const active = loadout.assumptions[flag.key];
                    return (
                      <button
                        key={flag.key}
                        type="button"
                        onClick={() =>
                          patchLoadout({
                            assumptions: { ...loadout.assumptions, [flag.key]: !active },
                          })
                        }
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium transition ${
                          active
                            ? 'border-[#3ee6c5]/60 bg-[#3ee6c5]/15 text-[#3ee6c5]'
                            : 'border-white/[0.08] bg-[#131a1e] text-slate-400 hover:text-white'
                        }`}
                      >
                        {flag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save + Expand Stats Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3ee6c5] py-2 text-xs font-bold uppercase tracking-wider text-[#091214] shadow-[0_0_16px_rgba(62,230,197,0.25)] transition hover:bg-[#5df0d2]"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setStatsColumnOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-[#131a1e] text-slate-200 transition hover:border-[#3ee6c5] hover:text-[#3ee6c5]"
              title={statsColumnOpen ? 'Collapse Detailed Stats' : 'Expand Detailed Stats'}
              aria-label="Toggle Basic and Battle Stats sheet"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${statsColumnOpen ? 'rotate-90 lg:rotate-180' : ''}`}
              />
            </button>
          </div>
        </section>

        {/* ZONE 3: Middle-Center Detailed Stats Sheet (col-span-3 on lg+) */}
        {statsColumnOpen && (
          <section className="flex max-h-[760px] flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f161a]/85 backdrop-blur-md lg:col-span-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0c1114] px-3.5 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Stat Breakdown
              </span>
              <span className="font-mono text-[10px] text-[#3ee6c5]">
                Rating {stats.gearScoreTotal}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-3 text-xs">
              {/* Basic Stats Accordion */}
              <div className="rounded-lg border border-white/[0.07] bg-[#131a1e]/75">
                <button
                  type="button"
                  onClick={() => setBasicOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-200"
                >
                  <span>Basic Stats</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      basicOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {basicOpen && (
                  <div className="divide-y divide-white/[0.05] border-t border-white/[0.06] px-3 py-1 text-[11px]">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-400">Attack (Char / Weapon)</span>
                      <span className="font-mono font-semibold text-white">
                        {stats.baseCharAttack} / {stats.weaponAttack}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-400">Psi Intensity</span>
                      <span className="font-mono font-semibold text-[#3ee6c5]">
                        {stats.psiIntensity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-400">HP (Current / Max)</span>
                      <span className="font-mono font-semibold text-emerald-300">
                        {stats.currentHp.toLocaleString()} / {stats.maxHp.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-400">Pollution Resist</span>
                      <span className="font-mono font-semibold text-sky-300">
                        {stats.pollutionResist}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Battle Stats Accordion */}
              <div className="rounded-lg border border-white/[0.07] bg-[#131a1e]/75">
                <button
                  type="button"
                  onClick={() => setBattleOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-200"
                >
                  <span>Battle Stats</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      battleOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {battleOpen && (
                  <div className="space-y-1 border-t border-white/[0.06] p-2">
                    <div className="px-1 text-[10px] text-slate-500">
                      Tap any stat to view exact sources
                    </div>
                    {BATTLE_STAT_KEYS.map((key) => {
                      const entry = stats.statDetails[key];
                      const open = inspectedStatKey === key;
                      const formattedVal =
                        entry.unit === '%'
                          ? `${entry.value.toFixed(1)}%`
                          : `${entry.value}`;

                      return (
                        <div key={key} className="rounded hover:bg-white/[0.03]">
                          <button
                            type="button"
                            onClick={() => setInspectedStatKey(open ? null : key)}
                            className="flex w-full items-center justify-between gap-2 px-1.5 py-1 text-left text-[11px]"
                          >
                            <span className="flex items-center gap-1 text-slate-300">
                              <span>{entry.label}</span>
                              {entry.sources.length > 0 && (
                                <Info className="h-2.5 w-2.5 text-slate-500" />
                              )}
                            </span>
                            <span
                              className={`font-mono font-semibold ${
                                entry.value > 0
                                  ? 'text-[#3ee6c5]'
                                  : entry.value < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-500'
                              }`}
                            >
                              {formattedVal}
                            </span>
                          </button>

                          {open && (
                            <div className="mx-1.5 mb-1.5 space-y-0.5 rounded border border-[#3ee6c5]/30 bg-[#0c1114] p-2 text-[10px]">
                              {entry.sources.length === 0 ? (
                                <div className="text-slate-500">No active sources for this stat.</div>
                              ) : (
                                entry.sources.map((src, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 text-slate-300"
                                  >
                                    <span className="truncate">{src.source}</span>
                                    <span className="font-mono font-semibold text-[#3ee6c5]">
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
                  </div>
                )}
              </div>

              {/* Active Armor Sets & Key Armors */}
              <div className="space-y-1.5 rounded-lg border border-white/[0.07] bg-[#131a1e]/75 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Active Set Bonuses & Key Armor
                </div>
                {stats.activeSets.map((s) => (
                  <div
                    key={s.setName}
                    className="rounded border border-white/[0.06] bg-[#0c1114] p-2 text-[10px]"
                  >
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>{s.setName}</span>
                      <span className="rounded bg-[#3ee6c5]/15 px-1.5 py-0.5 font-mono text-[#3ee6c5]">
                        {s.count}/4
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {s.activeTiers.map((t) => (
                        <div
                          key={t.count}
                          className={t.active ? 'text-slate-200' : 'text-slate-600 line-through'}
                        >
                          <strong className="font-mono">{t.count}pc:</strong> {t.desc}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {stats.activeKeyArmors.map((k) => (
                  <div
                    key={k.name}
                    className="rounded border border-amber-400/30 bg-amber-500/10 p-2 text-[10px]"
                  >
                    <div className="font-semibold text-amber-300">Key Armor: {k.name}</div>
                    <div className="mt-0.5 text-slate-200">{k.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ZONE 4: Right Equipment / Deviation / Cradle & Food Panel */}
        <section
          className={`rounded-xl border border-white/[0.08] bg-[#0f161a]/85 p-3.5 backdrop-blur-md ${
            statsColumnOpen ? 'lg:col-span-4' : 'lg:col-span-7'
          }`}
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

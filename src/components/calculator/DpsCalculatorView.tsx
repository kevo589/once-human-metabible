import { useMemo, useState } from 'react';
import { BookmarkPlus, RotateCcw, Save, Trash2, Zap } from 'lucide-react';
import { META_BUILDS } from '../../data/buildsAndTimers';
import { WEAPONS } from '../../data/weapons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { CalculatorPreset } from '../../types/game';
import { calculateDps } from '../../utils/dpsCalculator';
import { ArchetypeBadge, RarityBadge } from '../common/Badge';

interface SavedLoadout {
  id: string;
  name: string;
  preset: CalculatorPreset;
}

interface DpsCalculatorViewProps {
  preset: CalculatorPreset;
  onChangePreset: (next: CalculatorPreset) => void;
  activeBuildName?: string | null;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}

function SliderControl({ label, value, min, max, step = 1, suffix = '%', onChange }: SliderControlProps) {
  return (
    <div className="rounded-lg border border-obsidian-700/70 bg-obsidian-950/70 p-3">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono font-semibold text-stardust-400">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-obsidian-700 accent-cyan-400"
      />
    </div>
  );
}

export function DpsCalculatorView({ preset, onChangePreset, activeBuildName }: DpsCalculatorViewProps) {
  const [savedLoadouts, setSavedLoadouts] = useLocalStorage<SavedLoadout[]>('oh-saved-loadouts', []);
  const [saveName, setSaveName] = useState('');
  const [comparePreset, setComparePreset] = useState<CalculatorPreset | null>(null);

  const weapon = useMemo(
    () => WEAPONS.find((w) => w.id === preset.weaponId) ?? WEAPONS[0],
    [preset.weaponId],
  );

  const result = useMemo(() => calculateDps(weapon, preset), [weapon, preset]);

  const compareResult = useMemo(() => {
    if (!comparePreset) return null;
    const compareWeapon = WEAPONS.find((w) => w.id === comparePreset.weaponId) ?? WEAPONS[0];
    return {
      weaponName: compareWeapon.name,
      dps: calculateDps(compareWeapon, comparePreset),
    };
  }, [comparePreset]);

  const updateField = <K extends keyof CalculatorPreset>(key: K, val: CalculatorPreset[K]) => {
    onChangePreset({ ...preset, [key]: val });
  };

  const handleSelectWeapon = (weaponId: string) => {
    const matchingMeta = META_BUILDS.find((b) => b.weaponId === weaponId);
    if (matchingMeta) {
      onChangePreset(matchingMeta.preset);
    } else {
      onChangePreset({ ...preset, weaponId });
    }
  };

  const handleSaveLoadout = () => {
    const trimmed = saveName.trim() || `${weapon.name.split('—')[0].trim()} Custom`;
    setSavedLoadouts((prev) => [{ id: `custom-${Date.now()}`, name: trimmed, preset }, ...prev]);
    setSaveName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-obsidian-700/80 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Build & DPS Calculator</h1>
          <p className="mt-1 text-sm text-slate-400">
            Simulate Burst DPS, Sustained Mag-Cycle DPS, Crit/Weakspot scaling, and Elemental proc damage.
            {activeBuildName && (
              <span className="ml-2 text-stardust-400">Loaded preset: {activeBuildName}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setComparePreset(preset)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-stardust-400/50"
          >
            <BookmarkPlus className="h-3.5 w-3.5 text-stardust-400" />
            Pin Baseline for Compare
          </button>
          <button
            type="button"
            onClick={() => onChangePreset(META_BUILDS[0].preset)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-700 bg-obsidian-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-stardust-400/30 bg-gradient-to-br from-obsidian-900 to-obsidian-850 p-4">
          <div className="text-xs font-medium text-slate-400">Sustained DPS (incl. reload)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-stardust-glow">
            {result.sustainedDps.toLocaleString()}
          </div>
          {compareResult && (
            <div className="mt-1 text-xs text-slate-400">
              vs {compareResult.dps.sustainedDps.toLocaleString()} (
              <span
                className={
                  result.sustainedDps >= compareResult.dps.sustainedDps ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {result.sustainedDps >= compareResult.dps.sustainedDps ? '+' : ''}
                {(result.sustainedDps - compareResult.dps.sustainedDps).toLocaleString()}
              </span>
              )
            </div>
          )}
        </div>

        <div className="rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
          <div className="text-xs font-medium text-slate-400">Burst DPS (mag dump)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-white">
            {result.burstDps.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {result.effectiveFireRateRpm} RPM • {result.expectedPerShotDamage.toLocaleString()} / shot
          </div>
        </div>

        <div className="rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
          <div className="text-xs font-medium text-slate-400">Damage Per Magazine</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-300">
            {result.magazineTotalDamage.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {result.effectiveMagSize} rds • {result.effectiveReloadSeconds}s reload
          </div>
        </div>

        <div className="rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
          <div className="text-xs font-medium text-slate-400">Crit / Weakspot / Status</div>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-300">
            {result.effectiveCritRatePct}% Crit ({result.critMultiplier}x)
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Weakspot {result.weakspotMultiplier}x • Status share {result.elementalSharePct}%
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Weapon & Preset Picker */}
        <div className="space-y-4 rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            1. Primary Weapon & Trait
          </h2>

          <select
            value={weapon.id}
            onChange={(e) => handleSelectWeapon(e.target.value)}
            className="w-full rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-2.5 text-sm text-white outline-none focus:border-stardust-400"
          >
            {WEAPONS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.category} • {w.archetype})
              </option>
            ))}
          </select>

          <div className="rounded-lg border border-obsidian-700/70 bg-obsidian-950 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <RarityBadge rarity={weapon.rarity} />
              <ArchetypeBadge archetype={weapon.archetype} />
              <span className="text-slate-400">{weapon.category}</span>
            </div>
            <p className="mt-2 leading-relaxed text-slate-300">{weapon.trait}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-obsidian-800 pt-2 font-mono text-[11px] text-slate-400">
              <div>ATK: {weapon.baseDamage}</div>
              <div>RPM: {weapon.fireRateRpm}</div>
              <div>MAG: {weapon.magSize}</div>
            </div>
          </div>

          <div className="space-y-2 border-t border-obsidian-800 pt-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Save / Load Custom Loadouts
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Loadout name..."
                className="w-full rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-stardust-400"
              />
              <button
                type="button"
                onClick={handleSaveLoadout}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-stardust-500 px-3 py-1.5 text-xs font-semibold text-obsidian-950 hover:bg-stardust-400"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
            {savedLoadouts.length > 0 && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto pt-1">
                {savedLoadouts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-obsidian-700/60 bg-obsidian-950 px-2.5 py-1.5 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => onChangePreset(item.preset)}
                      className="truncate text-left font-medium text-slate-200 hover:text-stardust-400"
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedLoadouts((prev) => prev.filter((x) => x.id !== item.id))}
                      className="text-slate-500 hover:text-rose-400"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Offensive Stats */}
        <div className="space-y-3 rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            2. Weapon, Crit & Status Modifiers
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
            <SliderControl
              label="Weapon Attack Bonus (Mods + Calib)"
              value={preset.weaponAttackBonusPct}
              min={0}
              max={120}
              onChange={(v) => updateField('weaponAttackBonusPct', v)}
            />
            <SliderControl
              label="Elemental & Status DMG Bonus"
              value={preset.statusElementBonusPct}
              min={0}
              max={200}
              onChange={(v) => updateField('statusElementBonusPct', v)}
            />
            <SliderControl
              label="Crit Rate Bonus"
              value={preset.critRateBonusPct}
              min={0}
              max={85}
              onChange={(v) => updateField('critRateBonusPct', v)}
            />
            <SliderControl
              label="Crit DMG Bonus"
              value={preset.critDamageBonusPct}
              min={0}
              max={220}
              onChange={(v) => updateField('critDamageBonusPct', v)}
            />
            <SliderControl
              label="Weakspot Hit Ratio (Aim Accuracy)"
              value={preset.weakspotHitRatioPct}
              min={0}
              max={100}
              onChange={(v) => updateField('weakspotHitRatioPct', v)}
            />
            <SliderControl
              label="Weakspot DMG Bonus"
              value={preset.weakspotDamageBonusPct}
              min={0}
              max={180}
              onChange={(v) => updateField('weakspotDamageBonusPct', v)}
            />
          </div>
        </div>

        {/* Handling, Cradle & Set Multipliers */}
        <div className="space-y-3 rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            3. Armor Sets, Cradle, Food & Handling
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
            <SliderControl
              label="Armor Set Multiplier (Lonewolf / Shelterer)"
              value={preset.armorSetBonusPct}
              min={0}
              max={80}
              onChange={(v) => updateField('armorSetBonusPct', v)}
            />
            <SliderControl
              label="Cradle Overrides + Food + Deviant Buff"
              value={preset.cradleAndFoodBonusPct}
              min={0}
              max={90}
              onChange={(v) => updateField('cradleAndFoodBonusPct', v)}
            />
            <SliderControl
              label="Enemy Vulnerability (Bull's Eye / Great Ones)"
              value={preset.vulnerableEnemyBonusPct}
              min={0}
              max={60}
              onChange={(v) => updateField('vulnerableEnemyBonusPct', v)}
            />
            <SliderControl
              label="Magazine Capacity Bonus"
              value={preset.magSizeBonusPct}
              min={0}
              max={80}
              onChange={(v) => updateField('magSizeBonusPct', v)}
            />
            <SliderControl
              label="Fire Rate Bonus"
              value={preset.fireRateBonusPct}
              min={0}
              max={50}
              onChange={(v) => updateField('fireRateBonusPct', v)}
            />
            <SliderControl
              label="Reload Speed Bonus"
              value={preset.reloadSpeedBonusPct}
              min={0}
              max={80}
              onChange={(v) => updateField('reloadSpeedBonusPct', v)}
            />
            <SliderControl
              label="Archetype Proc Multiplier (Shrapnel / Vortex / Surge)"
              value={preset.archetypeProcMultiplier}
              min={1}
              max={2.2}
              step={0.05}
              suffix="x"
              onChange={(v) => updateField('archetypeProcMultiplier', v)}
            />
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Zap className="h-3.5 w-3.5" />
              Quick Tip
            </div>
            <p className="mt-1 text-slate-300">
              Switch to <strong>Meta Builds</strong> to load curated S+ presets (Shrapnel, Frost Vortex, Power Surge, Bomber, Burn, Bull’s Eye) directly into this simulator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

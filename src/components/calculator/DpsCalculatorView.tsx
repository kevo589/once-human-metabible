import { useMemo, useState } from 'react';
import { BookmarkPlus, Eye, RotateCcw, Save, Trash2 } from 'lucide-react';
import { META_BUILDS } from '../../data/buildsAndTimers';
import { WEAPONS } from '../../data/weapons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { CalculatorPreset } from '../../types/game';
import { calculateDps } from '../../utils/dpsCalculator';
import { ArchetypeBadge, RarityBadge } from '../common/Badge';
import { WeaponDetailModal, WeaponStatBars, WeaponThumbnail } from '../weapons/WeaponVisuals';

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
    <div className="py-2">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-xs font-medium text-slate-200">
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
        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-obsidian-800 accent-slate-300"
      />
    </div>
  );
}

export function DpsCalculatorView({ preset, onChangePreset, activeBuildName }: DpsCalculatorViewProps) {
  const [savedLoadouts, setSavedLoadouts] = useLocalStorage<SavedLoadout[]>('oh-saved-loadouts', []);
  const [saveName, setSaveName] = useState('');
  const [comparePreset, setComparePreset] = useState<CalculatorPreset | null>(null);
  const [inspectOpen, setInspectOpen] = useState(false);

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
    const trimmed = saveName.trim() || `${weapon.name.split('-')[0].trim()} Custom`;
    setSavedLoadouts((prev) => [{ id: `custom-${Date.now()}`, name: trimmed, preset }, ...prev]);
    setSaveName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-white">DPS Calculator</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Burst DPS, sustained mag-cycle DPS, crit/weakspot scaling, and elemental proc simulation.
            {activeBuildName && (
              <span className="ml-2 text-slate-200">Preset: {activeBuildName}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setComparePreset(preset)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-800 bg-obsidian-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-obsidian-700 hover:text-white"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Pin Baseline
          </button>
          <button
            type="button"
            onClick={() => onChangePreset(META_BUILDS[0].preset)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-800 bg-obsidian-900 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-obsidian-700 bg-obsidian-900/80 p-4">
          <div className="text-[11px] font-medium text-slate-400">Sustained DPS</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-stardust-400">
            {result.sustainedDps.toLocaleString()}
          </div>
          {compareResult ? (
            <div className="mt-1 text-[11px] text-slate-400">
              vs {compareResult.dps.sustainedDps.toLocaleString()} (
              <span className={result.sustainedDps >= compareResult.dps.sustainedDps ? 'text-emerald-400' : 'text-rose-400'}>
                {result.sustainedDps >= compareResult.dps.sustainedDps ? '+' : ''}
                {(result.sustainedDps - compareResult.dps.sustainedDps).toLocaleString()}
              </span>
              )
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-slate-500">Includes reload cycle</div>
          )}
        </div>

        <div className="rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-4">
          <div className="text-[11px] font-medium text-slate-400">Burst DPS</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-white">
            {result.burstDps.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {result.effectiveFireRateRpm} RPM · {result.expectedPerShotDamage.toLocaleString()} / shot
          </div>
        </div>

        <div className="rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-4">
          <div className="text-[11px] font-medium text-slate-400">Magazine Damage</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-slate-100">
            {result.magazineTotalDamage.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {result.effectiveMagSize} rds · {result.effectiveReloadSeconds}s reload
          </div>
        </div>

        <div className="rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-4">
          <div className="text-[11px] font-medium text-slate-400">Crit / Weakspot / Status</div>
          <div className="mt-1 font-mono text-lg font-semibold text-slate-100">
            {result.effectiveCritRatePct}% Crit ({result.critMultiplier}x)
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Weakspot {result.weakspotMultiplier}x · Status {result.elementalSharePct}%
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Weapon & Saved Loadouts */}
        <div className="space-y-4 rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Primary Weapon
          </div>

          <select
            value={weapon.id}
            onChange={(e) => handleSelectWeapon(e.target.value)}
            className="w-full rounded-lg border border-obsidian-800 bg-obsidian-950 px-3 py-2 text-xs text-white outline-none focus:border-obsidian-600"
          >
            {WEAPONS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.category})
              </option>
            ))}
          </select>

          <div className="space-y-3 rounded-lg border border-obsidian-800/80 bg-obsidian-950/60 p-3 text-xs">
            <WeaponThumbnail weapon={weapon} size="lg" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <RarityBadge rarity={weapon.rarity} />
                {weapon.archetype !== 'Standard' && <ArchetypeBadge archetype={weapon.archetype} />}
              </div>
              <button
                type="button"
                onClick={() => setInspectOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white"
              >
                <Eye className="h-3.5 w-3.5" />
                Inspect
              </button>
            </div>

            <p className="leading-relaxed text-slate-400">{weapon.trait}</p>

            <WeaponStatBars weapon={weapon} compact />
          </div>

          <div className="space-y-2 border-t border-obsidian-800 pt-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Saved Loadouts
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Loadout name..."
                className="w-full rounded-lg border border-obsidian-800 bg-obsidian-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-obsidian-600"
              />
              <button
                type="button"
                onClick={handleSaveLoadout}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-obsidian-700 bg-obsidian-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-obsidian-700"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
            {savedLoadouts.length > 0 && (
              <div className="max-h-36 space-y-1 overflow-y-auto pt-1">
                {savedLoadouts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-obsidian-800/60"
                  >
                    <button
                      type="button"
                      onClick={() => onChangePreset(item.preset)}
                      className="truncate text-left text-slate-200 hover:text-white"
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

        {/* Offensive Modifiers */}
        <div className="rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Offensive Modifiers
          </div>
          <div className="divide-y divide-obsidian-800/60">
            <SliderControl
              label="Weapon Attack (Mods + Calib)"
              value={preset.weaponAttackBonusPct}
              min={0}
              max={120}
              onChange={(v) => updateField('weaponAttackBonusPct', v)}
            />
            <SliderControl
              label="Elemental & Status DMG"
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
              label="Weakspot Hit Ratio"
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

        {/* Sets, Buffs & Handling */}
        <div className="rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Sets, Buffs & Handling
          </div>
          <div className="divide-y divide-obsidian-800/60">
            <SliderControl
              label="Armor Set Multiplier"
              value={preset.armorSetBonusPct}
              min={0}
              max={80}
              onChange={(v) => updateField('armorSetBonusPct', v)}
            />
            <SliderControl
              label="Cradle + Food + Deviant Buff"
              value={preset.cradleAndFoodBonusPct}
              min={0}
              max={90}
              onChange={(v) => updateField('cradleAndFoodBonusPct', v)}
            />
            <SliderControl
              label="Enemy Vulnerability"
              value={preset.vulnerableEnemyBonusPct}
              min={0}
              max={60}
              onChange={(v) => updateField('vulnerableEnemyBonusPct', v)}
            />
            <SliderControl
              label="Magazine Capacity"
              value={preset.magSizeBonusPct}
              min={0}
              max={80}
              onChange={(v) => updateField('magSizeBonusPct', v)}
            />
            <SliderControl
              label="Fire Rate"
              value={preset.fireRateBonusPct}
              min={0}
              max={50}
              onChange={(v) => updateField('fireRateBonusPct', v)}
            />
            <SliderControl
              label="Reload Speed"
              value={preset.reloadSpeedBonusPct}
              min={0}
              max={80}
              onChange={(v) => updateField('reloadSpeedBonusPct', v)}
            />
            <SliderControl
              label="Archetype Proc Multiplier"
              value={preset.archetypeProcMultiplier}
              min={1}
              max={2.2}
              step={0.05}
              suffix="x"
              onChange={(v) => updateField('archetypeProcMultiplier', v)}
            />
          </div>
        </div>
      </div>

      <WeaponDetailModal
        weapon={inspectOpen ? weapon : null}
        onClose={() => setInspectOpen(false)}
      />
    </div>
  );
}

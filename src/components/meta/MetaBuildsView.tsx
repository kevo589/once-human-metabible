import { useMemo, useState } from 'react';
import { ArrowUpRight, Shield, Sparkles, Utensils } from 'lucide-react';
import { META_BUILDS } from '../../data/buildsAndTimers';
import { DEVIATIONS, RECIPES } from '../../data/deviationsAndChef';
import { WEAPONS } from '../../data/weapons';
import type { Archetype, MetaBuild, ScenarioId } from '../../types/game';
import { calculateDps } from '../../utils/dpsCalculator';
import { ArchetypeBadge, Pill } from '../common/Badge';

interface MetaBuildsViewProps {
  onLoadInCalculator: (build: MetaBuild) => void;
}

const ARCHETYPES: Array<'All' | Archetype> = [
  'All',
  'Shrapnel',
  'Frost Vortex',
  'Power Surge',
  'Unstable Bomber',
  'Burn',
  "Bull's Eye",
];

export function MetaBuildsView({ onLoadInCalculator }: MetaBuildsViewProps) {
  const [archetypeFilter, setArchetypeFilter] = useState<'All' | Archetype>('All');
  const [scenarioFilter, setScenarioFilter] = useState<'all' | ScenarioId>('all');

  const filtered = useMemo(() => {
    return META_BUILDS.filter((b) => {
      if (archetypeFilter !== 'All' && b.archetype !== archetypeFilter) return false;
      if (scenarioFilter !== 'all' && !b.scenarioFit.includes(scenarioFilter)) return false;
      return true;
    });
  }, [archetypeFilter, scenarioFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-obsidian-700/80 pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Curated Meta Builds</h1>
          <p className="mt-1 text-sm text-slate-400">
            Endgame loadouts across Manibus, Way of Winter, and Isles of Abyss. Click any build to simulate or tweak its math.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value as 'all' | ScenarioId)}
            className="rounded-lg border border-obsidian-700 bg-obsidian-900 px-3 py-1.5 text-xs text-slate-200 outline-none"
          >
            <option value="all">All Scenarios</option>
            <option value="manibus">Manibus</option>
            <option value="way_of_winter">Way of Winter</option>
            <option value="isles_of_abyss">Isles of Abyss</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ARCHETYPES.map((arch) => (
          <button
            key={arch}
            type="button"
            onClick={() => setArchetypeFilter(arch)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              archetypeFilter === arch
                ? 'border-stardust-400/50 bg-stardust-500/15 text-stardust-glow'
                : 'border-obsidian-700 bg-obsidian-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {arch}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((build) => {
          const primary = WEAPONS.find((w) => w.id === build.weaponId) ?? WEAPONS[0];
          const secondary = WEAPONS.find((w) => w.id === build.secondaryWeaponId);
          const deviation = DEVIATIONS.find((d) => d.id === build.deviationId);
          const food = RECIPES.find((r) => r.id === build.foodBuffId);
          const sim = calculateDps(primary, build.preset);

          return (
            <article
              key={build.id}
              className="flex flex-col justify-between rounded-xl border border-obsidian-700 bg-obsidian-900 p-5 transition hover:border-stardust-400/40"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                        Tier {build.tier}
                      </span>
                      <ArchetypeBadge archetype={build.archetype} />
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-white">{build.name}</h2>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Est. Sustained</div>
                    <div className="font-mono text-lg font-bold text-stardust-glow">
                      {sim.sustainedDps.toLocaleString()} DPS
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-300">{build.playstyleNotes}</p>

                <div className="mt-4 space-y-2 rounded-lg border border-obsidian-800 bg-obsidian-950/70 p-3 text-xs">
                  <div>
                    <span className="text-slate-500">Weapons:</span>{' '}
                    <span className="font-medium text-white">{primary.name}</span>
                    {secondary && <span className="text-slate-400"> + {secondary.name}</span>}
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stardust-400" />
                    <span className="text-slate-300">{build.armorSetup}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                    <span className="text-slate-300">
                      Deviation: <strong className="text-white">{deviation?.name ?? build.deviationId}</strong>
                    </span>
                  </div>
                  {food && (
                    <div className="flex items-start gap-1.5">
                      <Utensils className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="text-slate-300">Food: {food.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {build.keyMods.map((mod) => (
                    <Pill key={mod}>{mod}</Pill>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {build.cradleOverrides.map((cradle) => (
                    <span
                      key={cradle}
                      className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[11px] text-cyan-200/80"
                    >
                      {cradle}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-obsidian-800 pt-3">
                <div className="flex gap-1.5 text-[11px] text-slate-500">
                  {build.scenarioFit.map((s) => (
                    <span key={s} className="rounded bg-obsidian-800 px-1.5 py-0.5">
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onLoadInCalculator(build)}
                  className="inline-flex items-center gap-1 rounded-lg bg-stardust-500 px-3 py-1.5 text-xs font-semibold text-obsidian-950 transition hover:bg-stardust-400"
                >
                  Open in Calculator
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

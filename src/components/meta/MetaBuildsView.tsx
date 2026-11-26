import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { META_BUILDS } from '../../data/buildsAndTimers';
import { DEVIATIONS, RECIPES } from '../../data/deviationsAndChef';
import { WEAPONS } from '../../data/weapons';
import type { Archetype, MetaBuild, ScenarioId } from '../../types/game';
import { calculateDps } from '../../utils/dpsCalculator';
import { ArchetypeBadge } from '../common/Badge';
import { EntityThumbnail } from '../common/ItemVisuals';
import { WeaponThumbnail } from '../weapons/WeaponVisuals';

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
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold text-white">Meta Builds</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Endgame loadouts across Manibus, Way of Winter, and Isles of Abyss.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={archetypeFilter}
            onChange={(e) => setArchetypeFilter(e.target.value as 'All' | Archetype)}
            className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none"
          >
            {ARCHETYPES.map((arch) => (
              <option key={arch} value={arch}>
                {arch === 'All' ? 'All Archetypes' : arch}
              </option>
            ))}
          </select>

          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value as 'all' | ScenarioId)}
            className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none"
          >
            <option value="all">All Scenarios</option>
            <option value="manibus">Manibus</option>
            <option value="way_of_winter">Way of Winter</option>
            <option value="isles_of_abyss">Isles of Abyss</option>
          </select>
        </div>
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
              className="flex flex-col justify-between rounded-xl border border-obsidian-800 bg-obsidian-900/70 p-5 transition hover:border-obsidian-700"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-amber-300/90">
                        Tier {build.tier}
                      </span>
                      <ArchetypeBadge archetype={build.archetype} />
                    </div>
                    <h2 className="mt-1.5 text-base font-semibold text-white">{build.name}</h2>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Est. Sustained</div>
                    <div className="font-mono text-base font-semibold text-stardust-400">
                      {sim.sustainedDps.toLocaleString()} DPS
                    </div>
                  </div>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-slate-400">{build.playstyleNotes}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-obsidian-800/80 bg-obsidian-950/60 p-3">
                  <div className="flex items-center gap-2.5">
                    <WeaponThumbnail weapon={primary} size="sm" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Primary</div>
                      <div className="text-xs font-medium text-white">{primary.name}</div>
                    </div>
                  </div>
                  {secondary && (
                    <div className="flex items-center gap-2.5 border-l border-obsidian-800 pl-3">
                      <WeaponThumbnail weapon={secondary} size="sm" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Secondary</div>
                        <div className="text-xs text-slate-300">{secondary.name}</div>
                      </div>
                    </div>
                  )}
                  {deviation && (
                    <div className="flex items-center gap-2.5 border-l border-obsidian-800 pl-3">
                      <EntityThumbnail src={deviation.imageUrl} alt={deviation.name} rarity={deviation.rarity} size="sm" fallbackKind="deviation" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Deviation</div>
                        <div className="text-xs text-slate-300">{deviation.name}</div>
                      </div>
                    </div>
                  )}
                </div>

                <dl className="mt-3.5 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-slate-500">Armor</dt>
                    <dd className="text-slate-300">{build.armorSetup}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-slate-500">Mods</dt>
                    <dd className="text-slate-300">{build.keyMods.join(' · ')}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-slate-500">Deviation</dt>
                    <dd className="text-slate-300">{deviation?.name ?? build.deviationId}</dd>
                  </div>
                  {food && (
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-slate-500">Food</dt>
                      <dd className="text-slate-300">{food.name}</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-slate-500">Cradle</dt>
                    <dd className="text-slate-400">{build.cradleOverrides.join(' · ')}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-obsidian-800 pt-3">
                <span className="text-[11px] text-slate-500">
                  {build.scenarioFit.map((s) => s.replace(/_/g, ' ')).join(' · ')}
                </span>
                <button
                  type="button"
                  onClick={() => onLoadInCalculator(build)}
                  className="inline-flex items-center gap-1 rounded-lg border border-obsidian-700 bg-obsidian-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-obsidian-700"
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

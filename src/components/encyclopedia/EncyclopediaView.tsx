import { useMemo, useState } from 'react';
import { Award, ChefHat, Cpu, Crosshair, Shield, Skull, Sparkles } from 'lucide-react';
import { DEVIATIONS, RECIPES } from '../../data/deviationsAndChef';
import { ARMOR_SETS, MODS } from '../../data/gearAndMods';
import { CLASS_SPECS, ENCOUNTERS } from '../../data/mapsAndEncounters';
import { WEAPONS } from '../../data/weapons';
import type { EncyclopediaSubTab, Rarity, Weapon } from '../../types/game';
import { cn } from '../../utils/cn';
import { ArchetypeBadge, Pill, RARITY_LEFT_BORDER, RarityBadge } from '../common/Badge';
import { WeaponDetailModal, WeaponThumbnail } from '../weapons/WeaponVisuals';

interface EncyclopediaViewProps {
  subTab: EncyclopediaSubTab;
  onChangeSubTab: (tab: EncyclopediaSubTab) => void;
  highlightedId?: string | null;
  onSimulateWeapon?: (weapon: Weapon) => void;
}

const SUB_TABS: Array<{ id: EncyclopediaSubTab; label: string; icon: typeof Crosshair }> = [
  { id: 'weapons', label: `Weapons (${WEAPONS.length})`, icon: Crosshair },
  { id: 'armor', label: 'Armor Sets', icon: Shield },
  { id: 'mods', label: 'Mods', icon: Cpu },
  { id: 'deviations', label: 'Deviations', icon: Sparkles },
  { id: 'chef', label: 'Chef & Brews', icon: ChefHat },
  { id: 'encounters', label: 'Encounters', icon: Skull },
  { id: 'classes', label: 'Specializations', icon: Award },
];

const WEAPON_CATEGORIES: Array<'All' | Weapon['category']> = [
  'All',
  'Assault Rifle',
  'SMG',
  'Sniper Rifle',
  'Shotgun',
  'LMG',
  'Pistol',
  'Crossbow',
  'Melee',
  'Flamethrower',
  'Rocket Launcher',
];

const WEAPON_RARITIES: Array<'All' | Rarity> = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

export function EncyclopediaView({
  subTab,
  onChangeSubTab,
  highlightedId,
  onSimulateWeapon,
}: EncyclopediaViewProps) {
  const [filterText, setFilterText] = useState('');
  const [weaponCategory, setWeaponCategory] = useState<'All' | Weapon['category']>('All');
  const [weaponRarity, setWeaponRarity] = useState<'All' | Rarity>('All');
  const [inspectedWeapon, setInspectedWeapon] = useState<Weapon | null>(null);

  const q = filterText.trim().toLowerCase();

  const filteredWeapons = useMemo(
    () =>
      WEAPONS.filter((w) => {
        if (weaponCategory !== 'All' && w.category !== weaponCategory) return false;
        if (weaponRarity !== 'All' && w.rarity !== weaponRarity) return false;
        if (
          q &&
          !w.name.toLowerCase().includes(q) &&
          !w.archetype.toLowerCase().includes(q) &&
          !w.category.toLowerCase().includes(q) &&
          !w.ammoType.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      }),
    [q, weaponCategory, weaponRarity],
  );

  const filteredArmor = useMemo(
    () =>
      ARMOR_SETS.filter(
        (a) =>
          !q ||
          a.name.toLowerCase().includes(q) ||
          a.effectSummary.toLowerCase().includes(q) ||
          a.archetypes.some((t) => t.toLowerCase().includes(q)),
      ),
    [q],
  );

  const filteredMods = useMemo(
    () =>
      MODS.filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.slot.toLowerCase().includes(q) ||
          m.primaryEffect.toLowerCase().includes(q),
      ),
    [q],
  );

  const filteredDeviations = useMemo(
    () =>
      DEVIATIONS.filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.skillSummary.toLowerCase().includes(q),
      ),
    [q],
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-obsidian-700/80 pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">MetaBible Encyclopedia</h1>
          <p className="mt-1 text-sm text-slate-400">
            Complete Once Human database with weapon visuals, armor sets, mods, Deviations, Chef recipes, bosses, and Specializations.
          </p>
        </div>

        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter current category..."
          className="w-full rounded-lg border border-obsidian-700 bg-obsidian-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-stardust-400 md:w-72"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                active
                  ? 'border-stardust-400/50 bg-stardust-500/15 text-stardust-glow'
                  : 'border-obsidian-700 bg-obsidian-900 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {subTab === 'weapons' && (
        <div className="space-y-4">
          {/* Category & Rarity Filter Bars */}
          <div className="space-y-2 rounded-xl border border-obsidian-800 bg-obsidian-900/70 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type:</span>
              {WEAPON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setWeaponCategory(cat)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-[11px] font-medium transition',
                    weaponCategory === cat
                      ? 'border-stardust-400/50 bg-stardust-500/15 text-stardust-glow'
                      : 'border-obsidian-700 bg-obsidian-950 text-slate-400 hover:text-white',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rarity:</span>
                {WEAPON_RARITIES.map((rar) => (
                  <button
                    key={rar}
                    type="button"
                    onClick={() => setWeaponRarity(rar)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[11px] font-medium transition',
                      weaponRarity === rar
                        ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                        : 'border-obsidian-700 bg-obsidian-950 text-slate-400 hover:text-white',
                    )}
                  >
                    {rar}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                Showing {filteredWeapons.length} of {WEAPONS.length} weapons (click card to inspect)
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredWeapons.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setInspectedWeapon(w)}
                className={cn(
                  'group flex items-center gap-3.5 rounded-xl border border-l-2 bg-obsidian-900 p-3.5 text-left transition hover:bg-obsidian-850',
                  RARITY_LEFT_BORDER[w.rarity],
                  highlightedId === w.id ? 'border-stardust-400 ring-1 ring-stardust-400/40' : 'border-obsidian-700',
                )}
              >
                <WeaponThumbnail weapon={w} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-bold text-white group-hover:text-stardust-glow">
                      {w.name}
                    </h3>
                    <RarityBadge rarity={w.rarity} />
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded border border-obsidian-700 bg-obsidian-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                      {w.category}
                    </span>
                    {w.archetype !== 'Standard' && <ArchetypeBadge archetype={w.archetype} />}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-slate-400">
                    <span><strong className="text-amber-300">{w.baseDamage}</strong> DMG</span>
                    <span><strong className="text-cyan-300">{w.fireRateRpm}</strong> RPM</span>
                    <span>MAG <strong className="text-slate-200">{w.magSize}</strong></span>
                    <span className="truncate text-slate-500">{w.ammoType}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {subTab === 'armor' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredArmor.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border bg-obsidian-900 p-4 ${
                highlightedId === a.id ? 'border-stardust-400 ring-1 ring-stardust-400/40' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">{a.name}</h3>
                <div className="flex items-center gap-1.5">
                  <RarityBadge rarity={a.rarity} />
                  <Pill>{a.isKeyPiece ? `Key ${a.slot}` : 'Armor Set'}</Pill>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300">{a.effectSummary}</p>
              {(a.twoPieceBonus || a.threePieceBonus || a.fourPieceBonus) && (
                <ul className="mt-3 space-y-1 rounded-lg border border-obsidian-800 bg-obsidian-950 p-2.5 text-xs text-slate-300">
                  {a.twoPieceBonus && <li><strong className="text-stardust-400">2pc:</strong> {a.twoPieceBonus}</li>}
                  {a.threePieceBonus && <li><strong className="text-stardust-400">3pc:</strong> {a.threePieceBonus}</li>}
                  {a.fourPieceBonus && <li><strong className="text-stardust-400">4pc:</strong> {a.fourPieceBonus}</li>}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.archetypes.map((arch) => (
                  <ArchetypeBadge key={arch} archetype={arch} />
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Source: {a.source}</div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'mods' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMods.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border bg-obsidian-900 p-4 ${
                highlightedId === m.id ? 'border-stardust-400 ring-1 ring-stardust-400/40' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">{m.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Pill>{m.slot} Slot</Pill>
                  <Pill>{m.archetype}</Pill>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300">{m.primaryEffect}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">Target Substats:</span>
                {m.recommendedSubstats.map((s) => (
                  <span key={s} className="rounded bg-obsidian-800 px-2 py-0.5 text-cyan-300">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Farm: {m.dropSource}</div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'deviations' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDeviations.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border bg-obsidian-900 p-4 ${
                highlightedId === d.id ? 'border-stardust-400 ring-1 ring-stardust-400/40' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">{d.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Pill>{d.type}</Pill>
                  <Pill>{d.element}</Pill>
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-stardust-400">Skill: {d.skillName}</div>
              <p className="mt-1 text-xs text-slate-300">{d.skillSummary}</p>
              <div className="mt-3 rounded-lg border border-obsidian-800 bg-obsidian-950 p-2 text-[11px] text-slate-400">
                <div><strong className="text-slate-300">Containment Mood:</strong> {d.moodRequirement}</div>
                <div className="mt-0.5"><strong className="text-slate-300">Drop Source:</strong> {d.dropSource}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'chef' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRecipes.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border bg-obsidian-900 p-4 ${
                highlightedId === r.id ? 'border-stardust-400 ring-1 ring-stardust-400/40' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">{r.name}</h3>
                <div className="flex items-center gap-1.5">
                  <RarityBadge rarity={r.rarity} />
                  <Pill>{r.durationMinutes}m</Pill>
                </div>
              </div>
              <div className="mt-1 text-[11px] text-amber-300">{r.category} • {r.station}</div>
              <p className="mt-2 text-xs text-slate-300">{r.effects}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.ingredients.map((ing) => (
                  <Pill key={ing}>{ing}</Pill>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'encounters' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEncounters.map((e) => (
            <div
              key={e.id}
              className={`rounded-xl border bg-obsidian-900 p-4 ${
                highlightedId === e.id ? 'border-stardust-400 ring-1 ring-stardust-400/40' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">{e.name}</h3>
                <Pill>Lv {e.recommendedLevel} • {e.type}</Pill>
              </div>
              <div className="mt-1 text-[11px] text-emerald-300">Recommended Element: {e.weakElement}</div>
              <p className="mt-2 text-xs text-slate-300">{e.mechanicsSummary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.keyDrops.map((drop) => (
                  <Pill key={drop}>{drop}</Pill>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'classes' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSpecs.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border bg-obsidian-900 p-4 ${
                highlightedId === s.id ? 'border-stardust-400 ring-1 ring-stardust-400/40' : 'border-obsidian-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">{s.name}</h3>
                <Pill>Unlock Lv {s.tierLevel} • {s.category}</Pill>
              </div>
              <p className="mt-2 text-xs text-slate-300">{s.description}</p>
              <div className="mt-2 rounded-lg border border-obsidian-800 bg-obsidian-950 p-2 text-[11px] text-stardust-400">
                Synergy: {s.synergyNotes}
              </div>
            </div>
          ))}
        </div>
      )}

      <WeaponDetailModal
        weapon={inspectedWeapon}
        onClose={() => setInspectedWeapon(null)}
        onSimulate={onSimulateWeapon}
      />
    </div>
  );
}

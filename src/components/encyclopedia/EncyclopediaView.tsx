import { useMemo, useState } from 'react';
import { Award, ChefHat, Cpu, Crosshair, Shield, Skull, Sparkles } from 'lucide-react';
import { DEVIATIONS, RECIPES } from '../../data/deviationsAndChef';
import { ARMOR_SETS, MODS } from '../../data/gearAndMods';
import { CLASS_SPECS, ENCOUNTERS } from '../../data/mapsAndEncounters';
import { WEAPONS } from '../../data/weapons';
import type { EncyclopediaSubTab, Rarity, Weapon } from '../../types/game';
import { cn } from '../../utils/cn';
import { Pill, RARITY_LEFT_BORDER, RARITY_TEXT, RarityBadge } from '../common/Badge';
import { WeaponDetailModal, WeaponThumbnail } from '../weapons/WeaponVisuals';

interface EncyclopediaViewProps {
  subTab: EncyclopediaSubTab;
  onChangeSubTab: (tab: EncyclopediaSubTab) => void;
  highlightedId?: string | null;
  onSimulateWeapon?: (weapon: Weapon) => void;
}

const SUB_TABS: Array<{ id: EncyclopediaSubTab; label: string; icon: typeof Crosshair }> = [
  { id: 'weapons', label: `Weapons (${WEAPONS.length})`, icon: Crosshair },
  { id: 'armor', label: 'Armor', icon: Shield },
  { id: 'mods', label: 'Mods', icon: Cpu },
  { id: 'deviations', label: 'Deviations', icon: Sparkles },
  { id: 'chef', label: 'Chef', icon: ChefHat },
  { id: 'encounters', label: 'Encounters', icon: Skull },
  { id: 'classes', label: 'Specs', icon: Award },
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
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold text-white">Encyclopedia</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Weapons, armor sets, mods, Deviations, recipes, encounters, and specializations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subTab === 'weapons' && (
            <>
              <select
                value={weaponCategory}
                onChange={(e) => setWeaponCategory(e.target.value as 'All' | Weapon['category'])}
                className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-obsidian-600"
              >
                {WEAPON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Types' : cat}
                  </option>
                ))}
              </select>

              <select
                value={weaponRarity}
                onChange={(e) => setWeaponRarity(e.target.value as 'All' | Rarity)}
                className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-obsidian-600"
              >
                {WEAPON_RARITIES.map((rar) => (
                  <option key={rar} value={rar}>
                    {rar === 'All' ? 'All Rarities' : rar}
                  </option>
                ))}
              </select>
            </>
          )}

          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter..."
            className="w-44 rounded-lg border border-obsidian-800 bg-obsidian-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-obsidian-600 sm:w-56"
          />
        </div>
      </div>

      {/* Sub-navigation strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
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

        {subTab === 'weapons' && (
          <span className="font-mono text-[11px] text-slate-500">
            {filteredWeapons.length} / {WEAPONS.length}
          </span>
        )}
      </div>

      {subTab === 'weapons' && (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredWeapons.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setInspectedWeapon(w)}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-l-2 bg-obsidian-900/70 px-3.5 py-3 text-left transition hover:bg-obsidian-850',
                RARITY_LEFT_BORDER[w.rarity],
                highlightedId === w.id ? 'border-stardust-400/60 ring-1 ring-stardust-400/30' : 'border-obsidian-800',
              )}
            >
              <WeaponThumbnail weapon={w} size="sm" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-medium text-slate-100 group-hover:text-white">
                    {w.name}
                  </h3>
                  <span className={cn('shrink-0 text-[10px] font-medium uppercase tracking-wider', RARITY_TEXT[w.rarity])}>
                    {w.rarity}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 truncate text-[11px] text-slate-400">
                  <span>{w.category}</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono">{w.baseDamage} DMG</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono">{w.fireRateRpm} RPM</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {subTab === 'armor' && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredArmor.map((a) => (
            <div
              key={a.id}
              className={cn(
                'rounded-xl border bg-obsidian-900/70 p-4',
                highlightedId === a.id ? 'border-stardust-400/60' : 'border-obsidian-800',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{a.name}</h3>
                <div className="flex items-center gap-1.5">
                  <RarityBadge rarity={a.rarity} />
                  <Pill>{a.isKeyPiece ? `Key ${a.slot}` : 'Set'}</Pill>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300">{a.effectSummary}</p>
              {(a.twoPieceBonus || a.threePieceBonus || a.fourPieceBonus) && (
                <ul className="mt-2.5 space-y-1 border-t border-obsidian-800 pt-2.5 text-xs text-slate-400">
                  {a.twoPieceBonus && <li><strong className="text-slate-200">2pc:</strong> {a.twoPieceBonus}</li>}
                  {a.threePieceBonus && <li><strong className="text-slate-200">3pc:</strong> {a.threePieceBonus}</li>}
                  {a.fourPieceBonus && <li><strong className="text-slate-200">4pc:</strong> {a.fourPieceBonus}</li>}
                </ul>
              )}
              <div className="mt-2.5 text-[11px] text-slate-500">{a.source}</div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'mods' && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredMods.map((m) => (
            <div
              key={m.id}
              className={cn(
                'rounded-xl border bg-obsidian-900/70 p-4',
                highlightedId === m.id ? 'border-stardust-400/60' : 'border-obsidian-800',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Pill>{m.slot}</Pill>
                  <Pill>{m.archetype}</Pill>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300">{m.primaryEffect}</p>
              <div className="mt-2.5 text-[11px] text-slate-400">
                Substats: <span className="text-slate-200">{m.recommendedSubstats.join(' · ')}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{m.dropSource}</div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'deviations' && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredDeviations.map((d) => (
            <div
              key={d.id}
              className={cn(
                'rounded-xl border bg-obsidian-900/70 p-4',
                highlightedId === d.id ? 'border-stardust-400/60' : 'border-obsidian-800',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{d.name}</h3>
                <Pill>{d.type} · {d.element}</Pill>
              </div>
              <div className="mt-1.5 text-xs font-medium text-slate-200">{d.skillName}</div>
              <p className="mt-1 text-xs text-slate-400">{d.skillSummary}</p>
              <div className="mt-2.5 border-t border-obsidian-800 pt-2 text-[11px] text-slate-500">
                Mood: {d.moodRequirement} · {d.dropSource}
              </div>
            </div>
          ))}
        </div>
      )}

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

      <WeaponDetailModal
        weapon={inspectedWeapon}
        onClose={() => setInspectedWeapon(null)}
        onSimulate={onSimulateWeapon}
      />
    </div>
  );
}

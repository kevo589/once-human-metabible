import { useMemo, useState } from 'react';
import { Award, ChefHat, Cpu, Crosshair, Shield, Skull, Sparkles } from 'lucide-react';
import { DEVIATIONS, RECIPES } from '../../data/deviationsAndChef';
import { ARMOR_SETS, MODS } from '../../data/gearAndMods';
import { CLASS_SPECS, ENCOUNTERS } from '../../data/mapsAndEncounters';
import { WEAPONS } from '../../data/weapons';
import type { ArmorSet, Deviation, EncyclopediaSubTab, ModItem, Rarity, Weapon } from '../../types/game';
import { cn } from '../../utils/cn';
import { Pill, RARITY_LEFT_BORDER, RARITY_TEXT, RarityBadge } from '../common/Badge';
import { EntityDetailModal, EntityThumbnail, type InspectedEntity } from '../common/ItemVisuals';
import { WeaponDetailModal, WeaponThumbnail } from '../weapons/WeaponVisuals';

interface EncyclopediaViewProps {
  subTab: EncyclopediaSubTab;
  onChangeSubTab: (tab: EncyclopediaSubTab) => void;
  highlightedId?: string | null;
  onSimulateWeapon?: (weapon: Weapon) => void;
}

const SUB_TABS: Array<{ id: EncyclopediaSubTab; label: string; icon: typeof Crosshair }> = [
  { id: 'weapons', label: `Weapons (${WEAPONS.length})`, icon: Crosshair },
  { id: 'armor', label: `Armor (${ARMOR_SETS.length})`, icon: Shield },
  { id: 'mods', label: `Mods (${MODS.length})`, icon: Cpu },
  { id: 'deviations', label: `Deviations (${DEVIATIONS.length})`, icon: Sparkles },
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

const ARMOR_SLOTS: Array<'All' | ArmorSet['slot']> = ['All', 'Helmet', 'Mask', 'Top', 'Bottom', 'Gloves', 'Shoes'];
const MOD_SLOTS: Array<'All' | ModItem['slot']> = ['All', 'Weapon', 'Helmet', 'Mask', 'Top', 'Bottom', 'Gloves', 'Shoes'];
const DEV_TYPES: Array<'All' | Deviation['type']> = ['All', 'Combat', 'Territory', 'Crafting'];
const RARITIES: Array<'All' | Rarity> = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

export function EncyclopediaView({
  subTab,
  onChangeSubTab,
  highlightedId,
  onSimulateWeapon,
}: EncyclopediaViewProps) {
  const [filterText, setFilterText] = useState('');
  const [weaponCategory, setWeaponCategory] = useState<'All' | Weapon['category']>('All');
  const [armorSlot, setArmorSlot] = useState<'All' | ArmorSet['slot']>('All');
  const [modSlot, setModSlot] = useState<'All' | ModItem['slot']>('All');
  const [devType, setDevType] = useState<'All' | Deviation['type']>('All');
  const [rarityFilter, setRarityFilter] = useState<'All' | Rarity>('All');

  const [inspectedWeapon, setInspectedWeapon] = useState<Weapon | null>(null);
  const [inspectedEntity, setInspectedEntity] = useState<InspectedEntity | null>(null);

  const q = filterText.trim().toLowerCase();

  const filteredWeapons = useMemo(
    () =>
      WEAPONS.filter((w) => {
        if (weaponCategory !== 'All' && w.category !== weaponCategory) return false;
        if (rarityFilter !== 'All' && w.rarity !== rarityFilter) return false;
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
    [q, weaponCategory, rarityFilter],
  );

  const filteredArmor = useMemo(
    () =>
      ARMOR_SETS.filter((a) => {
        if (armorSlot !== 'All' && a.slot !== armorSlot) return false;
        if (rarityFilter !== 'All' && a.rarity !== rarityFilter) return false;
        if (
          q &&
          !a.name.toLowerCase().includes(q) &&
          !(a.setName ?? '').toLowerCase().includes(q) &&
          !a.effectSummary.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      }),
    [q, armorSlot, rarityFilter],
  );

  const filteredMods = useMemo(
    () =>
      MODS.filter((m) => {
        if (modSlot !== 'All' && m.slot !== modSlot) return false;
        if (rarityFilter !== 'All' && m.rarity !== rarityFilter) return false;
        if (
          q &&
          !m.name.toLowerCase().includes(q) &&
          !m.slot.toLowerCase().includes(q) &&
          !m.primaryEffect.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      }),
    [q, modSlot, rarityFilter],
  );

  const filteredDeviations = useMemo(
    () =>
      DEVIATIONS.filter((d) => {
        if (devType !== 'All' && d.type !== devType) return false;
        if (rarityFilter !== 'All' && d.rarity !== rarityFilter) return false;
        if (
          q &&
          !d.name.toLowerCase().includes(q) &&
          !d.type.toLowerCase().includes(q) &&
          !d.skillSummary.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      }),
    [q, devType, rarityFilter],
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

  const showingCount =
    subTab === 'weapons'
      ? `${filteredWeapons.length} / ${WEAPONS.length}`
      : subTab === 'armor'
        ? `${filteredArmor.length} / ${ARMOR_SETS.length}`
        : subTab === 'mods'
          ? `${filteredMods.length} / ${MODS.length}`
          : subTab === 'deviations'
            ? `${filteredDeviations.length} / ${DEVIATIONS.length}`
            : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold text-white">Encyclopedia</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Weapons, armor, mods, Deviations, recipes, encounters, and specializations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subTab === 'weapons' && (
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
          )}

          {subTab === 'armor' && (
            <select
              value={armorSlot}
              onChange={(e) => setArmorSlot(e.target.value as 'All' | ArmorSet['slot'])}
              className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-obsidian-600"
            >
              {ARMOR_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Slots' : s}
                </option>
              ))}
            </select>
          )}

          {subTab === 'mods' && (
            <select
              value={modSlot}
              onChange={(e) => setModSlot(e.target.value as 'All' | ModItem['slot'])}
              className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-obsidian-600"
            >
              {MOD_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Slots' : s}
                </option>
              ))}
            </select>
          )}

          {subTab === 'deviations' && (
            <select
              value={devType}
              onChange={(e) => setDevType(e.target.value as 'All' | Deviation['type'])}
              className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-obsidian-600"
            >
              {DEV_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Types' : t}
                </option>
              ))}
            </select>
          )}

          {(subTab === 'weapons' || subTab === 'armor' || subTab === 'mods' || subTab === 'deviations') && (
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value as 'All' | Rarity)}
              className="rounded-lg border border-obsidian-800 bg-obsidian-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-obsidian-600"
            >
              {RARITIES.map((rar) => (
                <option key={rar} value={rar}>
                  {rar === 'All' ? 'All Rarities' : rar}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter..."
            className="w-44 rounded-lg border border-obsidian-800 bg-obsidian-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-obsidian-600 sm:w-52"
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

        {showingCount && <span className="font-mono text-[11px] text-slate-500">{showingCount}</span>}
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
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredArmor.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setInspectedEntity({ kind: 'armor', item: a })}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-l-2 bg-obsidian-900/70 px-3.5 py-3 text-left transition hover:bg-obsidian-850',
                RARITY_LEFT_BORDER[a.rarity],
                highlightedId === a.id ? 'border-stardust-400/60 ring-1 ring-stardust-400/30' : 'border-obsidian-800',
              )}
            >
              <EntityThumbnail src={a.imageUrl} alt={a.name} rarity={a.rarity} size="md" fallbackKind="armor" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-medium text-slate-100 group-hover:text-white">
                    {a.name}
                  </h3>
                  <span className={cn('shrink-0 text-[10px] font-medium uppercase tracking-wider', RARITY_TEXT[a.rarity])}>
                    {a.rarity}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 truncate text-[11px] text-slate-400">
                  <span>{a.slot}</span>
                  {a.hp > 0 && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono">{a.hp} HP</span>
                    </>
                  )}
                  {a.setName && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="truncate text-slate-500">{a.setName}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {subTab === 'mods' && (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredMods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setInspectedEntity({ kind: 'mod', item: m })}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-l-2 bg-obsidian-900/70 px-3.5 py-3 text-left transition hover:bg-obsidian-850',
                RARITY_LEFT_BORDER[m.rarity],
                highlightedId === m.id ? 'border-stardust-400/60 ring-1 ring-stardust-400/30' : 'border-obsidian-800',
              )}
            >
              <EntityThumbnail src={m.imageUrl} alt={m.name} rarity={m.rarity} size="md" fallbackKind="mod" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-medium text-slate-100 group-hover:text-white">
                    {m.name}
                  </h3>
                  <span className={cn('shrink-0 text-[10px] font-medium uppercase tracking-wider', RARITY_TEXT[m.rarity])}>
                    {m.rarity}
                  </span>
                </div>

                <div className="mt-1 truncate text-[11px] text-slate-400">
                  {m.slot} Mod · {m.primaryEffect}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {subTab === 'deviations' && (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDeviations.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setInspectedEntity({ kind: 'deviation', item: d })}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-l-2 bg-obsidian-900/70 px-3.5 py-3 text-left transition hover:bg-obsidian-850',
                RARITY_LEFT_BORDER[d.rarity],
                highlightedId === d.id ? 'border-stardust-400/60 ring-1 ring-stardust-400/30' : 'border-obsidian-800',
              )}
            >
              <EntityThumbnail src={d.imageUrl} alt={d.name} rarity={d.rarity} size="md" fallbackKind="deviation" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-medium text-slate-100 group-hover:text-white">
                    {d.name}
                  </h3>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {d.type}
                  </span>
                </div>

                <div className="mt-1 truncate text-[11px] text-slate-400">
                  {d.element} · {d.skillSummary}
                </div>
              </div>
            </button>
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

      <EntityDetailModal
        entity={inspectedEntity}
        onClose={() => setInspectedEntity(null)}
      />
    </div>
  );
}

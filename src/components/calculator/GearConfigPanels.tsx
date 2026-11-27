import { Check, Crosshair, Flame, Shield, Sparkles, Utensils } from 'lucide-react';
import {
  computeArmorRating,
  computeWeaponRating,
  DPS_DATA,
  findDeviationImage,
  lookupEquipIcons,
  type ActiveWeaponSlotKey,
  type ArmorSlotConfig,
  type EquipSlotId,
  type LoadoutConfig,
  type WeaponSlotConfig,
} from '../../data/dps/dpsEngine';
import { ARMOR_SETS } from '../../data/gearAndMods';
import { WEAPONS } from '../../data/weapons';
import { HIDES_AND_WOOLS, type ArmorSlotKey } from '../../utils/craftingEngine';
import { BENCH_BP_GRADIENT, MaterialIconGlyph } from '../workbench/MaterialVisuals';

const WEAPON_BY_ID = new Map(WEAPONS.map((w) => [w.id, w]));
const ARMOR_BY_ID = new Map(ARMOR_SETS.map((a) => [a.id, a]));
const HIDE_BY_ID = new Map(HIDES_AND_WOOLS.map((h) => [h.id, h]));

function WeaponEquipCard({
  slotId,
  badgeNumber,
  cfg,
  isActiveDps,
  tall,
  onSelectSlot,
  onSetActiveDps,
}: {
  slotId: 'primary' | 'secondary' | 'melee';
  badgeNumber?: '1' | '2';
  cfg: WeaponSlotConfig;
  isActiveDps?: boolean;
  tall?: boolean;
  onSelectSlot: (slot: EquipSlotId) => void;
  onSetActiveDps?: (slot: ActiveWeaponSlotKey) => void;
}) {
  const weapon = WEAPON_BY_ID.get(cfg.weaponId) ?? WEAPONS[0];
  const rating = computeWeaponRating(cfg, weapon);
  const icons = lookupEquipIcons(cfg, true);
  const grad = BENCH_BP_GRADIENT[weapon.rarity] ?? BENCH_BP_GRADIENT.Common;

  return (
    <div
      onClick={() => onSelectSlot(slotId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectSlot(slotId);
        }
      }}
      className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border p-2.5 text-left transition hover:brightness-110 ${grad} ${
        tall ? 'h-full min-h-[196px]' : 'h-[94px]'
      } ${
        isActiveDps
          ? 'ring-2 ring-[#3ee6c5] shadow-[0_0_20px_rgba(62,230,197,0.22)]'
          : 'hover:border-white/30'
      }`}
    >
      {/* Top Row: Rating + Gold [1]/[2] Badge */}
      <div className="z-10 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-bold leading-none text-white">{rating}</div>
          <div className="mt-0.5 truncate text-[10px] font-medium text-slate-300">
            {weapon.name}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {badgeNumber && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetActiveDps?.(badgeNumber === '1' ? 'primary' : 'secondary');
              }}
              title="Click to test this weapon for DPS"
              className={`flex h-5 w-5 items-center justify-center rounded font-mono text-[11px] font-extrabold transition ${
                isActiveDps
                  ? 'bg-[#3ee6c5] text-[#091214]'
                  : 'bg-[#e5b84b] text-[#1a1304] hover:brightness-110'
              }`}
            >
              {badgeNumber}
            </button>
          )}
          {!badgeNumber && (
            <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-300">
              Melee
            </span>
          )}
        </div>
      </div>

      {/* Centered Weapon Thumbnail */}
      <div
        className={`pointer-events-none flex items-center justify-center ${
          tall ? 'my-auto py-3' : 'absolute inset-0'
        }`}
      >
        {icons.itemImg ? (
          <img
            src={icons.itemImg}
            alt={weapon.name}
            className={`object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover:scale-105 ${
              tall ? 'h-24 w-24' : 'h-16 w-36 translate-x-5 translate-y-1 opacity-95'
            }`}
          />
        ) : (
          <Crosshair className="h-8 w-8 text-slate-500" />
        )}
      </div>

      {/* Bottom Row: Stars, Calibration, Mod Icon */}
      <div className="z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] tracking-tight text-amber-300">
            {'✦'.repeat(cfg.stars)}
          </span>
          <span className="rounded bg-black/55 px-1 py-0.5 font-mono text-[9px] font-bold text-slate-200">
            T{cfg.tier} · +{cfg.calibration}
          </span>
        </div>
        {icons.modImg && (
          <img
            src={icons.modImg}
            alt="Equipped Mod"
            title="Equipped Mod"
            className="h-5 w-5 rounded border border-white/20 bg-black/70 object-contain p-0.5"
          />
        )}
      </div>
    </div>
  );
}

function ArmorEquipCard({
  slotKey,
  label,
  cfg,
  wide,
  onSelectSlot,
}: {
  slotKey: ArmorSlotKey;
  label: string;
  cfg: ArmorSlotConfig;
  wide?: boolean;
  onSelectSlot: (slot: EquipSlotId) => void;
}) {
  const armor = ARMOR_BY_ID.get(cfg.armorId) ?? ARMOR_SETS[0];
  const rating = computeArmorRating(cfg, armor);
  const icons = lookupEquipIcons(cfg, false);
  const hide = HIDE_BY_ID.get(cfg.hideId);
  const grad = BENCH_BP_GRADIENT[armor.rarity] ?? BENCH_BP_GRADIENT.Common;

  return (
    <button
      type="button"
      onClick={() => onSelectSlot(slotKey)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-2.5 text-left transition hover:border-white/35 hover:brightness-110 ${grad} ${
        wide ? 'col-span-2 h-[106px]' : 'col-span-1 h-[102px]'
      }`}
    >
      {/* Top Row: Gear Rating + Slot Tag */}
      <div className="z-10 flex items-start justify-between gap-1">
        <div>
          <div className="font-mono text-sm font-bold leading-none text-white">{rating}</div>
          <div className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hide && (
            <div
              className="flex h-5 w-5 items-center justify-center rounded border border-white/15 bg-black/60 p-0.5"
              title={`Wool/Hide: ${hide.name}`}
            >
              <MaterialIconGlyph name={hide.name} accent="#3ee6c5" className="h-4 w-4" />
            </div>
          )}
          {icons.modImg && (
            <img
              src={icons.modImg}
              alt="Armor Mod"
              title="Equipped Mod"
              className="h-5 w-5 rounded border border-white/20 bg-black/70 object-contain p-0.5"
            />
          )}
        </div>
      </div>

      {/* Centered / Right-Anchored Armor Thumbnail */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {icons.itemImg ? (
          <img
            src={icons.itemImg}
            alt={armor.name}
            className={`object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover:scale-105 ${
              wide ? 'h-20 w-24 translate-x-6' : 'h-14 w-14 translate-x-2 translate-y-1'
            }`}
          />
        ) : (
          <Shield className="h-6 w-6 text-slate-500" />
        )}
      </div>

      {/* Bottom Row: Tier/Stars/Calib + Name */}
      <div className="z-10 space-y-0.5">
        <div className="max-w-full truncate text-[10px] font-medium text-slate-200">
          {armor.name}
        </div>
        <div className="flex items-center gap-1">
          <span className="whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-[#3ee6c5]">
            T{cfg.tier} {cfg.stars}★ +{cfg.calibration}
          </span>
        </div>
      </div>
    </button>
  );
}

export function EquipmentGridPanel({
  loadout,
  onSelectSlot,
  onSetActiveDps,
}: {
  loadout: LoadoutConfig;
  onSelectSlot: (slot: EquipSlotId) => void;
  onSetActiveDps: (slot: ActiveWeaponSlotKey) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Top Section: | Weapon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-dashed border-white/[0.1] pb-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
            <span className="h-3.5 w-0.5 bg-[#3ee6c5]" />
            <span>Weapon</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            3/3 Equipped · Click slot to configure
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-2">
            <WeaponEquipCard
              slotId="primary"
              badgeNumber="1"
              cfg={loadout.primary}
              isActiveDps={loadout.activeWeaponSlot === 'primary'}
              onSelectSlot={onSelectSlot}
              onSetActiveDps={onSetActiveDps}
            />
            <WeaponEquipCard
              slotId="secondary"
              badgeNumber="2"
              cfg={loadout.secondary}
              isActiveDps={loadout.activeWeaponSlot === 'secondary'}
              onSelectSlot={onSelectSlot}
              onSetActiveDps={onSetActiveDps}
            />
          </div>
          <div className="col-span-1">
            <WeaponEquipCard
              slotId="melee"
              cfg={loadout.melee}
              tall
              onSelectSlot={onSelectSlot}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section: | Gear */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-dashed border-white/[0.1] pb-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
            <span className="h-3.5 w-0.5 bg-[#3ee6c5]" />
            <span>Gear</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            6/6 Equipped · Includes Hide & Mod
          </span>
        </div>

        {/* Row 1: 4 Square Cards + Row 2: 2 Double-Width Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ArmorEquipCard
            slotKey="helmet"
            label="Helmet"
            cfg={loadout.armor.helmet}
            onSelectSlot={onSelectSlot}
          />
          <ArmorEquipCard
            slotKey="mask"
            label="Mask"
            cfg={loadout.armor.mask}
            onSelectSlot={onSelectSlot}
          />
          <ArmorEquipCard
            slotKey="gloves"
            label="Gloves"
            cfg={loadout.armor.gloves}
            onSelectSlot={onSelectSlot}
          />
          <ArmorEquipCard
            slotKey="shoes"
            label="Shoes"
            cfg={loadout.armor.shoes}
            onSelectSlot={onSelectSlot}
          />
          <ArmorEquipCard
            slotKey="top"
            label="Top (Chest)"
            cfg={loadout.armor.top}
            wide
            onSelectSlot={onSelectSlot}
          />
          <ArmorEquipCard
            slotKey="bottoms"
            label="Bottoms"
            cfg={loadout.armor.bottoms}
            wide
            onSelectSlot={onSelectSlot}
          />
        </div>
      </div>
    </div>
  );
}

export function CombatDeviationPanel({
  loadout,
  deviationDps,
  onChange,
}: {
  loadout: LoadoutConfig;
  deviationDps: number;
  onChange: (patch: Partial<LoadoutConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-dashed border-white/[0.1] pb-1.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <span className="h-3.5 w-0.5 bg-[#3ee6c5]" />
          <span>Combat Deviation</span>
        </div>
        <span className="font-mono text-xs font-semibold text-[#3ee6c5]">
          +{deviationDps.toLocaleString()} Companion DPS
        </span>
      </div>

      {/* Skill & Activity Sliders */}
      <div className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Skill Rating</span>
            <span className="font-mono font-bold text-[#3ee6c5]">
              Lv. {loadout.deviationSkillRating} / 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={loadout.deviationSkillRating}
            onChange={(e) => onChange({ deviationSkillRating: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer accent-[#3ee6c5]"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Activity Rating</span>
            <span className="font-mono font-bold text-amber-300">
              Lv. {loadout.deviationActivityRating} / 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={loadout.deviationActivityRating}
            onChange={(e) => onChange({ deviationActivityRating: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer accent-amber-300"
          />
        </div>
      </div>

      {/* Deviation Cards */}
      <div className="grid gap-2 sm:grid-cols-2">
        {DPS_DATA.combatDeviations.map((dev) => {
          const active = loadout.deviationId === dev.id;
          const imgUrl = findDeviationImage(dev.id);
          return (
            <button
              key={dev.id}
              type="button"
              onClick={() => onChange({ deviationId: dev.id })}
              className={`flex items-start gap-3 rounded-xl border p-2.5 text-left transition ${
                active
                  ? 'border-[#3ee6c5] bg-[#3ee6c5]/12 shadow-[0_0_16px_rgba(62,230,197,0.16)]'
                  : 'border-white/[0.07] bg-[#131a1e] hover:border-white/25'
              }`}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={dev.name}
                  className="h-12 w-12 shrink-0 rounded-lg border border-white/10 bg-[#0c1114] object-cover"
                />
              ) : (
                <Sparkles className="h-8 w-8 text-[#3ee6c5]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-bold text-white">{dev.name}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#3ee6c5]" />}
                </div>
                <div className="text-[10px] font-medium text-amber-300">
                  {dev.element} · {dev.role}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-400">{dev.summary}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CradleAndFoodPanel({
  loadout,
  onChange,
}: {
  loadout: LoadoutConfig;
  onChange: (patch: Partial<LoadoutConfig>) => void;
}) {
  const toggleCradle = (id: string) => {
    const exists = loadout.cradleIds.includes(id);
    if (exists) {
      onChange({ cradleIds: loadout.cradleIds.filter((x) => x !== id) });
    } else if (loadout.cradleIds.length < 4) {
      onChange({ cradleIds: [...loadout.cradleIds, id] });
    } else {
      onChange({ cradleIds: [...loadout.cradleIds.slice(1), id] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Cradle Overrides (4 slots) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-dashed border-white/[0.1] pb-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
            <span className="h-3.5 w-0.5 bg-[#3ee6c5]" />
            <span>Cradle Overrides</span>
          </div>
          <span className="font-mono text-[10px] text-[#3ee6c5]">
            {loadout.cradleIds.length} / 4 Active
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {DPS_DATA.cradleOverrides.map((c) => {
            const active = loadout.cradleIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCradle(c.id)}
                className={`rounded-xl border p-2.5 text-left transition ${
                  active
                    ? 'border-[#3ee6c5] bg-[#3ee6c5]/12'
                    : 'border-white/[0.07] bg-[#131a1e] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Flame className={`h-3.5 w-3.5 ${active ? 'text-[#3ee6c5]' : 'text-slate-500'}`} />
                    {c.name}
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-[#3ee6c5]" />}
                </div>
                <div className="mt-1 text-[10px] text-slate-300">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Food, Drink & Whim Buffs */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 border-b border-dashed border-white/[0.1] pb-1.5 text-xs font-bold uppercase tracking-wider text-white">
          <span className="h-3.5 w-0.5 bg-[#3ee6c5]" />
          <Utensils className="h-3.5 w-3.5 text-[#3ee6c5]" />
          <span>Food, Drink & Whim Potions</span>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Main Food Buff
            </label>
            <select
              value={loadout.foodId}
              onChange={(e) => onChange({ foodId: e.target.value })}
              className="w-full rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5 py-2 text-xs text-white outline-none"
            >
              {DPS_DATA.consumables.foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-sky-300">
              Drink Buff
            </label>
            <select
              value={loadout.drinkId}
              onChange={(e) => onChange({ drinkId: e.target.value })}
              className="w-full rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5 py-2 text-xs text-white outline-none"
            >
              {DPS_DATA.consumables.drinks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-purple-300">
              Tactical / Whim Potion
            </label>
            <select
              value={loadout.whimId}
              onChange={(e) => onChange({ whimId: e.target.value })}
              className="w-full rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5 py-2 text-xs text-white outline-none"
            >
              {DPS_DATA.consumables.whims.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.desc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

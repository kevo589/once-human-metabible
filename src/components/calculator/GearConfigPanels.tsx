import { AlertTriangle, Check, ChefHat, Crosshair, Flame, Lightbulb, Shield, Sparkles, Utensils } from 'lucide-react';
import {
  computeArmorRating,
  computeWeaponRating,
  DPS_DATA,
  DRINK_BUFFS,
  findDeviationImage,
  FOOD_BUFFS,
  lookupEquipIcons,
  resolveDrinkBuff,
  resolveFoodBuff,
  type ActiveWeaponSlotKey,
  type ArmorSlotConfig,
  type EquipSlotId,
  type LoadoutConfig,
  type LoadoutWarning,
  type WeaponSlotConfig,
} from '../../data/dps/dpsEngine';
import { ARMOR_SETS } from '../../data/gearAndMods';
import { WEAPONS } from '../../data/weapons';
import { HIDES_AND_WOOLS, type ArmorSlotKey } from '../../utils/craftingEngine';

const WEAPON_BY_ID = new Map(WEAPONS.map((w) => [w.id, w]));
const ARMOR_BY_ID = new Map(ARMOR_SETS.map((a) => [a.id, a]));
const HIDE_BY_ID = new Map(HIDES_AND_WOOLS.map((h) => [h.id, h]));

const CARD_SURFACE_GRADIENT: Record<string, string> = {
  Legendary:
    'bg-gradient-to-br from-[#5c4215]/75 via-[#2a2010]/70 to-[#11171b]/90 border-amber-400/25',
  Epic:
    'bg-gradient-to-br from-[#4d286a]/75 via-[#231632]/70 to-[#11171b]/90 border-purple-400/25',
  Rare:
    'bg-gradient-to-br from-[#19406c]/75 via-[#112236]/70 to-[#11171b]/90 border-sky-400/25',
  Fine:
    'bg-gradient-to-br from-[#19406c]/75 via-[#112236]/70 to-[#11171b]/90 border-sky-400/25',
  Common:
    'bg-gradient-to-br from-[#1c262c]/75 via-[#131a1e]/75 to-[#0f1519]/90 border-white/[0.08]',
};

function PipMarkers({
  tier,
  hasMod,
  hasHide,
}: {
  tier: number;
  hasMod?: boolean;
  hasHide?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rotate-45 rounded-[1px] bg-[#e5b84b] shadow-[0_0_6px_rgba(229,184,75,0.55)]" />
      <div className="flex items-center gap-0.5">
        {Array.from({ length: Math.min(5, tier) }).map((_, i) => (
          <span key={i} className="h-1 w-2 rounded-[1px] bg-slate-300/75" />
        ))}
      </div>
      {hasMod && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-purple-400" />}
      {hasHide && <span className="h-1.5 w-1.5 rounded-full bg-[#3ee6c5]" />}
    </div>
  );
}

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
  const grad = CARD_SURFACE_GRADIENT[weapon.rarity] ?? CARD_SURFACE_GRADIENT.Common;

  return (
    <div
      onClick={() => onSelectSlot(slotId)}
      role="button"
      tabIndex={0}
      title={`${weapon.name} · Tier ${cfg.tier} · ${cfg.stars}★ · +${cfg.calibration} (Click to configure)`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectSlot(slotId);
        }
      }}
      className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded border p-2.5 text-left transition hover:brightness-115 ${grad} ${
        tall ? 'h-full min-h-[242px]' : 'h-[117px]'
      } ${
        isActiveDps
          ? 'ring-1 ring-[#3ee6c5]/80 shadow-[0_0_20px_rgba(62,230,197,0.14)]'
          : 'hover:border-white/30'
      }`}
    >
      {/* Top Row: Clean Rating + Gold [1]/[2] Badge */}
      <div className="z-10 flex items-start justify-between">
        <span className="font-mono text-[15px] font-semibold tracking-tight text-white drop-shadow">
          {rating}
        </span>

        {badgeNumber && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetActiveDps?.(badgeNumber === '1' ? 'primary' : 'secondary');
            }}
            title={
              isActiveDps ? 'Active DPS weapon' : 'Click badge to test this weapon for DPS'
            }
            className={`flex h-5 w-5 items-center justify-center rounded-[3px] font-mono text-[11px] font-extrabold transition ${
              isActiveDps
                ? 'bg-[#e5b84b] text-[#141004] ring-1 ring-[#3ee6c5]'
                : 'bg-[#e5b84b]/85 text-[#141004] hover:bg-[#f2ca63]'
            }`}
          >
            {badgeNumber}
          </button>
        )}
      </div>

      {/* Centered Clean Artwork */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 py-4">
        {icons.itemImg ? (
          <img
            src={icons.itemImg}
            alt={weapon.name}
            className={`object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover:scale-105 ${
              tall ? 'h-44 w-20' : 'h-20 w-[85%]'
            }`}
          />
        ) : (
          <Crosshair className="h-8 w-8 text-slate-500" />
        )}
      </div>

      {/* Subtle Bottom-Left Pips & Hover Name */}
      <div className="z-10 flex items-end justify-between gap-2">
        <PipMarkers tier={cfg.tier} hasMod={Boolean(cfg.modId)} />
        <span className="truncate text-[10px] font-medium text-slate-300/0 transition group-hover:text-slate-200/90">
          {weapon.name}
        </span>
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
  const grad = CARD_SURFACE_GRADIENT[armor.rarity] ?? CARD_SURFACE_GRADIENT.Common;

  return (
    <button
      type="button"
      onClick={() => onSelectSlot(slotKey)}
      title={`${armor.name} (${label}) · Tier ${cfg.tier} · ${cfg.stars}★ · +${cfg.calibration}${
        hide ? ` · ${hide.name}` : ''
      }`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded border p-2 text-left transition hover:border-white/30 hover:brightness-115 ${grad} ${
        wide ? 'col-span-2 h-[118px]' : 'col-span-1 h-[108px]'
      }`}
    >
      {/* Top-Left Rating Only */}
      <div className="z-10 flex items-start justify-between">
        <span className="font-mono text-[15px] font-semibold tracking-tight text-white drop-shadow">
          {rating}
        </span>
      </div>

      {/* Centered Clean Armor Thumbnail */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-2">
        {icons.itemImg ? (
          <img
            src={icons.itemImg}
            alt={armor.name}
            className={`object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover:scale-105 ${
              wide ? 'h-24 w-28' : 'h-[72px] w-[72px]'
            }`}
          />
        ) : (
          <Shield className="h-6 w-6 text-slate-500" />
        )}
      </div>

      {/* Subtle Bottom-Left Pips & Hover Name */}
      <div className="z-10 flex items-end justify-between gap-1">
        <PipMarkers tier={cfg.tier} hasMod={Boolean(cfg.modId)} hasHide={Boolean(hide)} />
        <span className="truncate text-[10px] font-medium text-slate-300/0 transition group-hover:text-slate-200/90">
          {armor.name}
        </span>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-200">
            <span className="h-3.5 w-[2px] bg-[#3ee6c5]" />
            <span>Weapon</span>
            <span className="font-mono text-xs text-slate-300">3/3</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Click any slot to customize
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
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-200">
          <span className="h-3.5 w-[2px] bg-[#3ee6c5]" />
          <span>Gear</span>
          <span className="font-mono text-xs text-slate-300">6/6</span>
        </div>

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
            label="Top"
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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white">
          <span className="h-3.5 w-[2px] bg-[#3ee6c5]" />
          <span>Combat Deviation</span>
        </div>
        <span className="font-mono text-xs font-semibold text-[#3ee6c5]">
          +{deviationDps.toLocaleString()} DPS
        </span>
      </div>

      <div className="grid gap-3 rounded-lg border border-white/[0.06] bg-black/25 p-3 sm:grid-cols-2">
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
            className="h-1 w-full cursor-pointer accent-[#3ee6c5]"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Activity Rating</span>
            <span className="font-mono font-bold text-[#e5b84b]">
              Lv. {loadout.deviationActivityRating} / 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={loadout.deviationActivityRating}
            onChange={(e) => onChange({ deviationActivityRating: Number(e.target.value) })}
            className="h-1 w-full cursor-pointer accent-[#e5b84b]"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {DPS_DATA.combatDeviations.map((dev) => {
          const active = loadout.deviationId === dev.id;
          const imgUrl = findDeviationImage(dev.id);
          return (
            <button
              key={dev.id}
              type="button"
              onClick={() => onChange({ deviationId: dev.id })}
              className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition ${
                active
                  ? 'border-[#3ee6c5]/70 bg-[#3ee6c5]/10'
                  : 'border-white/[0.06] bg-black/25 hover:border-white/20'
              }`}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={dev.name}
                  className="h-11 w-11 shrink-0 rounded border border-white/10 bg-[#0b1014] object-cover"
                />
              ) : (
                <Sparkles className="h-7 w-7 text-[#3ee6c5]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-semibold text-white">{dev.name}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#3ee6c5]" />}
                </div>
                <div className="text-[10px] text-amber-300">
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
  warnings = [],
  onChange,
}: {
  loadout: LoadoutConfig;
  warnings?: LoadoutWarning[];
  onChange: (patch: Partial<LoadoutConfig>) => void;
}) {
  const chefEnabled = Boolean(loadout.chefClassEnabled);
  const stoveBonus = loadout.chefStoveBonusPct ?? 0;
  const stoveMult = chefEnabled ? 1 + stoveBonus / 100 : 1;

  const food1 = resolveFoodBuff(loadout.foodId);
  const food2 = chefEnabled ? resolveFoodBuff(loadout.foodId2) : undefined;
  const drink1 = resolveDrinkBuff(loadout.drinkId);
  const drink2 = chefEnabled ? resolveDrinkBuff(loadout.drinkId2) : undefined;

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
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white">
            <span className="h-3.5 w-[2px] bg-[#3ee6c5]" />
            <span>Cradle Overrides</span>
          </div>
          <span className="font-mono text-[11px] text-[#3ee6c5]">
            {loadout.cradleIds.length} / 4
          </span>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2">
          {DPS_DATA.cradleOverrides.map((c) => {
            const active = loadout.cradleIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCradle(c.id)}
                className={`rounded-lg border p-2 text-left transition ${
                  active
                    ? 'border-[#3ee6c5]/70 bg-[#3ee6c5]/10'
                    : 'border-white/[0.06] bg-black/25 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                    <Flame className={`h-3 w-3 ${active ? 'text-[#3ee6c5]' : 'text-slate-500'}`} />
                    {c.name}
                  </span>
                  {active && <Check className="h-3 w-3 text-[#3ee6c5]" />}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chef Class (Glutton) & Food / Drink / Whim Buffs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white">
            <span className="h-3.5 w-[2px] bg-[#3ee6c5]" />
            <Utensils className="h-3.5 w-3.5 text-[#3ee6c5]" />
            <span>Food, Drink & Whim</span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-black/40 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => onChange({ chefClassEnabled: false })}
              className={`rounded-md px-2 py-1 font-medium transition ${
                !chefEnabled ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard (1+1)
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  chefClassEnabled: true,
                  chefStoveBonusPct: stoveBonus || 30,
                })
              }
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition ${
                chefEnabled
                  ? 'bg-[#3ee6c5] text-[#091214]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ChefHat className="h-3 w-3" />
              Chef — Glutton (2+2)
            </button>
          </div>
        </div>

        {/* Chefosaurus Rex / Stove Buff Multiplier Slider */}
        {chefEnabled && (
          <div className="rounded-lg border border-[#3ee6c5]/30 bg-[#3ee6c5]/[0.06] p-2.5">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-200">
                Chefosaurus Rex / Stove Buff Multiplier
              </span>
              <span className="font-mono font-bold text-[#3ee6c5]">+{stoveBonus}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={38}
              step={1}
              value={stoveBonus}
              onChange={(e) => onChange({ chefStoveBonusPct: Number(e.target.value) })}
              aria-label="Chefosaurus Rex stove buff multiplier"
              className="h-1 w-full cursor-pointer accent-[#3ee6c5]"
            />
          </div>
        )}

        {/* Warnings inside Cradle & Food */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map((w) => (
              <div
                key={w.id}
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${
                  w.severity === 'warning'
                    ? 'border-amber-500/45 bg-amber-500/12 text-amber-200'
                    : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                }`}
              >
                {w.severity === 'warning' ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                )}
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* Food Slot 1 */}
          <div className="space-y-1 rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span>Food Slot 1</span>
              {food1 && chefEnabled && stoveBonus > 0 && (
                <span className="font-mono text-[#3ee6c5]">×{stoveMult.toFixed(2)}</span>
              )}
            </div>
            <select
              value={food1?.id ?? 'none'}
              onChange={(e) => {
                const nextId = e.target.value;
                onChange({
                  foodId: nextId,
                  foodId2: nextId !== 'none' && nextId === food2?.id ? 'none' : loadout.foodId2,
                });
              }}
              aria-label="Food Slot 1 selector"
              className="w-full rounded border border-white/[0.1] bg-[#0f161a] px-2 py-1.5 text-xs text-white outline-none"
            >
              <option value="none">No Food Buff</option>
              {FOOD_BUFFS.map((f) => (
                <option key={f.id} value={f.id} disabled={chefEnabled && f.id === food2?.id}>
                  {f.name} — {f.summary}
                </option>
              ))}
            </select>
            {food1 && (
              <div className="text-[10px] text-slate-400">
                <span className="text-slate-300">{food1.summary}</span> · {food1.bestFor.slice(0, 2).join(', ')}
              </div>
            )}
          </div>

          {/* Food Slot 2 (Chef Only) */}
          {chefEnabled && (
            <div className="space-y-1 rounded-lg border border-[#3ee6c5]/25 bg-[#3ee6c5]/[0.04] p-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#3ee6c5]">
                <span>Food Slot 2 (Glutton)</span>
                {food2 && stoveBonus > 0 && (
                  <span className="font-mono">×{stoveMult.toFixed(2)}</span>
                )}
              </div>
              <select
                value={food2?.id ?? 'none'}
                onChange={(e) => {
                  const nextId = e.target.value;
                  if (nextId !== 'none' && nextId === food1?.id) return;
                  onChange({ foodId2: nextId });
                }}
                aria-label="Food Slot 2 selector"
                className="w-full rounded border border-white/[0.1] bg-[#0f161a] px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="none">No Second Food</option>
                {FOOD_BUFFS.map((f) => (
                  <option key={f.id} value={f.id} disabled={f.id === food1?.id}>
                    {f.name} — {f.summary}
                  </option>
                ))}
              </select>
              {food2 && (
                <div className="text-[10px] text-slate-400">
                  <span className="text-slate-300">{food2.summary}</span> · {food2.bestFor.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Drink Slot 1 */}
          <div className="space-y-1 rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span>Drink Slot 1</span>
              {drink1 && chefEnabled && stoveBonus > 0 && (
                <span className="font-mono text-[#3ee6c5]">×{stoveMult.toFixed(2)}</span>
              )}
            </div>
            <select
              value={drink1?.id ?? 'none'}
              onChange={(e) => {
                const nextId = e.target.value;
                onChange({
                  drinkId: nextId,
                  drinkId2: nextId !== 'none' && nextId === drink2?.id ? 'none' : loadout.drinkId2,
                });
              }}
              aria-label="Drink Slot 1 selector"
              className="w-full rounded border border-white/[0.1] bg-[#0f161a] px-2 py-1.5 text-xs text-white outline-none"
            >
              <option value="none">No Drink Buff</option>
              {DRINK_BUFFS.map((d) => (
                <option key={d.id} value={d.id} disabled={chefEnabled && d.id === drink2?.id}>
                  {d.name} — {d.summary}
                </option>
              ))}
            </select>
            {drink1 && (
              <div className="text-[10px] text-slate-400">
                <span className="text-slate-300">{drink1.summary}</span>
              </div>
            )}
          </div>

          {/* Drink Slot 2 (Chef Only) */}
          {chefEnabled && (
            <div className="space-y-1 rounded-lg border border-[#3ee6c5]/25 bg-[#3ee6c5]/[0.04] p-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#3ee6c5]">
                <span>Drink Slot 2 (Glutton)</span>
                {drink2 && stoveBonus > 0 && (
                  <span className="font-mono">×{stoveMult.toFixed(2)}</span>
                )}
              </div>
              <select
                value={drink2?.id ?? 'none'}
                onChange={(e) => {
                  const nextId = e.target.value;
                  if (nextId !== 'none' && nextId === drink1?.id) return;
                  onChange({ drinkId2: nextId });
                }}
                aria-label="Drink Slot 2 selector"
                className="w-full rounded border border-white/[0.1] bg-[#0f161a] px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="none">No Second Drink</option>
                {DRINK_BUFFS.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.id === drink1?.id}>
                    {d.name} — {d.summary}
                  </option>
                ))}
              </select>
              {drink2 && (
                <div className="text-[10px] text-slate-400">
                  <span className="text-slate-300">{drink2.summary}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Whim Potion */}
        <select
          value={loadout.whimId}
          onChange={(e) => onChange({ whimId: e.target.value })}
          aria-label="Whim potion selector"
          className="w-full rounded-lg border border-white/[0.08] bg-black/35 px-2.5 py-2 text-xs text-white outline-none"
        >
          {DPS_DATA.consumables.whims.map((w) => (
            <option key={w.id} value={w.id} className="bg-[#0f161a]">
              Whim: {w.name} — {w.desc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

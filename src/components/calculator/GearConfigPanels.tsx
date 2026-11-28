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
    'bg-gradient-to-br from-[#5c4215]/75 via-[#2a2010]/70 to-sign-panel/90 border-amber-400/25',
  Epic:
    'bg-gradient-to-br from-[#4d286a]/75 via-[#231632]/70 to-sign-panel/90 border-purple-400/25',
  Rare:
    'bg-gradient-to-br from-[#19406c]/75 via-[#112236]/70 to-sign-panel/90 border-sky-400/25',
  Fine:
    'bg-gradient-to-br from-[#19406c]/75 via-[#112236]/70 to-sign-panel/90 border-sky-400/25',
  Common:
    'bg-gradient-to-br from-[#1c262c]/75 via-sign-raised/75 to-[#0f1519]/90 border-sign-seam',
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
          <span key={i} className="h-1 w-2 rounded-[1px] bg-sign-mute/75" />
        ))}
      </div>
      {hasMod && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-purple-400" />}
      {hasHide && <span className="h-1.5 w-1.5 rounded-full bg-line-dps" />}
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
          ? 'ring-2 ring-line-dps'
          : 'hover:border-white/30'
      }`}
    >
      {/* Top Row: Clean Rating + Gold [1]/[2] Badge */}
      <div className="z-10 flex items-start justify-between">
        <span className=" text-[15px] font-semibold tracking-tight text-white drop-shadow">
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
            className={`flex h-5 w-5 items-center justify-center rounded-[3px] text-[12px] font-extrabold transition ${
              isActiveDps
                ? 'bg-[#e5b84b] text-black ring-1 ring-line-dps'
                : 'bg-[#e5b84b]/85 text-black hover:bg-[#f2ca63]'
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
          <Crosshair className="h-8 w-8 text-sign-dim" />
        )}
      </div>

      {/* Subtle Bottom-Left Pips & Hover Name */}
      <div className={`z-10 flex items-end justify-between gap-2 ${tall ? 'flex-col-reverse items-start' : ''}`}>
        <PipMarkers tier={cfg.tier} hasMod={Boolean(cfg.modId)} />
        <span className="line-clamp-2 min-w-0 rounded-sm bg-black/80 px-1.5 py-0.5 text-right text-[12px] font-semibold leading-tight text-sign-white">
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
      {/* Top-Left Rating + item name */}
      <div className="z-10 flex min-w-0 flex-col items-start">
        <span className=" text-[15px] font-semibold tracking-tight text-white drop-shadow">
          {rating}
        </span>
        <span className="mt-1 line-clamp-2 max-w-full rounded-sm bg-black/80 px-1.5 py-0.5 text-[12px] font-semibold leading-tight text-sign-white">{armor.name}</span>
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
          <Shield className="h-6 w-6 text-sign-dim" />
        )}
      </div>

      {/* Subtle Bottom-Left Pips & Hover Name */}
      <div className="z-10 flex items-end justify-between gap-1">
        <PipMarkers tier={cfg.tier} hasMod={Boolean(cfg.modId)} hasHide={Boolean(hide)} />
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
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">
            <span>Weapon</span>
            <span className=" text-xs text-sign-mute">3/3</span>
          </div>
          <span className=" text-[12px] text-sign-mute">
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
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">
          <span>Gear</span>
          <span className=" text-xs text-sign-mute">6/6</span>
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
      <div className="flex items-center justify-between border-b border-sign-seam pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white">
          <span>Combat Deviation</span>
        </div>
        <span className=" text-xs font-semibold text-line-dps">
          +{deviationDps.toLocaleString()} DPS
        </span>
      </div>

      <div className="grid gap-3 rounded-lg border border-sign-seam bg-black/25 p-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="text-sign-mute">Skill Rating</span>
            <span className=" font-bold text-line-dps">
              Lv. {loadout.deviationSkillRating} / 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={loadout.deviationSkillRating}
            onChange={(e) => onChange({ deviationSkillRating: Number(e.target.value) })}
            className="h-1 w-full cursor-pointer accent-line-dps"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="text-sign-mute">Activity Rating</span>
            <span className=" font-bold text-[#e5b84b]">
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
                  ? 'border-line-dps/70 bg-line-dps/10'
                  : 'border-sign-seam bg-black/25 hover:border-sign-seam'
              }`}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={dev.name}
                  className="h-11 w-11 shrink-0 rounded border border-sign-seam bg-[#0b1014] object-cover"
                />
              ) : (
                <Sparkles className="h-7 w-7 text-line-dps" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-semibold text-white">{dev.name}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-line-dps" />}
                </div>
                <div className="text-[12px] text-amber-300">
                  {dev.element} · {dev.role}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-sign-mute">{dev.summary}</p>
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
        <div className="flex items-center justify-between border-b border-sign-seam pb-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white">
            <span>Cradle Overrides</span>
          </div>
          <span className=" text-[12px] text-line-dps">
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
                    ? 'border-line-dps/70 bg-line-dps/10'
                    : 'border-sign-seam bg-black/25 hover:border-sign-seam'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
                    <Flame className={`h-3 w-3 ${active ? 'text-line-dps' : 'text-sign-dim'}`} />
                    {c.name}
                  </span>
                  {active && <Check className="h-3 w-3 text-line-dps" />}
                </div>
                <div className="mt-0.5 text-[12px] text-sign-mute">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chef Class (Glutton) & Food / Drink / Whim Buffs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sign-seam pb-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white">
            <Utensils className="h-3.5 w-3.5 text-line-dps" />
            <span>Food, Drink & Whim</span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-sign-seam bg-black/40 p-0.5 text-[12px]">
            <button
              type="button"
              onClick={() => onChange({ chefClassEnabled: false })}
              className={`rounded-md px-2 py-1 font-medium transition ${
                !chefEnabled ? 'bg-white/15 text-white' : 'text-sign-mute hover:text-sign-white'
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
                  ? 'bg-line-dps text-black'
                  : 'text-sign-mute hover:text-sign-white'
              }`}
            >
              <ChefHat className="h-3 w-3" />
              Chef — Glutton (2+2)
            </button>
          </div>
        </div>

        {/* Chefosaurus Rex / Stove Buff Multiplier Slider */}
        {chefEnabled && (
          <div className="rounded-lg border border-line-dps/30 bg-line-dps/[0.06] p-2.5">
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-medium text-sign-white">
                Chefosaurus Rex / Stove Buff Multiplier
              </span>
              <span className=" font-bold text-line-dps">+{stoveBonus}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={38}
              step={1}
              value={stoveBonus}
              onChange={(e) => onChange({ chefStoveBonusPct: Number(e.target.value) })}
              aria-label="Chefosaurus Rex stove buff multiplier"
              className="h-1 w-full cursor-pointer accent-line-dps"
            />
          </div>
        )}

        {/* Warnings inside Cradle & Food */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map((w) => (
              <div
                key={w.id}
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[12px] ${
                  w.severity === 'warning'
                    ? 'border-amber-500/45 bg-amber-500/12 text-amber-200'
                    : 'border-line-dps/40 bg-line-dps/10 text-line-dps'
                }`}
              >
                {w.severity === 'warning' ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-line-dps" />
                )}
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* Food Slot 1 */}
          <div className="space-y-1 rounded-lg border border-sign-seam bg-black/25 p-2.5">
            <div className="flex items-center justify-between text-[12px] uppercase tracking-wider text-sign-mute">
              <span>Food Slot 1</span>
              {food1 && chefEnabled && stoveBonus > 0 && (
                <span className=" text-line-dps">×{stoveMult.toFixed(2)}</span>
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
              className="w-full rounded border border-white/[0.1] bg-sign-panel px-2 py-1.5 text-xs text-white outline-none"
            >
              <option value="none">No Food Buff</option>
              {FOOD_BUFFS.map((f) => (
                <option key={f.id} value={f.id} disabled={chefEnabled && f.id === food2?.id}>
                  {f.name} — {f.summary}
                </option>
              ))}
            </select>
            {food1 && (
              <div className="text-[12px] text-sign-mute">
                <span className="text-sign-mute">{food1.summary}</span> · {food1.bestFor.slice(0, 2).join(', ')}
              </div>
            )}
          </div>

          {/* Food Slot 2 (Chef Only) */}
          {chefEnabled && (
            <div className="space-y-1 rounded-lg border border-line-dps/25 bg-line-dps/[0.04] p-2.5">
              <div className="flex items-center justify-between text-[12px] uppercase tracking-wider text-line-dps">
                <span>Food Slot 2 (Glutton)</span>
                {food2 && stoveBonus > 0 && (
                  <span className="">×{stoveMult.toFixed(2)}</span>
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
                className="w-full rounded border border-white/[0.1] bg-sign-panel px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="none">No Second Food</option>
                {FOOD_BUFFS.map((f) => (
                  <option key={f.id} value={f.id} disabled={f.id === food1?.id}>
                    {f.name} — {f.summary}
                  </option>
                ))}
              </select>
              {food2 && (
                <div className="text-[12px] text-sign-mute">
                  <span className="text-sign-mute">{food2.summary}</span> · {food2.bestFor.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Drink Slot 1 */}
          <div className="space-y-1 rounded-lg border border-sign-seam bg-black/25 p-2.5">
            <div className="flex items-center justify-between text-[12px] uppercase tracking-wider text-sign-mute">
              <span>Drink Slot 1</span>
              {drink1 && chefEnabled && stoveBonus > 0 && (
                <span className=" text-line-dps">×{stoveMult.toFixed(2)}</span>
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
              className="w-full rounded border border-white/[0.1] bg-sign-panel px-2 py-1.5 text-xs text-white outline-none"
            >
              <option value="none">No Drink Buff</option>
              {DRINK_BUFFS.map((d) => (
                <option key={d.id} value={d.id} disabled={chefEnabled && d.id === drink2?.id}>
                  {d.name} — {d.summary}
                </option>
              ))}
            </select>
            {drink1 && (
              <div className="text-[12px] text-sign-mute">
                <span className="text-sign-mute">{drink1.summary}</span>
              </div>
            )}
          </div>

          {/* Drink Slot 2 (Chef Only) */}
          {chefEnabled && (
            <div className="space-y-1 rounded-lg border border-line-dps/25 bg-line-dps/[0.04] p-2.5">
              <div className="flex items-center justify-between text-[12px] uppercase tracking-wider text-line-dps">
                <span>Drink Slot 2 (Glutton)</span>
                {drink2 && stoveBonus > 0 && (
                  <span className="">×{stoveMult.toFixed(2)}</span>
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
                className="w-full rounded border border-white/[0.1] bg-sign-panel px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="none">No Second Drink</option>
                {DRINK_BUFFS.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.id === drink1?.id}>
                    {d.name} — {d.summary}
                  </option>
                ))}
              </select>
              {drink2 && (
                <div className="text-[12px] text-sign-mute">
                  <span className="text-sign-mute">{drink2.summary}</span>
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
          className="w-full rounded-lg border border-sign-seam bg-black/35 px-2.5 py-2 text-xs text-white outline-none"
        >
          {DPS_DATA.consumables.whims.map((w) => (
            <option key={w.id} value={w.id} className="bg-sign-panel">
              Whim: {w.name} — {w.desc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

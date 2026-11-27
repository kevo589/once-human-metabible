import { Check, Crosshair, Plus, Search, Shield, Sparkles, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DPS_DATA,
  getSubstatValue,
  normalizeSlotForArmorCatalog,
  normalizeSlotForMod,
  previewArmorSlotStats,
  previewWeaponSlotStats,
  type ActiveWeaponSlotKey,
  type ArmorSlotConfig,
  type EquipSlotId,
  type StatKey,
  type SubstatEntry,
  type SubstatRarity,
  type WeaponSlotConfig,
} from '../../data/dps/dpsEngine';
import { ARMOR_SETS, MODS } from '../../data/gearAndMods';
import { WEAPONS } from '../../data/weapons';
import {
  GENE_FABRICS,
  HIDES_AND_WOOLS,
  ROMAN_TIERS,
  type ArmorSlotKey,
  type CraftTier,
} from '../../utils/craftingEngine';
import { BENCH_BP_GRADIENT, MaterialIconGlyph, StarRatingDisplay } from '../workbench/MaterialVisuals';

interface SlotConfiguratorDrawerProps {
  slotId: EquipSlotId | null;
  weaponCfg?: WeaponSlotConfig;
  armorCfg?: ArmorSlotConfig;
  isActiveDpsWeapon?: boolean;
  onSetActiveDpsWeapon?: (slot: ActiveWeaponSlotKey) => void;
  onUpdateWeapon?: (next: WeaponSlotConfig) => void;
  onUpdateArmor?: (next: ArmorSlotConfig) => void;
  onClose: () => void;
}

const SLOT_LABELS: Record<EquipSlotId, string> = {
  primary: 'Weapon Slot 1 (Primary)',
  secondary: 'Weapon Slot 2 (Secondary)',
  melee: 'Melee Weapon Slot',
  helmet: 'Helmet Slot',
  mask: 'Mask Slot',
  gloves: 'Gloves Slot',
  shoes: 'Shoes Slot',
  top: 'Top (Chest) Slot',
  bottoms: 'Bottoms (Pants) Slot',
};

const TIERS: CraftTier[] = [1, 2, 3, 4, 5];
const RARITIES: SubstatRarity[] = ['common', 'fine', 'epic', 'legendary'];

export function SlotConfiguratorDrawer({
  slotId,
  weaponCfg,
  armorCfg,
  isActiveDpsWeapon,
  onSetActiveDpsWeapon,
  onUpdateWeapon,
  onUpdateArmor,
  onClose,
}: SlotConfiguratorDrawerProps) {
  const [section, setSection] = useState<'item' | 'tuning' | 'mods'>('tuning');
  const [itemSearch, setItemSearch] = useState('');
  const [modSearch, setModSearch] = useState('');
  const [hideSearch, setHideSearch] = useState('');

  const isWeapon = slotId === 'primary' || slotId === 'secondary' || slotId === 'melee';
  const modSlot = slotId ? normalizeSlotForMod(slotId) : 'Weapon';

  const weaponCatalog = useMemo(() => {
    if (!isWeapon) return [];
    const q = itemSearch.trim().toLowerCase();
    return WEAPONS.filter((w) => {
      if (slotId === 'melee' && w.category !== 'Melee') return false;
      if (slotId !== 'melee' && w.category === 'Melee') return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        w.archetype.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
      );
    });
  }, [isWeapon, slotId, itemSearch]);

  const armorCatalog = useMemo(() => {
    if (!slotId || isWeapon) return [];
    const targetSlot = normalizeSlotForArmorCatalog(slotId as ArmorSlotKey);
    const q = itemSearch.trim().toLowerCase();
    return ARMOR_SETS.filter((a) => {
      if (a.slot !== targetSlot) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.setName?.toLowerCase().includes(q) ?? false) ||
        a.effectSummary.toLowerCase().includes(q)
      );
    });
  }, [isWeapon, slotId, itemSearch]);

  const modCatalog = useMemo(() => {
    const q = modSearch.trim().toLowerCase();
    return MODS.filter((m) => {
      if (m.slot !== modSlot) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.variant.toLowerCase().includes(q) ||
        m.primaryEffect.toLowerCase().includes(q)
      );
    }).slice(0, 60);
  }, [modSlot, modSearch]);

  const filteredHides = useMemo(() => {
    const q = hideSearch.trim().toLowerCase();
    return HIDES_AND_WOOLS.filter(
      (h) =>
        !q ||
        h.name.toLowerCase().includes(q) ||
        (slotId && !isWeapon && h.effects[slotId as ArmorSlotKey].toLowerCase().includes(q)),
    );
  }, [hideSearch, slotId, isWeapon]);

  if (!slotId) return null;

  const currentWeapon =
    isWeapon && weaponCfg
      ? WEAPONS.find((w) => w.id === weaponCfg.weaponId) ?? WEAPONS[0]
      : null;
  const currentArmor =
    !isWeapon && armorCfg
      ? ARMOR_SETS.find((a) => a.id === armorCfg.armorId) ?? ARMOR_SETS[0]
      : null;

  const wPreview =
    isWeapon && weaponCfg && currentWeapon
      ? previewWeaponSlotStats(weaponCfg, currentWeapon)
      : null;
  const aPreview =
    !isWeapon && armorCfg && currentArmor
      ? previewArmorSlotStats(armorCfg, currentArmor)
      : null;

  const activeModId = isWeapon ? weaponCfg?.modId ?? '' : armorCfg?.modId ?? '';
  const activeMod = MODS.find((m) => m.id === activeModId) ?? null;
  const substats = isWeapon ? weaponCfg?.substats ?? [] : armorCfg?.substats ?? [];

  const updateSubstats = (next: SubstatEntry[]) => {
    if (isWeapon && weaponCfg && onUpdateWeapon) {
      onUpdateWeapon({ ...weaponCfg, substats: next });
    } else if (!isWeapon && armorCfg && onUpdateArmor) {
      onUpdateArmor({ ...armorCfg, substats: next });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-label={SLOT_LABELS[slotId]}
    >
      <aside
        className="flex h-full w-full max-w-[460px] flex-col border-l border-white/[0.12] bg-[#0f161a] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0c1114] px-4 py-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3ee6c5]">
              {SLOT_LABELS[slotId]}
            </div>
            <h3 className="text-sm font-bold text-white">
              {currentWeapon?.name ?? currentArmor?.name ?? 'Select Gear'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {(slotId === 'primary' || slotId === 'secondary') && onSetActiveDpsWeapon && (
              <button
                type="button"
                onClick={() => onSetActiveDpsWeapon(slotId)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                  isActiveDpsWeapon
                    ? 'border-[#3ee6c5] bg-[#3ee6c5]/20 text-[#3ee6c5]'
                    : 'border-white/[0.12] bg-[#131a1e] text-slate-300 hover:border-[#3ee6c5]/50'
                }`}
              >
                {isActiveDpsWeapon ? '✓ Active DPS' : 'Set Active DPS'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Close configurator"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sub-Section Switcher */}
        <div className="grid grid-cols-3 border-b border-white/[0.08] bg-[#0c1114]/80 text-xs font-semibold">
          {(
            [
              { id: 'tuning', label: isWeapon ? 'Tune & Ammo' : 'Tune & Wool' },
              { id: 'item', label: isWeapon ? 'Change Weapon' : 'Change Armor' },
              { id: 'mods', label: 'Mod & Substats' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={`border-b-2 py-2.5 transition ${
                section === t.id
                  ? 'border-[#3ee6c5] bg-[#3ee6c5]/10 text-[#3ee6c5]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {/* Live Scaled Preview Header */}
          {(wPreview || aPreview) && (
            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                BENCH_BP_GRADIENT[(currentWeapon ?? currentArmor)?.rarity ?? 'Common'] ?? ''
              }`}
            >
              <img
                src={(currentWeapon ?? currentArmor)?.imageUrl}
                alt={(currentWeapon ?? currentArmor)?.name}
                className="h-14 w-16 shrink-0 object-contain drop-shadow"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold text-white">
                    {currentWeapon?.name ?? currentArmor?.name}
                  </span>
                  <span className="font-mono text-[10px] text-amber-300">
                    {isWeapon
                      ? `+${weaponCfg?.calibration ?? 0}`
                      : `+${armorCfg?.calibration ?? 0}`}
                  </span>
                </div>
                {wPreview && currentWeapon && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-slate-200">
                    <span>ATK {wPreview.atkAfterCalAmmo}</span>
                    <span>{wPreview.fireRate} RPM</span>
                    <span>Mag {wPreview.magCap}</span>
                    <span>CR {Math.round(currentWeapon.critRate * 100)}%</span>
                  </div>
                )}
                {aPreview && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-slate-200">
                    <span>HP {aPreview.totalHp}</span>
                    <span>Psi {aPreview.totalPsi}</span>
                    <span>Poll {aPreview.totalPoll}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: TUNE / CALIBRATION / AMMO / WOOL */}
          {section === 'tuning' && (
            <div className="space-y-4">
              {/* Tier, Stars, Calibration */}
              <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Craft Tier
                    </label>
                    <select
                      value={isWeapon ? weaponCfg?.tier : armorCfg?.tier}
                      onChange={(e) => {
                        const t = Number(e.target.value) as CraftTier;
                        if (isWeapon && weaponCfg && onUpdateWeapon) {
                          onUpdateWeapon({ ...weaponCfg, tier: t });
                        } else if (!isWeapon && armorCfg && onUpdateArmor) {
                          onUpdateArmor({ ...armorCfg, tier: t });
                        }
                      }}
                      className="w-full rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5 py-1.5 font-mono text-xs text-[#3ee6c5] outline-none"
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          TIER {ROMAN_TIERS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Blueprint Stars
                    </label>
                    <div className="flex h-[30px] items-center justify-between rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5">
                      <StarRatingDisplay
                        stars={isWeapon ? weaponCfg?.stars ?? 1 : armorCfg?.stars ?? 1}
                        interactive
                        onSelect={(s) => {
                          if (isWeapon && weaponCfg && onUpdateWeapon) {
                            onUpdateWeapon({ ...weaponCfg, stars: s });
                          } else if (!isWeapon && armorCfg && onUpdateArmor) {
                            onUpdateArmor({ ...armorCfg, stars: s });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Calibration Level</span>
                    <span className="font-mono font-bold text-amber-300">
                      +{isWeapon ? weaponCfg?.calibration ?? 0 : armorCfg?.calibration ?? 0} / +10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={isWeapon ? weaponCfg?.calibration ?? 0 : armorCfg?.calibration ?? 0}
                    onChange={(e) => {
                      const c = Number(e.target.value);
                      if (isWeapon && weaponCfg && onUpdateWeapon) {
                        onUpdateWeapon({ ...weaponCfg, calibration: c });
                      } else if (!isWeapon && armorCfg && onUpdateArmor) {
                        onUpdateArmor({ ...armorCfg, calibration: c });
                      }
                    }}
                    className="h-1.5 w-full cursor-pointer accent-[#3ee6c5]"
                  />
                </div>
              </div>

              {/* WEAPON-SPECIFIC CONTROLS */}
              {isWeapon && weaponCfg && onUpdateWeapon && (
                <>
                  <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#3ee6c5]">
                      Calibration Blueprint & Secondary Attrs
                    </div>
                    <select
                      value={weaponCfg.calibrationStyleId}
                      onChange={(e) =>
                        onUpdateWeapon({ ...weaponCfg, calibrationStyleId: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      {DPS_DATA.calibrationStyles.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.notes}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={weaponCfg.secondaryAttr1}
                        onChange={(e) =>
                          onUpdateWeapon({ ...weaponCfg, secondaryAttr1: e.target.value })
                        }
                        aria-label="Calibration Secondary Attribute 1"
                        className="rounded-lg border border-white/[0.1] bg-[#0c1114] px-2 py-1.5 text-[11px] text-slate-200 outline-none"
                      >
                        {DPS_DATA.calibrationSecondaryAttrs.map((a) => (
                          <option key={a.id} value={a.id}>
                            Attr 1: {a.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={weaponCfg.secondaryAttr2}
                        onChange={(e) =>
                          onUpdateWeapon({ ...weaponCfg, secondaryAttr2: e.target.value })
                        }
                        aria-label="Calibration Secondary Attribute 2"
                        className="rounded-lg border border-white/[0.1] bg-[#0c1114] px-2 py-1.5 text-[11px] text-slate-200 outline-none"
                      >
                        {DPS_DATA.calibrationSecondaryAttrs.map((a) => (
                          <option key={a.id} value={a.id}>
                            Attr 2: {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {slotId !== 'melee' && (
                    <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#3ee6c5]">
                        Ammo Type & Accessories
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-slate-400">Ammo Round</label>
                        <select
                          value={weaponCfg.ammoId}
                          onChange={(e) => onUpdateWeapon({ ...weaponCfg, ammoId: e.target.value })}
                          className="w-full rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5 py-1.5 text-xs text-white outline-none"
                        >
                          {DPS_DATA.ammoTypes.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.dmgMult}×) — {a.notes}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={weaponCfg.opticId}
                          onChange={(e) => onUpdateWeapon({ ...weaponCfg, opticId: e.target.value })}
                          className="rounded-lg border border-white/[0.1] bg-[#0c1114] px-2 py-1.5 text-[11px] text-slate-200 outline-none"
                        >
                          {DPS_DATA.weaponAccessories.optics.map((o) => (
                            <option key={o.id} value={o.id}>
                              Optic: {o.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={weaponCfg.muzzleId}
                          onChange={(e) =>
                            onUpdateWeapon({ ...weaponCfg, muzzleId: e.target.value })
                          }
                          className="rounded-lg border border-white/[0.1] bg-[#0c1114] px-2 py-1.5 text-[11px] text-slate-200 outline-none"
                        >
                          {DPS_DATA.weaponAccessories.muzzles.map((m) => (
                            <option key={m.id} value={m.id}>
                              Muzzle: {m.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={weaponCfg.tacticalId}
                          onChange={(e) =>
                            onUpdateWeapon({ ...weaponCfg, tacticalId: e.target.value })
                          }
                          className="rounded-lg border border-white/[0.1] bg-[#0c1114] px-2 py-1.5 text-[11px] text-slate-200 outline-none"
                        >
                          {DPS_DATA.weaponAccessories.tacticals.map((t) => (
                            <option key={t.id} value={t.id}>
                              Tactical: {t.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={weaponCfg.magId}
                          onChange={(e) => onUpdateWeapon({ ...weaponCfg, magId: e.target.value })}
                          className="rounded-lg border border-white/[0.1] bg-[#0c1114] px-2 py-1.5 text-[11px] text-slate-200 outline-none"
                        >
                          {DPS_DATA.weaponAccessories.magazines.map((m) => (
                            <option key={m.id} value={m.id}>
                              Mag: {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ARMOR-SPECIFIC CONTROLS: HIDE/WOOL + GENE FABRIC */}
              {!isWeapon && armorCfg && onUpdateArmor && (
                <>
                  <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3ee6c5]">
                        Hide / Wool Material
                      </span>
                      <span className="text-[10px] text-slate-400">Live stat active</span>
                    </div>

                    <input
                      type="text"
                      value={hideSearch}
                      onChange={(e) => setHideSearch(e.target.value)}
                      placeholder="Filter wool/hide or perk..."
                      className="w-full rounded-lg border border-white/[0.08] bg-[#0c1114] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#3ee6c5]/60"
                    />

                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {filteredHides.map((h) => {
                        const selected = armorCfg.hideId === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => onUpdateArmor({ ...armorCfg, hideId: h.id })}
                            className={`flex w-full items-center gap-2.5 rounded-lg border p-2 text-left transition ${
                              selected
                                ? 'border-[#3ee6c5] bg-[#3ee6c5]/12'
                                : 'border-white/[0.06] bg-[#0c1114] hover:border-white/20'
                            }`}
                          >
                            <MaterialIconGlyph name={h.name} accent="#3ee6c5" className="h-8 w-8" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-semibold text-white">{h.name}</span>
                                {selected && <Check className="h-3.5 w-3.5 text-[#3ee6c5]" />}
                              </div>
                              <div className="text-[10px] text-slate-300">
                                {h.effects[slotId as ArmorSlotKey]}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {armorCfg.tier === 5 && (
                    <div className="space-y-2 rounded-xl border border-amber-400/30 bg-[#131a1e] p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Tier V Gene Fabric
                      </div>
                      <select
                        value={armorCfg.geneFabricId}
                        onChange={(e) =>
                          onUpdateArmor({ ...armorCfg, geneFabricId: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/[0.1] bg-[#0c1114] px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        {GENE_FABRICS.map((gf) => (
                          <option key={gf.id} value={gf.id}>
                            {gf.name} — {gf.effect}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: ITEM PICKER */}
          {section === 'item' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder={`Search ${isWeapon ? 'weapons or keywords' : 'armor or sets'}...`}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#131a1e] py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-[#3ee6c5]"
                />
              </div>

              <div className="space-y-1.5">
                {isWeapon &&
                  weaponCatalog.map((w) => {
                    const active = weaponCfg?.weaponId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() =>
                          weaponCfg &&
                          onUpdateWeapon?.({
                            ...weaponCfg,
                            weaponId: w.id,
                          })
                        }
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                          active
                            ? 'border-[#3ee6c5] bg-[#3ee6c5]/12'
                            : 'border-white/[0.06] bg-[#131a1e] hover:border-white/20'
                        }`}
                      >
                        {w.imageUrl ? (
                          <img
                            src={w.imageUrl}
                            alt={w.name}
                            className="h-11 w-14 shrink-0 object-contain"
                          />
                        ) : (
                          <Crosshair className="h-6 w-6 text-slate-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold text-white">{w.name}</span>
                            <span className="text-[10px] text-amber-300">{w.rarity}</span>
                          </div>
                          <div className="text-[10px] text-[#3ee6c5]">
                            {w.category} · {w.archetype} ({w.element})
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                            {w.trait}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {!isWeapon &&
                  armorCatalog.map((a) => {
                    const active = armorCfg?.armorId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          armorCfg &&
                          onUpdateArmor?.({
                            ...armorCfg,
                            armorId: a.id,
                          })
                        }
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                          active
                            ? 'border-[#3ee6c5] bg-[#3ee6c5]/12'
                            : 'border-white/[0.06] bg-[#131a1e] hover:border-white/20'
                        }`}
                      >
                        {a.imageUrl ? (
                          <img
                            src={a.imageUrl}
                            alt={a.name}
                            className="h-11 w-11 shrink-0 object-contain"
                          />
                        ) : (
                          <Shield className="h-6 w-6 text-slate-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold text-white">{a.name}</span>
                            <span className="text-[10px] text-amber-300">{a.rarity}</span>
                          </div>
                          <div className="text-[10px] text-[#3ee6c5]">
                            {a.setName ?? 'Key / Standalone Piece'}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                            {a.onePieceBonus ?? a.effectSummary}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 3: MOD & SUBSTATS */}
          {section === 'mods' && (
            <div className="space-y-4">
              {/* Substats (up to 4) */}
              <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3ee6c5]">
                    Mod Substats ({substats.length}/4)
                  </span>
                  {substats.length < 4 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateSubstats([...substats, { stat: 'critDmgPct', rarity: 'epic' }])
                      }
                      className="inline-flex items-center gap-1 rounded border border-[#3ee6c5]/45 bg-[#3ee6c5]/15 px-2 py-0.5 text-[10px] font-semibold text-[#3ee6c5]"
                    >
                      <Plus className="h-3 w-3" /> Add Substat
                    </button>
                  )}
                </div>

                {substats.length === 0 && (
                  <div className="py-2 text-[11px] text-slate-500">
                    No substats configured. Click + Add Substat.
                  </div>
                )}

                <div className="space-y-2">
                  {substats.map((sub, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#0c1114] p-2"
                    >
                      <select
                        value={sub.stat}
                        onChange={(e) => {
                          const next = [...substats];
                          next[idx] = { ...sub, stat: e.target.value as StatKey, overrideValue: undefined };
                          updateSubstats(next);
                        }}
                        className="col-span-5 rounded border border-white/[0.1] bg-[#131a1e] px-1.5 py-1 text-[11px] text-white outline-none"
                      >
                        {DPS_DATA.substatTypes.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={sub.rarity}
                        onChange={(e) => {
                          const next = [...substats];
                          next[idx] = {
                            ...sub,
                            rarity: e.target.value as SubstatRarity,
                            overrideValue: undefined,
                          };
                          updateSubstats(next);
                        }}
                        className="col-span-3 rounded border border-white/[0.1] bg-[#131a1e] px-1.5 py-1 text-[11px] capitalize text-amber-300 outline-none"
                      >
                        {RARITIES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.5"
                        value={getSubstatValue(sub)}
                        onChange={(e) => {
                          const next = [...substats];
                          next[idx] = { ...sub, overrideValue: Number(e.target.value) };
                          updateSubstats(next);
                        }}
                        aria-label="Substat percent value"
                        className="col-span-3 rounded border border-white/[0.1] bg-[#131a1e] px-1.5 py-1 font-mono text-[11px] text-[#3ee6c5] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateSubstats(substats.filter((_, i) => i !== idx))}
                        className="col-span-1 flex justify-center text-slate-500 hover:text-rose-400"
                        aria-label="Remove substat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Mod Preview + Picker */}
              <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3ee6c5]">
                    Equipped {modSlot} Mod
                  </span>
                  {activeMod && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isWeapon && weaponCfg) onUpdateWeapon?.({ ...weaponCfg, modId: '' });
                        else if (!isWeapon && armorCfg) onUpdateArmor?.({ ...armorCfg, modId: '' });
                      }}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Unequip
                    </button>
                  )}
                </div>

                {activeMod ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-[#3ee6c5]/35 bg-[#0c1114] p-2.5">
                    <img
                      src={activeMod.imageUrl}
                      alt={activeMod.name}
                      className="h-10 w-10 shrink-0 rounded border border-white/10 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white">
                        {activeMod.name}{' '}
                        <span className="text-[10px] text-amber-300">({activeMod.variant})</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-300">
                        {activeMod.primaryEffect}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/[0.1] p-2.5 text-center text-[11px] text-slate-500">
                    No {modSlot} mod equipped
                  </div>
                )}

                <input
                  type="text"
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  placeholder={`Search ${modSlot} mods (e.g. Violent, Bounce, Crit)...`}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0c1114] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#3ee6c5]"
                />

                <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                  {modCatalog.map((m) => {
                    const selected = activeModId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (isWeapon && weaponCfg) onUpdateWeapon?.({ ...weaponCfg, modId: m.id });
                          else if (!isWeapon && armorCfg) onUpdateArmor?.({ ...armorCfg, modId: m.id });
                        }}
                        className={`flex w-full items-start gap-2.5 rounded-lg border p-2 text-left transition ${
                          selected
                            ? 'border-[#3ee6c5] bg-[#3ee6c5]/12'
                            : 'border-white/[0.06] bg-[#0c1114] hover:border-white/20'
                        }`}
                      >
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          className="h-9 w-9 shrink-0 rounded object-contain"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold text-white">
                              {m.name} · {m.variant}
                            </span>
                            {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#3ee6c5]" />}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[10px] text-slate-400">
                            {m.primaryEffect}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

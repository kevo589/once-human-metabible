import { Check, Crosshair, Search, Shield, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DPS_DATA,
  normalizeSlotForArmorCatalog,
  previewArmorSlotStats,
  previewWeaponSlotStats,
  type ActiveWeaponSlotKey,
  type ArmorSlotConfig,
  type EquipSlotId,
  type WeaponSlotConfig,
} from '../../data/dps/dpsEngine';
import { ARMOR_SETS, MODS } from '../../data/gearAndMods';
import {
  clampModLevel,
  evaluateSubStatValue,
  MOD_CODEX,
  MOD_SUBSTAT_SET_BY_ID,
  MOD_SUBSTATS_PER_LEVEL,
  resolveCodexMod,
  type ModSlotName,
} from '../../data/mods/modCatalog';
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
const CORE_LEVELS = [1, 2, 3, 4, 5] as const;
const ROMAN_LEVELS = ['I', 'II', 'III', 'IV', 'V'] as const;

function mapEquipSlotToCodexSlot(slotId: EquipSlotId | null): ModSlotName {
  switch (slotId) {
    case 'helmet':
      return 'Helmet';
    case 'mask':
      return 'Mask';
    case 'top':
      return 'Top';
    case 'bottoms':
      return 'Bottoms';
    case 'shoes':
      return 'Shoes';
    case 'gloves':
      return 'Gloves';
    default:
      return 'Weapon';
  }
}

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
  const modSlot = mapEquipSlotToCodexSlot(slotId);

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
    return MOD_CODEX.filter((m) => {
      if (m.slot !== modSlot) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.obtain.toLowerCase().includes(q) ||
        m.subStatSetIds.some((sid) => {
          const s = MOD_SUBSTAT_SET_BY_ID.get(sid);
          return s ? s.name.toLowerCase().includes(q) : false;
        })
      );
    });
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
  const activeLegacyMod = MODS.find((m) => m.id === activeModId) ?? null;
  const activeCodexMod = resolveCodexMod(activeModId) ?? null;
  const modCoreLevel = clampModLevel(
    (isWeapon ? weaponCfg?.modCoreLevel : armorCfg?.modCoreLevel) ?? 5,
  );
  const availableSubStatSetIds =
    activeCodexMod?.subStatSetIds ?? ['violent', 'talents', 'precision'];
  const rawSetId = isWeapon ? weaponCfg?.modSubStatSetId : armorCfg?.modSubStatSetId;
  const activeSubStatSetId =
    rawSetId && MOD_SUBSTAT_SET_BY_ID.has(rawSetId)
      ? rawSetId
      : availableSubStatSetIds[0] ?? 'violent';
  const activeSubStatSet = MOD_SUBSTAT_SET_BY_ID.get(activeSubStatSetId) ?? null;
  const rawLevels = isWeapon ? weaponCfg?.modSubStatLevels : armorCfg?.modSubStatLevels;
  const modSubStatLevels: [number, number, number, number] = [
    clampModLevel(rawLevels?.[0] ?? 5),
    clampModLevel(rawLevels?.[1] ?? 4),
    clampModLevel(rawLevels?.[2] ?? 4),
    clampModLevel(rawLevels?.[3] ?? 3),
  ];
  const upgradeScore =
    modSubStatLevels[0] + modSubStatLevels[1] + modSubStatLevels[2] + modSubStatLevels[3];

  const patchSlotMod = (
    patch: Partial<Pick<WeaponSlotConfig, 'modId' | 'modCoreLevel' | 'modSubStatSetId' | 'modSubStatLevels'>>,
  ) => {
    if (isWeapon && weaponCfg && onUpdateWeapon) {
      onUpdateWeapon({ ...weaponCfg, ...patch });
    } else if (!isWeapon && armorCfg && onUpdateArmor) {
      onUpdateArmor({ ...armorCfg, ...patch });
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
              {/* Active Mod Preview + Core Effect Level I-V */}
              <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-[#131a1e] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3ee6c5]">
                    Equipped {modSlot} Mod
                  </span>
                  {(activeCodexMod || activeLegacyMod) && (
                    <button
                      type="button"
                      onClick={() => patchSlotMod({ modId: '' })}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Unequip
                    </button>
                  )}
                </div>

                {activeCodexMod || activeLegacyMod ? (
                  <div className="space-y-2.5 rounded-lg border border-[#3ee6c5]/35 bg-[#0c1114] p-2.5">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={activeCodexMod?.iconUrl || activeLegacyMod?.imageUrl || ''}
                        alt={activeCodexMod?.name || activeLegacyMod?.name || 'Mod'}
                        className="h-10 w-10 shrink-0 rounded border border-white/10 bg-[#111626] object-contain p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-white">
                            {activeCodexMod?.name ?? activeLegacyMod?.name}
                          </span>
                          {activeSubStatSet && (
                            <span className="rounded bg-[#3ee6c5]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#3ee6c5]">
                              {activeSubStatSet.name}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[10px] leading-relaxed text-slate-300">
                          {activeCodexMod
                            ? activeCodexMod.coreEffectByLevel[String(modCoreLevel)] ??
                              activeCodexMod.summary
                            : activeLegacyMod?.primaryEffect}
                        </div>
                      </div>
                    </div>

                    {/* Core Effect Level I - V */}
                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        Core Effect Level
                      </span>
                      <div className="flex items-center gap-1">
                        {CORE_LEVELS.map((lvl, idx) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => patchSlotMod({ modCoreLevel: lvl })}
                            className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold transition ${
                              modCoreLevel === lvl
                                ? 'bg-[#3ee6c5] text-[#091214]'
                                : 'bg-white/[0.06] text-slate-400 hover:text-white'
                            }`}
                          >
                            {ROMAN_LEVELS[idx]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/[0.1] p-2.5 text-center text-[11px] text-slate-500">
                    No {modSlot} mod equipped
                  </div>
                )}

                {/* Sub-Stat Set & 4 Sub-Stats Level 1-5 */}
                <div className="space-y-2 rounded-lg border border-white/[0.06] bg-[#0c1114] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3ee6c5]">
                      Sub-Stat Set
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Upgrade Score{' '}
                      <span className="font-bold text-white">{upgradeScore}/20</span>
                    </span>
                  </div>

                  <select
                    value={activeSubStatSetId}
                    onChange={(e) => patchSlotMod({ modSubStatSetId: e.target.value })}
                    aria-label="Sub-Stat Set"
                    className="w-full rounded border border-white/[0.12] bg-[#131a1e] px-2 py-1.5 text-xs text-white outline-none focus:border-[#3ee6c5]"
                  >
                    {availableSubStatSetIds.map((sid) => {
                      const def = MOD_SUBSTAT_SET_BY_ID.get(sid);
                      return (
                        <option key={sid} value={sid}>
                          {def ? def.name : sid}
                        </option>
                      );
                    })}
                  </select>

                  {activeSubStatSet && (
                    <div className="space-y-1.5 pt-1">
                      {activeSubStatSet.stats.map((statId, idx) => {
                        const def = MOD_SUBSTATS_PER_LEVEL[statId];
                        const lv = modSubStatLevels[idx] ?? 1;
                        const evaluated = evaluateSubStatValue(statId, lv);
                        return (
                          <div
                            key={`${statId}-${idx}`}
                            className="flex items-center justify-between gap-2 rounded border border-white/[0.05] bg-[#131a1e] px-2 py-1.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[11px] font-medium text-slate-200">
                                {def?.label ?? statId}
                              </div>
                              <div className="font-mono text-[10px] text-[#3ee6c5]">
                                {evaluated ? `+${evaluated.value.toFixed(1)}%` : 'Conditional'}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              {CORE_LEVELS.map((stepLv) => (
                                <button
                                  key={stepLv}
                                  type="button"
                                  onClick={() => {
                                    const next: [number, number, number, number] = [
                                      ...modSubStatLevels,
                                    ];
                                    next[idx] = stepLv;
                                    patchSlotMod({ modSubStatLevels: next });
                                  }}
                                  className={`h-5 w-5 rounded font-mono text-[10px] font-bold transition ${
                                    lv === stepLv
                                      ? 'bg-[#3ee6c5] text-[#091214]'
                                      : 'bg-white/[0.05] text-slate-400 hover:text-white'
                                  }`}
                                  title={`Set sub-stat level ${stepLv}`}
                                >
                                  {stepLv}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mod Picker */}
                <input
                  type="text"
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  placeholder={`Search ${modSlot} mods (e.g. Violent, Siphon, Crit)...`}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0c1114] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#3ee6c5]"
                />

                <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                  {modCatalog.map((m) => {
                    const selected = activeCodexMod?.id === m.id || activeModId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          patchSlotMod({
                            modId: m.id,
                            modCoreLevel: modCoreLevel,
                            modSubStatSetId: m.subStatSetIds.includes(activeSubStatSetId)
                              ? activeSubStatSetId
                              : m.subStatSetIds[0],
                            modSubStatLevels,
                          })
                        }
                        className={`flex w-full items-start gap-2.5 rounded-lg border p-2 text-left transition ${
                          selected
                            ? 'border-[#3ee6c5] bg-[#3ee6c5]/12'
                            : 'border-white/[0.06] bg-[#0c1114] hover:border-white/20'
                        }`}
                      >
                        <img
                          src={m.iconUrl}
                          alt={m.name}
                          className="h-9 w-9 shrink-0 rounded bg-[#111626] object-contain p-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold text-white">{m.name}</span>
                            {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#3ee6c5]" />}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[10px] text-slate-400">
                            {m.summary}
                          </div>
                          {m.obtain && (
                            <div className="mt-0.5 truncate text-[9px] text-cyan-400/80">
                              {m.obtain}
                            </div>
                          )}
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

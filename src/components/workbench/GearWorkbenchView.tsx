import { Check, Crosshair, Filter, Footprints, HardHat, Package, Search, Shield, Shirt, Sparkles, VenetianMask, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ARMOR_SETS } from '../../data/gearAndMods';
import { WEAPONS } from '../../data/weapons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Archetype, Rarity, Weapon } from '../../types/game';
import {
  computeArmorCraft,
  normalizeArmorSlotKey,
  type CraftTier,
  type QueuedCraftItem,
} from '../../utils/craftingEngine';
import { CraftQueueView } from './CraftQueueView';
import { CraftingInspectorPanel } from './CraftingInspectorPanel';
import { CustomMaterialPopover, GeneFabricPopover } from './CustomMaterialPopover';
import { BENCH_BP_GRADIENT, StarRatingDisplay } from './MaterialVisuals';

export type WorkbenchTabId = 'weapon' | 'armor' | 'queue';

interface GearWorkbenchViewProps {
  initialTab?: WorkbenchTabId;
  highlightedId?: string | null;
  onSimulateWeapon?: (weapon: Weapon) => void;
}

type ArmorRailSlot = 'Helmet' | 'Top' | 'Bottom' | 'Gloves' | 'Shoes' | 'Mask';
type WeaponRailSlot =
  | 'All'
  | 'Pistol'
  | 'Shotgun'
  | 'SMG'
  | 'Assault Rifle'
  | 'Sniper Rifle'
  | 'LMG'
  | 'Crossbow'
  | 'Heavy'
  | 'Melee';

const ARMOR_SLOTS: Array<{ id: ArmorRailSlot; label: string; header: string; icon: typeof Shield }> = [
  { id: 'Helmet', label: 'Helmet', header: 'Helmet', icon: HardHat },
  { id: 'Top', label: 'Top', header: 'Top', icon: Shirt },
  { id: 'Bottom', label: 'Bottoms', header: 'Bottoms', icon: Shield },
  { id: 'Gloves', label: 'Gloves', header: 'Gloves', icon: Sparkles },
  { id: 'Shoes', label: 'Shoes', header: 'Shoes', icon: Footprints },
  { id: 'Mask', label: 'Mask', header: 'Mask', icon: VenetianMask },
];

const WEAPON_SLOTS: Array<{ id: WeaponRailSlot; label: string }> = [
  { id: 'All', label: 'ALL' },
  { id: 'Pistol', label: 'PST' },
  { id: 'Shotgun', label: 'SHG' },
  { id: 'SMG', label: 'SMG' },
  { id: 'Assault Rifle', label: 'AR' },
  { id: 'Sniper Rifle', label: 'SNP' },
  { id: 'LMG', label: 'LMG' },
  { id: 'Crossbow', label: 'BOW' },
  { id: 'Heavy', label: 'HVY' },
  { id: 'Melee', label: 'MEL' },
];

const WEAPON_KEYWORDS: Array<'All' | Archetype> = [
  'All',
  'Bounce',
  'Shrapnel',
  'Frost Vortex',
  'Burn',
  'Power Surge',
  "Bull's Eye",
  'Fast Gunner',
  'Unstable Bomber',
  'Fortress Warfare',
];

const RARITIES: Array<'All' | Rarity> = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

export function GearWorkbenchView({
  initialTab = 'armor',
  highlightedId,
  onSimulateWeapon,
}: GearWorkbenchViewProps) {
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>(initialTab);
  const [armorSlot, setArmorSlot] = useState<ArmorRailSlot>('Top');
  const [weaponSlot, setWeaponSlot] = useState<WeaponRailSlot>('All');

  const [selectedArmorId, setSelectedArmorId] = useState<string>(() => {
    const savior = ARMOR_SETS.find((a) => a.id === 'savior-top');
    return savior?.id ?? ARMOR_SETS[0]?.id ?? '';
  });
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(WEAPONS[0]?.id ?? '');

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<'All' | Rarity>('All');
  const [keywordOrSetFilter, setKeywordOrSetFilter] = useState<string>('All');

  // Craft configuration state (persisted)
  const [tier, setTier] = useLocalStorage<CraftTier>('oh-wb-tier-v1', 5);
  const [starsByItem, setStarsByItem] = useLocalStorage<Record<string, number>>('oh-wb-stars-v1', {});
  const [hideByArmorId, setHideByArmorId] = useLocalStorage<Record<string, string>>(
    'oh-wb-hides-v1',
    {},
  );
  const [geneFabricByArmorId, setGeneFabricByArmorId] = useLocalStorage<Record<string, string>>(
    'oh-wb-fabrics-v1',
    {},
  );
  const [craftQueue, setCraftQueue] = useLocalStorage<QueuedCraftItem[]>('oh-wb-queue-v1', []);
  const [inventoryMode, setInventoryMode] = useLocalStorage<boolean>('oh-wb-inv-mode-v1', false);
  const [inventoryOwned, setInventoryOwned] = useLocalStorage<Record<string, number>>(
    'oh-wb-owned-v1',
    {},
  );
  const [gatheredMaterials, setGatheredMaterials] = useLocalStorage<Record<string, boolean>>(
    'oh-wb-gathered-v1',
    {},
  );
  const [, setSavedBuilds] = useLocalStorage<string[]>('oh-wb-saved-builds-v1', []);

  // Popovers & Mobile Inspector Drawer
  const [hidePickerOpen, setHidePickerOpen] = useState(false);
  const [genePickerOpen, setGenePickerOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((c) => (c === msg ? null : c));
    }, 2200);
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Sync external Global Search highlights cleanly
  useEffect(() => {
    if (!highlightedId) return;
    const armorHit = ARMOR_SETS.find((a) => a.id === highlightedId);
    if (armorHit) {
      setActiveTab('armor');
      if (
        armorHit.slot === 'Helmet' ||
        armorHit.slot === 'Top' ||
        armorHit.slot === 'Bottom' ||
        armorHit.slot === 'Gloves' ||
        armorHit.slot === 'Shoes' ||
        armorHit.slot === 'Mask'
      ) {
        setArmorSlot(armorHit.slot);
      }
      setSelectedArmorId(armorHit.id);
      return;
    }
    const weaponHit = WEAPONS.find((w) => w.id === highlightedId);
    if (weaponHit) {
      setActiveTab('weapon');
      setSelectedWeaponId(weaponHit.id);
    }
  }, [highlightedId]);

  const armorSetNames = useMemo(() => {
    const sets = new Set<string>();
    for (const a of ARMOR_SETS) {
      if (a.setName) sets.add(a.setName);
    }
    return ['All', ...Array.from(sets).sort()];
  }, []);

  const filteredArmor = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ARMOR_SETS.filter((a) => {
      if (a.slot !== armorSlot) return false;
      if (rarityFilter !== 'All' && a.rarity !== rarityFilter) return false;
      if (keywordOrSetFilter !== 'All' && (a.setName || 'Key Piece') !== keywordOrSetFilter) {
        return false;
      }
      if (
        q &&
        !a.name.toLowerCase().includes(q) &&
        !(a.setName ?? '').toLowerCase().includes(q) &&
        !a.effectSummary.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [armorSlot, rarityFilter, keywordOrSetFilter, searchQuery]);

  const filteredWeapons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return WEAPONS.filter((w) => {
      if (weaponSlot !== 'All') {
        if (weaponSlot === 'Heavy') {
          if (w.category !== 'Flamethrower' && w.category !== 'Rocket Launcher') return false;
        } else if (w.category !== weaponSlot) {
          return false;
        }
      }
      if (rarityFilter !== 'All' && w.rarity !== rarityFilter) return false;
      if (keywordOrSetFilter !== 'All' && w.archetype !== keywordOrSetFilter) return false;
      if (
        q &&
        !w.name.toLowerCase().includes(q) &&
        !w.archetype.toLowerCase().includes(q) &&
        !w.trait.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [weaponSlot, rarityFilter, keywordOrSetFilter, searchQuery]);

  const selectedArmor = useMemo(
    () =>
      ARMOR_SETS.find((a) => a.id === selectedArmorId) ?? filteredArmor[0] ?? ARMOR_SETS[0] ?? null,
    [selectedArmorId, filteredArmor],
  );

  const selectedWeapon = useMemo(
    () =>
      WEAPONS.find((w) => w.id === selectedWeaponId) ?? filteredWeapons[0] ?? WEAPONS[0] ?? null,
    [selectedWeaponId, filteredWeapons],
  );

  const activeItemId = activeTab === 'armor' ? selectedArmor?.id ?? '' : selectedWeapon?.id ?? '';
  const activeStars = starsByItem[activeItemId] ?? (selectedArmor?.rarity === 'Legendary' || selectedWeapon?.rarity === 'Legendary' ? 6 : 4);
  const selectedHideId = selectedArmor ? hideByArmorId[selectedArmor.id] ?? 'golden_wool' : 'golden_wool';
  const selectedGeneFabricId = selectedArmor ? geneFabricByArmorId[selectedArmor.id] ?? 'none' : 'none';

  const totalQueuedEl = useMemo(
    () => craftQueue.reduce((sum, item) => sum + item.elCost, 0),
    [craftQueue],
  );

  const sectionHeader =
    activeTab === 'armor'
      ? ARMOR_SLOTS.find((s) => s.id === armorSlot)?.header ?? armorSlot
      : weaponSlot === 'All'
        ? 'All Weapons'
        : weaponSlot === 'Heavy'
          ? 'Heavy & Launchers'
          : weaponSlot;

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0f1417] text-slate-100 shadow-2xl">
      {/* Top Navigation Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#141a1e]/95 px-4">
        <nav className="flex items-center gap-1 sm:gap-4" aria-label="Gear Workbench tabs">
          {[
            { id: 'weapon' as const, label: 'Weapon Crafting' },
            { id: 'armor' as const, label: 'Armor Crafting' },
            { id: 'queue' as const, label: `Craft Queue (${craftQueue.length})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setKeywordOrSetFilter('All');
                  setHidePickerOpen(false);
                  setGenePickerOpen(false);
                }}
                className={`relative py-3.5 text-xs font-semibold tracking-wide transition sm:text-sm ${
                  active ? 'text-[#3ee6c5]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#3ee6c5] shadow-[0_0_12px_#3ee6c5]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/20"
            title="Queued Energy Links Total"
          >
            <Package className="h-3.5 w-3.5" />
            <span>{totalQueuedEl.toLocaleString()} EL</span>
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0f1417] px-2.5 py-1 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={inventoryMode}
              onChange={(e) => setInventoryMode(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#3ee6c5]"
            />
            <span>Inventory Mode</span>
          </label>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-3 sm:p-4">
        {activeTab === 'queue' ? (
          <CraftQueueView
            queue={craftQueue}
            inventoryMode={inventoryMode}
            inventoryOwned={inventoryOwned}
            gatheredMaterials={gatheredMaterials}
            onToggleGathered={(name) =>
              setGatheredMaterials((prev) => ({ ...prev, [name]: !prev[name] }))
            }
            onUpdateOwned={(name, val) =>
              setInventoryOwned((prev) => ({ ...prev, [name]: val }))
            }
            onDuplicateItem={(item) => {
              setCraftQueue((prev) => [
                ...prev,
                { ...item, queueId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
              ]);
              showToast(`Added another ${item.name}`);
            }}
            onRemoveItem={(queueId) =>
              setCraftQueue((prev) => prev.filter((item) => item.queueId !== queueId))
            }
            onClearQueue={() => setCraftQueue([])}
            onGoToCrafting={() => setActiveTab('armor')}
          />
        ) : (
          /* 3-Column Tactical Workbench Grid */
          <div className="grid gap-3.5 lg:grid-cols-[56px_minmax(0,1fr)_360px]">
            {/* 1. Left Vertical Slot Rail */}
            <aside
              className="flex flex-row gap-1.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#141a1e] p-1.5 lg:flex-col lg:overflow-visible"
              aria-label="Equipment slot rail"
            >
              {activeTab === 'armor'
                ? ARMOR_SLOTS.map((slot) => {
                    const Icon = slot.icon;
                    const active = armorSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setArmorSlot(slot.id);
                          const firstMatch = ARMOR_SETS.find((a) => a.slot === slot.id);
                          if (firstMatch) setSelectedArmorId(firstMatch.id);
                          setHidePickerOpen(false);
                          setGenePickerOpen(false);
                        }}
                        title={slot.label}
                        aria-label={slot.label}
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition lg:w-full ${
                          active
                            ? 'border-[#3ee6c5]/50 bg-[#1db99b]/15 text-[#3ee6c5]'
                            : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        {active && (
                          <span className="absolute bottom-1.5 left-0 top-1.5 hidden w-0.5 rounded-r bg-[#3ee6c5] shadow-[0_0_8px_#3ee6c5] lg:block" />
                        )}
                        <Icon className="h-4.5 w-4.5" />
                      </button>
                    );
                  })
                : WEAPON_SLOTS.map((slot) => {
                    const active = weaponSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setWeaponSlot(slot.id);
                        }}
                        title={slot.id}
                        aria-label={slot.id}
                        className={`relative flex h-10 shrink-0 items-center justify-center rounded-lg border px-2 font-mono text-[10px] font-bold tracking-wider transition lg:w-full lg:px-0 ${
                          active
                            ? 'border-[#3ee6c5]/50 bg-[#1db99b]/15 text-[#3ee6c5]'
                            : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        {active && (
                          <span className="absolute bottom-1.5 left-0 top-1.5 hidden w-0.5 rounded-r bg-[#3ee6c5] shadow-[0_0_8px_#3ee6c5] lg:block" />
                        )}
                        {slot.label}
                      </button>
                    );
                  })}
            </aside>

            {/* 2. Center Blueprint Grid */}
            <section className="flex min-h-[520px] flex-col rounded-xl border border-white/[0.08] bg-[#141a1e]/85 p-3.5">
              {/* Section Header with teal pipe & dashed horizontal rule */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-white">
                  <span className="h-4 w-1 rounded-full bg-[#3ee6c5]" />
                  <span>{sectionHeader}</span>
                </div>
                <div className="flex-1 border-b border-dashed border-white/[0.12]" />
                <span className="font-mono text-[11px] text-slate-400">
                  {activeTab === 'armor' ? filteredArmor.length : filteredWeapons.length} B.P.
                </span>
              </div>

              {/* Scrollable 4-Column Landscape Blueprint Cards */}
              <div className="flex-1 overflow-y-auto pr-1 lg:max-h-[600px]">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {activeTab === 'armor'
                    ? filteredArmor.map((armor) => {
                        const selected = selectedArmor?.id === armor.id;
                        const itemStars =
                          starsByItem[armor.id] ?? (armor.rarity === 'Legendary' ? 6 : 4);
                        return (
                          <button
                            key={armor.id}
                            type="button"
                            onClick={() => {
                              setSelectedArmorId(armor.id);
                              setHidePickerOpen(false);
                              setGenePickerOpen(false);
                              if (window.innerWidth < 1024) setMobileInspectorOpen(true);
                            }}
                            className={`group relative aspect-[16/9] overflow-hidden rounded-xl border p-2.5 text-left transition ${
                              BENCH_BP_GRADIENT[armor.rarity] ?? BENCH_BP_GRADIENT.Common
                            } ${
                              selected
                                ? 'ring-2 ring-[#3ee6c5] shadow-[0_0_20px_rgba(62,230,197,0.22)]'
                                : 'hover:border-white/30'
                            }`}
                          >
                            <div className="relative z-10 flex h-full flex-col justify-between">
                              <StarRatingDisplay stars={itemStars} size="xs" />
                              <div className="max-w-[68%]">
                                <div className="truncate text-xs font-semibold text-white drop-shadow">
                                  {armor.name}
                                </div>
                                <div className="truncate text-[10px] text-slate-300/80">
                                  {armor.setName ?? 'Key Piece'}
                                </div>
                              </div>
                            </div>
                            <img
                              src={armor.imageUrl}
                              alt={armor.name}
                              loading="lazy"
                              className="pointer-events-none absolute bottom-1 right-1 h-[84%] w-[44%] object-contain opacity-95 transition group-hover:scale-105"
                            />
                          </button>
                        );
                      })
                    : filteredWeapons.map((weapon) => {
                        const selected = selectedWeapon?.id === weapon.id;
                        const itemStars =
                          starsByItem[weapon.id] ?? (weapon.rarity === 'Legendary' ? 6 : 4);
                        return (
                          <button
                            key={weapon.id}
                            type="button"
                            onClick={() => {
                              setSelectedWeaponId(weapon.id);
                              if (window.innerWidth < 1024) setMobileInspectorOpen(true);
                            }}
                            className={`group relative aspect-[16/9] overflow-hidden rounded-xl border p-2.5 text-left transition ${
                              BENCH_BP_GRADIENT[weapon.rarity] ?? BENCH_BP_GRADIENT.Common
                            } ${
                              selected
                                ? 'ring-2 ring-[#3ee6c5] shadow-[0_0_20px_rgba(62,230,197,0.22)]'
                                : 'hover:border-white/30'
                            }`}
                          >
                            <div className="relative z-10 flex h-full flex-col justify-between">
                              <StarRatingDisplay stars={itemStars} size="xs" />
                              <div className="max-w-[66%]">
                                <div className="truncate text-xs font-semibold text-white drop-shadow">
                                  {weapon.name}
                                </div>
                                <div className="truncate text-[10px] text-[#3ee6c5]/90">
                                  {weapon.archetype}
                                </div>
                              </div>
                            </div>
                            <img
                              src={weapon.imageUrl}
                              alt={weapon.name}
                              loading="lazy"
                              className="pointer-events-none absolute bottom-1 right-1 h-[82%] w-[46%] object-contain opacity-95 transition group-hover:scale-105"
                            />
                          </button>
                        );
                      })}
                </div>
              </div>

              {/* Bottom-Left Filter & Search Bar */}
              <div className="mt-3 space-y-2 border-t border-white/[0.08] pt-3">
                {filterOpen && (
                  <div className="space-y-2 rounded-lg border border-white/[0.08] bg-[#0f1417] p-2.5 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="mr-1 text-[10px] text-slate-500">Rarity:</span>
                      {RARITIES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRarityFilter(r)}
                          className={`rounded px-2 py-0.5 transition ${
                            rarityFilter === r
                              ? 'bg-[#3ee6c5]/20 text-[#3ee6c5]'
                              : 'bg-white/[0.04] text-slate-400 hover:text-white'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1 border-t border-white/[0.06] pt-2">
                      <span className="mr-1 text-[10px] text-slate-500">
                        {activeTab === 'armor' ? 'Armor Set:' : 'Keyword:'}
                      </span>
                      {(activeTab === 'armor' ? armorSetNames.slice(0, 14) : WEAPON_KEYWORDS).map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setKeywordOrSetFilter(tag)}
                            className={`rounded px-2 py-0.5 transition ${
                              keywordOrSetFilter === tag
                                ? 'bg-[#3ee6c5]/20 text-[#3ee6c5]'
                                : 'bg-white/[0.04] text-slate-400 hover:text-white'
                            }`}
                          >
                            {tag}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2 sm:max-w-md">
                    <button
                      type="button"
                      onClick={() => setFilterOpen((v) => !v)}
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                        filterOpen || rarityFilter !== 'All' || keywordOrSetFilter !== 'All'
                          ? 'border-[#3ee6c5]/60 bg-[#3ee6c5]/15 text-[#3ee6c5]'
                          : 'border-white/[0.08] bg-[#0f1417] text-slate-400 hover:text-white'
                      }`}
                      title="Filter blueprints by Rarity / Set / Keyword"
                      aria-label="Filter blueprints"
                    >
                      <Filter className="h-3.5 w-3.5" />
                    </button>

                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${activeTab === 'armor' ? 'armor' : 'weapon'} blueprint...`}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#0f1417] py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-500 outline-none focus:border-[#3ee6c5]/60"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Inspector Trigger */}
                  <button
                    type="button"
                    onClick={() => setMobileInspectorOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#3ee6c5]/50 bg-[#1db99b]/15 px-3 py-1.5 text-xs font-semibold text-[#3ee6c5] lg:hidden"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                    Inspect & Craft
                  </button>
                </div>
              </div>
            </section>

            {/* 3. Right Crafting Inspector Panel (Desktop Docked) */}
            <div className="hidden lg:block lg:h-[700px]">
              <CraftingInspectorPanel
                mode={activeTab}
                selectedArmor={selectedArmor}
                selectedWeapon={selectedWeapon}
                tier={tier}
                onChangeTier={setTier}
                stars={activeStars}
                onChangeStars={(s) =>
                  setStarsByItem((prev) => ({ ...prev, [activeItemId]: s }))
                }
                selectedHideId={selectedHideId}
                selectedGeneFabricId={selectedGeneFabricId}
                onOpenHidePicker={() => {
                  setGenePickerOpen(false);
                  setHidePickerOpen((v) => !v);
                }}
                onOpenGeneFabricPicker={() => {
                  setHidePickerOpen(false);
                  setGenePickerOpen((v) => !v);
                }}
                inventoryMode={inventoryMode}
                inventoryOwned={inventoryOwned}
                onUpdateOwned={(name, val) =>
                  setInventoryOwned((prev) => ({ ...prev, [name]: val }))
                }
                onAddToQueue={(item) => {
                  setCraftQueue((prev) => [
                    ...prev,
                    {
                      ...item,
                      queueId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    },
                  ]);
                  showToast(`Queued Tier ${item.tier} ${item.name}`);
                }}
                onSaveToBuild={async (summary) => {
                  setSavedBuilds((prev) => [summary, ...prev.slice(0, 11)]);
                  await navigator.clipboard?.writeText(summary).catch(() => {});
                  showToast('Saved to build & copied summary');
                }}
                onSimulateWeapon={onSimulateWeapon}
              />
            </div>
          </div>
        )}
      </div>

      {/* Responsive Slide-up Inspector Drawer on Mobile Portrait (< lg) */}
      {mobileInspectorOpen && activeTab !== 'queue' && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/70 p-2 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileInspectorOpen(false)}
        >
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <CraftingInspectorPanel
              mode={activeTab}
              selectedArmor={selectedArmor}
              selectedWeapon={selectedWeapon}
              tier={tier}
              onChangeTier={setTier}
              stars={activeStars}
              onChangeStars={(s) =>
                setStarsByItem((prev) => ({ ...prev, [activeItemId]: s }))
              }
              selectedHideId={selectedHideId}
              selectedGeneFabricId={selectedGeneFabricId}
              onOpenHidePicker={() => {
                setGenePickerOpen(false);
                setHidePickerOpen(true);
              }}
              onOpenGeneFabricPicker={() => {
                setHidePickerOpen(false);
                setGenePickerOpen(true);
              }}
              inventoryMode={inventoryMode}
              inventoryOwned={inventoryOwned}
              onUpdateOwned={(name, val) =>
                setInventoryOwned((prev) => ({ ...prev, [name]: val }))
              }
              onAddToQueue={(item) => {
                setCraftQueue((prev) => [
                  ...prev,
                  {
                    ...item,
                    queueId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  },
                ]);
                showToast(`Queued Tier ${item.tier} ${item.name}`);
              }}
              onSaveToBuild={async (summary) => {
                setSavedBuilds((prev) => [summary, ...prev.slice(0, 11)]);
                await navigator.clipboard?.writeText(summary).catch(() => {});
                showToast('Saved to build & copied summary');
              }}
              onSimulateWeapon={onSimulateWeapon}
              isMobileSheet
              onCloseMobileSheet={() => setMobileInspectorOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Custom Material List Popover (Wool / Hide / Fur) */}
      {hidePickerOpen && activeTab === 'armor' && selectedArmor && (
        <CustomMaterialPopover
          slotKey={normalizeArmorSlotKey(selectedArmor.slot)}
          hideCount={
            computeArmorCraft(
              selectedArmor,
              tier,
              activeStars,
              selectedHideId,
              selectedGeneFabricId,
            ).hideCount
          }
          selectedHideId={selectedHideId}
          onConfirm={(hideId) =>
            setHideByArmorId((prev) => ({ ...prev, [selectedArmor.id]: hideId }))
          }
          onClose={() => setHidePickerOpen(false)}
        />
      )}

      {/* Tier V Gene Fabric Popover */}
      {genePickerOpen && activeTab === 'armor' && selectedArmor && (
        <GeneFabricPopover
          slotKey={normalizeArmorSlotKey(selectedArmor.slot)}
          selectedId={selectedGeneFabricId}
          onSelect={(gfId) =>
            setGeneFabricByArmorId((prev) => ({ ...prev, [selectedArmor.id]: gfId }))
          }
          onClose={() => setGenePickerOpen(false)}
        />
      )}

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#3ee6c5]/50 bg-[#141a1e]/95 px-3.5 py-2 text-xs font-medium text-[#3ee6c5] shadow-2xl">
          <Check className="h-3.5 w-3.5" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

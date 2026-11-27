import { useEffect, useMemo, useState } from 'react';
import {
  Bomb,
  Crosshair,
  ExternalLink,
  Flame,
  Footprints,
  Hand,
  Heart,
  Layers,
  Search,
  Shield,
  Shirt,
  Snowflake,
  Sparkles,
  Swords,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { MODS } from '../../data/gearAndMods';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Archetype, ElementType, ModItem, Rarity } from '../../types/game';
import { cn } from '../../utils/cn';

interface ModsMatrixViewProps {
  highlightedId?: string | null;
}

type CategoryKey = Archetype | 'Universal';

interface ModCollectionEntry {
  owned: boolean;
  tier: Rarity;
}

const SLOT_CONFIG: Array<{
  id: ModItem['slot'];
  label: string;
  icon: typeof Swords;
}> = [
  { id: 'Weapon', label: 'Weapon', icon: Swords },
  { id: 'Helmet', label: 'Helmet', icon: Shield },
  { id: 'Mask', label: 'Mask', icon: Wind },
  { id: 'Top', label: 'Top', icon: Shirt },
  { id: 'Bottom', label: 'Bottom', icon: Layers },
  { id: 'Shoes', label: 'Shoes', icon: Footprints },
  { id: 'Gloves', label: 'Gloves', icon: Hand },
];

const CATEGORY_META: Record<
  CategoryKey,
  {
    label: string;
    tag: string;
    element: ElementType;
    summary: string;
    accentText: string;
    icon: typeof Zap;
  }
> = {
  Burn: {
    label: 'Burn',
    tag: 'Blaze DoT',
    element: 'Blaze',
    summary: 'Applies stacking Blaze DoT and triggers Fiery Explosions against burning targets.',
    accentText: 'text-[#fb923c]',
    icon: Flame,
  },
  'Power Surge': {
    label: 'Power Surge',
    tag: 'Instant DMG',
    element: 'Shock',
    summary: 'Deals instant Shock DMG and scales Shock Trigger Chance & Surge multipliers.',
    accentText: 'text-[#5eead4]',
    icon: Zap,
  },
  'Frost Vortex': {
    label: 'Frost Vortex',
    tag: 'AoE Control',
    element: 'Frost',
    summary: 'Spawns freezing vortex zones that chill enemies and detonate Frost Status DMG.',
    accentText: 'text-[#67e8f9]',
    icon: Snowflake,
  },
  'Unstable Bomber': {
    label: 'Unstable Bomber',
    tag: 'Blast AoE',
    element: 'Blast',
    summary: 'Triggers delayed Blast explosions that scale with Elemental DMG and Crit DMG.',
    accentText: 'text-[#fb7185]',
    icon: Bomb,
  },
  "Bull's Eye": {
    label: "Bull's Eye",
    tag: 'Weakspot',
    element: 'Physical',
    summary: 'Marks enemies with Hunter’s Mark / Vulnerability and amplifies Weakspot precision hits.',
    accentText: 'text-[#cbd5e1]',
    icon: Crosshair,
  },
  Shrapnel: {
    label: 'Shrapnel',
    tag: 'Multi-Hit',
    element: 'Physical',
    summary: 'Splits hits across extra enemy body parts with high Crit DMG scaling.',
    accentText: 'text-[#d4a853]',
    icon: Sparkles,
  },
  Bounce: {
    label: 'Bounce',
    tag: 'Ricochet',
    element: 'Physical',
    summary: 'Bounces bullets between nearby targets for sustained multi-target clearing.',
    accentText: 'text-[#5eead4]',
    icon: Wind,
  },
  'Fast Gunner': {
    label: 'Fast Gunner',
    tag: 'Fire Rate',
    element: 'Physical',
    summary: 'Ramps Fire Rate, Attack, and ammo sustain during continuous firing.',
    accentText: 'text-[#38bdf8]',
    icon: Zap,
  },
  'Fortress Warfare': {
    label: 'Fortress Warfare',
    tag: 'Zone Buff',
    element: 'Physical',
    summary: 'Generates defensive combat zones granting Weapon DMG and Super Armor.',
    accentText: 'text-[#cbd5e1]',
    icon: Shield,
  },
  Standard: {
    label: 'Ballistic / Weapon',
    tag: 'Physical',
    element: 'Physical',
    summary: 'Core Weapon DMG, Crit, Reload, and Magazine scaling mods.',
    accentText: 'text-[#cbd5e1]',
    icon: Swords,
  },
  Universal: {
    label: 'Universal & Survival',
    tag: 'Utility',
    element: 'Universal',
    summary: 'General combat, Deviant Energy, Sanity, HP, and movement utility mods.',
    accentText: 'text-[#94a3b8]',
    icon: Heart,
  },
};

const CATEGORY_ORDER: CategoryKey[] = [
  'Burn',
  'Power Surge',
  'Frost Vortex',
  'Unstable Bomber',
  "Bull's Eye",
  'Shrapnel',
  'Bounce',
  'Fast Gunner',
  'Fortress Warfare',
  'Standard',
  'Universal',
];

const SEASONAL_SUFFIXES = new Set([
  'Lunar',
  'Lunar Deviant Energy',
  'Downstar',
  'Downstar Deviant Energy',
  'Crescent',
  'Crescent Deviant Energy',
  'Phantasmal',
  'Phantasmal Deviant Energy',
  'Wild',
  'Wild Deviant Energy',
  'Mirror',
  'Mirror Deviant Energy',
  'Aero',
  'Aero Deviant Energy',
  'Resonance',
  'Resonance Deviant Energy',
]);

const GOLD_SUFFIXES = new Set([
  'Burn',
  'Frost Vortex',
  'Power Surge',
  'Unstable Bomber',
  'Shrapnel',
  'Bounce',
  "Bull's Eye",
  'Fast Gunner',
  'Fortress Warfare',
  'Lunar',
  'Lunar Deviant Energy',
  'Resonance',
  'Resonance Deviant Energy',
  'Downstar',
  'Downstar Deviant Energy',
  'Crescent',
  'Crescent Deviant Energy',
]);

const PURPLE_SUFFIXES = new Set([
  'Violent',
  'Precision',
  'Deviant Energy',
  'Aero',
  'Aero Deviant Energy',
  'Wild',
  'Wild Deviant Energy',
  'Phantasmal',
  'Phantasmal Deviant Energy',
  'Mirror',
  'Mirror Deviant Energy',
]);

function inferSuffixDefaultTier(variant: string): Rarity {
  if (GOLD_SUFFIXES.has(variant)) return 'Legendary';
  if (PURPLE_SUFFIXES.has(variant)) return 'Epic';
  return 'Rare';
}

const TILE_TIER_STYLES: Record<Rarity, string> = {
  Legendary: 'border-[#b8934a]/70 bg-[#2a2112]/90 hover:border-[#d4a853]',
  Epic: 'border-[#8b5cf6]/70 bg-[#1e1630]/90 hover:border-[#a78bfa]',
  Rare: 'border-[#38bdf8]/60 bg-[#102130]/90 hover:border-[#38bdf8]',
  Uncommon: 'border-[#34d399]/60 bg-[#0f241c]/90 hover:border-[#34d399]',
  Common: 'border-[#64748b]/50 bg-[#141922]/90 hover:border-[#94a3b8]',
};

const HEADER_GRADIENT_STYLES: Record<Rarity, string> = {
  Legendary: 'from-[#8c6b2d] to-[#5a441b] text-[#fef3c7]',
  Epic: 'from-[#6d3fb5] to-[#442573] text-[#f3e8ff]',
  Rare: 'from-[#1d6fa3] to-[#134669] text-[#e0f2fe]',
  Uncommon: 'from-[#1c7c5c] to-[#114d39] text-[#d1fae5]',
  Common: 'from-[#334155] to-[#1e293b] text-[#e2e8f0]',
};

const TIER_LEVEL_BADGE: Record<Rarity, string> = {
  Legendary: '15',
  Epic: '8',
  Rare: '5',
  Uncommon: '3',
  Common: '-',
};

export function ModsMatrixView({ highlightedId }: ModsMatrixViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<ModItem['slot']>('Weapon');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('Power Surge');
  const [searchText, setSearchText] = useState('');
  const [suffixFilter, setSuffixFilter] = useState<string>('All');
  const [eraMode, setEraMode] = useState<'all' | 'classic' | 'seasonal'>('all');
  const [colorMode, setColorMode] = useState<'suffix' | 'collection'>('suffix');
  const [selectedMod, setSelectedMod] = useState<ModItem | null>(null);

  const [equippedBySlot, setEquippedBySlot] = useLocalStorage<Partial<Record<ModItem['slot'], string>>>(
    'oh-equipped-mods',
    {},
  );
  const [collectionMap, setCollectionMap] = useLocalStorage<Record<string, ModCollectionEntry>>(
    'oh-mod-collection',
    {},
  );

  // Sync deep-linked search hit from Ctrl+K
  useEffect(() => {
    if (!highlightedId) return;
    const hit = MODS.find((m) => m.id === highlightedId);
    if (!hit) return;
    setSelectedSlot(hit.slot);
    setSelectedCategory(hit.archetype);
    setSelectedMod(hit);
  }, [highlightedId]);

  const slotMods = useMemo(
    () => MODS.filter((m) => m.slot === selectedSlot),
    [selectedSlot],
  );

  const availableCategories = useMemo(() => {
    const present = new Set(slotMods.map((m) => m.archetype));
    return CATEGORY_ORDER.filter((cat) => present.has(cat));
  }, [slotMods]);

  // Keep selectedCategory valid when switching gear slots
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  const categoryMods = useMemo(
    () => slotMods.filter((m) => m.archetype === selectedCategory),
    [slotMods, selectedCategory],
  );

  const availableSuffixes = useMemo(() => {
    const set = new Set(categoryMods.map((m) => m.variant));
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [categoryMods]);

  useEffect(() => {
    if (suffixFilter !== 'All' && !availableSuffixes.includes(suffixFilter)) {
      setSuffixFilter('All');
    }
  }, [availableSuffixes, suffixFilter]);

  const filteredCategoryMods = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return categoryMods.filter((m) => {
      if (suffixFilter !== 'All' && m.variant !== suffixFilter) return false;
      if (eraMode === 'classic' && SEASONAL_SUFFIXES.has(m.variant)) return false;
      if (eraMode === 'seasonal' && !SEASONAL_SUFFIXES.has(m.variant)) return false;
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.variant.toLowerCase().includes(q) &&
        !m.primaryEffect.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [categoryMods, suffixFilter, eraMode, searchText]);

  // Group into matrix rows: 1 row per Mod Name -> columns of Suffix Tiles
  const modRows = useMemo(() => {
    const grouped = new Map<string, ModItem[]>();
    for (const m of filteredCategoryMods) {
      const list = grouped.get(m.name);
      if (list) list.push(m);
      else grouped.set(m.name, [m]);
    }
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredCategoryMods]);

  const getVisualTier = (mod: ModItem): { tier: Rarity; isDimmed: boolean } => {
    if (colorMode === 'collection') {
      const entry = collectionMap[mod.id];
      if (!entry || !entry.owned) {
        return { tier: 'Common', isDimmed: true };
      }
      return { tier: entry.tier, isDimmed: false };
    }
    return { tier: inferSuffixDefaultTier(mod.variant), isDimmed: false };
  };

  const categoryFamilyNames = useMemo(
    () => Array.from(new Set(categoryMods.map((m) => m.name))),
    [categoryMods],
  );

  const ownedInCategoryCount = useMemo(() => {
    if (colorMode === 'suffix') return categoryFamilyNames.length;
    const ownedNames = new Set(
      categoryMods.filter((m) => collectionMap[m.id]?.owned).map((m) => m.name),
    );
    return ownedNames.size;
  }, [categoryFamilyNames.length, categoryMods, collectionMap, colorMode]);

  const equippedId = equippedBySlot[selectedSlot];
  const equippedMod = useMemo(
    () => (equippedId ? MODS.find((m) => m.id === equippedId) ?? null : null),
    [equippedId],
  );
  const equippedCount = Object.values(equippedBySlot).filter(Boolean).length;

  const meta = CATEGORY_META[selectedCategory] ?? CATEGORY_META.Universal;
  const selectedVisualTier = selectedMod ? getVisualTier(selectedMod).tier : 'Legendary';
  const safeSelectedHref =
    selectedMod &&
    (selectedMod.referenceUrl.startsWith('https://') || selectedMod.referenceUrl.startsWith('http://'))
      ? selectedMod.referenceUrl
      : undefined;

  const handleEquipMod = (mod: ModItem) => {
    setEquippedBySlot((prev) => ({ ...prev, [mod.slot]: mod.id }));
    setCollectionMap((prev) => ({
      ...prev,
      [mod.id]: { owned: true, tier: prev[mod.id]?.tier ?? inferSuffixDefaultTier(mod.variant) },
    }));
  };

  const handleSetOwnedTier = (mod: ModItem, tier: Rarity | null) => {
    setCollectionMap((prev) => {
      if (!tier) {
        const copy = { ...prev };
        delete copy[mod.id];
        return copy;
      }
      return { ...prev, [mod.id]: { owned: true, tier } };
    });
    if (tier) setColorMode('collection');
  };

  return (
    <div className="space-y-3">
      {/* Top Status Strip matching mockup */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#232e3f] bg-[#0d1118] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
          <span className="font-semibold text-[#f1f5f9]">Mod Matrix</span>
          <span className="text-[#232e3f]">|</span>
          <span>
            {MODS.length.toLocaleString()} total variants across {SLOT_CONFIG.length} slots
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-[#232e3f] bg-[#11161f] px-2.5 py-1 font-mono text-[11px] text-[#94a3b8]">
            Equipped <span className="text-[#5eead4]">{equippedCount}/7</span>
          </div>

          <div className="flex rounded-lg border border-[#232e3f] bg-[#11161f] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setColorMode('suffix')}
              className={cn(
                'rounded-md px-2 py-1 transition',
                colorMode === 'suffix' ? 'bg-[#18202c] text-[#f1f5f9]' : 'text-[#64748b] hover:text-[#94a3b8]',
              )}
            >
              Suffix Tiers
            </button>
            <button
              type="button"
              onClick={() => setColorMode('collection')}
              className={cn(
                'rounded-md px-2 py-1 transition',
                colorMode === 'collection' ? 'bg-[#0d2b2b] text-[#5eead4]' : 'text-[#64748b] hover:text-[#94a3b8]',
              )}
            >
              My Bag
            </button>
          </div>
        </div>
      </div>

      {/* Main 4-Part In-Game Layout: [Slot Rail] [Category Rail] [Matrix] [Right Summary] */}
      <div className="grid gap-3 lg:grid-cols-[56px_56px_minmax(0,1fr)_270px]">
        {/* 1. Far-Left Gear Slot Vertical Icon Rail */}
        <div className="flex flex-row gap-1 overflow-x-auto rounded-xl border border-[#232e3f] bg-[#0d1118] p-1.5 lg:flex-col lg:overflow-visible">
          {SLOT_CONFIG.map((slot) => {
            const Icon = slot.icon;
            const active = selectedSlot === slot.id;
            const hasEquipped = Boolean(equippedBySlot[slot.id]);
            return (
              <button
                key={slot.id}
                type="button"
                title={`${slot.label} Mods`}
                onClick={() => {
                  setSelectedSlot(slot.id);
                  setSelectedMod(null);
                }}
                className={cn(
                  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition lg:w-full',
                  active
                    ? 'bg-[#0d2b2b] text-[#5eead4]'
                    : 'text-[#64748b] hover:bg-[#151b24] hover:text-[#cbd5e1]',
                )}
              >
                {active && (
                  <span className="absolute bottom-2 left-0 top-2 hidden w-0.5 rounded-r bg-[#5eead4] lg:block" />
                )}
                <Icon className="h-4 w-4" />
                {hasEquipped && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#5eead4]" />
                )}
              </button>
            );
          })}
        </div>

        {/* 2. Secondary Element / Keyword Vertical Icon Rail */}
        <div className="flex flex-row gap-1 overflow-x-auto rounded-xl border border-[#232e3f] bg-[#0d1118] p-1.5 lg:flex-col lg:overflow-visible">
          {availableCategories.map((cat) => {
            const cMeta = CATEGORY_META[cat];
            const Icon = cMeta.icon;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                title={cMeta.label}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedMod(null);
                }}
                className={cn(
                  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition lg:w-full',
                  active
                    ? 'border-[#2dd4bf]/60 bg-[#0d2b2b] text-[#5eead4]'
                    : 'border-transparent text-[#64748b] hover:bg-[#151b24] hover:text-[#cbd5e1]',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? cMeta.accentText : '')} />
              </button>
            );
          })}
        </div>

        {/* 3. Center Mod Matrix + Floating/Docked Inspector + Bottom Controls */}
        <div className="relative flex min-h-[540px] flex-col justify-between rounded-xl border border-[#232e3f] bg-[#0d1118] p-4">
          <div>
            {/* Matrix Header */}
            <div className="flex items-center justify-between border-b border-[#232e3f] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-0.5 rounded bg-[#5eead4]" />
                <h2 className="text-sm font-semibold text-[#f1f5f9]">
                  {meta.label} Mods
                </h2>
                <span className="text-xs text-[#64748b]">· {selectedSlot} Slot</span>
              </div>
              <span className="font-mono text-[11px] text-[#64748b]">
                {modRows.length} mods · {filteredCategoryMods.length} tiles
              </span>
            </div>

            {/* Matrix Rows */}
            <div className="max-h-[430px] divide-y divide-[#232e3f]/80 overflow-y-auto pr-1">
              {modRows.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#64748b]">
                  No mods match the current search or suffix filter.
                </div>
              ) : (
                modRows.map(([modName, variants]) => (
                  <div
                    key={modName}
                    className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="w-full shrink-0 text-xs font-medium text-[#f1f5f9] sm:w-44">
                      {modName}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {variants.map((mod) => {
                        const isSelected = selectedMod?.id === mod.id;
                        const isEquipped = equippedBySlot[selectedSlot] === mod.id;
                        const { tier, isDimmed } = getVisualTier(mod);

                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => setSelectedMod(isSelected ? null : mod)}
                            title={`${mod.name} <${mod.variant}>`}
                            className={cn(
                              'group relative flex h-16 w-16 flex-col items-center justify-center rounded-lg border p-1.5 transition',
                              isSelected
                                ? 'border-[#5eead4] bg-[#0d2b2b] ring-1 ring-[#5eead4]/60'
                                : TILE_TIER_STYLES[tier],
                              isDimmed && !isSelected && 'opacity-45 hover:opacity-80',
                            )}
                          >
                            <span className="absolute left-1 top-0.5 font-mono text-[9px] text-[#94a3b8]">
                              {colorMode === 'collection' && !collectionMap[mod.id]?.owned
                                ? '-'
                                : TIER_LEVEL_BADGE[tier]}
                            </span>

                            {isEquipped && (
                              <span
                                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#5eead4]"
                                title="Equipped"
                              />
                            )}

                            <img
                              src={mod.imageUrl}
                              alt={`${mod.name} ${mod.variant}`}
                              loading="lazy"
                              decoding="async"
                              className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
                            />

                            <span className="mt-0.5 w-full truncate text-center text-[9px] leading-none text-[#cbd5e1]">
                              {mod.variant}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Floating Mod Inspector Card (Screenshot #1 style) */}
          {selectedMod && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#232e3f] bg-[#151b24] shadow-2xl lg:absolute lg:right-4 lg:top-14 lg:z-20 lg:mt-0 lg:w-80">
              <div
                className={cn(
                  'flex items-start justify-between gap-2 bg-gradient-to-r px-4 py-3',
                  HEADER_GRADIENT_STYLES[selectedVisualTier],
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-snug">
                    {selectedMod.name} &lt;{selectedMod.variant}&gt;
                  </div>
                  <div className="mt-0.5 text-[11px] opacity-80">
                    {selectedMod.slot} Mods · {selectedMod.element}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMod(null)}
                  className="rounded p-0.5 opacity-80 hover:bg-black/20 hover:opacity-100"
                  aria-label="Close mod card"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 p-4 text-xs">
                <p className="leading-relaxed text-[#f1f5f9]">{selectedMod.primaryEffect}</p>

                <div className="space-y-1 border-t border-[#232e3f] pt-2.5 text-[11px] text-[#94a3b8]">
                  <div className="font-medium text-[#cbd5e1]">Recommended Substats</div>
                  {selectedMod.recommendedSubstats.map((sub) => (
                    <div key={sub}>· {sub}</div>
                  ))}
                </div>

                {/* Optional Bag Tier Selector */}
                <div className="border-t border-[#232e3f] pt-2.5">
                  <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#64748b]">
                    My Bag Tier
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(['Legendary', 'Epic', 'Rare', 'Uncommon'] as Rarity[]).map((t) => {
                      const active = collectionMap[selectedMod.id]?.tier === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleSetOwnedTier(selectedMod, t)}
                          className={cn(
                            'rounded border px-2 py-0.5 text-[10px] transition',
                            active
                              ? 'border-[#5eead4] bg-[#0d2b2b] text-[#5eead4]'
                              : 'border-[#232e3f] bg-[#0d1118] text-[#94a3b8] hover:text-[#f1f5f9]',
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                    {collectionMap[selectedMod.id]?.owned && (
                      <button
                        type="button"
                        onClick={() => handleSetOwnedTier(selectedMod, null)}
                        className="rounded border border-[#232e3f] px-2 py-0.5 text-[10px] text-[#64748b] hover:text-[#fb7185]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleEquipMod(selectedMod)}
                    className="flex-1 rounded-lg bg-[#2dd4bf] px-3 py-2 text-xs font-semibold text-[#071a1a] transition hover:bg-[#5eead4]"
                  >
                    {equippedBySlot[selectedMod.slot] === selectedMod.id ? 'Equipped' : 'Equip Mod'}
                  </button>

                  {safeSelectedHref && (
                    <a
                      href={safeSelectedHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-[#232e3f] bg-[#0d1118] p-2 text-[#94a3b8] hover:text-[#f1f5f9]"
                      title="Open on OnceHumanDB"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Search & Suffix Bar matching screenshots */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#232e3f] pt-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search mods or effects..."
                className="w-full rounded-lg border border-[#232e3f] bg-[#11161f] py-1.5 pl-8 pr-3 text-xs text-[#f1f5f9] placeholder-[#64748b] outline-none focus:border-[#5eead4]/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={suffixFilter}
                onChange={(e) => setSuffixFilter(e.target.value)}
                className="rounded-lg border border-[#232e3f] bg-[#11161f] px-2.5 py-1.5 text-xs text-[#f1f5f9] outline-none"
              >
                {availableSuffixes.map((suf) => (
                  <option key={suf} value={suf}>
                    {suf === 'All' ? 'All Suffixes' : suf}
                  </option>
                ))}
              </select>

              <div className="flex rounded-lg border border-[#232e3f] bg-[#11161f] p-0.5 text-[11px]">
                {(['all', 'classic', 'seasonal'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setEraMode(mode)}
                    className={cn(
                      'rounded-md px-2 py-1 capitalize transition',
                      eraMode === mode
                        ? 'bg-[#0d2b2b] text-[#5eead4]'
                        : 'text-[#64748b] hover:text-[#cbd5e1]',
                    )}
                  >
                    {mode === 'seasonal' ? 'New' : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Right Category Summary & Equipped Slot Panel */}
        <aside className="flex flex-col justify-between gap-4 rounded-xl border border-[#232e3f] bg-[#0d1118] p-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[#f1f5f9]">{meta.label}</h3>
                <span className="rounded border border-[#232e3f] bg-[#151b24] px-2 py-0.5 text-[10px] font-medium text-[#5eead4]">
                  {meta.tag}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">{meta.summary}</p>
            </div>

            <div className="border-t border-[#232e3f] pt-3">
              <div className="text-2xl font-semibold font-mono text-[#f1f5f9]">
                {categoryMods.length}
              </div>
              <div className="text-[11px] text-[#64748b]">
                {meta.label} Suffix Variants in {selectedSlot}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[#94a3b8]">
                  {colorMode === 'collection' ? 'Collection Progress' : 'Mod Families'}
                </span>
                <span className="font-mono text-[#f1f5f9]">
                  {ownedInCategoryCount} / {categoryFamilyNames.length}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#151b24]">
                <div
                  className="h-full rounded-full bg-[#2dd4bf] transition-all duration-300"
                  style={{
                    width: `${
                      categoryFamilyNames.length > 0
                        ? Math.round((ownedInCategoryCount / categoryFamilyNames.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Active Equipped Mod Card */}
            <div className="rounded-xl border border-[#232e3f] bg-[#11161f] p-3">
              <div className="text-[11px] font-medium text-[#94a3b8]">
                Equipped in {selectedSlot} Slot
              </div>
              {equippedMod ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(equippedMod.archetype);
                    setSelectedMod(equippedMod);
                  }}
                  className="mt-2 flex w-full items-center gap-2.5 text-left hover:opacity-90"
                >
                  <img
                    src={equippedMod.imageUrl}
                    alt={equippedMod.name}
                    className="h-9 w-9 rounded border border-[#b8934a]/50 bg-[#2a2112]/60 object-contain p-1"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-[#f1f5f9]">
                      {equippedMod.name}
                    </div>
                    <div className="truncate text-[11px] text-[#5eead4]">
                      &lt;{equippedMod.variant}&gt;
                    </div>
                  </div>
                </button>
              ) : (
                <div className="mt-2 text-xs text-[#64748b]">
                  No mod equipped. Click any tile and press Equip Mod.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#232e3f] pt-3 text-[11px] leading-relaxed text-[#64748b]">
            Click any tile to inspect its effect, set your bag tier, or equip it to your {selectedSlot.toLowerCase()} slot.
          </div>
        </aside>
      </div>
    </div>
  );
}

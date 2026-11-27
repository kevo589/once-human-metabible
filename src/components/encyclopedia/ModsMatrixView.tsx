import { Menu, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MOD_CODEX,
  MOD_SLOT_ORDER,
  MOD_SUBSTAT_SET_BY_ID,
  MOD_SUBSTATS_PER_LEVEL,
  resolveCodexMod,
  type CodexModItem,
  type ModSlotName,
} from '../../data/mods/modCatalog';
import { ModDetailView } from './ModDetailView';

interface ModsMatrixViewProps {
  highlightedId?: string | null;
  onEquipInDps?: (
    mod: CodexModItem,
    targetWeaponSlot?: 'primary' | 'secondary' | 'melee',
  ) => void;
  onLocateOnMap?: (poiId: string) => void;
}

export function ModsMatrixView({
  highlightedId,
  onEquipInDps,
  onLocateOnMap,
}: ModsMatrixViewProps) {
  const [slotFilter, setSlotFilter] = useState<'All' | ModSlotName>('All');
  const [search, setSearch] = useState('');
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false);
  const [selectedMod, setSelectedMod] = useState<CodexModItem | null>(null);
  const sectionRefs = useRef<Partial<Record<ModSlotName, HTMLElement | null>>>({});

  // Support Global Search navigation to any mod
  useEffect(() => {
    if (!highlightedId) return;
    const hit = resolveCodexMod(highlightedId);
    if (hit) {
      setSelectedMod(hit);
    }
  }, [highlightedId]);

  const filteredMods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOD_CODEX.filter((m) => {
      if (slotFilter !== 'All' && m.slot !== slotFilter) return false;
      if (!q) return true;

      if (m.name.toLowerCase().includes(q)) return true;
      if (m.summary.toLowerCase().includes(q)) return true;
      if (m.obtain.toLowerCase().includes(q)) return true;
      if (m.archetypeTag.toLowerCase().includes(q)) return true;
      if (m.slot.toLowerCase().includes(q)) return true;

      // Match core effect per level
      for (const eff of Object.values(m.coreEffectByLevel)) {
        if (eff.toLowerCase().includes(q)) return true;
      }

      // Match Sub-Stat Set names or Sub-Stat names
      for (const sid of m.subStatSetIds) {
        const setDef = MOD_SUBSTAT_SET_BY_ID.get(sid);
        if (!setDef) continue;
        if (setDef.name.toLowerCase().includes(q)) return true;
        for (const statId of setDef.stats) {
          const statDef = MOD_SUBSTATS_PER_LEVEL[statId];
          if (statDef && statDef.label.toLowerCase().includes(q)) return true;
        }
      }

      return false;
    });
  }, [slotFilter, search]);

  const groupedBySlot = useMemo(() => {
    const map = new Map<ModSlotName, CodexModItem[]>();
    for (const s of MOD_SLOT_ORDER) map.set(s, []);
    for (const m of filteredMods) {
      map.get(m.slot)?.push(m);
    }
    return MOD_SLOT_ORDER.map((slot) => ({
      slot,
      items: map.get(slot) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filteredMods]);

  const handleQuickJump = (slot: 'All' | ModSlotName) => {
    setJumpMenuOpen(false);
    setSelectedMod(null);
    if (slot === 'All') {
      setSlotFilter('All');
      return;
    }
    if (slotFilter !== 'All' && slotFilter !== slot) {
      setSlotFilter(slot);
      return;
    }
    const el = sectionRefs.current[slot];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setSlotFilter(slot);
    }
  };

  if (selectedMod) {
    return (
      <ModDetailView
        mod={selectedMod}
        onBack={() => setSelectedMod(null)}
        onSelectMod={(next) => setSelectedMod(next)}
        onEquipInDps={onEquipInDps}
        onLocateOnMap={onLocateOnMap}
      />
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-white/[0.08] bg-[#07080a] p-3 text-slate-100 sm:p-5">
      {/* Sticky Sub-Header Bar */}
      <div className="sticky top-0 z-20 -mx-1 space-y-2.5 border-b border-white/[0.08] bg-[#07080a]/95 px-1 pb-3 pt-1 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Slot Jump Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setJumpMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#10131c] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-cyan-400/50 hover:text-cyan-300"
            >
              <Menu className="h-3.5 w-3.5 text-cyan-400" />
              <span>Mods</span>
            </button>

            {jumpMenuOpen && (
              <div className="absolute left-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-white/[0.12] bg-[#10131c] p-1 text-xs shadow-2xl">
                <button
                  type="button"
                  onClick={() => handleQuickJump('All')}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-slate-200 hover:bg-white/[0.06] hover:text-cyan-300"
                >
                  <span>All Slots</span>
                  <span className="font-mono text-[10px] text-[#8b92a5]">
                    {MOD_CODEX.length}
                  </span>
                </button>
                {MOD_SLOT_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleQuickJump(s)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-slate-200 hover:bg-white/[0.06] hover:text-cyan-300"
                  >
                    <span>{s}</span>
                    <span className="font-mono text-[10px] text-[#8b92a5]">
                      {MOD_CODEX.filter((m) => m.slot === s).length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Instant Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b92a5]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mod, effect, Violent / Downstar / Aero, or Silo - PSI..."
              className="w-full rounded-lg border border-white/[0.1] bg-[#10131c] py-1.5 pl-8 pr-8 text-xs text-white placeholder-[#8b92a5] outline-none focus:border-cyan-400/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b92a5] hover:text-white"
                aria-label="Clear mod search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <span className="font-mono text-[11px] text-[#8b92a5]">
            {filteredMods.length} mods
          </span>
        </div>

        {/* Quick Slot Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setSlotFilter('All')}
            className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              slotFilter === 'All'
                ? 'bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-400/40'
                : 'bg-[#10131c] text-[#8b92a5] hover:text-white'
            }`}
          >
            All Slots
          </button>
          {MOD_SLOT_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlotFilter(s)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                slotFilter === s
                  ? 'bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-400/40'
                  : 'bg-[#10131c] text-[#8b92a5] hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Slot-Grouped Directory */}
      <div className="space-y-7">
        {groupedBySlot.map((group) => (
          <section
            key={group.slot}
            ref={(el) => {
              sectionRefs.current[group.slot] = el;
            }}
            className="scroll-mt-24 space-y-3"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b92a5]">
                {group.slot.toUpperCase()}
              </h2>
              <span className="font-mono text-[11px] font-semibold text-slate-400">
                {group.items.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-3 xl:grid-cols-4">
              {group.items.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  title={`${mod.name} — ${mod.summary}`}
                  onClick={() => setSelectedMod(mod)}
                  className="group flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left transition hover:border-white/[0.08] hover:bg-[#10131c]"
                >
                  <img
                    src={mod.iconUrl}
                    alt={mod.name}
                    loading="lazy"
                    className="h-5 w-5 shrink-0 object-contain opacity-85 transition group-hover:scale-110 group-hover:opacity-100"
                  />
                  <span className="truncate text-sm font-medium text-slate-200 group-hover:text-cyan-300">
                    {mod.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        {groupedBySlot.length === 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-[#10131c] py-12 text-center text-xs text-[#8b92a5]">
            No mods match "{search}". Try a mod name, sub-stat set (Violent, Aero, Downstar), or drop location (Silo - PSI).
          </div>
        )}
      </div>
    </div>
  );
}

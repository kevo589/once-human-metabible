import { Check, Filter, Search, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  GENE_FABRICS,
  HIDES_AND_WOOLS,
  type ArmorSlotKey,
  type GeneFabricDef,
  type HideOrWoolDef,
} from '../../utils/craftingEngine';
import { MaterialIconGlyph, MATERIAL_RARITY_BORDER } from './MaterialVisuals';

interface CustomMaterialPopoverProps {
  slotKey: ArmorSlotKey;
  hideCount: number;
  selectedHideId: string;
  onConfirm: (hideId: string) => void;
  onClose: () => void;
}

const STAT_TAGS = [
  'All',
  'Cold Resist',
  'Heat Resist',
  'Stamina',
  'HP/Heal',
  'Movement Speed',
  'Damage/Crit',
  'Carry Weight',
  'Team',
  'Low HP',
  'Dream Zone',
];

const RARITY_OPTIONS: Array<'All' | HideOrWoolDef['rarity']> = [
  'All',
  'legendary',
  'epic',
  'fine',
  'common',
];

const SLOT_TITLES: Record<ArmorSlotKey, string> = {
  helmet: 'Helmet',
  top: 'Top',
  bottoms: 'Bottoms',
  gloves: 'Gloves',
  shoes: 'Shoes',
  mask: 'Mask',
};

export function CustomMaterialPopover({
  slotKey,
  hideCount,
  selectedHideId,
  onConfirm,
  onClose,
}: CustomMaterialPopoverProps) {
  const [draftId, setDraftId] = useState(selectedHideId);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<'All' | HideOrWoolDef['rarity']>('All');
  const [tagFilter, setTagFilter] = useState('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HIDES_AND_WOOLS.filter((item) => {
      if (rarityFilter !== 'All' && item.rarity !== rarityFilter) return false;
      if (tagFilter !== 'All' && !item.tags.includes(tagFilter)) return false;
      if (q) {
        const eff = item.effects[slotKey].toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          eff.includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, rarityFilter, tagFilter, slotKey]);

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 flex max-h-[82dvh] flex-col overflow-hidden rounded-xl border border-white/[0.12] bg-[#141a1e]/98 text-slate-100 shadow-2xl backdrop-blur-md lg:inset-x-auto lg:bottom-auto lg:right-[388px] lg:top-20 lg:max-h-[calc(100dvh-7rem)] lg:w-[370px]"
      role="dialog"
      aria-label="Custom Material List"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0f1417]/90 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white">Custom Material List</h3>
          <p className="text-[11px] text-[#3ee6c5]">
            Slot Perk Preview: {SLOT_TITLES[slotKey]} · Requires ×{hideCount}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
          aria-label="Close material list"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search & Funnel Filter Bar */}
      <div className="space-y-2 border-b border-white/[0.08] bg-[#0f1417]/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
              filterOpen || rarityFilter !== 'All' || tagFilter !== 'All'
                ? 'border-[#3ee6c5]/60 bg-[#3ee6c5]/15 text-[#3ee6c5]'
                : 'border-white/[0.08] bg-[#141a1e] text-slate-400 hover:text-white'
            }`}
            title="Filter by rarity or stat tag"
            aria-label="Toggle material filters"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hide, wool, fur or perk..."
              className="w-full rounded-lg border border-white/[0.08] bg-[#0f1417] py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-500 outline-none focus:border-[#3ee6c5]/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {filterOpen && (
          <div className="space-y-2 rounded-lg border border-white/[0.08] bg-[#0f1417] p-2.5 text-[11px]">
            <div className="flex flex-wrap gap-1">
              {RARITY_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarityFilter(r)}
                  className={`rounded px-2 py-0.5 capitalize transition ${
                    rarityFilter === r
                      ? 'bg-[#3ee6c5]/20 text-[#3ee6c5]'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'fine' ? 'Fine (Blue)' : r}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 border-t border-white/[0.06] pt-2">
              {STAT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tag)}
                  className={`rounded px-2 py-0.5 transition ${
                    tagFilter === tag
                      ? 'bg-[#3ee6c5]/20 text-[#3ee6c5]'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Rows */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {filtered.map((mat) => {
          const active = draftId === mat.id;
          const accentColor =
            mat.rarity === 'legendary'
              ? '#fbbf24'
              : mat.rarity === 'epic'
                ? '#c084fc'
                : mat.rarity === 'fine'
                  ? '#38bdf8'
                  : '#94a3b8';

          return (
            <button
              key={mat.id}
              type="button"
              onClick={() => setDraftId(mat.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                active
                  ? 'border-[#3ee6c5] bg-[#1db99b]/15 shadow-[0_0_16px_rgba(62,230,197,0.14)]'
                  : 'border-white/[0.06] bg-[#0f1417]/75 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${
                  MATERIAL_RARITY_BORDER[mat.rarity]
                }`}
              >
                <MaterialIconGlyph name={mat.name} accent={accentColor} className="h-9 w-9" />
                <span className="absolute bottom-0.5 right-1 rounded bg-black/55 px-1 font-mono text-[10px] font-bold text-white drop-shadow">
                  ×{hideCount}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-white">{mat.name}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#3ee6c5]" />}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-300">
                  {mat.effects[slotKey]}
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            No matching hides or wools found.
          </div>
        )}
      </div>

      {/* Confirm Footer */}
      <div className="border-t border-white/[0.08] bg-[#0f1417]/95 p-3">
        <button
          type="button"
          onClick={() => {
            onConfirm(draftId);
            onClose();
          }}
          className="w-full rounded-lg bg-[#3ee6c5] py-2.5 text-xs font-bold uppercase tracking-wider text-[#091214] shadow-lg transition hover:bg-[#5df0d2]"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

interface GeneFabricPopoverProps {
  slotKey: ArmorSlotKey;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function GeneFabricPopover({
  slotKey,
  selectedId,
  onSelect,
  onClose,
}: GeneFabricPopoverProps) {
  const [draftId, setDraftId] = useState(selectedId);

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 flex max-h-[75dvh] flex-col overflow-hidden rounded-xl border border-amber-400/35 bg-[#141a1e]/98 text-slate-100 shadow-2xl backdrop-blur-md lg:inset-x-auto lg:bottom-auto lg:right-[388px] lg:top-28 lg:w-[350px]"
      role="dialog"
      aria-label="Tier V Gene Fabric Picker"
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0f1417]/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <div>
            <h3 className="text-sm font-semibold text-white">Tier V Gene Fabric</h3>
            <p className="text-[10px] text-slate-400">Optional Tier V Blueprint Enhancement (×1)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {GENE_FABRICS.map((gf: GeneFabricDef) => {
          const active = draftId === gf.id;
          return (
            <button
              key={gf.id}
              type="button"
              onClick={() => setDraftId(gf.id)}
              className={`w-full rounded-xl border p-2.5 text-left transition ${
                active
                  ? 'border-[#3ee6c5] bg-[#1db99b]/15'
                  : 'border-white/[0.08] bg-[#0f1417]/80 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {gf.id !== 'none' && (
                    <MaterialIconGlyph name={gf.name} accent="#fbbf24" className="h-7 w-7" />
                  )}
                  <span className="truncate text-xs font-semibold text-white">{gf.name}</span>
                </div>
                {gf.id !== 'none' && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                    ×1
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-[#3ee6c5]">{gf.effect}</div>
              {slotKey === 'top' && gf.topBonus && (
                <div className="mt-1 text-[10px] text-amber-200/90">{gf.topBonus}</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-white/[0.08] bg-[#0f1417]/95 p-3">
        <button
          type="button"
          onClick={() => {
            onSelect(draftId);
            onClose();
          }}
          className="w-full rounded-lg bg-[#3ee6c5] py-2 text-xs font-bold uppercase tracking-wider text-[#091214] hover:bg-[#5df0d2]"
        >
          Confirm Fabric
        </button>
      </div>
    </div>
  );
}

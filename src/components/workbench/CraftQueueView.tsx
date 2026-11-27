import { CheckSquare, Copy, PackageCheck, Square, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import {
  ROMAN_TIERS,
  aggregateCraftQueue,
  type MaterialBucketId,
  type QueuedCraftItem,
} from '../../utils/craftingEngine';
import { MaterialIconGlyph, StarRatingDisplay, inferMaterialVisual } from './MaterialVisuals';

interface CraftQueueViewProps {
  queue: QueuedCraftItem[];
  inventoryMode: boolean;
  inventoryOwned: Record<string, number>;
  gatheredMaterials: Record<string, boolean>;
  onToggleGathered: (name: string) => void;
  onUpdateOwned: (name: string, val: number) => void;
  onDuplicateItem: (item: QueuedCraftItem) => void;
  onRemoveItem: (queueId: string) => void;
  onClearQueue: () => void;
  onGoToCrafting: () => void;
}

const BUCKET_META: Array<{ id: MaterialBucketId; title: string }> = [
  { id: 'stardust', title: 'Stardust Source' },
  { id: 'metals', title: 'Ingots, Ores & Wood' },
  { id: 'components', title: 'Fibers, Plastics, Adhesives & Parts' },
  { id: 'parts_linings', title: 'Linings & Weapon Bodies' },
  { id: 'hides', title: 'Wools, Hides & Furs' },
  { id: 'gene_fabrics', title: 'Tier V Gene Fabrics' },
];

export function CraftQueueView({
  queue,
  inventoryMode,
  inventoryOwned,
  gatheredMaterials,
  onToggleGathered,
  onUpdateOwned,
  onDuplicateItem,
  onRemoveItem,
  onClearQueue,
  onGoToCrafting,
}: CraftQueueViewProps) {
  const totals = useMemo(() => aggregateCraftQueue(queue), [queue]);

  if (queue.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-[#141a1e]/70 p-8 text-center">
        <PackageCheck className="h-10 w-10 text-[#3ee6c5]/70" />
        <h3 className="mt-3 text-base font-semibold text-white">Your Craft Queue is Empty</h3>
        <p className="mt-1 max-w-md text-xs text-slate-400">
          Select Weapons or Armor blueprints, configure Tier I–V, Blueprint Stars, and custom
          Wools/Hides, then click <strong className="text-[#3ee6c5]">Add to Craft Queue</strong> to
          compute your shopping list.
        </p>
        <button
          type="button"
          onClick={onGoToCrafting}
          className="mt-4 rounded-lg bg-[#3ee6c5] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#091214] hover:bg-[#5df0d2]"
        >
          Browse Blueprints
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Queued Blueprints List */}
      <div className="space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-1 rounded-full bg-[#3ee6c5]" />
            <h2 className="text-sm font-semibold text-white">Queued Blueprints ({queue.length})</h2>
          </div>
          <button
            type="button"
            onClick={onClearQueue}
            className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-950/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-950/40"
          >
            <Trash2 className="h-3 w-3" /> Clear All
          </button>
        </div>

        <div className="space-y-2">
          {queue.map((item) => (
            <div
              key={item.queueId}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#141a1e] p-3"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-12 w-12 shrink-0 rounded-lg border border-white/[0.08] bg-[#0f1417] object-contain p-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-white">{item.name}</span>
                  <span className="rounded bg-[#3ee6c5]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#3ee6c5]">
                    TIER {ROMAN_TIERS[item.tier]}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <StarRatingDisplay stars={item.stars} size="xs" />
                  <span>· {item.slotOrCategory}</span>
                  {item.hideName && <span className="text-emerald-300">· {item.hideName}</span>}
                  {item.geneFabricName && item.geneFabricId !== 'none' && (
                    <span className="text-amber-300">· {item.geneFabricName}</span>
                  )}
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-500">
                  {item.workbench} · {item.elCost.toLocaleString()} EL
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onDuplicateItem(item)}
                  className="rounded border border-white/[0.08] bg-[#0f1417] p-1.5 text-slate-300 hover:border-[#3ee6c5]/50 hover:text-[#3ee6c5]"
                  title="Duplicate item (+1)"
                  aria-label={`Duplicate ${item.name}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.queueId)}
                  className="rounded border border-white/[0.08] bg-[#0f1417] p-1.5 text-slate-400 hover:border-rose-500/40 hover:text-rose-400"
                  title="Remove from queue"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total Material Aggregator */}
      <div className="space-y-4 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-1 rounded-full bg-[#3ee6c5]" />
            <h2 className="text-sm font-semibold text-white">Grand Total Shopping List</h2>
          </div>
          <div className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-1 font-mono text-xs font-bold text-amber-300">
            Total Price: {totals.totalEl.toLocaleString()} EL
          </div>
        </div>

        <div className="space-y-3">
          {BUCKET_META.map((bucket) => {
            const rows = totals.grouped[bucket.id];
            if (!rows || rows.length === 0) return null;

            return (
              <div
                key={bucket.id}
                className="rounded-xl border border-white/[0.08] bg-[#141a1e] p-3.5"
              >
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#3ee6c5]">
                  {bucket.title}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {rows.map((mat) => {
                    const vis = inferMaterialVisual(mat.name);
                    const checked = Boolean(gatheredMaterials[mat.name]);
                    const owned = inventoryOwned[mat.name] ?? 0;
                    const short = inventoryMode && owned < mat.qty;

                    return (
                      <div
                        key={mat.name}
                        className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition ${
                          checked
                            ? 'border-emerald-500/30 bg-emerald-950/15 opacity-60'
                            : 'border-white/[0.07] bg-[#0f1417]/80'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleGathered(mat.name)}
                          className="text-slate-400 hover:text-[#3ee6c5]"
                          aria-label={`Mark ${mat.name} gathered`}
                        >
                          {checked ? (
                            <CheckSquare className="h-4 w-4 text-[#3ee6c5]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <MaterialIconGlyph name={mat.name} accent={vis.accent} />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-white">{mat.name}</div>
                          {inventoryMode && (
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                              <span className="text-slate-400">Owned:</span>
                              <input
                                type="number"
                                min={0}
                                value={owned}
                                onChange={(e) =>
                                  onUpdateOwned(mat.name, Math.max(0, Number(e.target.value) || 0))
                                }
                                className="w-14 rounded border border-white/[0.1] bg-[#141a1e] px-1.5 py-0.5 font-mono text-[10px] text-white outline-none focus:border-[#3ee6c5]"
                              />
                            </div>
                          )}
                        </div>

                        <div
                          className={`font-mono text-xs font-bold ${
                            short
                              ? 'text-rose-400'
                              : inventoryMode
                                ? 'text-[#3ee6c5]'
                                : 'text-white'
                          }`}
                        >
                          {inventoryMode ? `${owned}/${mat.qty}` : `×${mat.qty}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

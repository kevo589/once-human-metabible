import { ArrowLeft, ArrowRight, Check, MapPin, ShieldPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatReadableSubstat,
  MOD_CODEX,
  MOD_SUBSTAT_SET_BY_ID,
  MOD_SUBSTATS_PER_LEVEL,
  type CodexModItem,
} from '../../data/mods/modCatalog';

interface ModDetailViewProps {
  mod: CodexModItem;
  onBack: () => void;
  onSelectMod: (mod: CodexModItem) => void;
  onEquipInDps?: (mod: CodexModItem, targetWeaponSlot?: 'primary' | 'secondary' | 'melee') => void;
  onLocateOnMap?: (poiId: string) => void;
}

const LEVEL_ROMAN: Array<{ num: '1' | '2' | '3' | '4' | '5'; roman: string }> = [
  { num: '1', roman: 'I' },
  { num: '2', roman: 'II' },
  { num: '3', roman: 'III' },
  { num: '4', roman: 'IV' },
  { num: '5', roman: 'V' },
];

export function ModDetailView({
  mod,
  onBack,
  onSelectMod,
  onEquipInDps,
  onLocateOnMap,
}: ModDetailViewProps) {
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [substatMode, setSubstatMode] = useState<'raw' | 'readable'>('raw');
  const [previewLevel, setPreviewLevel] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [equipConfirmOpen, setEquipConfirmOpen] = useState(false);
  const [equippedBanner, setEquippedBanner] = useState<string | null>(null);

  const subStatSets = useMemo(
    () =>
      mod.subStatSetIds
        .map((id) => MOD_SUBSTAT_SET_BY_ID.get(id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [mod.subStatSetIds],
  );

  // Deduplicated ordered list of sub-stats available across this mod's sets
  const availableSubStatIds = useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();
    // Put standard numeric substats first, then special conditional sets (just like th.gl reference)
    for (const id of Object.keys(MOD_SUBSTATS_PER_LEVEL)) {
      if (subStatSets.some((s) => s.stats.includes(id)) && !seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
    return ordered;
  }, [subStatSets]);

  const highlightedStats = useMemo(() => {
    if (!selectedSetId) return null;
    const found = MOD_SUBSTAT_SET_BY_ID.get(selectedSetId);
    return found ? new Set(found.stats) : null;
  }, [selectedSetId]);

  const displayedSubStatIds = useMemo(() => {
    if (!highlightedStats) return availableSubStatIds;
    return availableSubStatIds.filter((id) => highlightedStats.has(id));
  }, [availableSubStatIds, highlightedStats]);

  const relatedMods = useMemo(
    () => MOD_CODEX.filter((m) => m.slot === mod.slot && m.id !== mod.id),
    [mod.slot, mod.id],
  );

  const handleConfirmEquip = (weaponSlot?: 'primary' | 'secondary' | 'melee') => {
    onEquipInDps?.(mod, weaponSlot);
    setEquipConfirmOpen(false);
    setEquippedBanner(
      `Equipped ${mod.name} in DPS Calculator (${weaponSlot ?? mod.slot})`,
    );
    window.setTimeout(() => setEquippedBanner(null), 2600);
  };

  return (
    <div className="space-y-6 rounded-xl border border-white/[0.08] bg-[#07080a] p-4 text-slate-100 sm:p-6">
      {/* Breadcrumb + Back */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8b92a5]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#10131c] px-2.5 py-1.5 font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Mods
        </button>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span>Mods</span>
          <span>›</span>
          <span>{mod.slot}</span>
          <span>›</span>
          <span className="text-slate-200">{mod.name}</span>
        </div>
      </div>

      {/* 1. Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-[#111626] p-2.5 shadow-inner">
            <img
              src={mod.iconUrl}
              alt={mod.name}
              className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {mod.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#1b2234] px-2.5 py-0.5 text-xs font-medium text-slate-200">
                {mod.slot}
              </span>
              {mod.archetypeTag && mod.archetypeTag !== mod.slot && (
                <span className="rounded border border-white/[0.08] bg-[#10131c] px-2 py-0.5 text-[11px] text-[#8b92a5]">
                  {mod.archetypeTag}
                </span>
              )}
            </div>
          </div>
        </div>

        {onEquipInDps && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (mod.slot === 'Weapon') {
                  setEquipConfirmOpen((v) => !v);
                } else {
                  setEquipConfirmOpen((v) => !v);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3ee6c5]/50 bg-[#3ee6c5]/15 px-3.5 py-2 text-xs font-semibold text-[#3ee6c5] transition hover:bg-[#3ee6c5]/25"
            >
              <ShieldPlus className="h-4 w-4" />
              <span>Equip in DPS Calc</span>
            </button>

            {equipConfirmOpen && (
              <div className="absolute right-0 top-11 z-30 w-64 space-y-2 rounded-xl border border-white/[0.12] bg-[#10131c] p-3 text-xs shadow-2xl">
                <div className="font-semibold text-white">
                  Equip {mod.name} (Lv. V)?
                </div>
                <p className="text-[11px] text-[#8b92a5]">
                  Applies Core Level V + default Sub-Stat Set into your active Gear Config build.
                </p>
                {mod.slot === 'Weapon' ? (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmEquip('primary')}
                      className="rounded bg-[#3ee6c5] py-1.5 text-[11px] font-bold text-[#091214]"
                    >
                      Slot 1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmEquip('secondary')}
                      className="rounded border border-white/[0.12] bg-[#161c2a] py-1.5 text-[11px] font-semibold text-white hover:border-[#3ee6c5]"
                    >
                      Slot 2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmEquip('melee')}
                      className="rounded border border-white/[0.12] bg-[#161c2a] py-1.5 text-[11px] font-semibold text-white hover:border-[#3ee6c5]"
                    >
                      Melee
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmEquip()}
                    className="w-full rounded bg-[#3ee6c5] py-1.5 text-[11px] font-bold text-[#091214]"
                  >
                    Confirm Equip ({mod.slot})
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {equippedBanner && (
        <div className="flex items-center gap-2 rounded-lg border border-[#3ee6c5]/40 bg-[#3ee6c5]/10 px-3 py-2 text-xs font-medium text-[#3ee6c5]">
          <Check className="h-4 w-4 shrink-0" />
          <span>{equippedBanner}</span>
        </div>
      )}

      {/* 2. Primary Effect Summary */}
      <div className="border-t border-white/[0.08] pt-4">
        <p className="text-sm leading-relaxed text-slate-200">{mod.summary}</p>
      </div>

      {/* 3. 2-Column Metadata Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.08] bg-[#10131c] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8b92a5]">
            SLOT
          </div>
          <div className="mt-1 text-sm font-semibold text-white">{mod.slot}</div>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-[#10131c] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8b92a5]">
            SUB-STAT SETS
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-white">
            {subStatSets.length}
          </div>
        </div>
      </div>

      {/* 4. CORE EFFECT PER LEVEL Table */}
      <div className="max-w-2xl space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a5]">
          CORE EFFECT PER LEVEL
        </h2>
        <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0d12]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#10131c] text-[10px] font-semibold uppercase tracking-wider text-[#8b92a5]">
                <th className="w-16 px-3.5 py-2">LEVEL</th>
                <th className="px-3.5 py-2">EFFECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {LEVEL_ROMAN.map(({ num, roman }, idx) => {
                const eff = mod.coreEffectByLevel[num] || mod.summary;
                const prevEff = idx > 0 ? mod.coreEffectByLevel[LEVEL_ROMAN[idx - 1].num] : null;
                const isUpgradeStep = idx > 0 && prevEff && eff !== prevEff;
                return (
                  <tr
                    key={num}
                    className={isUpgradeStep ? 'bg-cyan-500/[0.06]' : undefined}
                  >
                    <td className="px-3.5 py-2.5 align-top font-serif text-xs font-medium text-[#8b92a5]">
                      {roman}
                    </td>
                    <td className="px-3.5 py-2.5 leading-relaxed text-slate-100">
                      <span>{eff}</span>
                      {isUpgradeStep && (
                        <span className="ml-2 inline-block rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300">
                          Upgrade
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SUB-STAT SETS Table */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a5]">
            SUB-STAT SETS
          </h2>
          <span className="text-[11px] text-[#8b92a5]">
            Click a set row to filter Level 1–5 scaling below
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0d12]">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-white/[0.06]">
              {subStatSets.map((set) => {
                const active = selectedSetId === set.id;
                const statNames = set.stats
                  .map((sid) => MOD_SUBSTATS_PER_LEVEL[sid]?.label ?? sid)
                  .join('; ');

                return (
                  <tr
                    key={set.id}
                    onClick={() => setSelectedSetId(active ? null : set.id)}
                    className={`cursor-pointer transition ${
                      active ? 'bg-cyan-500/12' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <td
                      className={`w-1/3 px-3.5 py-2.5 align-top font-medium ${
                        active ? 'text-cyan-300' : 'text-[#8b92a5]'
                      }`}
                    >
                      {set.name}
                    </td>
                    <td className="px-3.5 py-2.5 leading-relaxed text-slate-100">
                      {statNames}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SUB-STATS PER LEVEL (1-5) Table */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a5]">
              SUB-STATS PER LEVEL (1-5)
            </h2>
            {selectedSetId && (
              <button
                type="button"
                onClick={() => setSelectedSetId(null)}
                className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
              >
                {MOD_SUBSTAT_SET_BY_ID.get(selectedSetId)?.name} × Show All
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {substatMode === 'readable' && (
              <div className="inline-flex items-center rounded-md border border-white/[0.08] bg-[#10131c] p-0.5 text-[10px]">
                {([1, 2, 3, 4, 5] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setPreviewLevel(lv)}
                    className={`rounded px-1.5 py-0.5 font-mono font-bold transition ${
                      previewLevel === lv
                        ? 'bg-cyan-400 text-[#07080a]'
                        : 'text-[#8b92a5] hover:text-white'
                    }`}
                  >
                    Lv.{lv}
                  </button>
                ))}
              </div>
            )}

            <div className="inline-flex items-center rounded-md border border-white/[0.08] bg-[#10131c] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setSubstatMode('raw')}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  substatMode === 'raw'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-[#8b92a5] hover:text-white'
                }`}
              >
                Raw Values
              </button>
              <button
                type="button"
                onClick={() => setSubstatMode('readable')}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  substatMode === 'readable'
                    ? 'bg-cyan-400/20 text-cyan-300'
                    : 'text-[#8b92a5] hover:text-white'
                }`}
              >
                Readable
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0d12]">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-white/[0.06]">
              {displayedSubStatIds.map((sid) => {
                const def = MOD_SUBSTATS_PER_LEVEL[sid];
                if (!def) return null;
                return (
                  <tr key={sid} className={highlightedStats ? 'bg-cyan-500/[0.04]' : undefined}>
                    <td className="w-[44%] px-3.5 py-2.5 align-top leading-relaxed text-[#8b92a5]">
                      {def.label}
                    </td>
                    <td className="px-3.5 py-2.5 align-top font-mono text-[11px] leading-relaxed text-slate-100">
                      {substatMode === 'raw'
                        ? def.display
                        : formatReadableSubstat(sid, previewLevel)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. DETAILS Card & Map Link */}
      <div className="space-y-3 pt-1">
        <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b0d12]">
          <div className="border-b border-white/[0.08] bg-[#10131c] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#8b92a5]">
            DETAILS
          </div>
          <div className="grid grid-cols-3 gap-2 px-3.5 py-3 font-mono text-xs">
            <div className="text-[#8b92a5]">Obtain</div>
            <div className="col-span-2 leading-relaxed text-slate-100">{mod.obtain}</div>
          </div>
        </div>

        {onLocateOnMap && mod.mapLocationId && (
          <button
            type="button"
            onClick={() => onLocateOnMap(mod.mapLocationId!)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#22d3ee] transition hover:text-[#3ee6c5] hover:underline"
          >
            <MapPin className="h-4 w-4" />
            <span>Mod Locations</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 8. RELATED · [SLOT] Section */}
      <div className="space-y-3 border-t border-white/[0.08] pt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a5]">
          RELATED · {mod.slot.toUpperCase()}
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {relatedMods.map((rel) => (
            <button
              key={rel.id}
              type="button"
              onClick={() => {
                setSelectedSetId(null);
                setEquipConfirmOpen(false);
                onSelectMod(rel);
              }}
              className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-[#0b0d12] px-3 py-2.5 text-left transition hover:border-cyan-400/50 hover:bg-[#10131c]"
            >
              <img
                src={rel.iconUrl}
                alt={rel.name}
                className="h-6 w-6 shrink-0 object-contain opacity-90"
              />
              <span className="truncate text-sm font-medium text-slate-100">{rel.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

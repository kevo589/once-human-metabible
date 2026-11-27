import { useState } from 'react';
import { ExternalLink, MapPin, Shield, Sparkles, X } from 'lucide-react';
import { DEVIATION_MAP_SPAWNS } from '../../data/deviationMapLinks';
import type { ArmorSet, Deviation, ModItem, Rarity } from '../../types/game';
import { cn } from '../../utils/cn';
import { Pill, RARITY_GLOW, RarityBadge } from './Badge';

interface EntityThumbnailProps {
  src: string;
  alt: string;
  rarity: Rarity;
  size?: 'sm' | 'md' | 'lg';
  fallbackKind?: 'armor' | 'mod' | 'deviation';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-10 w-10 rounded-lg p-1',
  md: 'h-12 w-12 rounded-lg p-1',
  lg: 'h-32 w-full rounded-xl p-4',
};

export function EntityThumbnail({
  src,
  alt,
  rarity,
  size = 'md',
  fallbackKind = 'armor',
  className,
}: EntityThumbnailProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border',
        RARITY_GLOW[rarity],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] transition-transform duration-200 group-hover:scale-105"
        />
      ) : fallbackKind === 'deviation' ? (
        <Sparkles className="h-5 w-5 text-slate-500" />
      ) : (
        <Shield className="h-5 w-5 text-slate-500" />
      )}
    </div>
  );
}

export type InspectedEntity =
  | { kind: 'armor'; item: ArmorSet }
  | { kind: 'mod'; item: ModItem; variants?: ModItem[] }
  | { kind: 'deviation'; item: Deviation };

export function EntityDetailModal({
  entity,
  onClose,
  onSelectModVariant,
  onLocateOnMap,
}: {
  entity: InspectedEntity | null;
  onClose: () => void;
  onSelectModVariant?: (mod: ModItem) => void;
  onLocateOnMap?: (poiId: string) => void;
}) {
  if (!entity) return null;

  const { item, kind } = entity;
  const safeHref =
    item.referenceUrl.startsWith('https://') || item.referenceUrl.startsWith('http://')
      ? item.referenceUrl
      : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-obsidian-700 bg-obsidian-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-obsidian-800 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <RarityBadge rarity={item.rarity} />
              {kind === 'armor' && <Pill>{item.slot}</Pill>}
              {kind === 'mod' && (
                <>
                  <Pill>{item.modCategory}</Pill>
                  <Pill>{item.slot}</Pill>
                  <Pill>{item.variant}</Pill>
                  <Pill>{item.element}</Pill>
                </>
              )}
              {kind === 'deviation' && <Pill>{item.type} · {item.element}</Pill>}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-obsidian-800 hover:text-white"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs">
          <EntityThumbnail
            src={item.imageUrl}
            alt={item.name}
            rarity={item.rarity}
            size="lg"
            fallbackKind={kind}
          />

          {kind === 'armor' && (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-lg border border-obsidian-800 bg-obsidian-950/60 p-3">
                  <div className="text-[11px] text-slate-500">Base HP</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">{item.hp}</div>
                </div>
                <div className="rounded-lg border border-obsidian-800 bg-obsidian-950/60 p-3">
                  <div className="text-[11px] text-slate-500">Pollution Res</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">{item.pollutionResist}</div>
                </div>
                <div className="rounded-lg border border-obsidian-800 bg-obsidian-950/60 p-3">
                  <div className="text-[11px] text-slate-500">PSI Intensity</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">{item.psiIntensity}</div>
                </div>
              </div>

              <div className="rounded-xl border border-obsidian-800 bg-obsidian-950/60 p-4">
                <p className="leading-relaxed text-slate-300">{item.effectSummary}</p>
                {(item.onePieceBonus || item.twoPieceBonus || item.threePieceBonus || item.fourPieceBonus) && (
                  <ul className="mt-3 space-y-1.5 border-t border-obsidian-800 pt-3 text-slate-300">
                    {item.onePieceBonus && <li><strong className="text-slate-100">1pc:</strong> {item.onePieceBonus}</li>}
                    {item.twoPieceBonus && <li><strong className="text-slate-100">2pc:</strong> {item.twoPieceBonus}</li>}
                    {item.threePieceBonus && <li><strong className="text-slate-100">3pc:</strong> {item.threePieceBonus}</li>}
                    {item.fourPieceBonus && <li><strong className="text-slate-100">4pc:</strong> {item.fourPieceBonus}</li>}
                  </ul>
                )}
              </div>
            </>
          )}

          {kind === 'mod' && (
            <>
              <div className="space-y-3 rounded-xl border border-obsidian-800 bg-obsidian-950/60 p-4">
                <p className="leading-relaxed text-slate-200">{item.primaryEffect}</p>
                <div className="grid grid-cols-2 gap-2 border-t border-obsidian-800 pt-2.5 text-slate-400">
                  <div><span className="text-slate-500">Keyword:</span> {item.archetype}</div>
                  <div><span className="text-slate-500">Element:</span> {item.element}</div>
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Substats:</span> {item.recommendedSubstats.join(' · ')}
                </div>
              </div>

              {entity.variants && entity.variants.length > 1 && (
                <div className="rounded-xl border border-obsidian-800 bg-obsidian-950/60 p-4">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Suffix Variants ({entity.variants.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entity.variants.map((v) => {
                      const active = v.id === item.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => onSelectModVariant?.(v)}
                          className={cn(
                            'rounded-md border px-2 py-1 text-[11px] transition',
                            active
                              ? 'border-stardust-400/60 bg-stardust-500/15 text-white'
                              : 'border-obsidian-800 bg-obsidian-900 text-slate-400 hover:border-obsidian-700 hover:text-slate-200',
                          )}
                        >
                          {v.variant}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {kind === 'deviation' && (
            <div className="space-y-3 rounded-xl border border-obsidian-800 bg-obsidian-950/60 p-4">
              <div className="font-medium text-slate-100">{item.skillName}</div>
              <p className="leading-relaxed text-slate-300">{item.skillSummary}</p>
              <div className="space-y-1.5 border-t border-obsidian-800 pt-2.5 text-slate-300">
                <div>
                  <span className="text-slate-500">Mood:</span> {item.moodRequirement}
                </div>
                <div>
                  <span className="text-slate-500">Where to Find:</span>{' '}
                  <span className="text-cyan-300">{item.dropSource}</span>
                </div>
              </div>

              {DEVIATION_MAP_SPAWNS[item.id]?.length ? (
                <div className="border-t border-obsidian-800 pt-2.5">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Map Spawn Locations ({DEVIATION_MAP_SPAWNS[item.id].length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEVIATION_MAP_SPAWNS[item.id].map((spawn) => (
                      <button
                        key={spawn.poiId}
                        type="button"
                        onClick={() => {
                          onLocateOnMap?.(spawn.poiId);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-1 text-[11px] font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                      >
                        <MapPin className="h-3 w-3 text-cyan-400" />
                        <span>{spawn.label}</span>
                        <span className="text-slate-400">· {spawn.region}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {safeHref && (
            <div className="border-t border-obsidian-800 pt-3">
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"
              >
                Reference on OnceHumanDB
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

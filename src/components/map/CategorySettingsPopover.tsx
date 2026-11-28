import { CheckCircle2, RotateCcw, Volume2, X } from 'lucide-react';
import { useState } from 'react';
import { MAP_DROP_TABLES, type MapCategoryDef } from '../../data/mapCatalog';
import { playMapAudioTone, type AudioToneId } from '../../utils/mapAudio';
import { CategoryGlyph } from './mapIcons';
import { DEFAULT_CATEGORY_PREF, type CategoryPreference } from './mapState';
import type { LabelDisplayMode } from './TacticalCanvasLayer';

interface CategorySettingsPopoverProps {
  category: MapCategoryDef;
  totalCount: number;
  discoveredCount: number;
  pref: CategoryPreference;
  onChangePref: (next: CategoryPreference) => void;
  onDiscoverAll: () => void;
  onResetDiscovered: () => void;
  onClose: () => void;
}

export function CategorySettingsPopover({
  category,
  totalCount,
  discoveredCount,
  pref,
  onChangePref,
  onDiscoverAll,
  onResetDiscovered,
  onClose,
}: CategorySettingsPopoverProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const current = { ...DEFAULT_CATEGORY_PREF, ...pref };
  const allDiscovered = totalCount > 0 && discoveredCount >= totalCount;
  const pct = totalCount > 0 ? Math.min(100, Math.round((discoveredCount / totalCount) * 100)) : 0;
  const drops = MAP_DROP_TABLES[category.key];

  return (
    <div
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[1200] flex max-h-[78dvh] flex-col overflow-hidden rounded-md border border-sign-seam bg-sign-black/95 text-sign-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-[344px] sm:top-3 sm:w-[340px]"
      role="dialog"
      aria-label={`${category.label} settings`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-sign-seam px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <CategoryGlyph
            typeKey={category.key}
            color={category.color}
            variant={category.isBossAnomaly ? 'anomaly' : 'default'}
          />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <span>{category.label}</span>
              {category.isNew && (
                <span className="rounded bg-line-map/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-line-map">
                  NEW
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-sign-mute">
              Total: <span className="font-mono text-sign-white">{totalCount}</span> · Discovered:{' '}
              <span className="font-mono text-line-map">{discoveredCount}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-sign-mute transition hover:bg-sign-seam hover:text-white"
          aria-label="Close category settings"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Controls Body */}
      <div className="flex-1 space-y-3.5 overflow-y-auto px-3.5 py-3 text-xs">
        <p className="text-[11px] leading-relaxed text-sign-mute">{category.description}</p>

        {/* Discover All / Reset Discovered Progress Row */}
        <div className="rounded-md border border-sign-seam bg-sign-raised p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            {allDiscovered ? (
              confirmReset ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-amber-300">Reset all?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDiscovered();
                      setConfirmReset(false);
                    }}
                    className="rounded bg-rose-500/25 px-2 py-0.5 text-[11px] font-medium text-rose-200 hover:bg-rose-500/35"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded px-1.5 py-0.5 text-[11px] text-sign-mute hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset discovered
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onDiscoverAll}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-line-map hover:text-line-map"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Discover all
              </button>
            )}
            <span className="font-mono text-[11px] text-sign-mute">
              {discoveredCount}/{totalCount}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sign-seam">
            <div
              className="h-full rounded-full bg-line-map transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Icon Size Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={`size-${category.key}`} className="font-medium text-sign-white">
              Icon Size
            </label>
            <span className="rounded bg-sign-seam px-1.5 py-0.5 font-mono text-[11px] text-line-map">
              {current.iconScale.toFixed(1)}x
            </span>
          </div>
          <input
            id={`size-${category.key}`}
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={current.iconScale}
            onChange={(e) =>
              onChangePref({
                ...current,
                iconScale: Number(e.target.value),
              })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-md bg-sign-seam accent-line-map"
          />
          <div className="flex justify-between font-mono text-[10px] text-sign-dim">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
        </div>

        {/* Audio Alert & Tone Controls */}
        <div className="space-y-2 rounded-md border border-sign-seam bg-sign-raised p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-sign-white">
              <Volume2 className="h-3.5 w-3.5 text-line-map" />
              <span>Audio Alert</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={current.audioEnabled}
              onClick={() => {
                const nextEnabled = !current.audioEnabled;
                onChangePref({ ...current, audioEnabled: nextEnabled });
                if (nextEnabled) playMapAudioTone(current.audioTone);
              }}
              className={`relative h-5 w-9 rounded-full transition ${
                current.audioEnabled ? 'bg-line-map' : 'bg-sign-seam'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                  current.audioEnabled ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`tone-${category.key}`} className="text-[11px] text-sign-mute">
              Tone
            </label>
            <select
              id={`tone-${category.key}`}
              value={current.audioTone}
              onChange={(e) => {
                const tone = e.target.value as AudioToneId;
                onChangePref({ ...current, audioTone: tone });
                if (tone !== 'muted') playMapAudioTone(tone);
              }}
              className="rounded-md border border-sign-seam bg-sign-black px-2 py-1 text-[11px] text-sign-white outline-none focus:border-line-map"
            >
              <option value="chime">Default (Chime)</option>
              <option value="ping">Soft Ping</option>
              <option value="radar">Radar</option>
              <option value="muted">Muted</option>
            </select>
          </div>
        </div>

        {/* Label Display Mode */}
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`label-${category.key}`} className="font-medium text-sign-white">
            Map Labels
          </label>
          <select
            id={`label-${category.key}`}
            value={current.labelMode}
            onChange={(e) =>
              onChangePref({
                ...current,
                labelMode: e.target.value as LabelDisplayMode,
              })
            }
            className="rounded-md border border-sign-seam bg-sign-raised px-2.5 py-1 text-[11px] text-sign-white outline-none focus:border-line-map"
          >
            <option value="off">Off</option>
            <option value="hover">Hover</option>
            <option value="always">Always</option>
          </select>
        </div>

        {/* Drops (per open) Section */}
        {drops && drops.length > 0 && (
          <div className="border-t border-sign-seam pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sign-mute">
                Drops (per open)
              </span>
              <span className="text-[10px] text-sign-dim">{drops.length} entries</span>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-sign-seam bg-sign-raised p-2">
              {drops.map((drop) => (
                <div
                  key={drop.item}
                  className="flex items-baseline justify-between gap-2 border-b border-sign-seam/70 pb-1 last:border-b-0 last:pb-0 text-[11px]"
                >
                  <span className="font-medium text-sign-white">
                    {drop.item}
                    {drop.quantity ? (
                      <span className="ml-1 font-mono text-line-map">{drop.quantity}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-right font-mono text-[10px] text-sign-mute">
                    {drop.chance}
                    {drop.qualifier ? (
                      <span className="ml-1 font-sans text-sign-dim">({drop.qualifier})</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

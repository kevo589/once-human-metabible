import { useState } from 'react';
import { Calculator, Crosshair, ExternalLink, Gauge, X } from 'lucide-react';
import type { Weapon } from '../../types/game';
import { cn } from '../../utils/cn';
import { ArchetypeBadge, Pill, RARITY_GLOW, RarityBadge } from '../common/Badge';

interface WeaponThumbnailProps {
  weapon: Weapon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-11 w-11 rounded-lg p-1',
  md: 'h-14 w-16 rounded-lg p-1.5',
  lg: 'h-32 w-full rounded-xl p-4',
};

export function WeaponThumbnail({ weapon, size = 'md', className }: WeaponThumbnailProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border',
        RARITY_GLOW[weapon.rarity],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {!failed && weapon.imageUrl ? (
        <img
          src={weapon.imageUrl}
          alt={weapon.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <Crosshair className="h-5 w-5 text-slate-500" />
      )}

      {size === 'lg' && (
        <div className="pointer-events-none absolute bottom-2 right-2.5 rounded bg-obsidian-900/90 px-2 py-0.5 font-mono text-[10px] text-slate-400">
          {weapon.category} · {weapon.fireMode}
        </div>
      )}
    </div>
  );
}

interface StatBarProps {
  label: string;
  valueText: string;
  pct: number;
}

function StatBar({ label, valueText, pct }: StatBarProps) {
  const clamped = Math.max(4, Math.min(100, Math.round(pct)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-medium text-slate-200">{valueText}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-obsidian-800">
        <div className="h-full rounded-full bg-slate-300/80 transition-all duration-300" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function WeaponStatBars({ weapon, compact = false }: { weapon: Weapon; compact?: boolean }) {
  return (
    <div className={cn('grid gap-x-4 gap-y-2.5', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
      <StatBar label="Damage" valueText={`${weapon.baseDamage}`} pct={(weapon.baseDamage / 1500) * 100} />
      <StatBar label="Fire Rate" valueText={`${weapon.fireRateRpm} RPM`} pct={(weapon.fireRateRpm / 1000) * 100} />
      <StatBar
        label="Range"
        valueText={weapon.effectiveRangeMeters > 0 ? `${weapon.rangeScore} (${weapon.effectiveRangeMeters}m)` : `${weapon.rangeScore}`}
        pct={weapon.rangeScore}
      />
      <StatBar label="Weakspot" valueText={`${Math.round(weapon.weakspotDamage * 100)}%`} pct={weapon.weakspotDamage * 100} />
      {!compact && (
        <>
          <StatBar
            label="Crit Rate / DMG"
            valueText={`${Math.round(weapon.critRate * 100)}% / ${Math.round(weapon.critDamage * 100)}%`}
            pct={weapon.critRate * 400}
          />
          <StatBar label="Mobility" valueText={`${weapon.mobility}`} pct={weapon.mobility} />
        </>
      )}
    </div>
  );
}

interface WeaponDetailModalProps {
  weapon: Weapon | null;
  onClose: () => void;
  onSimulate?: (weapon: Weapon) => void;
}

export function WeaponDetailModal({ weapon, onClose, onSimulate }: WeaponDetailModalProps) {
  if (!weapon) return null;

  const safeHref =
    weapon.referenceUrl.startsWith('https://') || weapon.referenceUrl.startsWith('http://')
      ? weapon.referenceUrl
      : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-obsidian-700 bg-obsidian-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-obsidian-800 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <RarityBadge rarity={weapon.rarity} />
              <Pill>{weapon.category}</Pill>
              <Pill>{weapon.element}</Pill>
              {weapon.archetype !== 'Standard' && <ArchetypeBadge archetype={weapon.archetype} />}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">{weapon.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-obsidian-800 hover:text-white"
            aria-label="Close weapon inspector"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <WeaponThumbnail weapon={weapon} size="lg" />

          <div className="rounded-xl border border-obsidian-800 bg-obsidian-950/60 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
              <Gauge className="h-3.5 w-3.5" />
              Ballistic Profile
            </div>
            <WeaponStatBars weapon={weapon} />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950/60 p-3">
              <div className="text-[11px] text-slate-500">Magazine</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">{weapon.magSize} rds</div>
            </div>
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950/60 p-3">
              <div className="text-[11px] text-slate-500">Reload</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">{weapon.reloadSeconds}s</div>
            </div>
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950/60 p-3">
              <div className="text-[11px] text-slate-500">Ammo</div>
              <div className="mt-0.5 truncate text-sm font-medium text-slate-200">{weapon.ammoType}</div>
            </div>
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950/60 p-3">
              <div className="text-[11px] text-slate-500">Fire Mode</div>
              <div className="mt-0.5 text-sm font-medium text-slate-200">{weapon.fireMode}</div>
            </div>
          </div>

          <div className="rounded-xl border border-obsidian-800 bg-obsidian-950/60 p-4 text-xs">
            <p className="leading-relaxed text-slate-300">{weapon.trait}</p>
            <div className="mt-2 text-[11px] text-slate-500">Source: {weapon.source}</div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-obsidian-800 pt-4">
            {safeHref ? (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"
              >
                Reference on OnceHumanDB
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span />
            )}

            {onSimulate && (
              <button
                type="button"
                onClick={() => {
                  onSimulate(weapon);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-obsidian-950 transition hover:bg-white"
              >
                <Calculator className="h-3.5 w-3.5" />
                Open in Calculator
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

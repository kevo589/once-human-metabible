import { useState } from 'react';
import { Calculator, Crosshair, ExternalLink, Flame, Gauge, Target, X, Zap } from 'lucide-react';
import type { Weapon } from '../../types/game';
import { cn } from '../../utils/cn';
import { ArchetypeBadge, Pill, RARITY_GLOW, RarityBadge } from '../common/Badge';

interface WeaponThumbnailProps {
  weapon: Weapon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-12 w-12 rounded-lg p-1',
  md: 'h-16 w-24 rounded-lg p-1.5',
  lg: 'h-36 w-full rounded-xl p-4',
};

export function WeaponThumbnail({ weapon, size = 'md', className }: WeaponThumbnailProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border bg-obsidian-950 bg-gradient-to-br',
        RARITY_GLOW[weapon.rarity],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {/* Subtle tactical grid backdrop inspired by Once Human DB */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)',
          backgroundSize: size === 'lg' ? '18px 18px' : '10px 10px',
        }}
      />

      {!failed && weapon.imageUrl ? (
        <img
          src={weapon.imageUrl}
          alt={weapon.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn(
            'relative z-10 h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover:scale-105',
          )}
        />
      ) : (
        <Crosshair className="relative z-10 h-6 w-6 text-slate-500" />
      )}

      {size === 'lg' && (
        <div className="pointer-events-none absolute bottom-2 right-2.5 z-10 rounded bg-obsidian-950/85 px-2 py-0.5 font-mono text-[10px] text-slate-300">
          {weapon.category} • {weapon.fireMode}
        </div>
      )}
    </div>
  );
}

interface StatBarProps {
  label: string;
  valueText: string;
  pct: number;
  barClass?: string;
}

function StatBar({ label, valueText, pct, barClass = 'bg-stardust-400' }: StatBarProps) {
  const clamped = Math.max(4, Math.min(100, Math.round(pct)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-semibold text-slate-100">{valueText}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-obsidian-800">
        <div className={cn('h-full rounded-full transition-all duration-300', barClass)} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function WeaponStatBars({ weapon, compact = false }: { weapon: Weapon; compact?: boolean }) {
  return (
    <div className={cn('grid gap-2.5', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
      <StatBar
        label="Base Damage"
        valueText={`${weapon.baseDamage}`}
        pct={(weapon.baseDamage / 1500) * 100}
        barClass="bg-amber-400"
      />
      <StatBar
        label="Fire Rate"
        valueText={`${weapon.fireRateRpm} RPM`}
        pct={(weapon.fireRateRpm / 1000) * 100}
        barClass="bg-cyan-400"
      />
      <StatBar
        label="Range Score"
        valueText={weapon.effectiveRangeMeters > 0 ? `${weapon.rangeScore} (${weapon.effectiveRangeMeters}m)` : `${weapon.rangeScore}`}
        pct={weapon.rangeScore}
        barClass="bg-emerald-400"
      />
      <StatBar
        label="Weakspot DMG"
        valueText={`${Math.round(weapon.weakspotDamage * 100)}%`}
        pct={weapon.weakspotDamage * 100}
        barClass="bg-rose-400"
      />
      {!compact && (
        <>
          <StatBar
            label="Crit Rate / DMG"
            valueText={`${Math.round(weapon.critRate * 100)}% / ${Math.round(weapon.critDamage * 100)}%`}
            pct={weapon.critRate * 400}
            barClass="bg-purple-400"
          />
          <StatBar
            label="Mobility"
            valueText={`${weapon.mobility}`}
            pct={weapon.mobility}
            barClass="bg-sky-400"
          />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
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
              <ArchetypeBadge archetype={weapon.archetype} />
              <Pill>{weapon.category}</Pill>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">{weapon.name}</h2>
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

        <div className="space-y-5 p-5">
          <WeaponThumbnail weapon={weapon} size="lg" />

          <div className="rounded-xl border border-obsidian-800 bg-obsidian-950/75 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Gauge className="h-3.5 w-3.5 text-stardust-400" />
              Ballistic & Combat Profile
            </div>
            <WeaponStatBars weapon={weapon} />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950 p-3">
              <div className="text-[11px] text-slate-500">Magazine</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-white">{weapon.magSize} rds</div>
            </div>
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950 p-3">
              <div className="text-[11px] text-slate-500">Reload Time</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-white">{weapon.reloadSeconds}s</div>
            </div>
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950 p-3">
              <div className="text-[11px] text-slate-500">Ammo Type</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-stardust-400">{weapon.ammoType}</div>
            </div>
            <div className="rounded-lg border border-obsidian-800 bg-obsidian-950 p-3">
              <div className="text-[11px] text-slate-500">Fire Mode</div>
              <div className="mt-0.5 text-sm font-semibold text-slate-200">{weapon.fireMode}</div>
            </div>
          </div>

          <div className="rounded-xl border border-obsidian-800 bg-obsidian-950 p-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              {weapon.archetype === 'Standard' ? <Target className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
              Weapon Trait & Overview
            </div>
            <p className="mt-1.5 leading-relaxed text-slate-300">{weapon.trait}</p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Zap className="h-3 w-3 text-slate-500" />
              Source: {weapon.source}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-obsidian-800 pt-4">
            {safeHref ? (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stardust-400 hover:text-stardust-glow"
              >
                View on OnceHumanDB
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-stardust-500 px-3.5 py-2 text-xs font-semibold text-obsidian-950 transition hover:bg-stardust-400"
              >
                <Calculator className="h-3.5 w-3.5" />
                Simulate in DPS Calculator
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

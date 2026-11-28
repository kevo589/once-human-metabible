import { Calculator, X } from 'lucide-react';
import type { AggregatedStats, FullDpsResult, LoadoutConfig } from '../../data/dps/dpsEngine';

interface FormulaBreakdownModalProps {
  open: boolean;
  loadout: LoadoutConfig;
  stats: AggregatedStats;
  dps: FullDpsResult;
  onClose: () => void;
}

export function FormulaBreakdownModal({
  open,
  loadout,
  stats,
  dps,
  onClose,
}: FormulaBreakdownModalProps) {
  if (!open) return null;

  const f = dps.formula;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-label="DPS Multiplicative Formula Breakdown"
    >
      <div
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.12] bg-sign-panel text-sign-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sign-seam bg-sign-panel px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line-dps/35 bg-line-dps/10 text-line-dps">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white">
                Multiplicative DPS Formula Audit
              </h3>
              <p className="text-[12px] text-sign-mute">
                {stats.activeWeapon.name} · {loadout.assumptions.targetType.replace('_', ' ')} target
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-sign-mute transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close formula breakdown"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs">
          {/* Bucket 1: Effective Weapon ATK */}
          <div className="rounded-xl border border-sign-seam bg-sign-raised p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-line-dps">1. Effective Weapon ATK</span>
              <span className=" text-sm font-bold text-white">{f.effectiveAtk}</span>
            </div>
            <div className=" text-[12px] text-sign-mute">
              Tier/Star ATK ({f.weaponTierStarAtk}) × Calib ({f.calibrationMult}×) × Ammo ({f.ammoMult}×) × Attack% ({f.attackPctMult}×)
            </div>
          </div>

          {/* Bucket 2-5: Multiplicative Bullet Buckets */}
          <div className="rounded-xl border border-sign-seam bg-sign-raised p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-line-dps">
                2. Bullet Hit Equation ({f.motionValuePct}% MV × {f.pellets} pellet{f.pellets > 1 ? 's' : ''})
              </span>
              <span className=" text-sm font-bold text-white">
                {dps.avgBulletHit.toLocaleString()} avg/shot
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-sign-seam bg-sign-panel p-2.5">
                <div className="text-[12px] uppercase tracking-wider text-sign-mute">
                  Weapon DMG Bucket
                </div>
                <div className="mt-0.5 text-xs font-semibold text-white">
                  {f.weaponDmgBucket}× <span className="text-sign-mute">(+{stats.totals.weaponDmgPct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="rounded-lg border border-sign-seam bg-sign-panel p-2.5">
                <div className="text-[12px] uppercase tracking-wider text-sign-mute">
                  Expected Crit / Weakspot
                </div>
                <div className="mt-0.5 text-xs font-semibold text-white">
                  {f.expectedCritWeakspotMult}×{' '}
                  <span className="text-sign-mute">
                    ({f.critRateClampedPct}% CR, {f.weakspotRateClampedPct}% WS)
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-sign-seam bg-sign-panel p-2.5">
                <div className="text-[12px] uppercase tracking-wider text-sign-mute">
                  Target Type ({f.enemyTypeLabel})
                </div>
                <div className="mt-0.5 text-xs font-semibold text-white">
                  {f.enemyTypeBucket}×
                </div>
              </div>
              <div className="rounded-lg border border-sign-seam bg-sign-panel p-2.5">
                <div className="text-[12px] uppercase tracking-wider text-sign-mute">
                  Vulnerability / Debuffs
                </div>
                <div className="mt-0.5 text-xs font-semibold text-white">
                  {f.vulnerabilityBucket}× <span className="text-sign-mute">(+{stats.totals.vulnerabilityPct.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center text-[12px]">
              <div className="rounded bg-sign-panel p-1.5">
                <div className="text-[12px] text-sign-mute">Normal ({f.normalHitMult}×)</div>
                <div className="font-bold text-sign-white">{dps.normalHit.toLocaleString()}</div>
              </div>
              <div className="rounded bg-sign-panel p-1.5">
                <div className="text-[12px] text-amber-300">Crit ({f.critHitMult}×)</div>
                <div className="font-bold text-amber-300">{dps.critHit.toLocaleString()}</div>
              </div>
              <div className="rounded bg-sign-panel p-1.5">
                <div className="text-[12px] text-sky-300">Weakspot ({f.weakspotHitMult}×)</div>
                <div className="font-bold text-sky-300">{dps.weakspotHit.toLocaleString()}</div>
              </div>
              <div className="rounded bg-sign-panel p-1.5">
                <div className="text-[12px] text-line-dps">WS Crit ({f.weakspotCritHitMult}×)</div>
                <div className="font-bold text-line-dps">{dps.weakspotCritHit.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Bucket 3: Keyword Proc Scaling */}
          <div className="rounded-xl border border-sign-seam bg-sign-raised p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-line-dps">
                3. Keyword Proc ({f.keywordName} · {f.keywordKind})
              </span>
              <span className=" text-sm font-bold text-white">
                +{dps.avgKeywordProcPerShot.toLocaleString()} / shot · {dps.keywordProcDps.toLocaleString()} DPS
              </span>
            </div>
            <div className=" text-[12px] text-sign-mute">
              {f.keywordKind === 'none'
                ? 'Standard ballistic weapon — no keyword proc multiplier.'
                : `${f.keywordScalingLabel} × ${f.keywordProcChancePct}% Proc × ${f.keywordDmgBucket}× Keyword Bucket × ${f.enemyTypeBucket}× Target × ${f.vulnerabilityBucket}× Vuln`}
            </div>
          </div>

          {/* Bucket 4: Magazine Cycle & Final DPS */}
          <div className="rounded-xl border border-line-dps/30 bg-sign-panel/85 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-line-dps">4. Final DPS & Mag Cycle</span>
              <span className=" text-xs text-sign-mute">
                {dps.shotsPerSecond} shots/s · {stats.magCapacity} rds
              </span>
            </div>
            <div className="grid gap-2 text-[12px] sm:grid-cols-2">
              <div className="rounded-lg bg-sign-panel/90 p-2.5">
                <div className="text-sign-mute">Burst DPS (+ Companion {dps.deviationDps.toLocaleString()})</div>
                <div className="mt-0.5 text-base font-bold text-white">
                  {dps.burstDps.toLocaleString()} DPS
                </div>
                <div className="text-[12px] text-sign-dim">
                  ({dps.avgBulletHit} + {dps.avgKeywordProcPerShot}) × {dps.shotsPerSecond}/s
                </div>
              </div>
              <div className="rounded-lg bg-sign-panel/90 p-2.5">
                <div className="text-sign-mute">Sustained DPS (Cycle {f.cycleSeconds}s)</div>
                <div className="mt-0.5 text-base font-bold text-line-dps">
                  {dps.sustainedDps.toLocaleString()} DPS
                </div>
                <div className="text-[12px] text-sign-dim">
                  {f.magDumpSeconds}s fire + {f.effectiveReloadSeconds}s reload
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

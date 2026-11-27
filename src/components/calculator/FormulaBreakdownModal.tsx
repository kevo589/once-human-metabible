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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-label="DPS Multiplicative Formula Breakdown"
    >
      <div
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#0f161a] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0c1114] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3ee6c5]/35 bg-[#3ee6c5]/10 text-[#3ee6c5]">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white">
                Multiplicative DPS Formula Audit
              </h3>
              <p className="text-[11px] text-slate-400">
                {stats.activeWeapon.name} · {loadout.assumptions.targetType.replace('_', ' ')} target
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close formula breakdown"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs">
          {/* Bucket 1: Effective Weapon ATK */}
          <div className="rounded-xl border border-white/[0.08] bg-[#131a1e] p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-[#3ee6c5]">1. Effective Weapon ATK</span>
              <span className="font-mono text-sm font-bold text-white">{f.effectiveAtk}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Tier/Star ATK ({f.weaponTierStarAtk}) × Calib ({f.calibrationMult}×) × Ammo ({f.ammoMult}×) × Attack% ({f.attackPctMult}×)
            </div>
          </div>

          {/* Bucket 2-5: Multiplicative Bullet Buckets */}
          <div className="rounded-xl border border-white/[0.08] bg-[#131a1e] p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-[#3ee6c5]">
                2. Bullet Hit Equation ({f.motionValuePct}% MV × {f.pellets} pellet{f.pellets > 1 ? 's' : ''})
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {dps.avgBulletHit.toLocaleString()} avg/shot
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-white/[0.06] bg-[#0c1114] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Weapon DMG Bucket
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                  {f.weaponDmgBucket}× <span className="text-slate-400">(+{stats.totals.weaponDmgPct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#0c1114] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Expected Crit / Weakspot
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                  {f.expectedCritWeakspotMult}×{' '}
                  <span className="text-slate-400">
                    ({f.critRateClampedPct}% CR, {f.weakspotRateClampedPct}% WS)
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#0c1114] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Target Type ({f.enemyTypeLabel})
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                  {f.enemyTypeBucket}×
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#0c1114] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Vulnerability / Debuffs
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                  {f.vulnerabilityBucket}× <span className="text-slate-400">(+{stats.totals.vulnerabilityPct.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
              <div className="rounded bg-[#0c1114] p-1.5">
                <div className="text-[10px] text-slate-400">Normal ({f.normalHitMult}×)</div>
                <div className="font-bold text-slate-200">{dps.normalHit.toLocaleString()}</div>
              </div>
              <div className="rounded bg-[#0c1114] p-1.5">
                <div className="text-[10px] text-amber-300">Crit ({f.critHitMult}×)</div>
                <div className="font-bold text-amber-300">{dps.critHit.toLocaleString()}</div>
              </div>
              <div className="rounded bg-[#0c1114] p-1.5">
                <div className="text-[10px] text-sky-300">Weakspot ({f.weakspotHitMult}×)</div>
                <div className="font-bold text-sky-300">{dps.weakspotHit.toLocaleString()}</div>
              </div>
              <div className="rounded bg-[#0c1114] p-1.5">
                <div className="text-[10px] text-[#3ee6c5]">WS Crit ({f.weakspotCritHitMult}×)</div>
                <div className="font-bold text-[#3ee6c5]">{dps.weakspotCritHit.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Bucket 3: Keyword Proc Scaling */}
          <div className="rounded-xl border border-white/[0.08] bg-[#131a1e] p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-[#3ee6c5]">
                3. Keyword Proc ({f.keywordName} · {f.keywordKind})
              </span>
              <span className="font-mono text-sm font-bold text-white">
                +{dps.avgKeywordProcPerShot.toLocaleString()} / shot · {dps.keywordProcDps.toLocaleString()} DPS
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              {f.keywordKind === 'none'
                ? 'Standard ballistic weapon — no keyword proc multiplier.'
                : `${f.keywordScalingLabel} × ${f.keywordProcChancePct}% Proc × ${f.keywordDmgBucket}× Keyword Bucket × ${f.enemyTypeBucket}× Target × ${f.vulnerabilityBucket}× Vuln`}
            </div>
          </div>

          {/* Bucket 4: Magazine Cycle & Final DPS */}
          <div className="rounded-xl border border-[#3ee6c5]/30 bg-[#102122]/85 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-[#3ee6c5]">4. Final DPS & Mag Cycle</span>
              <span className="font-mono text-xs text-slate-300">
                {dps.shotsPerSecond} shots/s · {stats.magCapacity} rds
              </span>
            </div>
            <div className="grid gap-2 font-mono text-[11px] sm:grid-cols-2">
              <div className="rounded-lg bg-[#0c1114]/90 p-2.5">
                <div className="text-slate-400">Burst DPS (+ Companion {dps.deviationDps.toLocaleString()})</div>
                <div className="mt-0.5 text-base font-bold text-white">
                  {dps.burstDps.toLocaleString()} DPS
                </div>
                <div className="text-[10px] text-slate-500">
                  ({dps.avgBulletHit} + {dps.avgKeywordProcPerShot}) × {dps.shotsPerSecond}/s
                </div>
              </div>
              <div className="rounded-lg bg-[#0c1114]/90 p-2.5">
                <div className="text-slate-400">Sustained DPS (Cycle {f.cycleSeconds}s)</div>
                <div className="mt-0.5 text-base font-bold text-[#3ee6c5]">
                  {dps.sustainedDps.toLocaleString()} DPS
                </div>
                <div className="text-[10px] text-slate-500">
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

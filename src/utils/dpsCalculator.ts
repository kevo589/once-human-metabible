import type { CalculatorPreset, Weapon } from '../types/game';

export interface DpsBreakdown {
  effectiveBaseHit: number;
  expectedPerShotDamage: number;
  effectiveMagSize: number;
  effectiveFireRateRpm: number;
  effectiveReloadSeconds: number;
  burstDps: number;
  sustainedDps: number;
  magazineTotalDamage: number;
  critMultiplier: number;
  weakspotMultiplier: number;
  elementalSharePct: number;
  effectiveCritRatePct: number;
}

/**
 * Computes Once Human weapon DPS breakdown from weapon base stats and build modifiers.
 * Keeps multipliers separated cleanly across Weapon Attack, Crit/Weakspot, Vulnerability,
 * Elemental/Status, Cradle/Food, Armor Set, and Archetype proc scaling.
 */
export function calculateDps(weapon: Weapon, preset: CalculatorPreset): DpsBreakdown {
  const effectiveCritRate = Math.min(1, Math.max(0, weapon.critRate + preset.critRateBonusPct / 100));
  const totalCritBonus = weapon.critDamage + preset.critDamageBonusPct / 100;
  const critMultiplier = 1 + effectiveCritRate * totalCritBonus;

  const weakspotRatio = Math.min(1, Math.max(0, preset.weakspotHitRatioPct / 100));
  const totalWeakspotBonus = weapon.weakspotDamage + preset.weakspotDamageBonusPct / 100;
  const weakspotMultiplier = 1 + weakspotRatio * totalWeakspotBonus;

  const weaponAtkMult = 1 + preset.weaponAttackBonusPct / 100;
  const elementMult = 1 + weapon.elementBonus + preset.statusElementBonusPct / 100;
  const vulnMult = 1 + preset.vulnerableEnemyBonusPct / 100;
  const cradleFoodMult = 1 + preset.cradleAndFoodBonusPct / 100;
  const armorSetMult = 1 + preset.armorSetBonusPct / 100;

  // Elemental builds derive a larger fraction of damage from status procs that ignore weakspot hitboxes,
  // while physical/crit builds scale directly with both crit and weakspot multipliers.
  const isElemental =
    weapon.archetype === 'Frost Vortex' ||
    weapon.archetype === 'Power Surge' ||
    weapon.archetype === 'Burn' ||
    weapon.archetype === 'Unstable Bomber';

  const physicalCore = weapon.baseDamage * weaponAtkMult * critMultiplier * weakspotMultiplier;
  const elementalPortion = isElemental
    ? weapon.baseDamage * (elementMult - 1) * (weapon.archetype === 'Unstable Bomber' ? critMultiplier : 1)
    : 0;

  const effectiveBaseHit = physicalCore + elementalPortion;
  const expectedPerShotDamage =
    effectiveBaseHit * vulnMult * cradleFoodMult * armorSetMult * preset.archetypeProcMultiplier;

  const effectiveMagSize = Math.max(1, Math.round(weapon.magSize * (1 + preset.magSizeBonusPct / 100)));
  const effectiveFireRateRpm = weapon.fireRateRpm * (1 + preset.fireRateBonusPct / 100);
  const shotsPerSecond = effectiveFireRateRpm / 60;
  const effectiveReloadSeconds = Math.max(0.4, weapon.reloadSeconds / (1 + preset.reloadSpeedBonusPct / 100));

  const magDumpSeconds = effectiveMagSize / shotsPerSecond;
  const cycleSeconds = magDumpSeconds + effectiveReloadSeconds;
  const magazineTotalDamage = expectedPerShotDamage * effectiveMagSize;

  const burstDps = expectedPerShotDamage * shotsPerSecond;
  const sustainedDps = magazineTotalDamage / cycleSeconds;

  const totalRaw = physicalCore + elementalPortion;
  const elementalSharePct = totalRaw > 0 ? Math.min(100, Math.round((elementalPortion / totalRaw) * 100)) : 0;

  return {
    effectiveBaseHit: Math.round(effectiveBaseHit),
    expectedPerShotDamage: Math.round(expectedPerShotDamage),
    effectiveMagSize,
    effectiveFireRateRpm: Math.round(effectiveFireRateRpm),
    effectiveReloadSeconds: Number(effectiveReloadSeconds.toFixed(2)),
    burstDps: Math.round(burstDps),
    sustainedDps: Math.round(sustainedDps),
    magazineTotalDamage: Math.round(magazineTotalDamage),
    critMultiplier: Number(critMultiplier.toFixed(2)),
    weakspotMultiplier: Number(weakspotMultiplier.toFixed(2)),
    elementalSharePct,
    effectiveCritRatePct: Math.round(effectiveCritRate * 100),
  };
}

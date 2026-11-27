import { ArrowLeftRight, ChevronDown, ClipboardCheck, Crosshair, Hammer, Info, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import type { ArmorSet, Weapon } from '../../types/game';
import {
  ROMAN_TIERS,
  computeArmorCraft,
  computeWeaponCraft,
  normalizeArmorSlotKey,
  type CraftTier,
  type QueuedCraftItem,
} from '../../utils/craftingEngine';
import { MaterialIconGlyph, MATERIAL_RARITY_BORDER, StarRatingDisplay, inferMaterialVisual } from './MaterialVisuals';

interface CraftingInspectorPanelProps {
  mode: 'weapon' | 'armor';
  selectedArmor: ArmorSet | null;
  selectedWeapon: Weapon | null;
  tier: CraftTier;
  onChangeTier: (tier: CraftTier) => void;
  stars: number;
  onChangeStars: (stars: number) => void;
  selectedHideId: string;
  selectedGeneFabricId: string;
  onOpenHidePicker: () => void;
  onOpenGeneFabricPicker: () => void;
  inventoryMode: boolean;
  inventoryOwned: Record<string, number>;
  onUpdateOwned: (matName: string, val: number) => void;
  onAddToQueue: (item: Omit<QueuedCraftItem, 'queueId'>) => void;
  onSaveToBuild: (summaryText: string, weapon?: Weapon) => void;
  onSimulateWeapon?: (weapon: Weapon) => void;
  isMobileSheet?: boolean;
  onCloseMobileSheet?: () => void;
}

const TIERS: CraftTier[] = [1, 2, 3, 4, 5];

export function CraftingInspectorPanel({
  mode,
  selectedArmor,
  selectedWeapon,
  tier,
  onChangeTier,
  stars,
  onChangeStars,
  selectedHideId,
  selectedGeneFabricId,
  onOpenHidePicker,
  onOpenGeneFabricPicker,
  inventoryMode,
  inventoryOwned,
  onUpdateOwned,
  onAddToQueue,
  onSaveToBuild,
  onSimulateWeapon,
  isMobileSheet = false,
  onCloseMobileSheet,
}: CraftingInspectorPanelProps) {
  const [setBonusOpen, setSetBonusOpen] = useState(false);
  const [inspectedMat, setInspectedMat] = useState<string | null>(null);

  if (mode === 'armor' && !selectedArmor) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/[0.08] bg-[#141a1e] p-6 text-xs text-slate-400">
        Select an armor blueprint to configure Tier & Materials.
      </div>
    );
  }
  if (mode === 'weapon' && !selectedWeapon) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-white/[0.08] bg-[#141a1e] p-6 text-xs text-slate-400">
        Select a weapon blueprint to configure Tier & Materials.
      </div>
    );
  }

  const armorCraft =
    mode === 'armor' && selectedArmor
      ? computeArmorCraft(selectedArmor, tier, stars, selectedHideId, selectedGeneFabricId)
      : null;

  const weaponCraft =
    mode === 'weapon' && selectedWeapon
      ? computeWeaponCraft(selectedWeapon, tier, stars)
      : null;

  const activeName = mode === 'armor' ? selectedArmor!.name : selectedWeapon!.name;
  const activeSubtitle =
    mode === 'armor'
      ? selectedArmor!.setName || `${selectedArmor!.slot} Key Blueprint`
      : `${selectedWeapon!.archetype} · ${selectedWeapon!.element}`;
  const slotKey = mode === 'armor' && selectedArmor ? normalizeArmorSlotKey(selectedArmor.slot) : null;

  const materials = armorCraft ? armorCraft.materials : weaponCraft!.materials;
  const workbench = armorCraft ? armorCraft.workbench : weaponCraft!.workbench;
  const elCost = armorCraft ? armorCraft.elCost : weaponCraft!.elCost;

  const handleQueue = () => {
    if (mode === 'armor' && selectedArmor && armorCraft) {
      onAddToQueue({
        kind: 'armor',
        itemId: selectedArmor.id,
        name: selectedArmor.name,
        rarity: selectedArmor.rarity,
        slotOrCategory: selectedArmor.slot,
        imageUrl: selectedArmor.imageUrl,
        tier,
        stars,
        hideId: armorCraft.selectedHide.id,
        hideName: armorCraft.selectedHide.name,
        geneFabricId: armorCraft.supportsGeneFabric ? armorCraft.selectedGeneFabric.id : undefined,
        geneFabricName:
          armorCraft.supportsGeneFabric && armorCraft.selectedGeneFabric.id !== 'none'
            ? armorCraft.selectedGeneFabric.name
            : undefined,
        elCost: armorCraft.elCost,
        materials: armorCraft.materials,
        workbench: armorCraft.workbench,
      });
    } else if (mode === 'weapon' && selectedWeapon && weaponCraft) {
      onAddToQueue({
        kind: 'weapon',
        itemId: selectedWeapon.id,
        name: selectedWeapon.name,
        rarity: selectedWeapon.rarity,
        slotOrCategory: selectedWeapon.category,
        imageUrl: selectedWeapon.imageUrl,
        tier,
        stars,
        elCost: weaponCraft.elCost,
        materials: weaponCraft.materials,
        workbench: weaponCraft.workbench,
      });
    }
  };

  const handleSaveBuild = () => {
    if (mode === 'armor' && selectedArmor && armorCraft) {
      const perk = slotKey ? armorCraft.selectedHide.effects[slotKey] : '';
      onSaveToBuild(
        `[Tier ${ROMAN_TIERS[tier]} · ${stars}★] ${selectedArmor.name} | Hide: ${armorCraft.selectedHide.name} (${perk})${
          armorCraft.supportsGeneFabric && armorCraft.selectedGeneFabric.id !== 'none'
            ? ` | Fabric: ${armorCraft.selectedGeneFabric.name}`
            : ''
        }`,
      );
    } else if (mode === 'weapon' && selectedWeapon && weaponCraft) {
      onSaveToBuild(
        `[Tier ${ROMAN_TIERS[tier]} · ${stars}★] ${selectedWeapon.name} (${selectedWeapon.archetype}) · ATK ${weaponCraft.baseDamage} +${weaponCraft.bonusDamage}`,
        selectedWeapon,
      );
    }
  };

  return (
    <aside
      className={`flex flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-[#141a1e]/96 text-slate-100 shadow-2xl backdrop-blur-md ${
        isMobileSheet ? 'max-h-[84dvh] w-full' : 'h-full w-full'
      }`}
    >
      {/* Mobile Sheet Close Bar */}
      {isMobileSheet && onCloseMobileSheet && (
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0f1417] px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3ee6c5]">
            Workbench Inspector
          </span>
          <button
            type="button"
            onClick={onCloseMobileSheet}
            className="rounded p-1 text-slate-400 hover:text-white"
            aria-label="Close workbench inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Tier Selector Dropdown */}
      <div className="border-b border-white/[0.08] bg-[#0f1417]/85 p-3">
        <div className="relative">
          <select
            value={tier}
            onChange={(e) => onChangeTier(Number(e.target.value) as CraftTier)}
            aria-label="Select crafting tier"
            className="w-full appearance-none rounded-lg border border-[#3ee6c5]/55 bg-[#112424] px-3.5 py-2 pr-9 text-xs font-bold tracking-[0.14em] text-[#3ee6c5] shadow-[0_0_14px_rgba(62,230,197,0.14)] outline-none transition hover:border-[#3ee6c5]"
          >
            {TIERS.map((t) => (
              <option key={t} value={t} className="bg-[#141a1e] text-slate-100">
                TIER {ROMAN_TIERS[t]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3ee6c5]" />
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3.5 text-xs">
        {/* 2. Blueprint Header & Interactive 1★–6★ Rating */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold tracking-wide text-white">{activeName} B.P.</h2>
              <button
                type="button"
                onClick={() => setSetBonusOpen((v) => !v)}
                className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#3ee6c5] hover:underline"
              >
                <span>{activeSubtitle}</span>
                <Info className="h-3 w-3" />
              </button>
            </div>
            <span className="rounded border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-slate-300">
              {mode === 'armor' ? selectedArmor!.rarity : selectedWeapon!.rarity}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0f1417]/75 px-3 py-1.5">
            <StarRatingDisplay
              stars={stars}
              interactive
              onSelect={onChangeStars}
              size="md"
            />
            <span className="font-mono text-[10px] text-[#3ee6c5]">
              {stars}★ (+{(stars - 1) * 5}% Stats)
            </span>
          </div>

          {setBonusOpen && (
            <div className="mt-2 space-y-1.5 rounded-lg border border-[#3ee6c5]/30 bg-[#0f1417] p-2.5 text-[11px] text-slate-300">
              {mode === 'armor' && selectedArmor ? (
                <>
                  {selectedArmor.onePieceBonus && (
                    <div><strong className="text-white">1pc:</strong> {selectedArmor.onePieceBonus}</div>
                  )}
                  {selectedArmor.twoPieceBonus && (
                    <div><strong className="text-white">2pc:</strong> {selectedArmor.twoPieceBonus}</div>
                  )}
                  {selectedArmor.threePieceBonus && (
                    <div><strong className="text-white">3pc:</strong> {selectedArmor.threePieceBonus}</div>
                  )}
                  {selectedArmor.fourPieceBonus && (
                    <div><strong className="text-white">4pc:</strong> {selectedArmor.fourPieceBonus}</div>
                  )}
                  {!selectedArmor.onePieceBonus && <div>{selectedArmor.effectSummary}</div>}
                </>
              ) : (
                <div>
                  <strong className="text-white">{selectedWeapon!.archetype}:</strong>{' '}
                  {selectedWeapon!.trait}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Basic Stats Block */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <span className="h-3 w-0.5 bg-[#3ee6c5]" />
            <span>Basic Stats</span>
          </div>

          {mode === 'armor' && armorCraft && slotKey && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2.5">
                  <div className="text-[10px] text-slate-400">HP</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {armorCraft.baseHp}
                  </div>
                  {armorCraft.bonusHp > 0 && (
                    <div className="font-mono text-[10px] font-semibold text-[#3ee6c5]">
                      +{armorCraft.bonusHp}↑
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2.5">
                  <div className="text-[10px] text-slate-400">Pollution Res</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {armorCraft.basePollutionResist}
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2.5">
                  <div className="text-[10px] text-slate-400">Psi Intensity</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {armorCraft.basePsiIntensity}
                  </div>
                  {armorCraft.bonusPsiIntensity > 0 && (
                    <div className="font-mono text-[10px] font-semibold text-[#3ee6c5]">
                      +{armorCraft.bonusPsiIntensity}↑
                    </div>
                  )}
                </div>
              </div>

              {/* Active Hide / Wool & Gene Fabric Perk Pill */}
              <div className="space-y-1 rounded-lg border border-[#3ee6c5]/25 bg-[#1db99b]/10 px-3 py-2 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#3ee6c5]">{armorCraft.selectedHide.name}</span>
                  <span className="text-[10px] uppercase text-slate-400">{selectedArmor!.slot}</span>
                </div>
                <div className="text-slate-200">{armorCraft.selectedHide.effects[slotKey]}</div>
                {armorCraft.supportsGeneFabric && armorCraft.selectedGeneFabric.id !== 'none' && (
                  <div className="border-t border-white/[0.08] pt-1 text-amber-200">
                    <strong>{armorCraft.selectedGeneFabric.name}:</strong>{' '}
                    {armorCraft.selectedGeneFabric.effect}
                    {slotKey === 'top' && armorCraft.selectedGeneFabric.topBonus
                      ? ` · ${armorCraft.selectedGeneFabric.topBonus}`
                      : ''}
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'weapon' && selectedWeapon && weaponCraft && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2.5">
                <div className="text-[10px] text-slate-400">ATK / DMG</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-white">
                  {weaponCraft.baseDamage}
                </div>
                {weaponCraft.bonusDamage > 0 && (
                  <div className="font-mono text-[10px] font-semibold text-[#3ee6c5]">
                    +{weaponCraft.bonusDamage}↑
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2.5">
                <div className="text-[10px] text-slate-400">Fire Rate</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-white">
                  {selectedWeapon.fireRateRpm}
                </div>
                <div className="text-[10px] text-slate-500">RPM</div>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2.5">
                <div className="text-[10px] text-slate-400">Mag Cap</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-white">
                  {selectedWeapon.magSize}
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2">
                <div className="text-[10px] text-slate-400">Crit Rate</div>
                <div className="mt-0.5 font-mono text-xs font-bold text-white">
                  {Math.round(selectedWeapon.critRate * 100)}%
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2">
                <div className="text-[10px] text-slate-400">Weakspot</div>
                <div className="mt-0.5 font-mono text-xs font-bold text-white">
                  +{Math.round(selectedWeapon.weakspotDamage * 100)}%
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-[#0f1417]/80 p-2">
                <div className="text-[10px] text-slate-400">Keyword</div>
                <div className="mt-0.5 truncate text-[11px] font-semibold text-[#3ee6c5]">
                  {selectedWeapon.archetype}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Workbench Requirement Line */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0f1417]/80 px-3 py-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Hammer className="h-3.5 w-3.5 text-[#3ee6c5]" />
            Required Bench
          </span>
          <span className="font-semibold text-white">{workbench}</span>
        </div>

        {/* 5. Crafting Materials Square Tiles (64x64) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <span className="h-3 w-0.5 bg-[#3ee6c5]" />
              <span>Crafting Materials</span>
            </div>
            {armorCraft?.supportsGeneFabric && (
              <button
                type="button"
                onClick={onOpenGeneFabricPicker}
                className="inline-flex items-center gap-1 rounded border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200 hover:bg-amber-500/20"
              >
                <Sparkles className="h-3 w-3" />
                {armorCraft.selectedGeneFabric.id === 'none'
                  ? '+ Gene Fabric'
                  : '⇄ Gene Fabric'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {materials.map((mat) => {
              const vis = inferMaterialVisual(mat.name);
              const isHide = mat.kind === 'hide';
              const isGene = mat.kind === 'gene_fabric';
              const owned = inventoryOwned[mat.name] ?? 0;
              const short = inventoryMode && owned < mat.qty;

              return (
                <button
                  key={`${mat.name}-${mat.kind ?? 'base'}`}
                  type="button"
                  onClick={() => {
                    if (isHide) onOpenHidePicker();
                    else if (isGene) onOpenGeneFabricPicker();
                    else setInspectedMat((cur) => (cur === mat.name ? null : mat.name));
                  }}
                  title={`${mat.name} — ${vis.source}`}
                  className={`group relative flex h-16 w-16 flex-col items-center justify-center rounded-lg border transition hover:scale-[1.03] ${
                    MATERIAL_RARITY_BORDER[vis.rarity]
                  } ${isHide || isGene ? 'ring-1 ring-[#3ee6c5]/50' : ''}`}
                >
                  {(isHide || isGene) && (
                    <span className="absolute -top-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded bg-[#3ee6c5] px-1.5 py-0.5 text-[9px] font-bold text-[#091214] shadow">
                      <ArrowLeftRight className="h-2.5 w-2.5" /> Change
                    </span>
                  )}

                  <MaterialIconGlyph name={mat.name} accent={vis.accent} className="h-9 w-9" />

                  <span
                    className={`mt-0.5 font-mono text-[10px] font-bold leading-none ${
                      short ? 'text-rose-400' : inventoryMode ? 'text-[#3ee6c5]' : 'text-white'
                    }`}
                  >
                    {inventoryMode ? `${owned}/${mat.qty}` : `×${mat.qty}`}
                  </span>
                </button>
              );
            })}
          </div>

          {inspectedMat && (
            <div className="rounded-lg border border-white/[0.08] bg-[#0f1417] p-2.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <MaterialIconGlyph
                    name={inspectedMat}
                    accent={inferMaterialVisual(inspectedMat).accent}
                    className="h-7 w-7"
                  />
                  <span className="truncate font-semibold text-white">{inspectedMat}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedMat(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                Source: {inferMaterialVisual(inspectedMat).source}
              </div>
              {inventoryMode && (
                <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-2">
                  <span className="text-[10px] text-slate-300">Owned Qty:</span>
                  <input
                    type="number"
                    min={0}
                    value={inventoryOwned[inspectedMat] ?? 0}
                    onChange={(e) =>
                      onUpdateOwned(inspectedMat, Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-20 rounded border border-white/[0.12] bg-[#141a1e] px-2 py-0.5 font-mono text-xs text-white outline-none focus:border-[#3ee6c5]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. Price & Action Footer */}
      <div className="space-y-2.5 border-t border-white/[0.08] bg-[#0f1417]/95 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Price</span>
          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-amber-300">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/50 bg-amber-500/20 text-[9px]">
              EL
            </span>
            <span>{elCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveBuild}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-[#141a1e] text-slate-200 transition hover:border-[#3ee6c5]/60 hover:text-[#3ee6c5]"
            title="Save to Build & copy summary"
            aria-label="Save to Build"
          >
            <ClipboardCheck className="h-4 w-4" />
          </button>

          {mode === 'weapon' && selectedWeapon && onSimulateWeapon && (
            <button
              type="button"
              onClick={() => onSimulateWeapon(selectedWeapon)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#141a1e] px-2.5 text-[11px] font-medium text-slate-200 transition hover:border-[#3ee6c5]/60 hover:text-[#3ee6c5]"
              title="Open in DPS Calculator"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">DPS</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleQueue}
            className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#3ee6c5] px-3 text-xs font-bold uppercase tracking-wider text-[#091214] shadow-[0_0_20px_rgba(62,230,197,0.28)] transition hover:bg-[#5df0d2]"
          >
            Add to Craft Queue
          </button>
        </div>
      </div>
    </aside>
  );
}

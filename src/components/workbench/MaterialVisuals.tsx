import { Layers } from 'lucide-react';
import rawMaterialImages from '../../data/crafting/materialImages.json';

export const MATERIAL_IMAGES = rawMaterialImages as Record<string, string>;

export function getMaterialImageUrl(name: string): string | undefined {
  return MATERIAL_IMAGES[name];
}

export const BENCH_BP_GRADIENT: Record<string, string> = {
  Legendary:
    'bg-gradient-to-br from-[#614515]/85 via-[#2a2010]/90 to-[#141a1e] border-amber-400/35',
  Epic:
    'bg-gradient-to-br from-[#4f2b6e]/85 via-[#241634]/90 to-[#141a1e] border-purple-400/35',
  Rare:
    'bg-gradient-to-br from-[#1b416e]/85 via-[#112238]/90 to-[#141a1e] border-sky-400/35',
  Fine:
    'bg-gradient-to-br from-[#1b416e]/85 via-[#112238]/90 to-[#141a1e] border-sky-400/35',
  Uncommon:
    'bg-gradient-to-br from-[#194a36]/85 via-[#10261d]/90 to-[#141a1e] border-emerald-400/35',
  Common:
    'bg-gradient-to-br from-[#194a36]/80 via-[#121e1a]/90 to-[#141a1e] border-emerald-400/30',
};

export const MATERIAL_RARITY_BORDER: Record<string, string> = {
  legendary: 'border-amber-400/55 bg-gradient-to-br from-[#5d4214]/75 to-[#141a1e]',
  epic: 'border-purple-400/55 bg-gradient-to-br from-[#4a2668]/75 to-[#141a1e]',
  fine: 'border-sky-400/55 bg-gradient-to-br from-[#193d68]/75 to-[#141a1e]',
  common: 'border-white/[0.14] bg-gradient-to-br from-[#1c252b] to-[#11171a]',
};

export function inferMaterialVisual(name: string): {
  rarity: 'legendary' | 'epic' | 'fine' | 'common';
  shortTag: string;
  source: string;
  accent: string;
} {
  const n = name.toLowerCase();
  if (n.includes('stardust source')) {
    return {
      rarity: 'epic',
      shortTag: 'SRC',
      source: 'Monoliths, Silos, Rift Anchors, Oil Rigs & Disassembly',
      accent: '#c084fc',
    };
  }
  if (n.includes('gene fabric')) {
    return {
      rarity: 'legendary',
      shortTag: 'GENE',
      source: 'Hard / Pro Dungeons & Scenario Trait Drops',
      accent: '#f59e0b',
    };
  }
  if (n.includes('lining') || n.includes('body') || n.includes('frame')) {
    const tierRarity = n.includes(' v') ? 'epic' : n.includes(' iv') ? 'fine' : 'common';
    return {
      rarity: tierRarity,
      shortTag: n.includes('lining') ? 'LIN' : 'BODY',
      source: 'Loot Crates, Stronghold Salvage & Supplies Bench',
      accent: '#3ee6c5',
    };
  }
  if (n.includes('tungsten')) {
    return {
      rarity: 'epic',
      shortTag: 'W-ING',
      source: 'Smelt Tungsten Ore (Red Sands / Chalk Peak / Ember Strand)',
      accent: '#a78bfa',
    };
  }
  if (n.includes('alloy')) {
    return {
      rarity: 'fine',
      shortTag: 'ALLOY',
      source: 'Smelt Aluminum Ore (Chalk Peak / Iron River) + Acid',
      accent: '#38bdf8',
    };
  }
  if (n.includes('steel ingot')) {
    return {
      rarity: 'fine',
      shortTag: 'STEEL',
      source: 'Smelt Iron Ore (Broken Delta / Iron River)',
      accent: '#94a3b8',
    };
  }
  if (n.includes('bronze') || n.includes('copper') || n.includes('wood')) {
    return {
      rarity: 'common',
      shortTag: n.includes('wood') ? 'WOOD' : 'ORE',
      source: 'Early Gathering (Dayton Wetlands / Broken Delta)',
      accent: '#d97706',
    };
  }
  if (n.includes('plastic')) {
    return {
      rarity: 'common',
      shortTag: 'PLAS',
      source: 'Disassemble Junk & Electronics across Settlements',
      accent: '#38bdf8',
    };
  }
  if (n.includes('fiber')) {
    return {
      rarity: 'common',
      shortTag: 'FIBR',
      source: 'Disassemble Fabrics & Salvage Crates',
      accent: '#34d399',
    };
  }
  if (n.includes('adhesive')) {
    return {
      rarity: 'fine',
      shortTag: 'ADHV',
      source: 'Storage Crates, Car Trunks & Junk Disassembly',
      accent: '#fbbf24',
    };
  }
  if (n.includes('parts')) {
    return {
      rarity: 'common',
      shortTag: 'PART',
      source: 'Weapon/Supply Crates, Car Trunks & Scrap Disassembly',
      accent: '#cbd5e1',
    };
  }
  return {
    rarity: 'common',
    shortTag: 'HIDE',
    source: 'Hunting Wildlife / Livestock Taming across Nalcott',
    accent: '#3ee6c5',
  };
}

export function MaterialIconGlyph({
  name,
  accent,
  className = 'h-9 w-9',
}: {
  name: string;
  accent: string;
  className?: string;
}) {
  const imageUrl = getMaterialImageUrl(name);
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        className={`${className} shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]`}
      />
    );
  }

  const n = name.toLowerCase();
  if (n.includes('stardust')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={accent} strokeWidth="1.9">
        <path d="M12 2 5.5 9.5 8 20h8l2.5-10.5L12 2Z" />
        <path d="M12 7v8m-3-4h6" />
      </svg>
    );
  }
  if (n.includes('ingot') || n.includes('ore')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={accent} strokeWidth="1.9">
        <path d="M4 16 7 9h10l3 7H4Zm2.5-7 2-3h7l2 3" />
      </svg>
    );
  }
  if (n.includes('wool') || n.includes('skin') || n.includes('hide') || n.includes('fur') || n.includes('velvet')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={accent} strokeWidth="1.8">
        <path d="M7 5c1.5 1 3 1 5 0 2 1 3.5 1 5 0l2 4-2 2v8l-5-2-5 2v-8L5 9l2-4Z" />
      </svg>
    );
  }
  if (n.includes('gene fabric') || n.includes('fiber') || n.includes('lining')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={accent} strokeWidth="1.9">
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M8 9h8M8 12h8M8 15h5" />
      </svg>
    );
  }
  if (n.includes('body') || n.includes('frame') || n.includes('parts')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={accent} strokeWidth="1.9">
        <path d="M3 10h13l3-2 2 2-2 3h-5v5h-4v-5H3v-3Z" />
      </svg>
    );
  }
  return <Layers className="h-5 w-5" style={{ color: accent }} />;
}

export function StarRatingDisplay({
  stars,
  interactive = false,
  onSelect,
  size = 'sm',
}: {
  stars: number;
  interactive?: boolean;
  onSelect?: (stars: number) => void;
  size?: 'xs' | 'sm' | 'md';
}) {
  const dim = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5, 6].map((level) => {
        const filled = level <= stars;
        return interactive ? (
          <button
            key={level}
            type="button"
            onClick={() => onSelect?.(level)}
            className={`${dim} leading-none transition hover:scale-110 ${
              filled ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]' : 'text-zinc-600 hover:text-zinc-400'
            }`}
            aria-label={`${level} star rating`}
          >
            ✦
          </button>
        ) : (
          <span
            key={level}
            className={`${dim} leading-none ${filled ? 'text-amber-300' : 'text-zinc-600/50'}`}
          >
            ✦
          </span>
        );
      })}
    </div>
  );
}

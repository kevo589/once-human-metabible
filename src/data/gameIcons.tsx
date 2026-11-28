/**
 * In-game Once Human icons, cut from TH.GL's icon sheet (https://oncehuman.th.gl),
 * downloaded with the owner's go-ahead on 2026-11-28 and credited in the map attribution.
 * Game art © Starry Studio / NetEase Games. Rects are [x, y, w, h] in sheet pixels.
 */
export const GAME_ICON_SHEET = './assets/icons/thgl-icons.webp';
export const GAME_ICON_CREDIT = 'Icons via <a href="https://oncehuman.th.gl" target="_blank" rel="noopener">TH.GL</a>';
const SHEET_W = 1837;
const SHEET_H = 1915;

type Rect = readonly [number, number, number, number];

export const GAME_ICONS: Record<string, Rect> = {
  // Map categories (our key -> TH.GL label in comment). teleport-tower has no labelled icon, so it keeps its drawn glyph.
  monolith: [1124, 926, 64, 64], // Monolith
  'securement-silo': [1160, 1652, 51, 51], // Securement Silos
  'mayfly-stronghold': [707, 1652, 57, 57], // Mountain Fortress
  'extraction-site': [1319, 1652, 50, 50], // Extraction Sites
  'contest-area': [1762, 1844, 31, 31], // Contest Area
  'attackers-base': [1631, 1652, 49, 49], // Attacker's Base
  'birdview-camp': [1733, 1652, 45, 45], // Birdview Camp
  'cave-base': [1780, 1652, 45, 45], // Cave Base
  settlement: [1105, 1652, 53, 53], // Town
  'mine-workshop': [860, 926, 64, 64], // Mine Workshop
  'harvesters-market': [266, 926, 64, 64], // Harvesters' Market
  worldstone: [462, 1652, 60, 60], // Worldstone
  place: [464, 1190, 64, 64], // generic named location
  'fragrant-cape': [464, 1190, 64, 64],
  'frost-forge': [464, 1190, 64, 64],
  'furnace-lair': [464, 1190, 64, 64],
  'gaia-military-base': [1371, 1652, 50, 50], // Military Base
  'gaia-research-center': [937, 1652, 54, 54], // Research Lab
  'thermal-tower': [881, 1652, 54, 54], // Public Thermal Tower
  arena: [1256, 926, 64, 64], // Large Arena
  'ore-startrace': [1640, 1760, 40, 40], // Ores
  'ore-tungsten': [662, 1322, 64, 64], // Tungsten Ore
  'ore-gold-silver': [530, 1322, 64, 64], // Gold Ore
  'ore-iron-copper': [728, 1322, 64, 64], // Iron Ore
  'hunting-grounds': [1190, 728, 64, 64], // Deer
  'herbs-crops': [1652, 1256, 64, 64], // Fruit & Veggies
  'acid-salt-sulfur': [794, 1322, 64, 64], // Sulfur
  'mystical-crate': [1514, 1802, 40, 40], // Mystical Crate
  'weapon-crate': [1322, 1256, 64, 64], // Weapon Crate
  'gear-crate': [842, 1802, 40, 40], // Gear Crate
  'morphic-crate': [380, 1802, 40, 40], // Morphic Crate
  'echo-loot': [1586, 596, 64, 64], // Echoes of Stardust
  'car-trunk': [2, 1322, 64, 64], // Car Trunk
  'ammo-box': [1586, 1256, 64, 64], // Ammo Box
  'basic-supply-crate': [422, 1802, 40, 40], // Basic Supply Crates
  'basic-crate': [1388, 1256, 64, 64], // Wooden Crate
  'dusty-loot-crate': [674, 1802, 40, 40], // Dusty Loot Crate
  'damp-crate': [1556, 1802, 39, 39], // Damp Crate
  'deviation-spawn': [266, 1520, 64, 64], // Securement Pod

  // Feature lines in the top band
  'nav-calculator': [1454, 1388, 64, 64], // Lv. 1 Assault Rifle (turret)
  'nav-meta': [1454, 1520, 64, 64], // Booster
  'nav-workbench': [134, 1388, 64, 64], // Advanced Gear Workbench
  'nav-map': [1722, 1844, 38, 38], // Respawn Point (map pin)
  'nav-encyclopedia': [1058, 1322, 64, 64], // book
  'nav-timers': [1256, 1388, 64, 64], // Alarm
};

/** A single game icon from the sheet, scaled into a size x size box. Renders nothing for unknown ids. */
export function GameIcon({ id, size, className }: { id: string; size: number; className?: string }) {
  const r = GAME_ICONS[id];
  if (!r) return null;
  const s = size / Math.max(r[2], r[3]);
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
        backgroundImage: `url(${GAME_ICON_SHEET})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${SHEET_W * s}px ${SHEET_H * s}px`,
        backgroundPosition: `${-r[0] * s}px ${-r[1] * s}px`,
      }}
    />
  );
}

let sheetImg: HTMLImageElement | null = null;
const sheetWaiters: Array<() => void> = [];

/** Shared decoded sheet for canvas drawing; calls onReady once it has loaded. */
export function getGameIconSheet(onReady?: () => void): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!sheetImg) {
    sheetImg = new Image();
    sheetImg.onload = () => sheetWaiters.splice(0).forEach((f) => f());
    sheetImg.src = GAME_ICON_SHEET;
  }
  if (sheetImg.complete && sheetImg.naturalWidth > 0) return sheetImg;
  if (onReady) sheetWaiters.push(onReady);
  return null;
}

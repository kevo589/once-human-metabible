import L from 'leaflet';
import { GAME_ICONS, GameIcon, getGameIconSheet } from '../../data/gameIcons';

const SVG_PATHS: Record<string, string> = {
  // Locations
  'teleport-tower':
    '<path d="M12 2v4m0 12v4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8M2 12h4m12 0h4M5.6 18.4l2.8-2.8m7.2-7.2 2.8-2.8"/><circle cx="12" cy="12" r="3"/>',
  monolith: '<path d="M12 2 4 9l2 11h12l2-11-8-7Z"/><circle cx="12" cy="11" r="2.2"/>',
  'securement-silo':
    '<path d="M12 2 4 6.5v11L12 22l8-4.5v-11L12 2Z"/><path d="M9 12h6m-3-3v6"/>',
  'mayfly-stronghold':
    '<path d="M4 20V8l4-3 4 3 4-3 4 3v12H4Z"/><path d="M9 20v-5h6v5"/>',
  'extraction-site': '<path d="M12 2v10m-5 8 5-18 5 18H7Zm2-6h6"/>',
  'contest-area': '<path d="M5 3v18M5 4h11l-2 4 2 4H5"/>',
  'attackers-base':
    '<path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5l-8-3Z"/>',
  'birdview-camp': '<path d="M12 4 3 20h18L12 4Zm0 8-3 8h6l-3-8Z"/>',
  'cave-base': '<path d="M3 20h18L17 7l-5-3-5 3-4 13Zm6 0v-6a3 3 0 0 1 6 0v6"/>',
  settlement: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z"/>',
  'mine-workshop':
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.7 3.7Z"/>',
  'harvesters-market':
    '<path d="M3 7h18l-2 11H5L3 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>',
  worldstone: '<path d="M12 2 5 11l7 11 7-11-7-9Z"/>',
  place:
    '<path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',

  // Gathering & Resources
  'ore-startrace':
    '<path d="M6 3h12l4 6-10 12L2 9l4-6Z"/><path d="M11 3 8 9l4 12 4-12-3-6M2 9h20"/>',
  'ore-tungsten':
    '<path d="M14 5 5 14l5 5 9-9-5-5Z"/><path d="m11 8 5 5M4 20l4-4"/>',
  'ore-gold-silver':
    '<path d="M7 14 3 20h10l-3-6H7Zm10-8-4 8h8l-4-8Z"/><circle cx="8" cy="7" r="2.2"/>',
  'ore-iron-copper':
    '<path d="M4 16 8 7l6-3 6 6-3 9H7l-3-3Z"/><path d="M8 7l5 5 7-2"/>',
  'hunting-grounds':
    '<circle cx="11" cy="5.5" r="1.7"/><circle cx="16.5" cy="7" r="1.7"/><circle cx="6" cy="9" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/><path d="M8.5 14c1.2-2 5.8-2 7 0l1.2 3.2c.5 1.3-.5 2.8-1.9 2.8H9.2c-1.4 0-2.4-1.5-1.9-2.8L8.5 14Z"/>',
  'herbs-crops':
    '<path d="M12 21V9m0 0C12 5 8 3 4 3c0 4 2 8 8 6Zm0 0c0-4 4-6 8-6 0 4-2 8-8 6Z"/>',
  'acid-salt-sulfur':
    '<path d="M9 3h6m-4 0v5l-4.5 8.5A2.2 2.2 0 0 0 8.4 20h7.2a2.2 2.2 0 0 0 1.9-3.5L13 8V3"/><path d="M7.5 15h9"/>',

  // Loot Containers
  'mystical-crate':
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M12 7v13M3 12h18M8 7c0-2 1.5-3 4-3s4 1 4 3"/>',
  'weapon-crate':
    '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7 12h10m-4-3 3 3-3 3"/>',
  'gear-crate':
    '<path d="M12 3 5 6v6c0 4.6 3 8.2 7 9.5 4-1.3 7-4.9 7-9.5V6l-7-3Z"/><path d="M9 12h6"/>',
  'morphic-crate':
    '<rect x="4" y="5" width="16" height="15" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M4 9h16"/>',
  'echo-loot':
    '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 3"/><circle cx="12" cy="12" r="2"/>',
  'car-trunk':
    '<path d="M5 17H3v-5l2-5h14l2 5v5h-2m-12 0a2 2 0 1 0 4 0m4 0a2 2 0 1 0 4 0M5 12h14"/>',
  'ammo-box':
    '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 10v6m4-6v6m4-6v6M4 10h16"/>',
  'basic-supply-crate':
    '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M12 9v7m-3.5-3.5h7"/>',
  'basic-crate': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>',
  'dusty-loot-crate':
    '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7 11h10M7 15h6"/>',
  'damp-crate':
    '<path d="M12 3s5 5.2 5 9a5 5 0 0 1-10 0c0-3.8 5-9 5-9Z"/><path d="M9.5 13a2.5 2.5 0 0 0 2.5 2"/>',
  'broken-relic': '<path d="M12 2 6 8l2 12h8l2-12-6-6Zm-1 6 3 4-3 5"/>',

  // Bosses, Lairs & Anomalies
  'rift-anchor': '<circle cx="12" cy="12" r="8"/><path d="M12 7v10m-5-5h10"/>',
  'deviation-spawn':
    '<path d="M12 2c3.5 3.2 6 6.2 6 10a6 6 0 1 1-12 0c0-3.8 2.5-6.8 6-10Z"/><circle cx="12" cy="13" r="2.2"/>',
  'prime-war': '<path d="M12 2 4 7v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V7l-8-5Zm-2 9 2 3 2-3"/>',
  'public-crisis':
    '<path d="M12 3 2.5 19h19L12 3Zm0 6v5m0 3h.01"/>',
  'fragrant-cape':
    '<path d="M12 3c2.5 3 4.5 5 4.5 8.5a4.5 4.5 0 1 1-9 0C7.5 8 9.5 6 12 3Z"/><path d="M5 19h14"/>',
  'frost-forge':
    '<path d="M12 2v20M4.9 6l14.2 12M19.1 6 4.9 18"/>',
  'furnace-lair':
    '<path d="M12 2c2 3.8 5 6.4 5 10a5 5 0 1 1-10 0c0-3.6 3-6.2 5-10Z"/>',
  'gaia-military-base':
    '<path d="M12 3 4 7v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4Z"/><circle cx="12" cy="12" r="2.5"/>',
  'gaia-research-center':
    '<path d="M9 3h6m-5 0v5l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 17l-5-9V3"/>',
  'thermal-tower': '<path d="M12 2v12m-4-6 4-6 4 6M7 20h10"/>',
  arena: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',

  // Custom Icon Choices
  star: '<path d="m12 2 3 6.2 6.8 1-4.9 4.7 1.2 6.8L12 17.4 5.9 20.7l1.2-6.8L2.2 9.2 9 8.2 12 2Z"/>',
  skull: '<circle cx="12" cy="11" r="6"/><path d="M9 17v3h6v-3m-4-6h.01M14 11h.01"/>',
  flag: '<path d="M5 3v18M5 4h12l-2.5 4L17 12H5"/>',
};

const SPRITE_CACHE = new Map<string, HTMLCanvasElement>();
const IMAGE_SPRITE_CACHE = new Map<string, HTMLCanvasElement>();
const IMAGE_SPRITE_PENDING = new Set<string>();
const CUSTOM_ICON_CACHE = new Map<string, L.DivIcon>();

export function CategoryGlyph({
  typeKey,
  color,
  variant = 'default',
}: {
  typeKey: string;
  color: string;
  variant?: 'default' | 'anomaly';
}) {
  if (GAME_ICONS[typeKey]) return <GameIcon id={typeKey} size={22} />;
  const path = SVG_PATHS[typeKey] ?? SVG_PATHS.place;
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        variant === 'anomaly'
          ? 'border-orange-500/45 bg-orange-950/75 text-orange-400'
          : 'border-sign-seam/80 bg-sign-raised text-sign-white'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={variant === 'anomaly' ? '#fb923c' : color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        dangerouslySetInnerHTML={{ __html: path }}
      />
    </span>
  );
}

/**
 * Generates and caches a crisp 64x64 offscreen canvas badge from inline vector SVG
 * so thousands of Canvas markers render with crisp edges across all zoom levels.
 */
export function getCategoryCanvasSprite(
  typeKey: string,
  color: string,
  onReady?: () => void,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const cacheKey = `${typeKey}|${color}`;
  const existing = SPRITE_CACHE.get(cacheKey);
  if (existing) return existing;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fallback immediate synchronous vector draw so frame 1 is never blank before Image decode
  drawFallbackBadge(ctx, size, color);

  const rect = GAME_ICONS[typeKey];
  if (rect) {
    // In-game icon from the shared sheet, with a soft shadow so it reads on bright terrain
    const paint = (sheet: HTMLImageElement) => {
      const [x, y, w, h] = rect;
      const fit = (size - 8) / Math.max(w, h);
      const dw = w * fit;
      const dh = h * fit;
      ctx.clearRect(0, 0, size, size);
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.drawImage(sheet, x, y, w, h, (size - dw) / 2, (size - dh) / 2, dw, dh);
    };
    const sheet = getGameIconSheet(() => {
      const ready = getGameIconSheet();
      if (ready) paint(ready);
      onReady?.();
    });
    if (sheet) paint(sheet);
    SPRITE_CACHE.set(cacheKey, canvas);
    return canvas;
  }

  const path = SVG_PATHS[typeKey] ?? SVG_PATHS.place;
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="27" fill="#000000" stroke="${color}" stroke-width="5"/>
    <circle cx="32" cy="32" r="23" fill="${color}" fill-opacity="0.16"/>
    <g transform="translate(15,15) scale(1.42)" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</g>
  </svg>`;

  const img = new Image();
  const blobUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
  img.onload = () => {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(blobUrl);
  };
  img.onerror = () => {
    URL.revokeObjectURL(blobUrl);
  };
  img.src = blobUrl;

  SPRITE_CACHE.set(cacheKey, canvas);
  return canvas;
}

/**
 * Generates and caches a crisp 76x76 circular portrait badge for image-backed markers
 * (such as Deviation Spawns), with a dark backdrop and glowing border ring.
 */
export function getImageCanvasSprite(
  imageUrl: string,
  borderColor: string,
  onReady?: () => void,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined' || !imageUrl) return null;
  const cacheKey = `${imageUrl}|${borderColor}`;
  const existing = IMAGE_SPRITE_CACHE.get(cacheKey);
  if (existing) return existing;

  const size = 76;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawFallbackBadge(ctx, size, borderColor);
  IMAGE_SPRITE_CACHE.set(cacheKey, canvas);

  if (!IMAGE_SPRITE_PENDING.has(cacheKey)) {
    IMAGE_SPRITE_PENDING.add(cacheKey);
    const img = new Image();
    img.onload = () => {
      IMAGE_SPRITE_PENDING.delete(cacheKey);
      const center = size / 2;
      const radius = size * 0.43;

      ctx.clearRect(0, 0, size, size);

      // Subtle dark outer halo for map contrast
      ctx.beginPath();
      ctx.arc(center, center, radius + 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
      ctx.fill();

      // Circular dark plate behind transparent PNG corners
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = '#14171c';
      ctx.fillRect(0, 0, size, size);

      // Aspect-fill crop centered on the portrait
      const nw = img.naturalWidth || size;
      const nh = img.naturalHeight || size;
      const scale = Math.max((radius * 2) / nw, (radius * 2) / nh);
      const dw = nw * scale;
      const dh = nh * scale;
      ctx.drawImage(img, center - dw / 2, center - dh / 2, dw, dh);
      ctx.restore();

      // Crisp category ring stroke
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      // Thin inner gleam
      ctx.beginPath();
      ctx.arc(center, center, radius - 2.5, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      onReady?.();
    };
    img.onerror = () => {
      IMAGE_SPRITE_PENDING.delete(cacheKey);
    };
    img.src = imageUrl;
  }

  return canvas;
}

function drawFallbackBadge(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const c = size / 2;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.lineWidth = size * 0.08;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(c, c, size * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function getCustomPinDivIcon(iconKey: string, color: string, label?: string): L.DivIcon {
  const cacheKey = `${iconKey}|${color}|${label ?? ''}`;
  const cached = CUSTOM_ICON_CACHE.get(cacheKey);
  if (cached) return cached;

  const path = SVG_PATHS[iconKey] ?? SVG_PATHS.place;
  const icon = L.divIcon({
    className: 'thgl-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div class="thgl-pin" style="width:28px;height:28px;background:#000000;border:2px solid ${color};box-shadow:0 0 12px ${color}55;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${path}</svg></div>`,
  });
  CUSTOM_ICON_CACHE.set(cacheKey, icon);
  return icon;
}

export const PLAYER_POSITION_ICON = L.divIcon({
  className: 'thgl-marker-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  html: `<div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;"><span style="position:absolute;inset:0;border-radius:9999px;background:rgba(6,182,212,0.28);border:2px solid #06b6d4;animation:pulse 1.8s infinite;"></span><span style="position:relative;width:11px;height:11px;border-radius:9999px;background:#22d3ee;border:2px solid #ffffff;box-shadow:0 0 10px #06b6d4;"></span></div>`,
});

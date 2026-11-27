import L from 'leaflet';

const SVG_PATHS: Record<string, string> = {
  'teleport-tower':
    '<path d="M12 2v4m0 12v4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8M2 12h4m12 0h4M5.6 18.4l2.8-2.8m7.2-7.2 2.8-2.8"/><circle cx="12" cy="12" r="3"/>',
  monolith: '<path d="M12 2 4 9l2 11h12l2-11-8-7Z"/><circle cx="12" cy="11" r="2"/>',
  'securement-silo':
    '<path d="M12 2 4 6.5v11L12 22l8-4.5v-11L12 2Z"/><path d="M9 12h6m-3-3v6"/>',
  worldstone: '<path d="M12 2 5 11l7 11 7-11-7-9Z"/>',
  'rift-anchor':
    '<circle cx="12" cy="12" r="8"/><path d="M12 8v8m-4-4h8"/>',
  'mayfly-stronghold':
    '<path d="M4 20V8l4-3 4 3 4-3 4 3v12H4Z"/><path d="M9 20v-5h6v5"/>',
  settlement: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z"/>',
  'mine-workshop':
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.7 3.7Z"/>',
  'thermal-tower':
    '<path d="M12 2c2 4 5 6.5 5 10a5 5 0 1 1-10 0c0-3.5 3-6 5-10Z"/>',
  'harvesters-market':
    '<path d="M3 7h18l-2 11H5L3 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>',
  camp: '<path d="M12 4 3 20h18L12 4Zm0 8-3 8h6l-3-8Z"/>',
  'research-lab':
    '<path d="M9 3h6m-5 0v5l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 17l-5-9V3"/>',
  'extraction-site':
    '<path d="M12 2v10m-5 8 5-18 5 18H7Zm2-6h6"/>',
  arena:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  'contest-area': '<path d="M5 3v18M5 4h11l-2 4 2 4H5"/>',
  'attackers-base': '<path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5l-8-3Z"/>',
  place: '<path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
};

const ICON_CACHE = new Map<string, L.DivIcon>();

export function CategoryGlyph({ typeKey, color }: { typeKey: string; color: string }) {
  const path = SVG_PATHS[typeKey] ?? SVG_PATHS.place;
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-obsidian-950/90 shadow-sm"
      style={{ backgroundColor: color }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#07090d"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
        dangerouslySetInnerHTML={{ __html: path }}
      />
    </span>
  );
}

export function getMarkerDivIcon(
  typeKey: string,
  color: string,
  found: boolean,
  selected: boolean,
): L.DivIcon {
  const cacheKey = `${typeKey}|${color}|${found ? '1' : '0'}|${selected ? '1' : '0'}`;
  const cached = ICON_CACHE.get(cacheKey);
  if (cached) return cached;

  const size = selected ? 30 : 22;
  const svgSize = selected ? 15 : 12;
  const path = SVG_PATHS[typeKey] ?? SVG_PATHS.place;
  const classes = `thgl-pin${found ? ' is-found' : ''}${selected ? ' is-selected' : ''}`;

  const icon = L.divIcon({
    className: 'thgl-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div class="${classes}" style="width:${size}px;height:${size}px;background:${color};"><svg viewBox="0 0 24 24" width="${svgSize}" height="${svgSize}" fill="none" stroke="#07090d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${path}</svg></div>`,
  });

  ICON_CACHE.set(cacheKey, icon);
  return icon;
}

const CUSTOM_PIN_ICON = L.divIcon({
  className: 'thgl-marker-icon',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
  html: `<div class="thgl-pin" style="width:26px;height:26px;background:#10b981;border-color:#ffffff;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#052e16" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${SVG_PATHS.place}</svg></div>`,
});

export function getCustomPinDivIcon(): L.DivIcon {
  return CUSTOM_PIN_ICON;
}

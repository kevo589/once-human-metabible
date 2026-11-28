import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { NalcottPoi } from '../../data/nalcottMap';
import { getCategoryCanvasSprite, getImageCanvasSprite } from './mapIcons';

export type LabelDisplayMode = 'off' | 'hover' | 'always';

export interface CategoryVisualSetting {
  iconScale: number;
  labelMode: LabelDisplayMode;
}

interface TacticalCanvasLayerProps {
  markers: NalcottPoi[];
  foundSet: Set<string>;
  selectedId: string | null;
  categorySettings: Record<string, CategoryVisualSetting>;
  suppressInteractions: boolean;
  onSelectMarker: (poi: NalcottPoi) => void;
  onHoverMarker?: (poi: NalcottPoi | null) => void;
}

const BUCKET_SIZE = 32; // 32x32 map units across 512x512 -> 16x16 buckets
const BASE_RADIUS_PX = 12;
const BASE_IMAGE_RADIUS_PX = 16;

export function TacticalCanvasLayer({
  markers,
  foundSet,
  selectedId,
  categorySettings,
  suppressInteractions,
  onSelectMarker,
  onHoverMarker,
}: TacticalCanvasLayerProps) {
  const map = useMap();

  const propsRef = useRef({
    markers,
    foundSet,
    selectedId,
    categorySettings,
    suppressInteractions,
    onSelectMarker,
    onHoverMarker,
  });
  propsRef.current = {
    markers,
    foundSet,
    selectedId,
    categorySettings,
    suppressInteractions,
    onSelectMarker,
    onHoverMarker,
  };

  const spatialBucketsRef = useRef<Map<string, NalcottPoi[]>>(new Map());
  const hoveredIdRef = useRef<string | null>(null);
  const redrawFnRef = useRef<(() => void) | null>(null);

  // Build spatial hash whenever filtered markers change
  useEffect(() => {
    const buckets = new Map<string, NalcottPoi[]>();
    for (const m of markers) {
      const bx = Math.floor(m.lng / BUCKET_SIZE);
      const by = Math.floor(-m.lat / BUCKET_SIZE);
      const key = `${bx},${by}`;
      let arr = buckets.get(key);
      if (!arr) {
        arr = [];
        buckets.set(key, arr);
      }
      arr.push(m);
    }
    spatialBucketsRef.current = buckets;

    // Warm sprite atlas for visible categories and image badges so icons rasterize promptly
    const seen = new Set<string>();
    const seenImages = new Set<string>();
    for (const m of markers) {
      if (m.imageUrl) {
        if (!seenImages.has(m.imageUrl)) {
          seenImages.add(m.imageUrl);
          getImageCanvasSprite(m.imageUrl, m.color, () => redrawFnRef.current?.());
        }
      } else if (!seen.has(m.typeKey)) {
        seen.add(m.typeKey);
        getCategoryCanvasSprite(m.typeKey, m.color, () => redrawFnRef.current?.());
      }
    }

    redrawFnRef.current?.();
  }, [markers]);

  // Redraw when visual state (foundSet, selection, scales, labels) updates
  useEffect(() => {
    redrawFnRef.current?.();
  }, [foundSet, selectedId, categorySettings]);

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'thgl-canvas-markers');
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '450';

    const pane = map.getPane('overlayPane');
    if (!pane) return;
    pane.appendChild(canvas);

    let rafId: number | null = null;
    let spriteWarmTimer: number | null = window.setTimeout(() => {
      scheduleDraw();
    }, 180);

    const queryVisibleInBounds = (): NalcottPoi[] => {
      const bounds = map.getBounds().pad(0.18);
      const minLng = Math.max(0, bounds.getWest());
      const maxLng = Math.min(512, bounds.getEast());
      const minLat = Math.max(-512, bounds.getSouth());
      const maxLat = Math.min(0, bounds.getNorth());

      const bx0 = Math.floor(minLng / BUCKET_SIZE);
      const bx1 = Math.floor(maxLng / BUCKET_SIZE);
      const by0 = Math.floor(-maxLat / BUCKET_SIZE);
      const by1 = Math.floor(-minLat / BUCKET_SIZE);

      const hits: NalcottPoi[] = [];
      const buckets = spatialBucketsRef.current;
      for (let bx = bx0; bx <= bx1; bx += 1) {
        for (let by = by0; by <= by1; by += 1) {
          const list = buckets.get(`${bx},${by}`);
          if (list) hits.push(...list);
        }
      }
      return hits;
    };

    const draw = () => {
      rafId = null;
      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const targetW = Math.round(size.x * dpr);
      const targetH = Math.round(size.y * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
      }

      const topLeftLayer = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeftLayer);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);

      const {
        foundSet: curFound,
        selectedId: curSelected,
        categorySettings: settings,
      } = propsRef.current;
      const curHover = hoveredIdRef.current;
      const zoom = map.getZoom();
      const candidates = queryVisibleInBounds();

      const deferredLabels: Array<{
        x: number;
        y: number;
        r: number;
        text: string;
        alpha: number;
        selected: boolean;
      }> = [];

      let drawnLabels = 0;

      for (const m of candidates) {
        const pt = map.latLngToContainerPoint([m.lat, m.lng]);
        if (pt.x < -36 || pt.y < -36 || pt.x > size.x + 36 || pt.y > size.y + 36) {
          continue;
        }

        const catCfg = settings[m.typeKey];
        const scale = catCfg?.iconScale ?? 1;
        const labelMode = catCfg?.labelMode ?? 'hover';
        const isSelected = m.id === curSelected;
        const isHovered = m.id === curHover;
        const isFound = curFound.has(m.id);

        const baseRadius = m.imageUrl ? BASE_IMAGE_RADIUS_PX : BASE_RADIUS_PX;
        const iconDiameter = Math.max(
          m.imageUrl ? 18 : 11,
          Math.min(m.imageUrl ? 56 : 48, Math.round(baseRadius * 2 * scale * (isSelected ? 1.25 : isHovered ? 1.15 : 1))),
        );
        const r = iconDiameter / 2;
        const alpha = isSelected || isHovered ? 1 : isFound ? 0.35 : 0.96;

        ctx.globalAlpha = alpha;

        if (isSelected) {
          // sign system selection: black gap then a white ring, independent of category hue
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#f2f2ee';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (isHovered) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const sprite = m.imageUrl
          ? getImageCanvasSprite(m.imageUrl, m.color, scheduleDraw)
          : getCategoryCanvasSprite(m.typeKey, m.color, scheduleDraw);
        if (sprite) {
          ctx.drawImage(sprite, pt.x - r, pt.y - r, iconDiameter, iconDiameter);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r * 0.72, 0, Math.PI * 2);
          ctx.fillStyle = m.color;
          ctx.fill();
        }

        const wantsLabel =
          isSelected ||
          isHovered ||
          (labelMode === 'always' && zoom >= 2 && drawnLabels < 90);

        if (wantsLabel) {
          drawnLabels += 1;
          deferredLabels.push({
            x: pt.x,
            y: pt.y,
            r,
            text: m.name,
            alpha: isSelected || isHovered ? 1 : alpha,
            selected: isSelected,
          });
        }
      }

      // Draw crisp pill labels above all markers
      if (deferredLabels.length > 0) {
        ctx.font = '600 10.5px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const lbl of deferredLabels) {
          ctx.globalAlpha = Math.max(0.65, lbl.alpha);
          const textW = Math.min(180, ctx.measureText(lbl.text).width);
          const boxW = textW + 12;
          const boxH = 18;
          const bx = lbl.x - boxW / 2;
          const by = lbl.y + lbl.r + 4;

          ctx.fillStyle = 'rgba(18, 18, 20, 0.92)';
          ctx.strokeStyle = lbl.selected ? '#06b6d4' : '#27272a';
          ctx.lineWidth = 1;
          roundRectPath(ctx, bx, by, boxW, boxH, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = lbl.selected ? '#ecfeff' : '#f4f4f5';
          ctx.fillText(lbl.text, lbl.x, by + boxH / 2 + 0.5, 174);
        }
      }

      ctx.restore();
    };

    const scheduleDraw = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(draw);
    };

    redrawFnRef.current = scheduleDraw;

    const findMarkerAtPoint = (containerPt: L.Point): NalcottPoi | null => {
      const { categorySettings: settings } = propsRef.current;
      const latlng = map.containerPointToLatLng(containerPt);
      const bxCenter = Math.floor(latlng.lng / BUCKET_SIZE);
      const byCenter = Math.floor(-latlng.lat / BUCKET_SIZE);

      let closest: NalcottPoi | null = null;
      let closestDistSq = Number.POSITIVE_INFINITY;
      const buckets = spatialBucketsRef.current;

      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const list = buckets.get(`${bxCenter + dx},${byCenter + dy}`);
          if (!list) continue;
          for (const m of list) {
            const p = map.latLngToContainerPoint([m.lat, m.lng]);
            const scale = settings[m.typeKey]?.iconScale ?? 1;
            const hitRadius = Math.max(13, (m.imageUrl ? 17 : 14) * scale);
            const distX = p.x - containerPt.x;
            const distY = p.y - containerPt.y;
            const distSq = distX * distX + distY * distY;
            if (distSq <= hitRadius * hitRadius && distSq < closestDistSq) {
              closestDistSq = distSq;
              closest = m;
            }
          }
        }
      }
      return closest;
    };

    const onMapMove = () => scheduleDraw();

    const onMapMouseMove = (e: L.LeafletMouseEvent) => {
      if (propsRef.current.suppressInteractions) {
        if (hoveredIdRef.current !== null) {
          hoveredIdRef.current = null;
          map.getContainer().style.cursor = '';
          propsRef.current.onHoverMarker?.(null);
          scheduleDraw();
        }
        return;
      }
      const hit = findMarkerAtPoint(e.containerPoint);
      const nextId = hit?.id ?? null;
      if (nextId !== hoveredIdRef.current) {
        hoveredIdRef.current = nextId;
        map.getContainer().style.cursor = hit ? 'pointer' : '';
        propsRef.current.onHoverMarker?.(hit);
        scheduleDraw();
      }
    };

    const onMapClick = (e: L.LeafletMouseEvent) => {
      if (propsRef.current.suppressInteractions) return;
      const hit = findMarkerAtPoint(e.containerPoint);
      if (hit) {
        L.DomEvent.stopPropagation(e);
        propsRef.current.onSelectMarker(hit);
      }
    };

    map.on('move', onMapMove);
    map.on('zoom', onMapMove);
    map.on('viewreset', onMapMove);
    map.on('moveend', onMapMove);
    map.on('zoomend', onMapMove);
    map.on('resize', onMapMove);
    map.on('mousemove', onMapMouseMove);
    map.on('click', onMapClick);

    scheduleDraw();

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (spriteWarmTimer !== null) window.clearTimeout(spriteWarmTimer);
      map.off('move', onMapMove);
      map.off('zoom', onMapMove);
      map.off('viewreset', onMapMove);
      map.off('moveend', onMapMove);
      map.off('zoomend', onMapMove);
      map.off('resize', onMapMove);
      map.off('mousemove', onMapMouseMove);
      map.off('click', onMapClick);
      map.getContainer().style.cursor = '';
      canvas.remove();
      redrawFnRef.current = null;
    };
  }, [map]);

  return null;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

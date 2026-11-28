import L from 'leaflet';
import {
  BookmarkPlus,
  Check,
  Copy,
  Download,
  Edit3,
  EyeOff,
  FileJson,
  Grid,
  RotateCcw,
  Terminal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { BUILT_IN_FILTER_PRESETS, MAP_CATEGORIES } from '../../data/mapCatalog';
import {
  type CustomMarkerIconId,
  type CustomMarkerItem,
  type CustomPresetRecord,
  type DevLogEntry,
  type GlobalMapFlags,
} from './mapState';

/* ──────────────────────────── Coordinate Grid Overlay ──────────────────────────── */

export function CoordinateGridLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const GridCanvas = L.GridLayer.extend({
      createTile(coords: L.Coords) {
        const tile = document.createElement('canvas');
        const size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;
        const ctx = tile.getContext('2d');
        if (!ctx) return tile;

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.lineWidth = 1;
        const subDivs = 4;
        const step = size.x / subDivs;

        for (let i = 0; i <= subDivs; i += 1) {
          const pos = Math.round(i * step) + 0.5;
          ctx.beginPath();
          ctx.moveTo(pos, 0);
          ctx.lineTo(pos, size.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, pos);
          ctx.lineTo(size.x, pos);
          ctx.stroke();
        }

        const scale = Math.pow(2, coords.z);
        const worldLng = Math.round((coords.x * 512) / scale);
        const worldLat = Math.round((-coords.y * 512) / scale);
        if (worldLng >= 0 && worldLng <= 512 && worldLat <= 0 && worldLat >= -512) {
          ctx.fillStyle = 'rgba(18, 18, 20, 0.78)';
          ctx.fillRect(4, 4, 72, 16);
          ctx.fillStyle = '#22d3ee';
          ctx.font = '600 10px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(`${worldLng}, ${worldLat}`, 8, 15);
        }
        return tile;
      },
    });

    const layer = new (GridCanvas as unknown as new (opts: L.GridLayerOptions) => L.GridLayer)({
      tileSize: 512,
      minZoom: -1,
      maxZoom: 6,
      zIndex: 350,
      bounds: [
        [-512, 0],
        [0, 512],
      ],
    });

    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, enabled]);

  return null;
}

/* ──────────────────────────── Presets Popover ──────────────────────────── */

interface PresetsPopoverProps {
  customPresets: CustomPresetRecord[];
  onApplyPreset: (categories: string[], resourceAreaIds?: string[]) => void;
  onSaveCurrentAsPreset: (name: string) => void;
  onRenamePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
  onClose: () => void;
}

export function PresetsManagerPopover({
  customPresets,
  onApplyPreset,
  onSaveCurrentAsPreset,
  onRenamePreset,
  onDeletePreset,
  onClose,
}: PresetsPopoverProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  return (
    <div
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[1200] flex max-h-[75dvh] flex-col overflow-hidden rounded-md border border-sign-seam bg-sign-black/95 text-sign-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-[344px] sm:top-16 sm:w-[330px]"
      role="dialog"
      aria-label="Filter Presets"
    >
      <div className="flex items-center justify-between border-b border-sign-seam px-3.5 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white">
          Filter Presets
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-sign-mute hover:bg-sign-seam hover:text-white"
          aria-label="Close presets"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-sign-mute">
            Built-in Farming Routes
          </div>
          {BUILT_IN_FILTER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onApplyPreset(p.categories, p.resourceAreaIds);
                onClose();
              }}
              className="w-full rounded-md border border-sign-seam bg-sign-raised p-2.5 text-left transition hover:border-line-map/50 hover:bg-sign-seam/80"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{p.name}</span>
                <span className="font-mono text-[10px] text-line-map">
                  {p.categories.length} layers
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-sign-mute">{p.description}</div>
            </button>
          ))}
        </div>

        <div className="border-t border-sign-seam pt-2.5">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sign-mute">
            Save Current Filters
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 rounded-md border border-sign-seam bg-sign-raised px-2.5 py-1.5 text-xs text-white placeholder-sign-dim outline-none focus:border-line-map"
            />
            <button
              type="button"
              onClick={() => {
                const trimmed = newName.trim();
                if (!trimmed) return;
                onSaveCurrentAsPreset(trimmed);
                setNewName('');
              }}
              className="inline-flex items-center gap-1 rounded-md bg-line-map/20 px-2.5 py-1.5 text-xs font-medium text-line-map hover:bg-line-map/30"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </div>

        {customPresets.length > 0 && (
          <div className="space-y-1.5 border-t border-sign-seam pt-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-sign-mute">
              Your Saved Presets ({customPresets.length})
            </div>
            {customPresets.map((cp) => (
              <div
                key={cp.id}
                className="flex items-center gap-1.5 rounded-md border border-sign-seam bg-sign-raised p-2"
              >
                {editingId === cp.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 rounded border border-line-map bg-sign-black px-2 py-1 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingName.trim()) onRenamePreset(cp.id, editingName.trim());
                        setEditingId(null);
                      }}
                      className="rounded p-1 text-line-map hover:bg-sign-seam"
                      aria-label="Confirm rename"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPreset(cp.categories, cp.resourceAreaIds);
                        onClose();
                      }}
                      className="flex-1 truncate text-left font-medium text-white hover:text-line-map"
                    >
                      {cp.name}{' '}
                      <span className="font-mono text-[10px] text-sign-dim">
                        ({cp.categories.length})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(cp.id);
                        setEditingName(cp.name);
                      }}
                      className="rounded p-1 text-sign-mute hover:bg-sign-seam hover:text-white"
                      aria-label={`Rename ${cp.name}`}
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(cp.id)}
                      className="rounded p-1 text-sign-mute hover:bg-sign-seam hover:text-rose-400"
                      aria-label={`Delete ${cp.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── Global Settings & Backup Modal ──────────────────────────── */

interface GlobalSettingsModalProps {
  flags: GlobalMapFlags;
  discoveredCount: number;
  customCount: number;
  drawingsCount: number;
  onChangeFlags: (next: GlobalMapFlags) => void;
  onExportJson: () => string;
  onImportJson: (raw: string) => { ok: boolean; message: string };
  onResetAllData: () => void;
  onClose: () => void;
}

export function GlobalSettingsModal({
  flags,
  discoveredCount,
  customCount,
  drawingsCount,
  onChangeFlags,
  onExportJson,
  onImportJson,
  onResetAllData,
  onClose,
}: GlobalSettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleDownloadBackup = () => {
    const json = onExportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nalcott-map-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Backup JSON downloaded.');
  };

  const handleCopyBackup = async () => {
    const json = onExportJson();
    await navigator.clipboard?.writeText(json).catch(() => {});
    setStatusMsg('Backup JSON copied to clipboard.');
  };

  const handleImportSubmit = (raw: string) => {
    const res = onImportJson(raw);
    setStatusMsg(res.message);
    if (res.ok) setImportText('');
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[1300] flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-label="Global Map Settings"
    >
      <div className="flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-md border border-sign-seam bg-sign-black text-sign-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sign-seam px-4 py-3">
          <span className="text-sm font-semibold text-white">Map Settings & Backup</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-sign-mute hover:bg-sign-seam hover:text-white"
            aria-label="Close global settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
          {/* Toggles */}
          <div className="space-y-2 rounded-md border border-sign-seam bg-sign-raised p-3">
            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sign-white">
                <EyeOff className="h-3.5 w-3.5 text-line-map" />
                Hide Discovered Markers ({discoveredCount})
              </span>
              <input
                type="checkbox"
                checked={flags.hideDiscovered}
                onChange={(e) => onChangeFlags({ ...flags, hideDiscovered: e.target.checked })}
                className="h-4 w-4 accent-line-map"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sign-white">
                <Grid className="h-3.5 w-3.5 text-line-map" />
                Coordinate Grid Overlay (#)
              </span>
              <input
                type="checkbox"
                checked={flags.showGrid}
                onChange={(e) => onChangeFlags({ ...flags, showGrid: e.target.checked })}
                className="h-4 w-4 accent-line-map"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sign-white">
                <Terminal className="h-3.5 w-3.5 text-amber-400" />
                Dev Coordinate Logger (Click Map)
              </span>
              <input
                type="checkbox"
                checked={flags.devLoggerEnabled}
                onChange={(e) => onChangeFlags({ ...flags, devLoggerEnabled: e.target.checked })}
                className="h-4 w-4 accent-amber-500"
              />
            </label>
          </div>

          {/* Resource Area Opacity */}
          <div className="space-y-1.5 rounded-md border border-sign-seam bg-sign-raised p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sign-white">Resource Zone Opacity</span>
              <span className="font-mono text-[11px] text-line-map">
                {Math.round(flags.resourceOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.08}
              max={0.7}
              step={0.04}
              value={flags.resourceOpacity}
              onChange={(e) =>
                onChangeFlags({ ...flags, resourceOpacity: Number(e.target.value) })
              }
              className="h-1.5 w-full cursor-pointer appearance-none rounded-md bg-sign-seam accent-line-map"
            />
          </div>

          {/* Export / Import */}
          <div className="space-y-2 rounded-md border border-sign-seam bg-sign-raised p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-sign-white">
                <FileJson className="h-3.5 w-3.5 text-line-map" />
                JSON Backup & Restore
              </span>
              <span className="text-[10px] text-sign-dim">
                {customCount} pins · {drawingsCount} routes
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-sign-seam bg-sign-black px-2.5 py-1.5 font-medium text-sign-white hover:border-line-map/50 hover:text-white"
              >
                <Download className="h-3.5 w-3.5 text-line-map" />
                Download JSON
              </button>
              <button
                type="button"
                onClick={handleCopyBackup}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-sign-seam bg-sign-black px-2.5 py-1.5 font-medium text-sign-white hover:border-line-map/50 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5 text-line-map" />
                Copy JSON
              </button>
            </div>

            <div className="pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const txt = await file.text();
                  handleImportSubmit(txt);
                  e.target.value = '';
                }}
              />
              <textarea
                rows={3}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste backup JSON here or upload a .json file..."
                className="w-full rounded-md border border-sign-seam bg-sign-black p-2 font-mono text-[10px] text-sign-white placeholder-sign-dim outline-none focus:border-line-map"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md border border-sign-seam bg-sign-black px-2.5 py-1.5 text-[11px] text-sign-mute hover:text-white"
                >
                  <Upload className="h-3 w-3" />
                  Load File
                </button>
                <button
                  type="button"
                  disabled={!importText.trim()}
                  onClick={() => handleImportSubmit(importText)}
                  className="flex-1 rounded-md bg-line-map/20 px-2.5 py-1.5 text-[11px] font-medium text-line-map hover:bg-line-map/30 disabled:opacity-40"
                >
                  Restore Backup
                </button>
              </div>
            </div>
          </div>

          {statusMsg && (
            <div className="rounded-md border border-line-map/35 bg-line-map/30 px-3 py-2 text-[11px] text-line-map">
              {statusMsg}
            </div>
          )}

          {/* Reset All Data */}
          <div className="border-t border-sign-seam pt-3">
            {confirmWipe ? (
              <div className="flex items-center justify-between rounded-md border border-rose-500/40 bg-rose-950/25 px-3 py-2">
                <span className="text-[11px] text-rose-200">Clear all local progress?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetAllData();
                      setConfirmWipe(false);
                      setStatusMsg('All map progress reset to defaults.');
                    }}
                    className="rounded bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500"
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmWipe(false)}
                    className="rounded px-2 py-1 text-[11px] text-sign-mute hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmWipe(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-950/40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Custom Marker Creator Modal ──────────────────────────── */

const CUSTOM_ICON_CHOICES: Array<{ id: CustomMarkerIconId; label: string }> = [
  { id: 'place', label: 'Pin' },
  { id: 'star', label: 'Star' },
  { id: 'mystical-crate', label: 'Chest' },
  { id: 'mine-workshop', label: 'Ore' },
  { id: 'flag', label: 'Flag' },
  { id: 'skull', label: 'Boss' },
];

const CUSTOM_COLOR_CHOICES = ['#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#e4e4e7'];

interface CustomMarkerModalProps {
  initialLat: number;
  initialLng: number;
  onSave: (marker: Omit<CustomMarkerItem, 'id' | 'createdAt' | 'visible'>) => void;
  onClose: () => void;
}

export function CustomMarkerModal({
  initialLat,
  initialLng,
  onSave,
  onClose,
}: CustomMarkerModalProps) {
  const [title, setTitle] = useState('Custom Marker');
  const [icon, setIcon] = useState<CustomMarkerIconId>('place');
  const [color, setColor] = useState('#06b6d4');
  const [notes, setNotes] = useState('');

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[1300] flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-label="Add Custom Marker"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-md border border-sign-seam bg-sign-black text-sign-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sign-seam px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">Add Custom Marker</div>
            <div className="font-mono text-[10px] text-line-map">
              Coord ({initialLng.toFixed(1)}, {initialLat.toFixed(1)})
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-sign-mute hover:bg-sign-seam hover:text-white"
            aria-label="Cancel custom marker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              title: title.trim() || 'Custom Marker',
              icon,
              color,
              notes: notes.trim(),
              lat: initialLat,
              lng: initialLng,
            });
          }}
          className="space-y-3 p-4 text-xs"
        >
          <div>
            <label className="mb-1 block text-[11px] font-medium text-sign-mute">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-sign-seam bg-sign-raised px-2.5 py-1.5 text-white outline-none focus:border-line-map"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-sign-mute">Icon</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CUSTOM_ICON_CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setIcon(c.id)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                    icon === c.id
                      ? 'border-line-map bg-line-map/15 text-line-map'
                      : 'border-sign-seam bg-sign-raised text-sign-mute hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-sign-mute">Color</label>
            <div className="flex gap-2">
              {CUSTOM_COLOR_CHOICES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    color === swatch ? 'scale-110 border-white' : 'border-sign-seam'
                  }`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Color ${swatch}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-sign-mute">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ore vein notes, timing, loot..."
              className="w-full rounded-md border border-sign-seam bg-sign-raised px-2.5 py-1.5 text-white placeholder-sign-dim outline-none focus:border-line-map"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sign-seam px-3 py-1.5 text-sign-mute hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-line-map px-3 py-1.5 font-semibold text-sign-black hover:bg-line-map"
            >
              Save Marker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────── Dev Bulk Coordinate Logger Drawer ──────────────────────────── */

interface DevLoggerDrawerProps {
  entries: DevLogEntry[];
  onUpdateEntry: (id: string, patch: Partial<DevLogEntry>) => void;
  onRemoveEntry: (id: string) => void;
  onClearEntries: () => void;
  onClose: () => void;
}

export function DevCoordinateLoggerDrawer({
  entries,
  onUpdateEntry,
  onRemoveEntry,
  onClearEntries,
  onClose,
}: DevLoggerDrawerProps) {
  const [copied, setCopied] = useState(false);

  const exportPayload = JSON.stringify(entries, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(exportPayload).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([exportPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-coords-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="pointer-events-auto absolute bottom-14 right-3 z-[1150] flex max-h-[55dvh] w-[320px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-md border border-amber-500/45 bg-sign-black/95 text-sign-white shadow-2xl"
      role="region"
      aria-label="Dev Coordinate Logger"
    >
      <div className="flex items-center justify-between border-b border-sign-seam px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
          <Terminal className="h-3.5 w-3.5" />
          Dev Coordinate Logger ({entries.length})
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded border border-sign-seam bg-sign-raised px-1.5 py-0.5 text-[10px] text-sign-white hover:border-line-map"
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded border border-sign-seam bg-sign-raised px-1.5 py-0.5 text-[10px] text-sign-white hover:border-line-map"
          >
            Export
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-sign-mute hover:text-white"
            aria-label="Disable Dev Logger"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="border-b border-sign-seam bg-amber-950/20 px-3 py-1.5 text-[10px] text-amber-200/90">
        Click anywhere on the map to capture exact (X, Y) coordinates.
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2 text-xs">
        {entries.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-sign-dim">
            No coordinates captured yet. Click on map tiles to append rows.
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="space-y-1 rounded-md border border-sign-seam bg-sign-raised p-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-line-map">
                  ({entry.lng}, {entry.lat}) · {entry.region}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveEntry(entry.id)}
                  className="text-sign-dim hover:text-rose-400"
                  aria-label="Remove log row"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <select
                  value={entry.category}
                  onChange={(e) => onUpdateEntry(entry.id, { category: e.target.value })}
                  className="rounded border border-sign-seam bg-sign-black px-1.5 py-0.5 text-[10px] text-sign-white outline-none"
                >
                  {MAP_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => onUpdateEntry(entry.id, { name: e.target.value })}
                  placeholder="Name..."
                  className="rounded border border-sign-seam bg-sign-black px-1.5 py-0.5 text-[10px] text-white outline-none"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {entries.length > 0 && (
        <div className="border-t border-sign-seam p-2 text-right">
          <button
            type="button"
            onClick={onClearEntries}
            className="text-[10px] text-rose-300 hover:text-rose-200"
          >
            Clear captured batch
          </button>
        </div>
      )}
    </div>
  );
}

import { ArrowRight, CheckCircle2, Circle, Copy, Link2, X } from 'lucide-react';
import { useMemo } from 'react';
import { META_BUILDS } from '../../data/buildsAndTimers';
import { MAP_DROP_TABLES } from '../../data/mapCatalog';
import type { NalcottPoi } from '../../data/nalcottMap';
import { buildMapShareUrl } from '../../utils/mapUrlState';
import { buildSearchEntries, type SearchEntry } from '../../utils/searchIndex';
import { NAV_LINES, RouteBullet } from '../layout/Sidebar';
import { GAME_ICONS, GameIcon } from '../../data/gameIcons';
import { CategoryGlyph } from './mapIcons';

const norm = (s: string) => s.split(' · ')[0].trim().toLowerCase();

let nonMapEntries: SearchEntry[] | null = null;

/** Other MetaBible destinations for the same entity as this pin, matched by name. */
export function findTransfers(poi: NalcottPoi): SearchEntry[] {
  nonMapEntries ??= buildSearchEntries().filter((e) => e.targetTab !== 'map');
  // Named regions share words with entities ("Lighthouse"), so they never transfer.
  if (poi.id.startsWith('place-')) return [];
  const name = norm(poi.name);
  if (name.length < 3) return [];
  const direct = nonMapEntries.filter((e) => norm(e.title) === name);
  const deviationIds = new Set(direct.filter((e) => e.kind === 'Deviation').map((e) => e.targetId));
  const buildIds = new Set(META_BUILDS.filter((b) => deviationIds.has(b.deviationId)).map((b) => b.id));
  const builds = nonMapEntries.filter((e) => e.kind === 'Meta Build' && buildIds.has(e.targetId));
  return [...direct, ...builds];
}

interface StationSignProps {
  poi: NalcottPoi;
  scenarioId: string;
  zoomLevel: number;
  discovered: boolean;
  onToggleDiscovered: () => void;
  onToast: (msg: string) => void;
  onClose: () => void;
  onTransfer: (entry: SearchEntry) => void;
}

/** A selected pin, read like a station sign: header band, data rows, then Transfers. */
export function StationSign({
  poi,
  scenarioId,
  zoomLevel,
  discovered,
  onToggleDiscovered,
  onToast,
  onClose,
  onTransfer,
}: StationSignProps) {
  const drops = MAP_DROP_TABLES[poi.typeKey];
  const [title, place] = poi.name.split(' · ');
  const transfers = useMemo(() => findTransfers(poi), [poi]);

  const copyCoords = async () => {
    await navigator.clipboard?.writeText(`${poi.lng.toFixed(1)}, ${poi.lat.toFixed(1)}`).catch(() => {});
    onToast('Coordinates copied');
  };
  const copyLink = async () => {
    const url = buildMapShareUrl({ scenario: scenarioId, x: poi.lng, y: poi.lat, z: Math.max(zoomLevel, 3), pin: poi.id });
    await navigator.clipboard?.writeText(url).catch(() => {});
    onToast('Pin link copied');
  };

  return (
    <aside
      key={poi.id}
      aria-label={`${poi.name} details`}
      onClick={(e) => e.stopPropagation()}
      className="station-sign pointer-events-auto absolute inset-x-0 bottom-0 z-[1200] flex max-h-[62%] flex-col overflow-hidden rounded-t-md border-t-[3px] border-sign-white bg-sign-black md:inset-x-auto md:bottom-auto md:right-3 md:top-[60px] md:max-h-[calc(100%-76px)] md:w-[360px] md:rounded-md md:border md:border-sign-seam"
    >
      <div className="flex items-start gap-3 bg-sign-white px-4 py-3.5 text-black">
        {poi.imageUrl ? (
          <img src={poi.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-sm bg-black object-cover" />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-black">
            {GAME_ICONS[poi.typeKey] ? (
              <GameIcon id={poi.typeKey} size={40} />
            ) : (
              <CategoryGlyph typeKey={poi.typeKey} color={poi.color} />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.015em] [text-wrap:balance]">
            {title}
          </h2>
          <p className="mt-1 text-[14px] font-medium text-[#3a3b38]">
            {poi.typeLabel} · {poi.region}
            {place && <> · {place}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-sm text-black hover:bg-black/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={onToggleDiscovered}
            aria-pressed={discovered}
            className={
              discovered
                ? 'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-line-map text-[14px] font-semibold text-black'
                : 'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border-2 border-sign-white text-[14px] font-semibold text-sign-white hover:bg-sign-white hover:text-black'
            }
          >
            {discovered ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {discovered ? 'Discovered' : 'Mark discovered'}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-10 items-center gap-2 rounded-md border-2 border-sign-seam px-3 text-[14px] font-semibold text-sign-mute hover:border-sign-white hover:text-sign-white"
          >
            <Link2 className="h-4 w-4" /> Share
          </button>
        </div>
        <dl className="px-4 pt-2 text-[14px]">
          <Row label="Coordinates">
            <button type="button" onClick={copyCoords} className="inline-flex items-center gap-1.5 hover:underline underline-offset-4">
              X {poi.lng.toFixed(1)} · Y {poi.lat.toFixed(1)} <Copy className="h-3.5 w-3.5 text-sign-dim" />
            </button>
          </Row>
          {poi.level !== null && <Row label="Level">Lv {poi.level}</Row>}
          {poi.near && <Row label="Near">{poi.near}</Row>}
          {poi.tierNote && <Row label="Note">{poi.tierNote}</Row>}
          <Row label="Status">{discovered ? 'Discovered' : 'Not discovered'}</Row>
        </dl>

        {drops && drops.length > 0 && (
          <div className="px-4 pb-4 pt-4">
            <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">
              Drops per open
            </h3>
            <ul className="text-[14px]">
              {drops.map((d) => (
                <li key={d.item} className="flex items-baseline justify-between gap-3 border-b border-sign-seam py-1.5">
                  <span className="text-sign-white">
                    {d.item}
                    {d.quantity && <span className="text-sign-mute"> {d.quantity}</span>}
                  </span>
                  <span className="text-sign-mute">{d.chance}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      <div className="border-t-[3px] border-sign-white px-4 pb-3 pt-3">
        <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-sign-mute">Transfers</h3>
        {transfers.length === 0 ? (
          <p className="py-1.5 text-[14px] text-sign-dim">No other MetaBible pages for this pin yet.</p>
        ) : (
          <ul>
            {transfers.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onTransfer(t)}
                  className="group flex min-h-11 w-full items-center gap-3 py-1.5 text-left text-[15px] font-semibold leading-snug text-sign-white"
                >
                  <RouteBullet tab={t.targetTab} size="sm" />
                  <span className="min-w-0 flex-1 group-hover:underline group-hover:underline-offset-4">
                    {t.kind === 'Meta Build' ? t.title : `${t.kind} in ${NAV_LINES[t.targetTab].label}`}
                  </span>
                  <ArrowRight aria-hidden className="h-4 w-4 text-sign-mute group-hover:text-sign-white" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-sign-seam py-2">
      <dt className="text-sign-mute">{label}</dt>
      <dd className="text-right font-semibold text-sign-white">{children}</dd>
    </div>
  );
}

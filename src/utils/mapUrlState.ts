export interface MapUrlParams {
  scenario?: string;
  x?: number;
  y?: number;
  z?: number;
  pin?: string;
}

export function readMapUrlParams(): MapUrlParams {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  const scenario = sp.get('scenario') || undefined;
  const xRaw = sp.get('x');
  const yRaw = sp.get('y');
  const zRaw = sp.get('z');
  const pin = sp.get('pin') || undefined;

  const x = xRaw !== null && Number.isFinite(Number(xRaw)) ? Number(xRaw) : undefined;
  const y = yRaw !== null && Number.isFinite(Number(yRaw)) ? Number(yRaw) : undefined;
  const z = zRaw !== null && Number.isFinite(Number(zRaw)) ? Number(zRaw) : undefined;

  return { scenario, x, y, z, pin };
}

export function buildMapShareUrl(params: MapUrlParams): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  const sp = url.searchParams;
  if (params.scenario) sp.set('scenario', params.scenario);
  else sp.delete('scenario');

  if (typeof params.x === 'number' && Number.isFinite(params.x)) {
    sp.set('x', params.x.toFixed(1));
  } else {
    sp.delete('x');
  }

  if (typeof params.y === 'number' && Number.isFinite(params.y)) {
    sp.set('y', params.y.toFixed(1));
  } else {
    sp.delete('y');
  }

  if (typeof params.z === 'number' && Number.isFinite(params.z)) {
    sp.set('z', params.z.toFixed(1));
  } else {
    sp.delete('z');
  }

  if (params.pin) sp.set('pin', params.pin);
  else sp.delete('pin');

  url.search = sp.toString();
  return url.toString();
}

export function syncMapUrlParams(params: MapUrlParams): void {
  if (typeof window === 'undefined') return;
  const nextUrl = buildMapShareUrl(params);
  if (nextUrl && nextUrl !== window.location.href) {
    window.history.replaceState(null, '', nextUrl);
  }
}

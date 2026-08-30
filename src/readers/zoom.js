export const ZOOM_STEPS = Object.freeze([0.75, 0.9, 1, 1.1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4]);

export function clampZoom(value, min = 0.75, max = 4) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Math.min(max, Math.max(min, 1));
  return Math.min(max, Math.max(min, numeric));
}

export function nextZoom(value, direction = 1, steps = ZOOM_STEPS) {
  const current = clampZoom(value);
  const index = steps.reduce((closest, step, candidate) => Math.abs(step - current) < Math.abs(steps[closest] - current) ? candidate : closest, 0);
  return clampZoom(steps[Math.min(steps.length - 1, Math.max(0, index + (direction < 0 ? -1 : 1))) ]);
}

export function normalizeZoomMode(value, fallback = 'custom') {
  return ['fit-page', 'fit-width', 'custom'].includes(value) ? value : fallback;
}

export function calculatePdfScale({ baseWidth, baseHeight, viewportWidth, viewportHeight, mode = 'fit-width', zoom = 1, maxScale = 4 }) {
  const width = Math.max(1, Number(baseWidth) || 1);
  const height = Math.max(1, Number(baseHeight) || 1);
  const availableWidth = Math.max(1, Number(viewportWidth) || 1);
  const availableHeight = Math.max(1, Number(viewportHeight) || 1);
  const fitWidth = availableWidth / width;
  const fitPage = Math.min(fitWidth, availableHeight / height);
  const baseScale = mode === 'fit-page' ? fitPage : fitWidth;
  return Math.min(maxScale, Math.max(0.1, baseScale * (mode === 'custom' ? clampZoom(zoom) : 1)));
}

export function readerPreferenceKey(format, profile = 'default') {
  return `araru:reader-zoom:v1:${String(profile || 'default')}:${String(format || 'unknown').toLowerCase()}`;
}

export function readZoomPreference(format) {
  if (typeof window === 'undefined') return null;
  try {
    const profile = JSON.parse(window.localStorage.getItem('biblioteca:active-profile:v1') || '"default"');
    const value = JSON.parse(window.localStorage.getItem(readerPreferenceKey(format, profile)) || 'null');
    if (!value || typeof value !== 'object') return null;
    return { zoom: clampZoom(value.zoom), mode: normalizeZoomMode(value.mode) };
  } catch {
    return null;
  }
}

export function writeZoomPreference(format, value) {
  if (typeof window === 'undefined') return;
  try {
    const profile = JSON.parse(window.localStorage.getItem('biblioteca:active-profile:v1') || '"default"');
    window.localStorage.setItem(readerPreferenceKey(format, profile), JSON.stringify({ zoom: clampZoom(value.zoom), mode: normalizeZoomMode(value.mode) }));
  } catch {
    // Preferência local é apenas fallback; falha de storage não interrompe a leitura.
  }
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { clampZoom, nextZoom, normalizeZoomMode, readZoomPreference, writeZoomPreference } from './zoom.js';

export function useReaderZoom({ format, defaultZoom = 1, defaultMode = 'custom', min = 0.75, max = 4, enabled = true } = {}) {
  const stored = useMemo(() => readZoomPreference(format), [format]);
  const [zoom, setZoomState] = useState(() => clampZoom(stored?.zoom ?? defaultZoom, min, max));
  const [mode, setMode] = useState(() => normalizeZoomMode(stored?.mode ?? defaultMode, defaultMode));

  useEffect(() => {
    if (!enabled) return;
    writeZoomPreference(format, { zoom, mode });
  }, [enabled, format, mode, zoom]);

  const setZoom = useCallback((value) => {
    setMode('custom');
    setZoomState(clampZoom(value, min, max));
  }, [max, min]);
  const zoomIn = useCallback(() => setZoomState((value) => { setMode('custom'); return clampZoom(nextZoom(value, 1), min, max); }), [max, min]);
  const zoomOut = useCallback(() => setZoomState((value) => { setMode('custom'); return clampZoom(nextZoom(value, -1), min, max); }), [max, min]);
  const resetZoom = useCallback(() => { setMode(defaultMode === 'custom' ? 'custom' : defaultMode); setZoomState(1); }, [defaultMode]);
  const setFitMode = useCallback((nextMode) => {
    const normalized = normalizeZoomMode(nextMode, defaultMode);
    setMode(normalized);
    if (normalized !== 'custom') setZoomState(1);
  }, [defaultMode]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomIn(); }
      if (event.key === '-' || event.key === '_') { event.preventDefault(); zoomOut(); }
      if (event.key === '0') { event.preventDefault(); resetZoom(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, resetZoom, zoomIn, zoomOut]);

  const onWheel = useCallback((event) => {
    if (!enabled || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    if (event.deltaY < 0) zoomIn(); else if (event.deltaY > 0) zoomOut();
  }, [enabled, zoomIn, zoomOut]);

  return { zoom, mode, setZoom, zoomIn, zoomOut, resetZoom, setFitMode, interactionProps: { onWheel } };
}

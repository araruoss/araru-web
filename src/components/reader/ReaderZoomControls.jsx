import { Minus, Plus, RotateCcw, Scan, StretchHorizontal } from 'lucide-react';

export function ReaderZoomControls({ capabilities = {}, zoom = 1, mode = 'custom', onZoomIn, onZoomOut, onReset, onFitWidth, onFitPage, className = '' }) {
  const typography = capabilities.fontScale && !capabilities.pageZoom;
  if (!capabilities.zoom && !capabilities.fontScale) return null;
  const valueLabel = `${Math.round(Number(zoom || 1) * 100)}%`;
  return <div className={`flex flex-wrap items-center justify-center gap-0.5 ${className}`} role="group" aria-label={typography ? 'Text size' : 'Zoom'}>
    <button type="button" onClick={onZoomOut} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10" aria-label={typography ? 'Decrease text size' : 'Decrease zoom'} title={typography ? 'Decrease text size' : 'Decrease zoom'}><Minus className="h-4 w-4" /></button>
    <span role="status" aria-live="polite" className="min-w-[3.25rem] text-center text-sm tabular-nums">{valueLabel}</span>
    <button type="button" onClick={onZoomIn} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10" aria-label={typography ? 'Increase text size' : 'Increase zoom'} title={typography ? 'Increase text size' : 'Increase zoom'}><Plus className="h-4 w-4" /></button>
    <button type="button" onClick={onReset} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10" aria-label={typography ? 'Reset text size' : 'Reset zoom'} title={typography ? 'Reset text size' : 'Reset zoom'}><RotateCcw className="h-4 w-4" /></button>
    {capabilities.fitWidth && <button type="button" onClick={onFitWidth} className={`grid h-9 w-9 place-items-center rounded-lg ${mode === 'fit-width' ? 'bg-white/15' : 'hover:bg-white/10'}`} aria-label="Fit page to width" title="Fit width"><StretchHorizontal className="h-4 w-4" /></button>}
    {capabilities.fitPage && <button type="button" onClick={onFitPage} className={`grid h-9 w-9 place-items-center rounded-lg ${mode === 'fit-page' ? 'bg-white/15' : 'hover:bg-white/10'}`} aria-label="Fit page to screen" title="Fit page"><Scan className="h-4 w-4" /></button>}
  </div>;
}

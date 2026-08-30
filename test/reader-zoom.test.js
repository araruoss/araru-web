import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePdfScale, clampZoom, nextZoom, normalizeZoomMode } from '../src/readers/zoom.js';

test('zoom sanitiza valores e percorre steps sem sair dos limites', () => {
  assert.equal(clampZoom(Number.NaN), 1);
  assert.equal(clampZoom(-10), 0.75);
  assert.equal(clampZoom(Infinity), 1);
  assert.equal(nextZoom(1), 1.1);
  assert.equal(nextZoom(4), 4);
  assert.equal(normalizeZoomMode('invalid', 'fit-width'), 'fit-width');
});

test('PDF calcula fit width, fit page e custom com escala independente', () => {
  const input = { baseWidth: 1000, baseHeight: 1500, viewportWidth: 800, viewportHeight: 700 };
  assert.equal(calculatePdfScale({ ...input, mode: 'fit-width' }), 0.8);
  assert.equal(calculatePdfScale({ ...input, mode: 'fit-page' }), 0.4666666666666667);
  assert.equal(calculatePdfScale({ ...input, mode: 'custom', zoom: 2 }), 1.6);
  assert.equal(calculatePdfScale({ ...input, mode: 'custom', zoom: 999 }), 3.2);
});

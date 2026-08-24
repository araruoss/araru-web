import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = { localStorage: { getItem: () => null, setItem: () => {}, addEventListener: () => {} } };
const { mergeReadingStates } = await import('../src/utils/readingSync.js');

test('mescla progresso por livro sem perder a posição mais recente', () => {
  const merged = mergeReadingStates(
    { favorites: ['a'], history: [], progress: { a: { page: 8, updatedAt: 20 } }, stats: {}, clientUpdatedAt: 20 },
    { favorites: ['b'], history: [], progress: { a: { page: 3, updatedAt: 10 }, b: { page: 2, updatedAt: 15 } }, stats: {}, clientUpdatedAt: 10 }
  );
  assert.equal(merged.progress.a.page, 8);
  assert.equal(merged.progress.b.page, 2);
  assert.deepEqual(merged.favorites, ['a']);
});

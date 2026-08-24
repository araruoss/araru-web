import assert from 'node:assert/strict';
import test from 'node:test';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    clear: () => values.clear()
  };
}

globalThis.window = { localStorage: createStorage() };

const storage = await import('../src/utils/localStorage.js');

test('persiste progresso e registra uma obra aberta', () => {
  window.localStorage.clear();
  storage.saveReadingProgress('livro-1', { format: 'pdf', page: 12, progress: 0.2 });

  assert.equal(storage.getReadingProgress('livro-1').page, 12);
  assert.deepEqual(storage.getReadingStats().openedBookIds, ['livro-1']);
});

test('marca a obra como concluída apenas uma vez', () => {
  window.localStorage.clear();
  storage.saveReadingProgress('livro-1', { format: 'epub', progress: 0.5 });
  storage.saveReadingProgress('livro-1', { format: 'epub', progress: 1 });
  storage.saveReadingProgress('livro-1', { format: 'epub', progress: 1 });

  assert.deepEqual(storage.getReadingStats().completedBookIds, ['livro-1']);
});

test('remove somente o progresso quando solicitado', () => {
  window.localStorage.clear();
  storage.saveReadingProgress('livro-1', { format: 'mobi', progress: 0.3 });
  storage.clearReadingProgress('livro-1');

  assert.equal(storage.getReadingProgress('livro-1'), null);
  assert.deepEqual(storage.getReadingStats().openedBookIds, ['livro-1']);
});

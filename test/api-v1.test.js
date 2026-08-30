import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('API client and catalog use only the v1 contract', async () => {
  const [api, hook, library, routes] = await Promise.all([
    readFile(new URL('../src/lib/api.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/hooks/useLivros.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/Biblioteca.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
  ]);
  assert.match(api, /\/api\/v1/);
  assert.match(api, /\/works\//);
  assert.doesNotMatch(api, /\/livros|\/categorias/);
  for (const filter of ['libraryId', 'author', 'category', 'format', 'favorite', 'completed', 'sort', 'order']) {
    assert.match(`${hook}\n${library}`, new RegExp(filter));
  }
  for (const route of ['/library', '/works/:id', '/reader/:workId', '/search', '/profiles']) {
    assert.match(routes, new RegExp(route.replace(/[/:]/g, '\\$&')));
  }
});

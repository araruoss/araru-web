import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('service worker exclui payloads de livros e limita caches offline', async () => {
  const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(source, /request\.headers\.has\('range'\)/);
  assert.match(source, /conteudo\|paginas\?\|recursos/);
  assert.match(source, /url\.pathname\.startsWith\('\/arquivos\/'\)/);
  assert.match(source, /no-store\|private/);
  assert.match(source, /trimCache/);
  assert.match(source, /CONFIGURE_API/);
  assert.match(source, /apiOrigin/);
  assert.match(source, /url\.origin !== self\.location\.origin && url\.origin !== apiOrigin/);
  assert.match(source, /Servidor indisponível/);
});

test('gerenciador offline não retorna Promise como limpeza de useEffect', async () => {
  const source = await readFile(new URL('../src/components/OfflineManager.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /useEffect\(refresh,/);
  assert.match(source, /useEffect\(\(\)=>\{void refresh\(\);\},\[\]\)/);
});

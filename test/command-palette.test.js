import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('global search uses the Spotlight dialog treatment and accessible result controls', async () => {
  const [palette, input, dialog, styles] = await Promise.all([
    readFile(new URL('../src/components/search/GlobalSearch.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/search/SearchInput.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/ui/dialog.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  ]);

  assert.match(palette, /MIN_QUERY_LENGTH = 2/);
  assert.match(palette, /useDebounce\(query, 180\)/);
  assert.match(palette, /queryKeys\.search\.global/);
  assert.match(palette, /ArrowDown/);
  assert.match(palette, /fetchJson\('\/search'/);
  assert.match(input, /aria-activedescendant/);
  assert.match(input, /aria-controls/);
  assert.match(dialog, /backdropClassName/);
  assert.match(styles, /\.search-dialog/);
  assert.match(styles, /color-mix\(in srgb, var\(--surface-raised\)/);
  assert.match(styles, /\.search-input-shell:focus-within/);
  assert.match(styles, /\.search-result:focus-visible/);
  assert.match(styles, /@media \(max-width: 639px\)/);
});

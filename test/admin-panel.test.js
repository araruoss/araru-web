import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('admin panel possui rotas modulares, guard de role e navegação responsiva', async () => {
  const [page, layout, navigation, app] = await Promise.all([
    readFile(new URL('../src/pages/Admin.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/admin/layouts/AdminLayout.jsx', import.meta.url), 'utf8'),
    import('../src/features/admin/adminNavigation.js'),
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
  ]);
  assert.match(page, /identity\.role!=='admin'/);
  assert.match(app, /path="\/admin\/\*"/);
  assert.match(layout, /lg:hidden/);
  assert.match(layout, /aria-label/);
  assert.deepEqual(navigation.adminNavigation.map((item) => item.key), [
    'general','users','roles','libraries','storage','metadata','jobs','backup','security','system'
  ]);
});

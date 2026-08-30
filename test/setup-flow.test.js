import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('setup usa o fluxo v1, não expõe infraestrutura e não persiste senhas', async () => {
  const setup = await readFile(new URL('../src/pages/Setup.jsx', import.meta.url), 'utf8');
  assert.match(setup, /apiFetch\('\/setup'/);
  assert.match(setup, /apiFetch\('\/system\/status'/);
  assert.doesNotMatch(setup, /POSTGRES|REDIS_URL|PostgreSQL/);
  assert.match(setup, /sessionStorage\.setItem\('araru:setup-draft'/);
  assert.match(setup, /password: ''/);
  assert.match(setup, /aria-current/);
  assert.match(setup, /prefers-color-scheme|definirTema/);
  assert.match(setup, /theme: 'dark'/);
});

test('setup mantém as etapas essenciais e a tela de conclusão', async () => {
  const [setup, pt, en] = await Promise.all([
    readFile(new URL('../src/pages/Setup.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/locales/pt-BR.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/locales/en.js', import.meta.url), 'utf8')
  ]);
  for (const key of ['welcome', 'language', 'server', 'admin', 'profile', 'appearance', 'review']) assert.match(setup, new RegExp(`key: '${key}'`));
  for (const locale of [pt, en]) {
    for (const key of ['welcomeTitle', 'languageTitle', 'serverTitle', 'adminTitle', 'profileTitle', 'appearanceTitle', 'reviewTitle', 'readyText']) assert.match(locale, new RegExp(key));
  }
  assert.match(setup, /setStep\(SETUP_STEPS\.length\)/);
  assert.match(setup, /t\('setup\.enter'\)/);
});

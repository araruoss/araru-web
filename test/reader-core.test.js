import assert from 'node:assert/strict';
import test from 'node:test';
import { ReaderMemoryBudget, adaptivePrefetchWindow, capabilitiesFor, createReaderContract } from '../src/readers/core.js';

test('capabilities e contrato comum respeitam o tipo de reader', async () => {
  assert.equal(capabilitiesFor('cbr').webtoon, true);
  assert.equal(capabilitiesFor('epub').typography, true);
  assert.equal(capabilitiesFor('pdf').pagination, true);
  let closed = false;
  const contract = createReaderContract({ close: () => { closed = true; } });
  await contract.destroy();
  assert.equal(closed, true);
});

test('orçamento LRU descarta recursos antigos e prefetch adapta ao dispositivo', () => {
  const removed = [];
  const budget = new ReaderMemoryBudget({ maxBytes: 10, onEvict: (key) => removed.push(key) });
  budget.set('a', 1, 6);
  budget.set('b', 2, 6);
  assert.deepEqual(removed, ['a']);
  assert.equal(budget.get('b'), 2);
  assert.equal(adaptivePrefetchWindow({ viewportWidth: 390, deviceMemory: 2 }), 1);
  assert.equal(adaptivePrefetchWindow({ viewportWidth: 1400, deviceMemory: 8 }), 2);
});

test('abrir e fechar repetidamente libera todo o orçamento e executa cleanup', () => {
  let cleanups = 0;
  const budget = new ReaderMemoryBudget({ maxBytes: 1024 });
  for (let cycle = 0; cycle < 50; cycle += 1) {
    budget.set(`page-${cycle}`, { cycle }, 512, () => { cleanups += 1; });
    budget.clear();
    assert.deepEqual(budget.stats(), { entries: 0, bytes: 0, maxBytes: 1024 });
  }
  assert.equal(cleanups, 50);
});

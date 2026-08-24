export const READER_CAPABILITIES = Object.freeze({
  pdf: Object.freeze({ pagination: true, continuous: true, zoom: true, typography: false, webtoon: false, pageAnimation: false }),
  comic: Object.freeze({ pagination: true, continuous: true, zoom: true, typography: false, webtoon: true, pageAnimation: false }),
  epub: Object.freeze({ pagination: false, continuous: true, zoom: true, typography: true, webtoon: false, pageAnimation: false }),
  mobi: Object.freeze({ pagination: false, continuous: true, zoom: true, typography: true, webtoon: false, pageAnimation: false })
});

export function engineNameFor(format = '') {
  const normalized = String(format).toLowerCase();
  return ['cbz', 'cbr'].includes(normalized) ? 'comic' : normalized;
}

export function capabilitiesFor(format) {
  return READER_CAPABILITIES[engineNameFor(format)] || Object.freeze({ pagination: false, continuous: false, zoom: false, typography: false, webtoon: false, pageAnimation: false });
}

export function createReaderContract(adapter = {}) {
  const noop = async () => {};
  return Object.freeze({
    open: adapter.open || noop,
    close: adapter.close || noop,
    next: adapter.next || noop,
    previous: adapter.previous || noop,
    goTo: adapter.goTo || noop,
    getProgress: adapter.getProgress || (() => null),
    restoreProgress: adapter.restoreProgress || noop,
    getCapabilities: adapter.getCapabilities || (() => ({})),
    destroy: adapter.destroy || adapter.close || noop
  });
}

export function adaptivePrefetchWindow({ viewportWidth = 390, deviceMemory = 4, estimatedItemBytes = 4 * 1024 * 1024 } = {}) {
  if (viewportWidth < 640 || deviceMemory <= 2 || estimatedItemBytes > 16 * 1024 * 1024) return 1;
  if (viewportWidth >= 1200 && deviceMemory >= 8 && estimatedItemBytes <= 8 * 1024 * 1024) return 2;
  return 1;
}

export class ReaderMemoryBudget {
  constructor({ maxBytes, onEvict } = {}) {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const memory = typeof navigator !== 'undefined' ? Number(navigator.deviceMemory || 4) : 4;
    this.maxBytes = maxBytes || Math.max(32, Math.min(mobile ? 96 : 256, memory * 32)) * 1024 * 1024;
    this.onEvict = onEvict || (() => {});
    this.entries = new Map();
    this.bytes = 0;
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key, value, bytes = 0, cleanup) {
    this.delete(key);
    this.entries.set(key, { value, bytes: Math.max(0, Number(bytes) || 0), cleanup });
    this.bytes += Math.max(0, Number(bytes) || 0);
    this.evict();
    return value;
  }

  delete(key) {
    const entry = this.entries.get(key);
    if (!entry) return false;
    this.entries.delete(key);
    this.bytes -= entry.bytes;
    try { entry.cleanup?.(entry.value); } catch { /* cleanup best effort */ }
    return true;
  }

  evict() {
    while (this.bytes > this.maxBytes && this.entries.size > 1) {
      const key = this.entries.keys().next().value;
      const entry = this.entries.get(key);
      this.delete(key);
      this.onEvict(key, entry?.value);
    }
  }

  retain(keys) {
    const allowed = new Set(keys);
    for (const key of this.entries.keys()) if (!allowed.has(key)) this.delete(key);
  }

  clear() { for (const key of [...this.entries.keys()]) this.delete(key); }
  stats() { return { entries: this.entries.size, bytes: this.bytes, maxBytes: this.maxBytes }; }
}

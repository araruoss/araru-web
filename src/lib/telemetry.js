const metrics = [];

export function startLocalWebVitals() {
  // Keep observability privacy-preserving and local until the server exposes
  // a v1 telemetry contract. The reader metrics remain available to debugging
  // tools through getReaderMetrics().
  return () => {};
}

export function recordReaderMetric(metric) {
  if (!metric || typeof metric !== 'object') return;
  metrics.push({ ...metric, recordedAt: Date.now() });
  if (metrics.length > 100) metrics.shift();
}

export function getReaderMetrics() { return [...metrics]; }

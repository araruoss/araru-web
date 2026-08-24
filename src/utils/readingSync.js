import { applyReadingState, getLocalReadingState } from './localStorage.js';
import { apiFetch } from '../lib/api.js';

let timer;
let syncing = false;

function mergeById(local = [], remote = []) {
  const items = new Map();
  for (const item of [...remote, ...local]) {
    const previous = items.get(item.id);
    if (!previous || new Date(item.lidoEm || 0) >= new Date(previous.lidoEm || 0)) items.set(item.id, item);
  }
  return [...items.values()].sort((a, b) => new Date(b.lidoEm || 0) - new Date(a.lidoEm || 0)).slice(0, 20);
}

function mergeProgress(local = {}, remote = {}) {
  const result = { ...remote };
  for (const [id, value] of Object.entries(local)) {
    if (!result[id] || Number(value.updatedAt || 0) >= Number(result[id].updatedAt || 0)) result[id] = value;
  }
  return result;
}

export function mergeReadingStates(local, remote) {
  const localIsNewer = Number(local.clientUpdatedAt || 0) >= Number(remote.clientUpdatedAt || 0);
  return {
    favorites: localIsNewer ? local.favorites : remote.favorites,
    history: mergeById(local.history, remote.history),
    progress: mergeProgress(local.progress, remote.progress),
    stats: localIsNewer ? local.stats : remote.stats,
    clientUpdatedAt: Math.max(Number(local.clientUpdatedAt || 0), Number(remote.clientUpdatedAt || 0), Date.now())
  };
}

async function request(path = '', options = {}) {
  const response = await apiFetch(`/reading-state${path}`, {
    headers: { 'Content-Type': 'application/json' }, ...options
  });
  if (!response.ok) throw new Error(`reading_sync_${response.status}`);
  return response.json();
}

export async function syncReadingState({ hydrate = false } = {}) {
  if (syncing || typeof fetch !== 'function') return;
  syncing = true;
  try {
    const local = getLocalReadingState();
    let merged = local;
    if (hydrate) {
      const remote = (await request()).data || {};
      merged = mergeReadingStates(local, remote);
      applyReadingState(merged);
    }
    await request('', { method: 'PUT', body: JSON.stringify(merged) });
  } catch {
    // Offline, backend antigo ou sessão ainda não autenticada: localStorage
    // permanece como fonte funcional e uma próxima alteração tenta novamente.
  } finally { syncing = false; }
}

export function startReadingStateSync() {
  syncReadingState({ hydrate: true });
  window.addEventListener('biblioteca:reading-state-changed', () => {
    clearTimeout(timer);
    timer = setTimeout(() => syncReadingState(), 1500);
  });
}

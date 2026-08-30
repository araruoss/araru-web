import { applyReadingState, getLocalReadingState } from './localStorage.js';
let timer;

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
    version: Math.max(Number(local.version || 0), Number(remote.version || 0)),
    clientUpdatedAt: Math.max(Number(local.clientUpdatedAt || 0), Number(remote.clientUpdatedAt || 0), Date.now())
  };
}

export async function syncReadingState({ hydrate = false } = {}) {
  // The v1 server exposes reading state per work/profile, not a global
  // aggregate endpoint. Keep the aggregate local until a matching contract
  // is introduced; this avoids silently calling a legacy route.
  if (hydrate) applyReadingState(getLocalReadingState());
}

export function startReadingStateSync() {
  syncReadingState({ hydrate: true });
  window.addEventListener('biblioteca:reading-state-changed', () => {
    clearTimeout(timer);
    timer = setTimeout(() => syncReadingState(), 1500);
  });
}

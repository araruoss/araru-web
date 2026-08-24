export function getStorageItem(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

const ACTIVE_PROFILE_KEY = 'biblioteca:active-profile:v1';
const SYNC_UPDATED_KEY = 'biblioteca:sync-updated-at:v1';
function readingKey(key) {
  const profile = getStorageItem(ACTIVE_PROFILE_KEY, 'default');
  return profile && profile !== 'default' ? `${key}:profile:${profile}` : key;
}
export function setActiveReadingProfile(profileId) { setStorageItem(ACTIVE_PROFILE_KEY, profileId || 'default'); }
export function getActiveReadingProfile() { return getStorageItem(ACTIVE_PROFILE_KEY, 'default'); }
function notifyReadingStateChanged() {
  setStorageItem(readingKey(SYNC_UPDATED_KEY), Date.now());
  if (typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('biblioteca:reading-state-changed'));
  }
}

export function getFavoritos() {
  return getStorageItem(readingKey('biblioteca:favoritos'), []);
}

export function toggleFavorito(id) {
  const favoritos = new Set(getFavoritos());
  if (favoritos.has(id)) {
    favoritos.delete(id);
  } else {
    favoritos.add(id);
  }

  const atualizados = [...favoritos];
  setStorageItem(readingKey('biblioteca:favoritos'), atualizados);
  notifyReadingStateChanged();
  return atualizados;
}

export function getUltimosLidos() {
  return getStorageItem(readingKey('biblioteca:ultimos-lidos'), []);
}

export function adicionarUltimoLido(livro) {
  const historico = getUltimosLidos().filter((item) => item.id !== livro.id);
  const atualizados = [
    {
      id: livro.id,
      nome: livro.nome,
      categoria: livro.categoria,
      capa: livro.capa,
      capaUrl: livro.capaUrl,
      contentUrl: livro.contentUrl,
      formato: livro.formato,
      previewUrl: livro.previewUrl,
      webViewLink: livro.webViewLink,
      fonte: livro.fonte,
      lidoEm: new Date().toISOString()
    },
    ...historico
  ].slice(0, 20);

  setStorageItem(readingKey('biblioteca:ultimos-lidos'), atualizados);
  notifyReadingStateChanged();
  return atualizados;
}

const READING_PROGRESS_KEY = 'biblioteca:reading-progress:v1';
const READING_STATS_KEY = 'biblioteca:reading-stats:v1';

function diaAtual(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getReadingStatsStore() {
  return getStorageItem(readingKey(READING_STATS_KEY), {
    openedBookIds: [],
    completedBookIds: [],
    days: {}
  });
}

function saveReadingStatsStore(stats) {
  setStorageItem(readingKey(READING_STATS_KEY), stats);
}

function registrarAtividade(bookId, previous, next) {
  const now = next.updatedAt;
  const stats = getReadingStatsStore();
  const date = diaAtual(now);
  const day = stats.days[date] || { activeMs: 0, bookIds: [] };
  const elapsed = previous?.updatedAt ? now - previous.updatedAt : 0;

  // Só contabiliza intervalos plausíveis entre interações para não transformar
  // dias de ausência em tempo de leitura.
  if (elapsed >= 2_000 && elapsed <= 90_000) day.activeMs += elapsed;
  if (!day.bookIds.includes(bookId)) day.bookIds.push(bookId);

  const openedBookIds = stats.openedBookIds.includes(bookId)
    ? stats.openedBookIds
    : [...stats.openedBookIds, bookId];
  const completedBookIds = previous?.progress < 0.98 && next.progress >= 0.98 && !stats.completedBookIds.includes(bookId)
    ? [...stats.completedBookIds, bookId]
    : stats.completedBookIds;

  saveReadingStatsStore({
    ...stats,
    openedBookIds,
    completedBookIds,
    days: { ...stats.days, [date]: day }
  });
}

export function getReadingProgress(bookId) {
  return getStorageItem(readingKey(READING_PROGRESS_KEY), {})[bookId] || null;
}

export function saveReadingProgress(bookId, progress) {
  const all = getStorageItem(readingKey(READING_PROGRESS_KEY), {});
  const previous = all[bookId] || null;
  const next = { ...progress, updatedAt: Date.now() };
  setStorageItem(readingKey(READING_PROGRESS_KEY), { ...all, [bookId]: next });
  registrarAtividade(bookId, previous, next);
  notifyReadingStateChanged();
  return next;
}

export function clearReadingProgress(bookId) {
  const all = getStorageItem(readingKey(READING_PROGRESS_KEY), {});
  delete all[bookId];
  setStorageItem(readingKey(READING_PROGRESS_KEY), all);
  notifyReadingStateChanged();
}

export function getAllReadingProgress() {
  return getStorageItem(readingKey(READING_PROGRESS_KEY), {});
}

export function getReadingStats() {
  return getReadingStatsStore();
}

export function getLocalReadingState() {
  return {
    favorites: getFavoritos(), history: getUltimosLidos(), progress: getAllReadingProgress(),
    stats: getReadingStats(), clientUpdatedAt: Number(getStorageItem(readingKey(SYNC_UPDATED_KEY), 0))
  };
}

export function applyReadingState(state) {
  setStorageItem(readingKey('biblioteca:favoritos'), state.favorites || []);
  setStorageItem(readingKey('biblioteca:ultimos-lidos'), state.history || []);
  setStorageItem(readingKey(READING_PROGRESS_KEY), state.progress || {});
  setStorageItem(readingKey(READING_STATS_KEY), state.stats || { openedBookIds: [], completedBookIds: [], days: {} });
  setStorageItem(readingKey(SYNC_UPDATED_KEY), Number(state.clientUpdatedAt || 0));
}

export function getReadingStreak(stats = getReadingStatsStore(), now = Date.now()) {
  let streak = 0;
  const cursor = new Date(now);
  while (stats.days[diaAtual(cursor.getTime())]) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

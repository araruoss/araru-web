import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext.jsx';
import { getAllReadingProgress, getFavoritos, getReadingStats, getUltimosLidos } from '../utils/localStorage.js';
import { MediaRail } from './content/MediaRail';

function formatReadingTime(milliseconds, t) {
  if (milliseconds < 60_000) return t('stats.lessMinute');
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return hours ? `${hours}h ${minutes}min` : `${minutes} min`;
}

export default function ReadingHome({ livros, onOpen, onToggleFavorite }) {
  const { t } = useLocale();
  const progress = getAllReadingProgress();
  const stats = getReadingStats();
  const favoriteIds = new Set(getFavoritos());
  const byId = new Map(livros.map((book) => [book.id, book]));
  const continuing = Object.entries(progress)
    .filter(([, value]) => value.progress > 0 && value.progress < 0.98)
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
    .map(([id, value]) => ({ ...byId.get(id), readingProgress: value.progress }))
    .filter((book) => book.id);
  const recent = [...livros].sort((a, b) => new Date(b.modifiedTime || b.fileMtime || 0) - new Date(a.modifiedTime || a.fileMtime || 0));
  const favorites = livros.filter((book) => favoriteIds.has(book.id));
  const opened = getUltimosLidos().map((item) => byId.get(item.id)).filter(Boolean).slice(0, 12);
  const readingTime = Object.values(stats.days).reduce((total, day) => total + Number(day.activeMs || 0), 0);
  const hasInsights = stats.completedBookIds.length > 0 || continuing.length > 0 || readingTime > 0;
  const railProps = { favoriteIds, onOpen, onToggleFavorite };

  return <div className="space-y-9">
    {continuing.length > 0 && <MediaRail title={t('library.continueReading')} works={continuing} actionLabel={t('home.viewHistory')} actionTo="/history" {...railProps} />}
    <MediaRail title={t('library.recentlyAdded')} works={recent} actionLabel={t('home.viewLibrary')} actionTo="/library" {...railProps} />
    {favorites.length > 0 && <MediaRail title={t('navigation.favorites')} works={favorites} actionLabel={t('home.viewLibrary')} actionTo="/library?favorite=true" {...railProps} />}
    {opened.length > 0 && <MediaRail title={t('library.recentlyOpened')} works={opened} actionLabel={t('home.viewHistory')} actionTo="/history" {...railProps} />}
    {hasInsights && <section className="rounded-md border border-border-subtle bg-surface px-4 py-3 sm:px-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-body-sm text-secondary"><strong className="font-semibold text-primary">{t('stats.homeTitle')}</strong><span className="mx-2 text-muted">·</span>{t('stats.summary', { completed: stats.completedBookIds.length, inProgress: continuing.length, time: formatReadingTime(readingTime, t) })}</p><Link to="/estatisticas" className="shrink-0 text-caption font-medium text-link hover:text-link-hover">{t('stats.open')}</Link></div></section>}
    {!continuing.length && !opened.length && !recent.length && <p className="text-body-sm text-muted">{t('home.empty')}</p>}
  </div>;
}

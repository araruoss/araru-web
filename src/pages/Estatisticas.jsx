import { BarChart3, BookOpen, Check, Clock3, Flame } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useLivros } from '../hooks/useLivros.js';
import { getAllReadingProgress, getReadingStats, getReadingStreak } from '../utils/localStorage.js';

function formatarTempo(milliseconds, t) {
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return t('stats.lessMinute');
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function diasRecentes(stats, locale) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = getLocalDateKey(date);
    const utcKey = date.toISOString().slice(0, 10);
    return { key, label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', ''), value: Number(stats.days[key]?.activeMs || stats.days[utcKey]?.activeMs || 0) };
  });
}

function SummaryMetric({ label, value, icon: Icon, emphasis = false }) {
  return (
    <div className={`rounded-2xl border border-border-subtle bg-surface p-5 shadow-subtle ${emphasis ? 'border-l-4 border-l-accent' : ''}`}>
      <div className="flex items-center gap-2 text-caption font-medium text-muted">
        <Icon className={`h-4 w-4 ${emphasis ? 'text-accent' : ''}`} />
        {label}
      </div>
      <p className={`mt-2 font-semibold tracking-tight text-primary ${emphasis ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
        {value}
      </p>
    </div>
  );
}

function ReadingActivityChart({ days, total, max, t }) {
  if (!total) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted bg-surface/50">
        {t('stats.noActivity')}
      </div>
    );
  }
  return (
    <div className="mt-6" role="img" aria-label={t('stats.chartAccessible')}>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {days.map((day) => (
          <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end rounded-xl bg-background-subtle px-1.5 pt-1.5 shadow-inner">
              <div
                className="w-full rounded-md bg-accent transition-[height] duration-300 hover:brightness-105"
                style={{ height: `${Math.max(6, Math.round((day.value / max) * 100))}%` }}
                title={`${day.label}: ${formatarTempo(day.value, t)}`}
              />
            </div>
            <span className="text-[11px] font-medium capitalize text-muted">{day.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-caption text-muted">{t('stats.chartAccessible')}</p>
    </div>
  );
}

export default function Estatisticas() {
  const { idioma, t } = useLocale();
  const { livros } = useLivros();
  const dados = useMemo(() => {
    const stats = getReadingStats();
    const progressos = getAllReadingProgress();
    const dias = diasRecentes(stats, idioma);
    const recentTotal = dias.reduce((total, day) => total + day.value, 0);
    const idsLidos = new Set([...stats.openedBookIds, ...stats.completedBookIds]);
    const emAndamento = Object.values(progressos).filter(
      (item) => Number(item.progress || 0) > 0 && Number(item.progress || 0) < 0.98
    ).length;
    const porCategoria = new Map();
    livros.forEach((livro) => {
      if (!idsLidos.has(livro.id)) return;
      const categoria = livro.categoria || livro.category;
      if (categoria) porCategoria.set(categoria, (porCategoria.get(categoria) || 0) + 1);
    });
    const categorias = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const tempoTotal = Object.values(stats.days).reduce((total, day) => total + Number(day.activeMs || 0), 0);
    const totalRead = stats.openedBookIds.length;
    const notStarted = Math.max(0, livros.length - idsLidos.size);
    return {
      stats,
      dias,
      recentTotal,
      max: Math.max(...dias.map((day) => day.value), 1),
      emAndamento,
      categorias,
      tempoTotal,
      streak: getReadingStreak(stats),
      totalRead,
      notStarted
    };
  }, [idioma, livros]);

  const hasData = dados.tempoTotal > 0 || dados.totalRead > 0 || dados.stats.completedBookIds.length > 0 || dados.emAndamento > 0;
  const maxCategory = Math.max(...dados.categorias.map(([, total]) => total), 1);

  return (
    <div className="library-shell min-h-screen text-primary">
      <Header showSearch={false} />
      <main className="mx-auto max-w-[1120px] px-4 pb-24 pt-7 sm:px-6 lg:px-8 lg:pt-9 lg:pb-12">
        <header className="border-b border-border-subtle pb-5">
          <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[.16em] text-muted">
            <BarChart3 className="h-4 w-4" />
            {t('stats.reading')}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">{t('stats.title')}</h1>
          <p className="mt-2 text-body-sm text-secondary">{t('stats.description')}</p>
        </header>
        {!hasData ? (
          <section className="mt-10 max-w-lg rounded-2xl border border-dashed border-border bg-surface/50 p-8 shadow-subtle">
            <BarChart3 className="h-8 w-8 text-muted" />
            <h2 className="mt-4 text-heading-sm font-semibold">{t('stats.emptyTitle')}</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-secondary">{t('stats.emptyDescription')}</p>
            <Link
              to="/library"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-body-sm font-semibold text-accent-foreground shadow-subtle transition hover:bg-accent-hover active:scale-[0.99]"
            >
              {t('stats.exploreLibrary')}
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <SummaryMetric icon={Clock3} label={t('stats.registeredTime')} value={formatarTempo(dados.tempoTotal, t)} emphasis />
              <SummaryMetric icon={Flame} label={t('stats.currentStreak')} value={t('stats.days', { count: dados.streak })} />
              <SummaryMetric icon={Check} label={t('stats.completed')} value={dados.stats.completedBookIds.length} />
            </section>
            <section className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
              <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-subtle">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">{t('stats.readingActivity')}</h2>
                    <p className="mt-1 text-body-sm text-secondary">{t('stats.activityHelp')}</p>
                  </div>
                  <span className="rounded-full bg-surface-raised px-3 py-1 text-caption font-medium text-secondary">
                    {formatarTempo(dados.recentTotal, t)} · {t('stats.lastDays')}
                  </span>
                </div>
                <ReadingActivityChart days={dados.dias} total={dados.recentTotal} max={dados.max} t={t} />
              </div>
              <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-subtle">
                <h2 className="text-lg font-semibold tracking-tight">{t('stats.topCategories')}</h2>
                <p className="mt-1 text-body-sm text-secondary">{t('stats.categoryHelp')}</p>
                {dados.categorias.length ? (
                  <ol className="mt-6 space-y-4">
                    {dados.categorias.map(([category, total], index) => (
                      <li key={category}>
                        <div className="flex items-center justify-between gap-3 text-body-sm">
                          <span className="truncate font-medium">{category}</span>
                          <span className="text-caption text-muted">{total} {total === 1 ? 'obra' : 'obras'}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-background-subtle">
                          <div
                            className="h-full rounded-full bg-accent transition-all duration-300"
                            style={{ width: `${Math.max(8, Math.round((total / maxCategory) * 100))}%` }}
                          />
                        </div>
                        <span className="sr-only">{index + 1}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-6 text-body-sm text-muted">{t('stats.categoryEmpty')}</p>
                )}
              </div>
            </section>
            <section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border-subtle bg-surface px-5 py-4 text-body-sm text-secondary shadow-subtle">
              <span>
                <BookOpen className="mr-2 inline h-4 w-4 text-muted" />
                {t('stats.started')}: <strong className="text-primary">{dados.totalRead}</strong>
              </span>
              <span>
                {t('stats.inProgress')}: <strong className="text-primary">{dados.emAndamento}</strong>
              </span>
              <span>
                {t('stats.notStarted')}: <strong className="text-primary">{dados.notStarted}</strong>
              </span>
              <Link to="/history" className="ml-auto text-caption font-semibold text-link transition hover:text-link-hover">
                {t('stats.viewHistory')} →
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

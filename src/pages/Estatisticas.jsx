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
  return <div className={emphasis ? 'border-l-2 border-accent pl-4' : ''}><div className="flex items-center gap-2 text-caption text-muted"><Icon className="h-4 w-4" />{label}</div><p className={`mt-1 font-semibold tracking-tight ${emphasis ? 'text-3xl' : 'text-xl'}`}>{value}</p></div>;
}

function ReadingActivityChart({ days, total, max, t }) {
  if (!total) return <div className="mt-7 rounded-md border border-dashed border-border px-4 py-8 text-center text-body-sm text-muted">{t('stats.noActivity')}</div>;
  return <div className="mt-7" role="img" aria-label={t('stats.chartAccessible')}><div className="flex h-44 items-end gap-2 sm:gap-3">{days.map((day) => <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="flex h-36 w-full items-end rounded-md bg-background-subtle px-1.5 pt-1.5"><div className="w-full rounded-sm bg-accent transition-[height]" style={{ height: `${Math.max(4, Math.round((day.value / max) * 100))}%` }} title={`${day.label}: ${formatarTempo(day.value, t)}`} /></div><span className="text-[11px] capitalize text-muted">{day.label}</span></div>)}</div><p className="mt-3 text-caption text-muted">{t('stats.chartAccessible')}</p></div>;
}

export default function Estatisticas() {
  const { idioma, t } = useLocale(); const { livros } = useLivros();
  const dados = useMemo(() => {
    const stats = getReadingStats(); const progressos = getAllReadingProgress(); const dias = diasRecentes(stats, idioma); const recentTotal = dias.reduce((total, day) => total + day.value, 0); const idsLidos = new Set([...stats.openedBookIds, ...stats.completedBookIds]); const emAndamento = Object.values(progressos).filter((item) => Number(item.progress || 0) > 0 && Number(item.progress || 0) < 0.98).length; const porCategoria = new Map();
    livros.forEach((livro) => { if (!idsLidos.has(livro.id)) return; const categoria = livro.categoria || livro.category; if (categoria) porCategoria.set(categoria, (porCategoria.get(categoria) || 0) + 1); });
    const categorias = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5); const tempoTotal = Object.values(stats.days).reduce((total, day) => total + Number(day.activeMs || 0), 0); const totalRead = stats.openedBookIds.length; const notStarted = Math.max(0, livros.length - idsLidos.size);
    return { stats, dias, recentTotal, max: Math.max(...dias.map((day) => day.value), 1), emAndamento, categorias, tempoTotal, streak: getReadingStreak(stats), totalRead, notStarted };
  }, [idioma, livros]);
  const hasData = dados.tempoTotal > 0 || dados.totalRead > 0 || dados.stats.completedBookIds.length > 0 || dados.emAndamento > 0;
  const maxCategory = Math.max(...dados.categorias.map(([, total]) => total), 1);

  return <div className="library-shell min-h-screen text-primary"><Header showSearch={false} /><main className="mx-auto max-w-[1120px] px-4 pb-12 pt-7 sm:px-6 lg:px-8 lg:pt-9"><header className="border-b border-border-subtle pb-5"><p className="text-caption text-muted">{t('stats.reading')}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('stats.title')}</h1><p className="mt-2 text-body-sm text-secondary">{t('stats.description')}</p></header>{!hasData ? <section className="mt-10 max-w-lg rounded-md border border-dashed border-border px-6 py-10"><BarChart3 className="h-6 w-6 text-muted" /><h2 className="mt-5 text-heading-sm font-semibold">{t('stats.emptyTitle')}</h2><p className="mt-2 text-body-sm leading-6 text-secondary">{t('stats.emptyDescription')}</p><Link to="/library" className="mt-5 inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-body-sm font-semibold text-accent-foreground hover:bg-accent-hover">{t('stats.exploreLibrary')}</Link></section> : <><section className="mt-8 grid gap-7 border-b border-border-subtle pb-8 sm:grid-cols-3"><SummaryMetric icon={Clock3} label={t('stats.registeredTime')} value={formatarTempo(dados.tempoTotal, t)} emphasis /><SummaryMetric icon={Flame} label={t('stats.currentStreak')} value={t('stats.days', { count: dados.streak })} /><SummaryMetric icon={Check} label={t('stats.completed')} value={dados.stats.completedBookIds.length} /></section><section className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]"><div className="border-b border-border-subtle pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-heading-sm font-semibold">{t('stats.readingActivity')}</h2><p className="mt-1 text-body-sm text-secondary">{t('stats.activityHelp')}</p></div><span className="text-body-sm font-medium text-secondary">{formatarTempo(dados.recentTotal, t)} · {t('stats.lastDays')}</span></div><ReadingActivityChart days={dados.dias} total={dados.recentTotal} max={dados.max} t={t} /></div><div><h2 className="text-heading-sm font-semibold">{t('stats.topCategories')}</h2><p className="mt-1 text-body-sm text-secondary">{t('stats.categoryHelp')}</p>{dados.categorias.length ? <ol className="mt-6 space-y-4">{dados.categorias.map(([category, total], index) => <li key={category}><div className="flex items-center justify-between gap-3 text-body-sm"><span className="truncate font-medium">{category}</span><span className="text-muted">{total}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-subtle"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(8, Math.round((total / maxCategory) * 100))}%` }} /></div><span className="sr-only">{index + 1}</span></li>)}</ol> : <p className="mt-5 text-body-sm text-muted">{t('stats.categoryEmpty')}</p>}</div></section><section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border-subtle pt-5 text-body-sm text-secondary"><span><BookOpen className="mr-2 inline h-4 w-4 text-muted" />{t('stats.started')}: <strong className="text-primary">{dados.totalRead}</strong></span><span>{t('stats.inProgress')}: <strong className="text-primary">{dados.emAndamento}</strong></span><span>{t('stats.notStarted')}: <strong className="text-primary">{dados.notStarted}</strong></span><Link to="/history" className="text-link hover:text-link-hover">{t('stats.viewHistory')}</Link></section></>}</main></div>;
}

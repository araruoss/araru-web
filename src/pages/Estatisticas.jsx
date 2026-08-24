import { ArrowLeft, BarChart3, BookOpen, CheckCircle2, Clock3, Flame } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useTema } from '../context/TemaContext.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useLivros } from '../hooks/useLivros.js';
import { getAllReadingProgress, getReadingStats, getReadingStreak } from '../utils/localStorage.js';

function formatarTempo(milliseconds, t) {
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return t('stats.lessMinute');
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

function diasRecentes(stats, locale) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', ''), value: stats.days[key]?.activeMs || 0 };
  });
}

export default function Estatisticas() {
  const { tema, alternarTema } = useTema();
  const { idioma, t } = useLocale();
  const { livros } = useLivros();
  const dados = useMemo(() => {
    const stats = getReadingStats();
    const progressos = getAllReadingProgress();
    const dias = diasRecentes(stats, idioma);
    const maxDia = Math.max(...dias.map((dia) => dia.value), 1);
    const emAndamento = Object.values(progressos).filter((item) => Number(item.progress || 0) > 0 && Number(item.progress || 0) < 0.98).length;
    const idsLidos = new Set([...stats.openedBookIds, ...stats.completedBookIds]);
    const porCategoria = new Map();
    for (const livro of livros) {
      if (!idsLidos.has(livro.id)) continue;
      const categoria = livro.categoria || 'Sem categoria';
      porCategoria.set(categoria, (porCategoria.get(categoria) || 0) + 1);
    }
    const categorias = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const tempoTotal = Object.values(stats.days).reduce((total, dia) => total + Number(dia.activeMs || 0), 0);
    return { stats, dias, maxDia, emAndamento, categorias, tempoTotal, streak: getReadingStreak(stats) };
  }, [livros, idioma]);

  return (
    <div className="library-shell min-h-screen text-slate-950 dark:text-white">
      <Header busca="" onBuscaChange={() => {}} tema={tema} onToggleTema={alternarTema} title={t('stats.title')} showSearch={false} />
      <main className="mx-auto max-w-[1240px] px-3 pb-12 pt-7 sm:px-5 lg:px-8 lg:pt-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"><ArrowLeft className="h-4 w-4" /> {t('navigation.library')}</Link>
        <section className="mt-5 rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 dark:border-slate-800 dark:bg-slate-900/65 sm:p-8"><p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500"><BarChart3 className="h-4 w-4" /> {t('stats.reading')}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t('stats.hero')}</h1><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('stats.description')}</p></section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica icon={Clock3} label={t('stats.registeredTime')} value={formatarTempo(dados.tempoTotal,t)} />
          <Metrica icon={Flame} label={t('stats.currentStreak')} value={t('stats.days',{count:dados.streak})} />
          <Metrica icon={BookOpen} label={t('stats.inProgress')} value={t('library.books',{count:dados.emAndamento})} />
          <Metrica icon={CheckCircle2} label={t('stats.completed')} value={t('library.books',{count:dados.stats.completedBookIds.length})} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 dark:border-slate-800 dark:bg-slate-900/65"><div className="flex items-baseline justify-between gap-4"><div><h2 className="text-lg font-semibold">{t('stats.lastDays')}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('stats.interactionTime')}</p></div><span className="text-sm font-medium text-slate-500 dark:text-slate-400">{formatarTempo(dados.dias.reduce((total, dia) => total + dia.value, 0),t)}</span></div><div className="mt-8 flex h-44 items-end gap-3">{dados.dias.map((dia) => <div key={dia.key} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="flex h-32 w-full items-end rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><div className="w-full rounded-lg bg-slate-950 transition-[height] dark:bg-white" style={{ height: `${Math.max(dia.value ? 8 : 2, Math.round((dia.value / dados.maxDia) * 100))}%` }} title={formatarTempo(dia.value,t)} /></div><span className="text-[11px] capitalize text-slate-500 dark:text-slate-400">{dia.label}</span></div>)}</div></div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 dark:border-slate-800 dark:bg-slate-900/65"><h2 className="text-lg font-semibold">Categorias mais lidas</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Com base nas obras abertas ou concluídas.</p>{dados.categorias.length ? <ol className="mt-6 space-y-4">{dados.categorias.map(([categoria, total], index) => <li key={categoria} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs font-semibold dark:bg-slate-800">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{categoria}</span><span className="text-sm text-slate-500 dark:text-slate-400">{total}</span></li>)}</ol> : <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">As categorias aparecem depois das primeiras leituras.</p>}</div>
        </section>
      </main>
    </div>
  );
}

function Metrica({ icon: Icon, label, value }) {
  return <article className="rounded-[1.6rem] border border-slate-200/80 bg-white/75 p-5 dark:border-slate-800 dark:bg-slate-900/65"><Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" /><p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p></article>;
}

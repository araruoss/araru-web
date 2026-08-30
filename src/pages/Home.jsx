import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import Header from '../components/Header.jsx';
import LivroDetalhesModal from '../components/LivroDetalhesModal.jsx';
import ReadingHome from '../components/ReadingHome.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useLivros } from '../hooks/useLivros.js';
import { getFavoritos, toggleFavorito } from '../utils/localStorage.js';

export default function Home() {
  const { t } = useLocale();
  const { livros, loading, error, recarregar, tentarNovamente } = useLivros();
  const [, setFavoritos] = useState(() => getFavoritos());
  const [livroSelecionado, setLivroSelecionado] = useState(null);

  return <div className="library-shell min-h-screen text-slate-950 dark:text-white">
    <Header />
    <main className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="mb-7 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('home.title')}</h1>
        <p className="mt-1 text-body-sm text-secondary">{t('home.description')}</p>
      </section>
      {error && <div className="mb-8 flex items-center gap-3 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger"><AlertCircle className="h-5 w-5 shrink-0" /><span className="flex-1">{error}</span><button type="button" onClick={tentarNovamente} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-current/20 px-3 font-medium"><RefreshCcw className="h-4 w-4" />{t('library.retry')}</button></div>}
      {loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><div className="h-48 animate-pulse rounded-md bg-surface-raised" /><div className="h-48 animate-pulse rounded-md bg-surface-raised" /><div className="h-48 animate-pulse rounded-md bg-surface-raised" /></div> : <ReadingHome livros={livros} onOpen={setLivroSelecionado} onToggleFavorite={(livro) => setFavoritos(toggleFavorito(livro.id))} />}
    </main>
    <LivroDetalhesModal livro={livroSelecionado} onClose={() => setLivroSelecionado(null)} onMetadataQueued={recarregar} />
  </div>;
}

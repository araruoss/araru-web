import {
  AlertCircle,
  ChevronRight,
  Filter,
  RefreshCcw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import FiltrosBiblioteca, { FILTROS_VAZIOS } from '../components/FiltrosBiblioteca.jsx';
import Header from '../components/Header.jsx';
import LivroDetalhesModal from '../components/LivroDetalhesModal.jsx';
import SlidingPanel from '../components/SlidingPanel.jsx';
import VirtualBookGrid from '../components/VirtualBookGrid.jsx';
import SavedViews from '../components/SavedViews.jsx';
import ReaderPreferences from '../components/ReaderPreferences.jsx';
import OfflineManager from '../components/OfflineManager.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useLivros, useLivrosFiltrados } from '../hooks/useLivros.js';
import { getFavoritos, getUltimosLidos, toggleFavorito } from '../utils/localStorage.js';

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="animate-pulse space-y-3">
          <div className="aspect-[2/3] rounded-xl bg-surface-raised" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded-md bg-surface-raised" />
            <div className="h-3 w-1/2 rounded-md bg-surface-raised" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatarQuantidade(total, singular, plural) {
  return `${total} ${total === 1 ? singular : plural}`;
}

function caminhoExisteNaArvore(tree, path) {
  let nodes = tree;
  for (const segment of path) {
    const node = nodes.find((item) => item.name === segment);
    if (!node) return false;
    nodes = node.children || [];
  }
  return true;
}

function encontrarNoNaArvore(tree, path) {
  let nodes = tree;
  let current = null;
  for (const segment of path) {
    current = nodes.find((item) => item.name === segment);
    if (!current) return null;
    nodes = current.children || [];
  }
  return current;
}

export default function Biblioteca() {
  const { t } = useLocale();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = useMemo(() => Object.fromEntries(searchParams.entries()), []);
  const serverFilters = useMemo(() => ({
    libraryId: searchParams.get('libraryId') || undefined,
    author: searchParams.get('author') || searchParams.get('autor') || undefined,
    category: searchParams.get('category') || searchParams.get('categoria') || undefined,
    format: searchParams.get('format') || searchParams.get('formato') || undefined,
    favorite: (searchParams.get('favorite') ?? searchParams.get('favorito')) || undefined,
    completed: searchParams.get('completed') || undefined,
    sort: searchParams.get('sort') || 'title',
    order: searchParams.get('order') || 'asc',
    q: searchParams.get('q') || undefined
  }), [searchParams]);
  const { livros, categorias, arvoreCategorias, loading, error, recarregar, tentarNovamente } = useLivros(serverFilters);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState('');
  const [caminhoCategoria, setCaminhoCategoria] = useState([]);
  const [incluirSubpastas, setIncluirSubpastas] = useState(initial.subpastas !== '0');
  const [busca, setBusca] = useState(initial.q || '');
  const [filtros, setFiltros] = useState(() => ({ ...FILTROS_VAZIOS, autor: initial.autor || '', editora: initial.editora || '', tag: initial.tag || '', formato: initial.formato || '', idioma: initial.idioma || '', anoMin: initial.anoMin || '', anoMax: initial.anoMax || '' }));
  const [favoritos, setFavoritos] = useState(() => getFavoritos());
  const [livroSelecionado, setLivroSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState(initial.secao || (initial.categoria ? 'categorias' : 'todos'));
  const [ordenacao, setOrdenacao] = useState(initial.ordem || 'titulo');
  const [painelAtivo, setPainelAtivo] = useState(null);
  const applyingUrlRef = useRef(false);

  useEffect(() => {
    applyingUrlRef.current = true;
    const pathFromUrl = searchParams.get('categoria');
    setCaminhoCategoria(pathFromUrl ? pathFromUrl.split('/').map(decodeURIComponent).filter(Boolean) : []);
    setBusca(searchParams.get('q') || '');
    setAbaAtiva(searchParams.get('secao') || (pathFromUrl ? 'categorias' : 'todos'));
    setOrdenacao(searchParams.get('ordem') || 'titulo');
    setIncluirSubpastas(searchParams.get('subpastas') !== '0');
    setFiltros({ ...FILTROS_VAZIOS, autor: searchParams.get('autor') || '', editora: searchParams.get('editora') || '', tag: searchParams.get('tag') || '', formato: searchParams.get('formato') || '', idioma: searchParams.get('idioma') || '', anoMin: searchParams.get('anoMin') || '', anoMax: searchParams.get('anoMax') || '' });
  }, [searchParams]);

  useEffect(() => {
    if (applyingUrlRef.current) { applyingUrlRef.current = false; return; }
    const next = new URLSearchParams();
    if (caminhoCategoria.length) next.set('categoria', caminhoCategoria.join('/'));
    if (busca) next.set('q', busca);
    if (abaAtiva !== 'todos') next.set('secao', abaAtiva);
    if (ordenacao !== 'titulo') next.set('ordem', ordenacao);
    if (!incluirSubpastas) next.set('subpastas', '0');
    for (const [key, value] of Object.entries(filtros)) if (value) next.set(key, value);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [abaAtiva, busca, caminhoCategoria, filtros, incluirSubpastas, ordenacao, searchParams, setSearchParams]);

  useEffect(() => {
    const key = `biblioteca:scroll:${location.pathname || '/'}:${searchParams.toString()}`;
    const saved = Number(sessionStorage.getItem(key) || 0);
    if (saved > 0) requestAnimationFrame(() => window.scrollTo({ top: saved }));
    const save = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    return () => { save(); window.removeEventListener('scroll', save); };
  }, [location.pathname, searchParams]);

  useEffect(() => {
    if (loading || !caminhoCategoria.length || caminhoExisteNaArvore(arvoreCategorias, caminhoCategoria)) return;
    const next = new URLSearchParams(searchParams);
    next.delete('categoria');
    setSearchParams(next, { replace: true });
  }, [arvoreCategorias, caminhoCategoria, loading, searchParams, setSearchParams]);

  const navegarCategoria = useCallback((path) => {
    setAbaAtiva('categorias');
    setCaminhoCategoria(path);
    setCategoriaSelecionada('Todos');
    setSubcategoriaSelecionada('');
    const next = new URLSearchParams(searchParams);
    if (path.length) next.set('categoria', path.join('/'));
    else next.delete('categoria');
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const historico = useMemo(() => getUltimosLidos(), []);
  const favoritosSet = useMemo(() => new Set(favoritos), [favoritos]);
  const historicoMap = useMemo(() => {
    return new Map(
      historico.map((item, index) => [
        item.id,
        {
          index,
          timestamp: Date.parse(item.lidoEm || '') || 0
        }
      ])
    );
  }, [historico]);

  const categoriasDisponiveis = useMemo(() => {
    return [
      { nome: 'Todos', total: livros.length },
      ...categorias.filter((categoria) => categoria.nome !== 'Todos')
    ];
  }, [categorias, livros.length]);

  const categoriaAtual = useMemo(() => {
    return categoriasDisponiveis.find((categoria) => categoria.nome === categoriaSelecionada);
  }, [categoriasDisponiveis, categoriaSelecionada]);

  const livrosFiltrados = useLivrosFiltrados(
    livros,
    categoriaSelecionada,
    busca,
    filtros,
    subcategoriaSelecionada,
    caminhoCategoria,
    incluirSubpastas
  );

  const metadados = useMemo(() => {
    const autores = new Set();
    const editoras = new Set();
    const tags = new Set();
    const formatos = new Set();
    const idiomas = new Set();
    const anos = [];

    for (const livro of livros) {
      for (const autor of Array.isArray(livro.autor) ? livro.autor : livro.autor ? [livro.autor] : []) {
        if (autor) autores.add(autor);
      }

      if (livro.editora) editoras.add(livro.editora);
      for (const tag of livro.tags || []) {
        if (tag) tags.add(tag);
      }
      for (const formato of livro.availableFormats?.length ? livro.availableFormats : [livro.formato]) if (formato) formatos.add(String(formato).toLowerCase());
      if (livro.idioma) idiomas.add(livro.idioma);
      if (livro.ano) anos.push(Number(livro.ano));
    }

    return {
      autores: [...autores].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      editoras: [...editoras].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      tags: [...tags].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      formatos: [...formatos].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      idiomas: [...idiomas].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      anoMin: anos.length ? Math.min(...anos) : '',
      anoMax: anos.length ? Math.max(...anos) : ''
    };
  }, [livros]);

  const handleToggleFavorito = useCallback((livro) => {
    setFavoritos(toggleFavorito(livro.id));
  }, []);

  const handleSelecionarCategoria = useCallback((categoria) => {
    setCategoriaSelecionada(categoria);
    setSubcategoriaSelecionada('');
    setAbaAtiva('categorias');
    setPainelAtivo(null);
    setCaminhoCategoria([categoria]);
  }, []);

  const handleSelecionarSubcategoria = useCallback((subcategoria) => {
    setSubcategoriaSelecionada(subcategoria);
    setAbaAtiva('categorias');
  }, []);

  const handleTrocarAba = useCallback((aba) => {
    setAbaAtiva(aba);
    if (aba !== 'categorias') {
      setCategoriaSelecionada('Todos');
      setSubcategoriaSelecionada('');
      setCaminhoCategoria([]);
      const next = new URLSearchParams(searchParams);
      next.delete('categoria');
      setSearchParams(next);
    }
  }, [searchParams, setSearchParams]);

  const handleBuscaChange = useCallback((termo) => {
    setBusca(termo);

    if (termo.trim()) {
      setAbaAtiva('todos');
      setCategoriaSelecionada('Todos');
      setSubcategoriaSelecionada('');
      setCaminhoCategoria([]);
    }
  }, []);

  const livrosDaSecao = useMemo(() => {
    if (abaAtiva === 'favoritos') {
      return livrosFiltrados.filter((livro) => favoritosSet.has(livro.id));
    }

    if (abaAtiva === 'recentes') {
      return livrosFiltrados.filter((livro) => historicoMap.has(livro.id));
    }

    return livrosFiltrados;
  }, [abaAtiva, favoritosSet, historicoMap, livrosFiltrados]);

  const livrosOrdenados = useMemo(() => {
    const lista = [...livrosDaSecao];

    if (ordenacao === 'autor') {
      return lista.sort((a, b) => {
        const autorA = Array.isArray(a.autor) ? a.autor.join(', ') : a.autor || '';
        const autorB = Array.isArray(b.autor) ? b.autor.join(', ') : b.autor || '';
        return autorA.localeCompare(autorB, 'pt-BR');
      });
    }

    if (ordenacao === 'ano') {
      return lista.sort((a, b) => Number(b.ano || 0) - Number(a.ano || 0));
    }

    if (ordenacao === 'recentes') {
      return lista.sort((a, b) => {
        const tempoA = historicoMap.get(a.id)?.timestamp || 0;
        const tempoB = historicoMap.get(b.id)?.timestamp || 0;
        if (tempoA !== tempoB) return tempoB - tempoA;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
    }

    return lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [historicoMap, livrosDaSecao, ordenacao]);

  const filtrosAtivos = useMemo(() => {
    return Object.values(filtros).filter((valor) => valor !== '').length;
  }, [filtros]);

  const mostrarResumoCategorias = false;

  const tituloPagina = useMemo(() => {
    if (abaAtiva === 'favoritos') return t('navigation.favorites');
    if (abaAtiva === 'recentes') return t('navigation.recent');
    if (abaAtiva === 'categorias') {
      if (caminhoCategoria.length) return caminhoCategoria.at(-1);
      if (subcategoriaSelecionada) return `${categoriaSelecionada} / ${subcategoriaSelecionada}`;
      return categoriaSelecionada === 'Todos' ? t('navigation.categories') : categoriaSelecionada;
    }
    return t('library.title');
  }, [abaAtiva, categoriaSelecionada, subcategoriaSelecionada, caminhoCategoria, t]);

  const totalPrincipal = mostrarResumoCategorias
    ? categoriasDisponiveis.filter((categoria) => categoria.nome !== 'Todos').length
    : livrosOrdenados.length;

  const legendaPrincipal = mostrarResumoCategorias
    ? formatarQuantidade(totalPrincipal, 'categoria', 'categorias')
    : formatarQuantidade(totalPrincipal, 'livro', 'livros');

  const mensagemVazia =
    abaAtiva === 'favoritos'
      ? t('library.emptyFavorites')
      : abaAtiva === 'recentes'
        ? t('library.emptyRecent')
        : t('library.empty');

  return (
    <div className="library-shell min-h-screen text-slate-950 transition-colors dark:text-white">
      <Header />

      <div className="mx-auto max-w-[1560px] px-3 pb-24 sm:px-5 lg:px-8 lg:pb-12">
        <main className="min-w-0 pt-6 lg:pt-8">
          <div className="mx-auto max-w-[1500px] space-y-7">
            <section className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">{tituloPagina}</h1>
                  <p className="text-body-sm text-slate-500 dark:text-slate-400">{legendaPrincipal}</p>
                </div>

                {abaAtiva !== 'categorias' && <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPainelAtivo('filtros')}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white shadow-subtle"
                  >
                    <Filter className="h-4 w-4" />
                    {t('library.filters')}
                    {filtrosAtivos > 0 && (
                      <span className="rounded-full bg-accent/20 text-accent-foreground dark:text-accent px-2 py-0.5 text-xs font-semibold">
                        {filtrosAtivos}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={recarregar}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200/60 bg-transparent px-4 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900 dark:border-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    {t('library.refresh')}
                  </button>
                </div>}
              </div>

            </section>

            {!mostrarResumoCategorias && (
              <section className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${abaAtiva === 'categorias' ? 'category-books-toolbar' : ''}`}>
                {abaAtiva === 'categorias' ? <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t('library.allBooks')}</h2> : <div className="text-body-sm text-slate-500 dark:text-slate-400">{busca ? t('library.result',{query:busca}) : t('library.featured')}</div>}

                <div className="flex flex-wrap items-center gap-2">
                  {abaAtiva === 'categorias' && <label title="Inclui livros armazenados nas categorias abaixo desta." className="category-descendants-toggle category-toolbar-toggle">
                    <input type="checkbox" checked={incluirSubpastas} onChange={() => setIncluirSubpastas((value) => !value)} />
                    <span aria-hidden="true" className="category-toggle-track"><span /></span>
                    <span>{t('library.includeSubcategories')}</span>
                  </label>}
                  {abaAtiva === 'categorias' && <button type="button" onClick={() => setPainelAtivo('filtros')} className="category-toolbar-action"><Filter className="h-4 w-4" />{t('library.filters')}</button>}
                  <label className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  {abaAtiva !== 'categorias' && <span>{t('library.sort')}</span>}
                  <select
                    value={ordenacao}
                    onChange={(event) => setOrdenacao(event.target.value)}
                    className="library-select h-11 min-w-[180px] rounded-full px-4 border border-border bg-surface text-primary"
                  >
                    <option value="titulo">{t('library.titleSort')}</option>
                    <option value="autor">{t('library.author')}</option>
                    <option value="ano">{t('library.year')}</option>
                    <option value="recentes">{t('library.newest')}</option>
                  </select>
                  </label>
                </div>
              </section>
            )}

            {error && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 shadow-subtle">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="min-w-0 flex-1 text-sm font-medium">{error}</p>
                <button type="button" onClick={tentarNovamente} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-current/20 px-4 text-sm font-semibold transition hover:bg-rose-100 dark:hover:bg-rose-900/40">
                  <RefreshCcw className="h-4 w-4" />
                  {t('library.retry')}
                </button>
              </div>
            )}

            {loading ? (
              <SkeletonGrid />
            ) : mostrarResumoCategorias ? (
              <ResumoCategorias categorias={categoriasDisponiveis} onSelect={handleSelecionarCategoria} />
            ) : livrosOrdenados.length > 0 ? (
              <VirtualBookGrid livros={livrosOrdenados} favoritoIds={favoritosSet} onToggleFavorito={handleToggleFavorito} onOpen={setLivroSelecionado} onShowCategory={handleSelecionarCategoria} />
            ) : (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-primary">{mensagemVazia}</p>
                  <p className="text-body-sm text-secondary">
                    {t('library.adjust')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <SlidingPanel
        open={painelAtivo === 'filtros'}
        title={t('library.filters')}
        onClose={() => setPainelAtivo(null)}
      >
        <FiltrosBiblioteca
          filtros={filtros}
          setFiltros={setFiltros}
          metadados={metadados}
          onClose={() => setPainelAtivo(null)}
        />
      </SlidingPanel>

      <SlidingPanel
        open={painelAtivo === 'configuracoes'}
        title={t('navigation.settings')}
        onClose={() => setPainelAtivo(null)}
      >
        <div className="space-y-4">
          <SavedViews />
          <ReaderPreferences />
          <OfflineManager />
        </div>
      </SlidingPanel>

      <LivroDetalhesModal livro={livroSelecionado} onClose={() => setLivroSelecionado(null)} onMetadataQueued={recarregar} />
    </div>
  );
}

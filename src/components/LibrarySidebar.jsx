import { ChevronLeft, ChevronRight, Heart, History, Library, Search, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocale } from '../context/LocaleContext.jsx';

export default function LibrarySidebar({
  expanded,
  mobile = false,
  categoryOnly = false,
  activeKey,
  onToggleExpanded,
  onOpenSettings,
  onSelectHome,
  onSelectRecent,
  onSelectFavorites,
  onOpenCategoryTree,
  categoryTree = [],
  categoryPath = [],
  onNavigateCategory
}) {
  const { t } = useLocale();
  const compacta = !expanded && !mobile;
  const categoriasAtivas = categoryOnly || activeKey === 'biblioteca';
  const abrirBiblioteca = () => {
    if (compacta || mobile) return onOpenCategoryTree?.();
    onSelectHome?.();
  };

  return (
    <aside className={`library-rail ${compacta ? 'collapsed' : 'expanded'} ${mobile ? 'mobile' : ''}`}>
      <div className={categoryOnly ? 'sidebar-category-only' : 'space-y-4'}>
        {!mobile && (
          <div className={`sidebar-control-row ${compacta ? 'compact' : ''}`}>
            {!compacta && <span className="sidebar-control-label">{t('navigation.navigation')}</span>}
            <button
              type="button"
              onClick={onToggleExpanded}
              className={`sidebar-toggle ${compacta ? 'sidebar-toggle-compact' : ''}`}
              aria-label={compacta ? t('navigation.expand') : t('navigation.collapse')}
              title={compacta ? t('navigation.expand') : t('navigation.collapse')}
            >
              {compacta ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
            </button>
          </div>
        )}

        {!categoryOnly && <nav className="space-y-2">
          <BotaoSidebar
            compacta={compacta}
            active={activeKey === 'biblioteca'}
            icon={Library}
            label={t('navigation.library')}
            onClick={abrirBiblioteca}
          />
          <BotaoSidebar
            compacta={compacta}
            active={activeKey === 'recentes'}
            icon={History}
            label={t('navigation.recent')}
            onClick={onSelectRecent}
          />
          <BotaoSidebar
            compacta={compacta}
            active={activeKey === 'favoritos'}
            icon={Heart}
            label={t('navigation.favorites')}
            onClick={onSelectFavorites}
          />
        </nav>}

        {!compacta && categoriasAtivas && <NavegadorCategoriasSidebar tree={categoryTree} path={categoryPath} onNavigate={onNavigateCategory} />}
      </div>

      {!categoryOnly && <div className="space-y-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className={`sidebar-button ${compacta ? 'compact' : ''}`}
        >
          <Settings2 className="h-4 w-4 shrink-0" />
          {!compacta && <span>{t('navigation.settings')}</span>}
        </button>
      </div>}
    </aside>
  );
}

function encontrarCategoria(tree, path) {
  let nodes = tree;
  let current = null;
  for (const segment of path) {
    current = nodes.find((node) => node.name === segment);
    if (!current) return null;
    nodes = current.children || [];
  }
  return current;
}

function achatarCategorias(nodes, parents = []) {
  return nodes.flatMap((node) => [
    { ...node, parents },
    ...achatarCategorias(node.children || [], [...parents, node.name])
  ]);
}

function NavegadorCategoriasSidebar({ tree, path, onNavigate }) {
  const { t } = useLocale();
  const [busca, setBusca] = useState('');
  const categoriaAtual = useMemo(() => encontrarCategoria(tree, path), [tree, path]);
  const filhos = categoriaAtual?.children || (path.length ? [] : tree);
  const resultados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return [];
    return achatarCategorias(tree).filter((node) => node.name.toLocaleLowerCase('pt-BR').includes(termo));
  }, [busca, tree]);
  const pai = path.length > 1 ? path.at(-2) : t('navigation.categories');
  const irPara = (nextPath) => {
    setBusca('');
    onNavigate?.(nextPath);
  };

  return (
    <section className="sidebar-category-browser" aria-label={t('navigation.categories')}>
      {path.length > 0 && <button type="button" className="sidebar-category-back" onClick={() => irPara(path.slice(0, -1))} aria-label={t('navigation.backTo',{name:pai})}>
        <ChevronLeft className="h-4 w-4" /> <span>{pai}</span>
      </button>}

      <div className="sidebar-category-context">
        <h2 title={path.join(' / ') || t('navigation.categories')} aria-current={categoriaAtual ? 'page' : undefined}>{categoriaAtual?.name || t('navigation.categories')}</h2>
        <p>{categoriaAtual ? t('library.books',{count:categoriaAtual.totalCount}) : t('navigation.browseFolders')}</p>
      </div>

      <label className="sidebar-category-search">
        <Search className="h-4 w-4" />
        <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={t('navigation.searchCategory')} aria-label={t('navigation.searchCategory')} />
      </label>

      {busca.trim() ? (
        <div className="sidebar-category-results" role="listbox" aria-label={t('navigation.categoryResults')}>
          {resultados.length ? resultados.map((node) => <button key={node.pathString} type="button" role="option" onClick={() => irPara(node.path)} className="sidebar-category-result">
            <span className="min-w-0"><strong>{node.name}</strong><small title={node.path.join(' / ')}>{node.parents.join(' / ') || t('navigation.categories')}</small></span>
            <span>{node.totalCount}</span>
          </button>) : <p className="sidebar-category-empty">{t('navigation.noneFound')}</p>}
        </div>
      ) : (
        <div className="sidebar-category-list">
          {filhos.map((node) => <button key={node.pathString} type="button" onClick={() => irPara(node.path)} className="sidebar-category-row" aria-current={node.pathString === path.join('/') ? 'page' : undefined}>
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
            <span className="sidebar-category-count">{node.totalCount}</span>
            {node.children?.length > 0 && <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </button>)}
          {!filhos.length && <p className="sidebar-category-empty">{t('navigation.noChildren')}</p>}
        </div>
      )}
    </section>
  );
}

function BotaoSidebar({ active, compacta, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sidebar-button ${active ? 'active' : ''} ${compacta ? 'compact' : ''}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!compacta && <span>{label}</span>}
    </button>
  );
}

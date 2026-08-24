import { ChevronRight, Library } from 'lucide-react';

export default function Categorias({
  categorias,
  selecionada,
  subcategoriaSelecionada,
  onSelect,
  onSelectSubcategoria
}) {
  const categoriaAtual = categorias.find((categoria) => categoria.nome === selecionada);
  const categoriasVisiveis = categorias.filter((categoria) => categoria.nome !== 'Todos');

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
          <Library className="h-4 w-4" />
          Categorias
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Escolha uma seção da coleção para focar a estante.
        </p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            onSelect('Todos');
            onSelectSubcategoria('');
          }}
          className={`category-panel-item ${selecionada === 'Todos' ? 'active' : ''}`}
        >
          <span className="truncate">Toda a biblioteca</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
        </button>

        {categoriasVisiveis.map((categoria) => {
          const ativa = categoria.nome === selecionada;

          return (
            <button
              type="button"
              key={categoria.nome}
              onClick={() => {
                onSelect(categoria.nome);
                onSelectSubcategoria('');
              }}
              className={`category-panel-item ${ativa ? 'active' : ''}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{categoria.nome}</span>
                <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
                  {categoria.total} {categoria.total === 1 ? 'livro' : 'livros'}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          );
        })}
      </div>

      {categoriaAtual?.subcategorias?.length > 0 && (
        <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{categoriaAtual.nome}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Subcategorias
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectSubcategoria('')}
              className={`subcategoria-pill ${!subcategoriaSelecionada ? 'active' : ''}`}
            >
              Todas
            </button>

            {categoriaAtual.subcategorias.map((subcategoria) => {
              const nome = typeof subcategoria === 'string' ? subcategoria : subcategoria.nome;
              const total = typeof subcategoria === 'object' ? subcategoria.total : null;

              return (
                <button
                  key={nome}
                  type="button"
                  onClick={() => onSelectSubcategoria(nome)}
                  className={`subcategoria-pill ${subcategoriaSelecionada === nome ? 'active' : ''}`}
                >
                  {nome}
                  {typeof total === 'number' && <span className="opacity-60">{total}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

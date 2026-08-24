import { SlidersHorizontal, Star, X } from 'lucide-react';

export const FILTROS_VAZIOS = {
  autor: '',
  editora: '',
  anoMin: '',
  anoMax: '',
  avaliacaoMin: '',
  tag: '',
  formato: '',
  idioma: ''
};

export default function FiltrosBiblioteca({ filtros, setFiltros, metadados, onClose }) {
  const ativos = Object.entries(filtros).filter(([, valor]) => valor !== '');
  const atualizar = (campo, valor) => setFiltros((atual) => ({ ...atual, [campo]: valor }));
  const campo =
    'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Refine a biblioteca sem deixar os controles ocuparem a tela inteira.
        </p>
      </div>

      <div className="space-y-4">
        <CampoFiltro label="Autor">
          <select aria-label="Autor" value={filtros.autor} onChange={(event) => atualizar('autor', event.target.value)} className={campo}>
            <option value="">Todos</option>
            {metadados.autores.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Editora">
          <select aria-label="Editora" value={filtros.editora} onChange={(event) => atualizar('editora', event.target.value)} className={campo}>
            <option value="">Todas</option>
            {metadados.editoras.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Tag">
          <select aria-label="Tag" value={filtros.tag} onChange={(event) => atualizar('tag', event.target.value)} className={campo}>
            <option value="">Todas</option>
            {metadados.tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Formato">
          <select aria-label="Formato" value={filtros.formato} onChange={(event) => atualizar('formato', event.target.value)} className={campo}>
            <option value="">Todos</option>
            {metadados.formatos.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Idioma">
          <select aria-label="Idioma" value={filtros.idioma} onChange={(event) => atualizar('idioma', event.target.value)} className={campo}>
            <option value="">Todos</option>
            {metadados.idiomas.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Ano">
          <div className="grid grid-cols-2 gap-3">
            <input
              aria-label="Ano inicial"
              type="number"
              min={metadados.anoMin || undefined}
              max={metadados.anoMax || undefined}
              value={filtros.anoMin}
              onChange={(event) => atualizar('anoMin', event.target.value)}
              placeholder={metadados.anoMin ? String(metadados.anoMin) : 'Inicial'}
              className={campo}
            />
            <input
              aria-label="Ano final"
              type="number"
              min={metadados.anoMin || undefined}
              max={metadados.anoMax || undefined}
              value={filtros.anoMax}
              onChange={(event) => atualizar('anoMax', event.target.value)}
              placeholder={metadados.anoMax ? String(metadados.anoMax) : 'Final'}
              className={campo}
            />
          </div>
        </CampoFiltro>

        <CampoFiltro label="Avaliação">
          <select aria-label="Avaliação mínima" value={filtros.avaliacaoMin} onChange={(event) => atualizar('avaliacaoMin', event.target.value)} className={campo}>
            <option value="">Qualquer nota</option>
            <option value="4">4 estrelas ou mais</option>
            <option value="4.5">4.5 estrelas ou mais</option>
          </select>
        </CampoFiltro>
      </div>

      {ativos.length > 0 && (
        <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Star className="h-4 w-4" />
            Filtros ativos
          </p>
          <div className="flex flex-wrap gap-2">
            {ativos.map(([chave, valor]) => (
              <button
                key={chave}
                type="button"
                onClick={() => atualizar(chave, '')}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span className="truncate">{valor}</span>
                <X className="h-3.5 w-3.5 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setFiltros(FILTROS_VAZIOS)}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          Aplicar
        </button>
      </div>
    </section>
  );
}

function CampoFiltro({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

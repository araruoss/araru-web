import { Search, X } from 'lucide-react';

export default function Busca({ value, onChange, className = '', placeholder = 'Buscar livros...', autoFocus = false }) {
  const textoBusca = value ?? '';

  return (
    <div className={`search-field relative w-full ${className}`.trim()}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        autoFocus={autoFocus}
        value={textoBusca}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border-0 bg-transparent pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-0 dark:text-white"
      />
      {textoBusca && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Limpar busca"
          title="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

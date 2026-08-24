import { Check, Pencil, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api.js';

function autores(livro) {
  return Array.isArray(livro.autor) ? livro.autor.join(', ') : livro.autor || 'Autor não informado';
}

export default function RevisarMetadados({ onEdit, onChanged }) {
  const [livros, setLivros] = useState([]);
  const [loading, setLoading] = useState(true);
  const carregar = useCallback(() => {
    setLoading(true);
    return apiFetch('/livros/revisar-metadados')
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload) => setLivros(payload.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function aceitar(livro) {
    await apiFetch(`/livros/${encodeURIComponent(livro.id)}/atualizar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aceitarRevisao: true })
    });
    await carregar();
    onChanged?.();
  }

  async function buscarNovamente(livro) {
    await apiFetch(`/livros/${encodeURIComponent(livro.id)}/enriquecer?mode=force`, { method: 'POST' });
    await carregar();
    onChanged?.();
  }

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Carregando itens para revisão…</p>;
  if (!livros.length) return <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum metadado precisa de revisão agora.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">Confirme ou ajuste apenas os itens com identificação parcial.</p>
      {livros.map((livro) => (
        <article key={livro.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{livro.originalFilename || livro.nome}</p>
          <h3 className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{livro.nome}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{autores(livro)}</p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Confiança: {Math.round((livro.metadataConfidence || 0) * 100)}% · {livro.metadataSource || 'identificação local'}</p>
          {livro.candidateMatches?.length > 0 && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Alternativa: {livro.candidateMatches[0].nome}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => aceitar(livro)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"><Check className="h-3.5 w-3.5" />Aceitar</button>
            <button type="button" onClick={() => onEdit?.(livro)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700"><Pencil className="h-3.5 w-3.5" />Editar</button>
            <button type="button" onClick={() => buscarNovamente(livro)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700"><RefreshCw className="h-3.5 w-3.5" />Buscar novamente</button>
          </div>
        </article>
      ))}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, fetchJson } from '../lib/api.js';

export default function SavedViews() {
  const navigate=useNavigate(), client=useQueryClient(); const [name,setName]=useState('');
  const views=useQuery({queryKey:['saved-views'],queryFn:({signal})=>fetchJson('/saved-views',{signal})});
  const create=useMutation({mutationFn:()=>api.post('/saved-views',{name,query:Object.fromEntries(new URLSearchParams(window.location.search))}),onSuccess:()=>{setName('');client.invalidateQueries({queryKey:['saved-views']});toast.success('Visualização salva.');},onError:()=>toast.error('Não foi possível salvar esta visualização.')});
  const remove=useMutation({mutationFn:(id)=>api.delete(`/saved-views/${id}`),onSuccess:()=>client.invalidateQueries({queryKey:['saved-views']})});
  return <section className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><h3 className="text-sm font-semibold">Visualizações salvas</h3><p className="mt-1 text-xs text-slate-500">Guarde busca, filtros, ordem e categoria atuais.</p><form onSubmit={(event)=>{event.preventDefault();if(name.trim())create.mutate();}} className="mt-3 flex gap-2"><input value={name} onChange={(event)=>setName(event.target.value)} maxLength={80} placeholder="Ex.: DevOps não lidos" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700"/><button aria-label="Salvar visualização" className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950"><BookmarkPlus className="h-4 w-4"/></button></form><div className="mt-3 space-y-1">{(views.data?.data||[]).map((view)=><div key={view.id} className="flex items-center gap-1"><button type="button" onClick={()=>navigate(`/?${new URLSearchParams(view.query).toString()}`)} className="min-h-11 min-w-0 flex-1 truncate rounded-xl px-3 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{view.name}</button><button type="button" onClick={()=>remove.mutate(view.id)} aria-label={`Excluir ${view.name}`} className="grid h-11 w-11 place-items-center rounded-xl text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4"/></button></div>)}{views.isSuccess&&!views.data?.data?.length&&<p className="py-2 text-xs text-slate-500">Nenhuma visualização salva.</p>}</div></section>;
}

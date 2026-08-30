import { BookmarkPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageItem, setStorageItem } from '../utils/localStorage.js';

const KEY = 'araru:saved-views:v1';
export default function SavedViews() {
  const navigate = useNavigate(); const [name, setName] = useState(''); const [views, setViews] = useState(() => getStorageItem(KEY, []));
  const save = (event) => { event.preventDefault(); if (!name.trim()) return; const next = [...views.filter((view) => view.name !== name.trim()), { id: crypto.randomUUID(), name: name.trim(), query: window.location.search }]; setViews(next); setStorageItem(KEY, next); setName(''); };
  const remove = (id) => { const next = views.filter((view) => view.id !== id); setViews(next); setStorageItem(KEY, next); };
  return <section className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><h3 className="text-sm font-semibold">Saved views</h3><p className="mt-1 text-xs text-slate-500">Save the current search, filters and ordering locally.</p><form onSubmit={save} className="mt-3 flex gap-2"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Example: unread DevOps" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 text-sm dark:border-slate-700" /><button aria-label="Save view" className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950"><BookmarkPlus className="h-4 w-4" /></button></form><div className="mt-3 space-y-1">{views.map((view) => <div key={view.id} className="flex items-center gap-1"><button type="button" onClick={() => navigate(`/${view.query}`)} className="min-h-11 min-w-0 flex-1 truncate rounded-xl px-3 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{view.name}</button><button type="button" onClick={() => remove(view.id)} aria-label={`Delete ${view.name}`} className="grid h-11 w-11 place-items-center rounded-xl text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button></div>)}{!views.length && <p className="py-2 text-xs text-slate-500">No saved views.</p>}</div></section>;
}

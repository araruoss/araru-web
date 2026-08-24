import { Check, Plus, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { setActiveReadingProfile } from '../utils/localStorage.js';
import { apiFetch } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';

export default function ProfileControls() {
  const { t } = useLocale();
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState('default');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const response = await apiFetch('/profiles');
    if (!response.ok) return;
    const result = await response.json();
    setProfiles(result.data || []);
    setSelected(result.selectedProfileId || 'default');
    setActiveReadingProfile(result.selectedProfileId || 'default');
  }
  useEffect(() => { load(); }, []);

  async function select(id) {
    const response = await apiFetch(`/profiles/${encodeURIComponent(id)}/select`, { method: 'POST' });
    if (!response.ok) return;
    setActiveReadingProfile(id);
    window.location.reload();
  }

  async function create(event) {
    event.preventDefault(); setError('');
    const response = await apiFetch('/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const result = await response.json();
    if (!response.ok) return setError(result.message || t('profiles.failed'));
    setName(''); setCreating(false); await load();
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 p-3 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold">{t('profiles.title')}</p><p className="mt-1 text-xs text-slate-400">{t('profiles.help')}</p></div><UserRound className="h-4 w-4 opacity-50" /></div>
      <div className="space-y-1">
        {profiles.map((profile) => <button key={profile.id} type="button" onClick={() => select(profile.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm ${selected === profile.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: profile.color }} /><span className="min-w-0 flex-1 truncate">{profile.name}</span>{selected === profile.id && <Check className="h-4 w-4" />}</button>)}
      </div>
      {creating ? <form onSubmit={create} className="mt-3 flex gap-2"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder={t('profiles.name')} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none dark:border-slate-700" /><button className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">{t('profiles.create')}</button></form> : <button type="button" onClick={() => setCreating(true)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm dark:border-slate-700"><Plus className="h-4 w-4" />{t('profiles.new')}</button>}
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
    </section>
  );
}

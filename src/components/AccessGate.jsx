import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { syncReadingState } from '../utils/readingSync.js';
import { apiFetch } from '../lib/api.js';
import { useTema } from '../context/TemaContext.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Setup from '../pages/Setup.jsx';

export default function AccessGate({ children }) {
  const [status, setStatus] = useState('checking');
  const [secret, setSecret] = useState('');
  const [username, setUsername] = useState('admin');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const { tema, definirTema } = useTema();
  const { definirIdioma, t } = useLocale();

  useEffect(() => {
    (async () => {
      try {
        const system = await apiFetch('/system/status').then((response) => response.json());
        if (system.publicSettings) { definirIdioma(system.publicSettings.language); definirTema(system.publicSettings.theme); }
        if (system.setupRequired) { setSetupRequired(true); return setStatus('setup'); }
        const session = await apiFetch('/access/session');
        if (session.ok) { const settings = await apiFetch('/settings/general').then((response) => response.ok ? response.json() : null); if (settings?.data) { definirIdioma(settings.data.language); definirTema(settings.data.theme); } }
        setStatus(session.ok ? 'allowed' : 'required');
      } catch { setStatus('allowed'); }
    })();
  }, []);

  async function login(event) {
    event.preventDefault(); setSending(true); setError('');
    try {
      const response = await apiFetch('/access/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password: secret })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? t('auth.invalid') : (result.message || t('auth.failed')));
      setMustChangePassword(Boolean(result.mustChangePassword));
      setStatus('allowed');
      syncReadingState({ hydrate: true });
    } catch (cause) { setError(cause.message || t('auth.failed')); }
    finally { setSending(false); }
  }

  if (status === 'allowed' && mustChangePassword) return <ChangePassword onComplete={() => setMustChangePassword(false)} />;
  if (status === 'setup' || setupRequired) return <Setup onComplete={() => { setSetupRequired(false); setStatus('required'); }} />;
  if (status === 'allowed') return children;
  if (status === 'checking') return <main className="access-home grid min-h-screen place-items-center bg-slate-950 text-slate-400"><div className="flex items-center gap-3"><img src="/brand/araru-favicon.png" alt="" className="h-9 w-9 rounded-xl" />{t('auth.checking')}</div></main>;

  return (
    <main className="access-home min-h-screen overflow-hidden bg-slate-950 px-5 py-6 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center gap-3"><img src="/brand/araru-favicon.png" alt="Araru" className="h-10 w-10 rounded-2xl" /><div><p className="font-semibold tracking-tight">Araru</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{t('auth.digitalCollection')}</p></div></header>
        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_420px]">
          <section className="max-w-xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">{t('auth.personalLibrary')}</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{t('auth.hero')}</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400 sm:text-lg">{t('auth.description')}</p>
            <img src="/brand/araru-mascot.png" alt="Mascote Araru" className="pointer-events-none mt-8 hidden h-48 w-auto object-contain object-left opacity-90 sm:block lg:h-64" />
          </section>
          <form onSubmit={login} className="w-full rounded-[2rem] border border-white/10 bg-white/[0.07] p-7 shadow-2xl backdrop-blur-xl sm:p-9">
            <div className="mb-7"><h2 className="text-2xl font-semibold">{t('auth.title')}</h2><p className="mt-2 text-sm text-slate-400">{t('auth.help')}</p></div>
            <label className="text-sm font-medium" htmlFor="access-username">{t('auth.username')}</label>
            <input id="access-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 outline-none" required />
            <label className="mt-4 block text-sm font-medium" htmlFor="access-secret">{t('auth.password')}</label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 focus-within:border-cyan-300/60"><LockKeyhole className="h-4 w-4 text-slate-400" /><input id="access-secret" autoFocus type="password" value={secret} onChange={(event) => setSecret(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent outline-none" required /></div>
            {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
            <button disabled={sending} className="mt-5 h-12 w-full rounded-2xl bg-cyan-300 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">{sending ? t('auth.signingIn') : t('auth.login')}</button>
          </form>
        </div>
        <footer className="border-t border-white/10 py-5 text-xs text-slate-500">{t('auth.footer')}</footer>
      </div>
    </main>
  );
}

function ChangePassword({ onComplete }) {
  const { t } = useLocale();
  const [password, setPassword] = useState(''); const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); const response = await apiFetch('/access/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); if (!response.ok) { const result = await response.json(); setError(result.message || t('auth.changeFailed')); return; } onComplete(); }
  return <main className="access-home grid min-h-screen place-items-center bg-slate-950 px-5 text-white"><form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.07] p-8 shadow-2xl"><img src="/brand/araru-favicon.png" alt="Araru" className="mb-5 h-12 w-12 rounded-2xl" /><h1 className="text-2xl font-semibold">{t('auth.changeTitle')}</h1><p className="mt-2 text-sm text-slate-400">{t('auth.changeHelp')}</p><input autoFocus type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('auth.newPassword')} className="mt-6 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 outline-none" required />{error && <p className="mt-3 text-sm text-rose-400">{error}</p>}<button className="mt-5 h-12 w-full rounded-xl bg-cyan-300 font-semibold text-slate-950">{t('auth.savePassword')}</button></form></main>;
}

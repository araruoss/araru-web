import { useEffect, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from 'lucide-react';
import { syncReadingState } from '../utils/readingSync.js';
import { apiFetch } from '../lib/api.js';
import { useTema } from '../context/TemaContext.js';
import { useLocale } from '../context/LocaleContext.jsx';
import Setup from '../pages/Setup.jsx';

export default function AccessGate({ children }) {
  const [status, setStatus] = useState('checking');
  const [secret, setSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        const sessionData = session.ok ? await session.json() : null;
        setMustChangePassword(Boolean(sessionData?.user?.mustChangePassword || sessionData?.user?.passwordExpired));
        setStatus(session.ok ? 'allowed' : 'required');
      } catch { setStatus('allowed'); }
    })();
  }, []);

  async function login(event) {
    event.preventDefault(); setSending(true); setError('');
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password: secret })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? t('auth.invalid') : (result.message || t('auth.failed')));
      setMustChangePassword(Boolean(result.mustChangePassword));
      setStatus('allowed');
      syncReadingState({ hydrate: true });
    } catch (cause) { setError(cause instanceof TypeError ? t('auth.unavailable') : (cause.message || t('auth.failed'))); }
    finally { setSending(false); }
  }

  if (status === 'allowed' && mustChangePassword) return <ChangePassword onComplete={() => setMustChangePassword(false)} />;
  if (status === 'setup' || setupRequired) return <Setup onComplete={() => { setSetupRequired(false); setStatus('required'); }} />;
  if (status === 'allowed') return children;
  if (status === 'checking') return <main className="access-home grid min-h-screen place-items-center bg-slate-950 text-slate-400"><div className="flex items-center gap-3"><img src="/brand/araru-favicon.png" alt="" className="h-9 w-9 rounded-xl" />{t('auth.checking')}</div></main>;

  return (
    <main className="access-home relative min-h-dvh overflow-hidden bg-[var(--access-bg)] px-5 py-5 text-[var(--access-text)] sm:px-8 lg:px-12">
      <div className="access-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="access-glow pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="access-glow pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-blue-600/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <header className="flex items-center border-b border-white/10 pb-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-300/20"><img src="/brand/araru-favicon.png" alt="" className="h-8 w-8 rounded-xl" /></span><div><p className="font-semibold tracking-tight">Araru</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{t('auth.digitalCollection')}</p></div></div>
        </header>
        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-16 lg:py-12">
          <section className="max-w-xl">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300"><span className="h-px w-8 bg-cyan-300" />{t('auth.personalLibrary')}</p>
            <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{t('auth.hero')}</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">{t('auth.description')}</p>
            <img src="/brand/araru-mascot.png" alt="" className="pointer-events-none mt-8 h-32 w-auto object-contain object-left opacity-75 sm:h-40 lg:mt-10 lg:h-48" />
          </section>
          <form onSubmit={login} className="access-card w-full rounded-[1.75rem] border border-white/15 bg-white/[0.075] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-7"><div className="mb-4 h-1 w-10 rounded-full bg-cyan-300" /><h2 className="text-2xl font-semibold tracking-tight">{t('auth.title')}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{t('auth.help')}</p></div>
            <label className="text-sm font-medium" htmlFor="access-username">{t('auth.username')}</label>
            <div className="access-input-field mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4"><UserRound className="h-4 w-4 shrink-0 text-slate-500" /><input id="access-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent outline-none" required /></div>
            <label className="mt-4 block text-sm font-medium" htmlFor="access-secret">{t('auth.password')}</label>
            <div className="access-input-field access-password-field mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4"><LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" /><input id="access-secret" autoComplete="current-password" autoFocus type={showPassword ? 'text' : 'password'} value={secret} onChange={(event) => setSecret(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'access-error' : undefined} className="h-12 min-w-0 flex-1 bg-transparent outline-none" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-slate-200" aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')} title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {error && <p id="access-error" role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
            <button type="submit" disabled={sending} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 font-semibold text-accent-foreground shadow-lg shadow-accent/10 transition hover:-translate-y-0.5 hover:bg-accent-hover disabled:translate-y-0 disabled:opacity-60">{sending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{sending ? t('auth.signingIn') : t('auth.login')}</button>
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
  async function submit(event) { event.preventDefault(); const response = await apiFetch('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); if (!response.ok) { const result = await response.json(); setError(result.message || t('auth.changeFailed')); return; } onComplete(); }
  return <main className="access-home grid min-h-screen place-items-center bg-slate-950 px-5 text-white"><form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.07] p-8 shadow-2xl"><img src="/brand/araru-favicon.png" alt="Araru" className="mb-5 h-12 w-12 rounded-2xl" /><h1 className="text-2xl font-semibold">{t('auth.changeTitle')}</h1><p className="mt-2 text-sm text-slate-400">{t('auth.changeHelp')}</p><input autoFocus type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('auth.newPassword')} className="mt-6 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 outline-none" required />{error && <p className="mt-3 text-sm text-rose-400">{error}</p>}<button className="mt-5 h-12 w-full rounded-xl bg-cyan-300 font-semibold text-slate-950">{t('auth.savePassword')}</button></form></main>;
}

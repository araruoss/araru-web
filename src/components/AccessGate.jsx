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
    <main className="relative min-h-dvh flex flex-col justify-between bg-background px-4 py-6 text-primary sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between">
        <header className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-raised border border-border-subtle shadow-subtle">
              <img src="/brand/araru-favicon.png" alt="" className="h-7 w-7 rounded-lg" />
            </span>
            <div>
              <p className="font-semibold tracking-tight text-base text-primary">Araru</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{t('auth.digitalCollection')}</p>
            </div>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-16 lg:py-12">
          <section className="max-w-xl space-y-4">
            <p className="inline-flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-6 bg-accent" />
              {t('auth.personalLibrary')}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl lg:text-5xl leading-tight">
              {t('auth.hero')}
            </h1>
            <p className="text-body text-secondary max-w-md leading-relaxed">
              {t('auth.description')}
            </p>
            <div className="pt-2">
              <img
                src="/brand/araru-mascot.png"
                alt="Mascote Araru"
                className="pointer-events-none h-28 sm:h-36 w-auto object-contain object-left opacity-80"
              />
            </div>
          </section>

          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <form
              onSubmit={login}
              className="rounded-2xl border border-border bg-surface p-6 shadow-raised backdrop-blur-sm sm:p-8 space-y-5"
            >
              <div>
                <div className="mb-3 h-1 w-8 rounded-full bg-accent" />
                <h2 className="text-xl font-semibold tracking-tight text-primary sm:text-2xl">{t('auth.title')}</h2>
                <p className="mt-1 text-body-sm text-secondary">{t('auth.help')}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-label font-medium text-primary" htmlFor="access-username">
                  {t('auth.username')}
                </label>
                <div className="relative flex items-center rounded-lg border border-border bg-background-subtle px-3 transition-colors focus-within:border-focus-ring focus-within:ring-2 focus-within:ring-focus-ring/25">
                  <UserRound className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    id="access-username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-11 min-w-0 flex-1 bg-transparent px-2.5 text-body-sm text-primary outline-none placeholder:text-muted"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-label font-medium text-primary" htmlFor="access-secret">
                  {t('auth.password')}
                </label>
                <div className="relative flex items-center rounded-lg border border-border bg-background-subtle px-3 transition-colors focus-within:border-focus-ring focus-within:ring-2 focus-within:ring-focus-ring/25">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    id="access-secret"
                    autoComplete="current-password"
                    autoFocus
                    type={showPassword ? 'text' : 'password'}
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'access-error' : undefined}
                    className="h-11 min-w-0 flex-1 bg-transparent px-2.5 text-body-sm text-primary outline-none placeholder:text-muted"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-raised hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p id="access-error" role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-caption font-medium text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-body-sm font-semibold text-accent-foreground shadow-subtle transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {sending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {sending ? t('auth.signingIn') : t('auth.login')}
              </button>
            </form>
          </div>
        </div>

        <footer className="border-t border-border-subtle py-4 text-center text-caption text-muted">
          {t('auth.footer')}
        </footer>
      </div>
    </main>
  );
}

function ChangePassword({ onComplete }) {
  const { t } = useLocale();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await apiFetch('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        const result = await response.json();
        setError(result.message || t('auth.changeFailed'));
        return;
      }
      onComplete();
    } catch {
      setError(t('auth.changeFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-6 text-primary sm:px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-raised sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <img src="/brand/araru-favicon.png" alt="Araru" className="h-10 w-10 rounded-xl" />
          <div>
            <h1 className="text-xl font-semibold text-primary">{t('auth.changeTitle')}</h1>
            <p className="text-caption text-secondary">{t('auth.changeHelp')}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-label font-medium text-primary" htmlFor="new-password">
            {t('auth.newPassword')}
          </label>
          <input
            id="new-password"
            autoFocus
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('auth.newPassword')}
            className="h-11 w-full rounded-lg border border-border bg-background-subtle px-3 text-body-sm text-primary outline-none focus-visible:border-focus-ring focus-visible:ring-2 focus-visible:ring-focus-ring/25"
            required
          />
        </div>
        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-caption font-medium text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-body-sm font-semibold text-accent-foreground shadow-subtle transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {t('auth.savePassword')}
        </button>
      </form>
    </main>
  );
}


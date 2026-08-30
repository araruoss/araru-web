import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Eye, EyeOff,
  Languages, LoaderCircle, LockKeyhole, Palette, Server, ShieldCheck,
  UserRound, Wifi, XCircle
} from 'lucide-react';
import { apiFetch } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useTema } from '../context/TemaContext.js';

const SETUP_STEPS = [
  { key: 'welcome', icon: ShieldCheck }, { key: 'language', icon: Languages },
  { key: 'server', icon: Server }, { key: 'admin', icon: LockKeyhole },
  { key: 'profile', icon: UserRound }, { key: 'appearance', icon: Palette },
  { key: 'review', icon: CheckCircle2 }
];

const createInitialData = (language = 'en') => ({
  language, theme: 'dark', server: { libraryName: 'Araru' },
  admin: { username: '', email: '', displayName: '', password: '', confirmation: '' },
  profile: { name: '', color: '#0891B2' }, preferences: {}
});

function readDraft(language) {
  try {
    const saved = JSON.parse(sessionStorage.getItem('araru:setup-draft') || 'null');
    if (!saved) return createInitialData(language);
    const initial = createInitialData(language);
    return { ...initial, ...saved, admin: { ...initial.admin, ...saved.admin, password: '', confirmation: '' } };
  } catch { return createInitialData(language); }
}

function writeDraft(data) {
  try { sessionStorage.setItem('araru:setup-draft', JSON.stringify({ ...data, admin: { ...data.admin, password: '', confirmation: '' } })); } catch { /* storage opcional */ }
}

function Field({ id, label, error, help, ...props }) {
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
    <input id={id} {...props} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
      className="h-12 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 text-[var(--text-primary)] outline-none transition focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20" />
    {help && <p id={`${id}-help`} className="text-xs text-[var(--text-muted)]">{help}</p>}
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
  </div>;
}

function PasswordField({ id, label, value, onChange, error, help, confirmation = false, t }) {
  const [visible, setVisible] = useState(false);
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete="new-password" minLength={8}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        className="h-12 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 pr-12 text-[var(--text-primary)] outline-none transition focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/20" />
      <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--background-subtle)]" aria-label={visible ? t('setup.hidePassword') : t('setup.showPassword')}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {help && <p id={`${id}-help`} className="text-xs text-[var(--text-muted)]">{help}</p>}
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
  </div>;
}

function Choice({ active, onClick, title, description, children }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? 'border-[var(--link)] bg-[var(--link)]/10 ring-2 ring-[var(--link)]/15' : 'border-[var(--app-border)] hover:border-[var(--border-strong)]'}`}>
    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? 'border-[var(--link)] bg-[var(--link)] text-white' : 'border-[var(--border-strong)]'}`}>{active && <Check className="h-3.5 w-3.5" />}</span>
    <span><span className="block font-medium text-[var(--text-primary)]">{title}</span>{description && <span className="mt-1 block text-sm text-[var(--text-muted)]">{description}</span>}{children}</span>
  </button>;
}

export default function Setup({ onComplete }) {
  const { idioma, definirIdioma, t } = useLocale();
  const { definirTema } = useTema();
  const [step, setStep] = useState(0); const [data, setData] = useState(() => readDraft(idioma));
  const [errors, setErrors] = useState({}); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [health, setHealth] = useState('checking');
  const titleRef = useRef(null);
  useEffect(() => { writeDraft(data); }, [data]);
  useEffect(() => { definirTema(data.theme); }, []);
  useEffect(() => { titleRef.current?.focus(); }, [step]);
  useEffect(() => {
    if (step !== 2) return undefined;
    let active = true; setHealth('checking');
    apiFetch('/system/status').then(async (response) => { const result = await response.json().catch(() => ({})); if (active) setHealth(response.ok && result.setupRequired ? 'ready' : 'error'); }).catch(() => { if (active) setHealth('error'); });
    return () => { active = false; };
  }, [step]);
  const patch = (section, value) => setData((current) => section ? ({ ...current, [section]: { ...current[section], ...value } }) : ({ ...current, ...value }));
  const stepErrors = useMemo(() => validateStep(step, data, t), [step, data, t]);
  function next() { setErrors(stepErrors); setError(''); if (step === 2 && health !== 'ready') { setError(health === 'checking' ? t('setup.serverChecking') : t('setup.serverErrorHelp')); return; } if (!Object.keys(stepErrors).length) setStep((current) => Math.min(SETUP_STEPS.length - 1, current + 1)); }
  function back() { setErrors({}); setError(''); setStep((current) => Math.max(0, current - 1)); }
  async function finish() {
    const validation = [2, 3, 4].map((item) => ({ step: item, errors: validateStep(item, data, t) })).find((item) => Object.keys(item.errors).length); if (validation) { setErrors(validation.errors); setStep(validation.step); return; }
    setBusy(true); setError('');
    try {
      const response = await apiFetch('/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(result.message || result.error?.message || t('setup.failed')), { status: response.status });
      sessionStorage.removeItem('araru:setup-draft'); definirIdioma(data.language); definirTema(data.theme); setStep(SETUP_STEPS.length);
    } catch (cause) { setError(cause.status === 409 ? t('setup.alreadyCompleted') : (cause.message || t('setup.failed'))); } finally { setBusy(false); }
  }
  if (step === SETUP_STEPS.length) return <main className="setup-shell min-h-dvh bg-[var(--background)] px-5 py-6 text-[var(--text-primary)] sm:px-8"><div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-3xl flex-col justify-center"><SetupHeader t={t} /><section className="py-12 text-center"><img src="/brand/araru-mascot.png" alt="" className="mx-auto mb-8 h-36 w-auto object-contain" /><p className="text-sm font-semibold uppercase tracking-[.2em] text-[var(--link)]">{t('setup.readyEyebrow')}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t('setup.ready')}</h1><p className="mx-auto mt-5 max-w-md text-lg leading-8 text-[var(--text-muted)]">{t('setup.readyText')}</p><button type="button" onClick={onComplete} className="mt-9 inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--accent)] px-6 font-semibold text-[var(--accent-foreground)]"><Wifi className="h-4 w-4" />{t('setup.enter')}</button></section></div></main>;
  const current = SETUP_STEPS[step];
  return <main className="setup-shell min-h-dvh bg-[var(--background)] px-4 py-5 text-[var(--text-primary)] sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><SetupHeader t={t} /><div className="mb-6 flex items-center justify-between gap-4 lg:hidden"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">{t('setup.stepOf', { current: step + 1, total: SETUP_STEPS.length })}</p><p className="mt-1 font-medium">{t(`setup.${current.key}`)}</p></div><div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--background-subtle)]" role="progressbar" aria-valuenow={step + 1} aria-valuemin="1" aria-valuemax={SETUP_STEPS.length}><div className="h-full rounded-full bg-[var(--link)] transition-all" style={{ width: `${((step + 1) / SETUP_STEPS.length) * 100}%` }} /></div></div><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,720px)] lg:justify-center lg:gap-14"><aside className="hidden lg:block" aria-label={t('setup.title')}><p className="mb-5 text-xs font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">{t('setup.progress')}</p><nav className="space-y-1">{SETUP_STEPS.map((item, index) => <StepNav key={item.key} item={item} index={index} current={step} t={t} onSelect={() => index <= step && setStep(index)} />)}</nav></aside><section className="min-w-0"><div className="setup-step min-h-[min(620px,calc(100dvh-9rem))]" key={current.key}><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--link)]">{t('setup.stepOf', { current: step + 1, total: SETUP_STEPS.length })}</p><h1 ref={titleRef} tabIndex="-1" className="mt-3 text-3xl font-semibold tracking-tight outline-none sm:text-4xl">{t(`setup.${current.key}Title`)}</h1><p className="mt-3 max-w-2xl leading-7 text-[var(--text-muted)]">{t(`setup.${current.key}Help`)}</p></div><StepContent step={step} data={data} patch={patch} t={t} setStep={setStep} definirIdioma={definirIdioma} definirTema={definirTema} health={health} errors={errors} /></div>{error && <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]"><XCircle className="h-5 w-5 shrink-0" />{error}</div>}<div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-[var(--app-border)] bg-[var(--background)]/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0"><button type="button" onClick={back} disabled={step === 0 || busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--background-subtle)] disabled:opacity-40"><ChevronLeft className="h-4 w-4" />{t('setup.back')}</button>{step === SETUP_STEPS.length - 1 ? <button type="button" onClick={finish} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-60">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{busy ? t('setup.configuring') : t('setup.complete')}</button> : <button type="button" onClick={next} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)]">{t('common.continue')}<ChevronRight className="h-4 w-4" /></button>}</div></section></div></div></main>;
}

function SetupHeader({ t }) { return <header className="mb-10 flex items-center gap-3 border-b border-[var(--app-border)] pb-5"><img src="/brand/araru-favicon.png" className="h-10 w-10 rounded-xl" alt="" /><div><p className="font-semibold tracking-tight">Araru</p><p className="text-xs text-[var(--text-muted)]">{t('setup.title')}</p></div></header>; }
function StepNav({ item, index, current, t, onSelect }) { const Icon = item.icon; const done = index < current; const active = index === current; return <button type="button" onClick={onSelect} disabled={index > current} aria-current={active ? 'step' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active ? 'bg-[var(--background-subtle)] font-semibold text-[var(--text-primary)]' : done ? 'text-[var(--success)] hover:bg-[var(--background-subtle)]' : 'text-[var(--text-muted)] disabled:cursor-default'}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${active ? 'border-[var(--link)] text-[var(--link)]' : done ? 'border-[var(--success)] bg-[var(--success)] text-white' : 'border-[var(--border-strong)]'}`}>{done ? <Check className="h-3.5 w-3.5" /> : active ? <Icon className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5" />}</span>{t(`setup.${item.key}`)}</button>; }

function StepContent({ step, data, patch, t, setStep, definirIdioma, definirTema, health, errors }) {
  if (step === 0) return <div className="max-w-xl"><img src="/brand/araru-mascot.png" alt="" className="mb-8 h-40 w-auto object-contain object-left sm:h-48" /><p className="text-lg leading-8 text-[var(--text-secondary)]">{t('setup.welcomeText')}</p></div>;
  if (step === 1) return <div className="grid gap-3 sm:grid-cols-2">{[['pt-BR', 'Português (Brasil)'], ['en', 'English']].map(([value, label]) => <Choice key={value} active={data.language === value} onClick={() => { patch(null, { language: value }); definirIdioma(value); }} title={label} description={value === 'pt-BR' ? t('setup.languagePortuguese') : t('setup.languageEnglish')} />)}</div>;
  if (step === 2) return <div className="space-y-6"><div className={`flex items-center gap-3 rounded-2xl border p-4 ${health === 'error' ? 'border-[var(--danger)]/30 bg-[var(--danger)]/10' : 'border-[var(--success)]/30 bg-[var(--success)]/10'}`}>{health === 'checking' ? <LoaderCircle className="h-5 w-5 animate-spin text-[var(--text-muted)]" /> : health === 'ready' ? <CheckCircle2 className="h-5 w-5 text-[var(--success)]" /> : <XCircle className="h-5 w-5 text-[var(--danger)]" />}<div><p className="font-medium">{health === 'error' ? t('setup.serverError') : health === 'checking' ? t('setup.serverChecking') : t('setup.serverReady')}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{health === 'error' ? t('setup.serverErrorHelp') : t('setup.serverReadyHelp')}</p></div></div><Field id="library-name" label={t('setup.libraryName')} value={data.server.libraryName} onChange={(event) => patch('server', { libraryName: event.target.value })} maxLength={80} error={errors.libraryName} help={t('setup.libraryNameHelp')} /></div>;
  if (step === 3) return <div className="grid gap-5 sm:grid-cols-2"><Field id="admin-display-name" label={t('setup.displayName')} value={data.admin.displayName} onChange={(event) => patch('admin', { displayName: event.target.value })} error={errors.displayName} autoComplete="name" /><Field id="admin-username" label={t('auth.username')} value={data.admin.username} onChange={(event) => patch('admin', { username: event.target.value })} error={errors.username} autoComplete="username" required /><Field id="admin-email" label={t('setup.email')} type="email" value={data.admin.email} onChange={(event) => patch('admin', { email: event.target.value })} error={errors.email} autoComplete="email" /><span className="hidden sm:block" /><PasswordField id="admin-password" label={t('auth.password')} value={data.admin.password} onChange={(event) => patch('admin', { password: event.target.value })} error={errors.password} help={t('setup.passwordHelp')} t={t} /><PasswordField id="admin-confirmation" label={t('setup.confirmPassword')} value={data.admin.confirmation} onChange={(event) => patch('admin', { confirmation: event.target.value })} error={errors.confirmation} t={t} confirmation /></div>;
  if (step === 4) return <div className="max-w-xl"><Field id="profile-name" label={t('setup.profileName')} value={data.profile.name} onChange={(event) => patch('profile', { name: event.target.value })} error={errors.profileName} autoComplete="nickname" help={t('setup.profileNameHelp')} /></div>;
  if (step === 5) return <div className="grid gap-3 sm:grid-cols-3">{[['system', t('common.system'), t('setup.themeSystem')], ['light', t('common.light'), t('setup.themeLight')], ['dark', t('common.dark'), t('setup.themeDark')]].map(([value, title, description]) => <Choice key={value} active={data.theme === value} onClick={() => { patch(null, { theme: value }); definirTema(value); }} title={title} description={description}><span className={`mt-3 block h-9 w-full rounded-lg ${value === 'dark' ? 'bg-[var(--surface-overlay)]' : value === 'light' ? 'bg-[var(--surface)] ring-1 ring-[var(--border)]' : 'bg-gradient-to-r from-[var(--surface)] to-[var(--surface-overlay)]'}`} aria-hidden="true" /></Choice>)}</div>;
  return <Review data={data} t={t} onEdit={setStep} />;
}

function Review({ data, t, onEdit }) { const items = [[t('setup.language'), data.language === 'en' ? 'English' : 'Português (Brasil)', 1], [t('setup.server'), data.server.libraryName || 'Araru', 2], [t('setup.admin'), data.admin.displayName || data.admin.username, 3], [t('setup.profile'), data.profile.name, 4], [t('setup.appearance'), data.theme === 'dark' ? t('common.dark') : data.theme === 'light' ? t('common.light') : t('common.system'), 5]]; return <div className="divide-y divide-[var(--app-border)] rounded-2xl border border-[var(--app-border)]">{items.map(([label, value, target]) => <div key={label} className="flex items-center justify-between gap-4 p-4"><div><span className="block text-sm text-[var(--text-muted)]">{label}</span><span className="mt-1 block font-medium">{value}</span></div><button type="button" onClick={() => onEdit(target)} className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--link)] hover:bg-[var(--background-subtle)]">{t('common.edit')}</button></div>)}<p className="p-4 text-sm text-[var(--text-muted)]">{t('setup.reviewHelp')}</p></div>; }

function validateStep(step, data, t) {
  const errors = {};
  if (step === 2 && !String(data.server.libraryName || '').trim()) errors.libraryName = t('setup.required');
  if (step === 3) {
    if (!String(data.admin.displayName || '').trim()) errors.displayName = t('setup.required');
    if (!/^[a-z0-9._@+-]{3,120}$/i.test(String(data.admin.username || '').trim())) errors.username = t('setup.usernameHelp');
    if (data.admin.email && !/^\S+@\S+\.\S+$/.test(data.admin.email)) errors.email = t('setup.emailInvalid');
    if (String(data.admin.password || '').length < 8) errors.password = t('setup.passwordHelp');
    if (data.admin.password !== data.admin.confirmation) errors.confirmation = t('setup.passwordMismatch');
  }
  if (step === 4 && !String(data.profile.name || '').trim()) errors.profileName = t('setup.required');
  return errors;
}

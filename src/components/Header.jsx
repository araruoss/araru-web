import { BarChart3, History, Menu, Search, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Busca from './Busca.jsx';
import { apiFetch } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';

export default function Header({
  busca,
  onBuscaChange,
  title = 'Biblioteca',
  brand = 'Araru',
  showSearch = true,
  onOpenNavigation
}) {
  const { t } = useLocale();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('default');
  const [identity, setIdentity] = useState(null);
  const showContext = title && title !== 'Biblioteca';
  const activeProfile = profiles.find((profile) => profile.id === selectedProfile);
  useEffect(() => { apiFetch('/auth/me').then(async (response) => { if (!response.ok) return; const data = await response.json(); setIdentity(data.user); setProfiles(data.profiles || []); setSelectedProfile(data.activeProfile?.id || 'default'); }).catch(() => {}); }, []);

  async function openProfiles() {
    setProfileMenuOpen((open) => !open);
    if (profiles.length) return;
    const response = await apiFetch('/profiles');
    if (!response.ok) return;
    const data = await response.json();
    setProfiles(data.data || []);
    setSelectedProfile(data.selectedProfileId || 'default');
  }

  async function selectProfile(id) {
    const response = await apiFetch(`/profiles/${encodeURIComponent(id)}/select`, { method: 'POST' });
    if (response.ok) window.location.reload();
  }

  async function logout() {
    await apiFetch('/access/logout', { method: 'POST' }).catch(() => {});
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/');
  }

  return (
    <header className="library-topbar sticky top-0 z-40">
      <div className="mx-auto max-w-[1560px] px-3 py-3 sm:px-5 lg:px-8">
        <div className="topbar-shell flex min-h-[62px] items-center gap-3 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {onOpenNavigation && (
              <button
                type="button"
                onClick={onOpenNavigation}
                className="quiet-action grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
                aria-label={t('header.openNavigation')}
                title={t('header.openNavigation')}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <Link to="/" className="topbar-brand flex min-w-0 items-center gap-3">
              <span className="brand-mark topbar-brand-mark grid h-10 w-10 shrink-0 place-items-center overflow-hidden">
                <img src="/brand/araru-favicon.png" alt="" className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="topbar-title truncate text-sm font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[15px]">
                    {brand}
                  </span>
                  {showContext && (
                    <>
                      <span className="topbar-separator hidden sm:block" />
                      <span className="topbar-context hidden truncate text-sm text-slate-500 dark:text-slate-400 sm:block">
                        {title}
                      </span>
                    </>
                  )}
                </div>
                <p className="hidden text-[11px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 sm:block">
                  {t('header.tagline')}
                </p>
              </div>
            </Link>
          </div>

          {showSearch && (
            <div className="mx-auto hidden flex-1 justify-center lg:flex">
              <Busca
                value={busca}
                onChange={onBuscaChange}
                className="max-w-[380px]"
                placeholder={t('header.searchPlaceholder')}
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {showSearch && (
              <button
                type="button"
                onClick={() => setMobileSearchOpen((value) => !value)}
                className="quiet-action grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
                aria-label={t('header.search')}
                title={t('header.search')}
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            <div className="topbar-actions flex items-center gap-1 p-1">
              <Link
                to="/estatisticas"
                className="quiet-action grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={t('header.statistics')}
                title={t('header.statistics')}
              >
                <BarChart3 className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/historico"
                className="quiet-action grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={t('header.history')}
                title={t('header.history')}
              >
                <History className="h-4.5 w-4.5" />
              </Link>

              <div className="relative">
                <button type="button" onClick={openProfiles} className="quiet-action flex min-h-11 items-center gap-2 px-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white" aria-label={t('header.userProfile')} title={t('header.userProfile')} aria-expanded={profileMenuOpen}>
                  <UserRound className="h-4.5 w-4.5" /><span className="hidden max-w-32 text-left xl:block"><strong className="block truncate text-xs font-medium">{identity?.displayName || identity?.username}</strong><span className="block truncate text-[10px] text-slate-500">{activeProfile?.name||t('header.readingProfile')}</span></span>
                </button>
                {profileMenuOpen && <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-2 shadow-2xl backdrop-blur-xl"><div className="border-b border-[var(--app-border)] px-3 py-2"><p className="truncate text-sm font-semibold">{identity?.displayName || identity?.username}</p><p className="truncate text-xs text-slate-500">{identity?.email || identity?.username}</p></div><p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">{t('header.readingProfile')}</p>{profiles.map((profile) => <button key={profile.id} type="button" onClick={() => selectProfile(profile.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm ${selectedProfile === profile.id ? 'bg-[var(--brand-primary)] text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: profile.color }} />{profile.name}</button>)}{identity?.role==='admin'&&<a href="/admin" className="mt-1 block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{t('header.administration')}</a>}<button type="button" onClick={logout} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-500/10">{t('header.logout')}</button></div>}
              </div>

            </div>
          </div>
        </div>
      </div>

      {showSearch && mobileSearchOpen && (
        <div className="mx-auto max-w-[1560px] px-3 pb-3 sm:px-5 lg:px-8 lg:hidden">
          <div className="topbar-search-panel px-3 py-3 sm:px-4">
            <Busca
              value={busca}
              onChange={onBuscaChange}
              placeholder={t('header.searchPlaceholder')}
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}

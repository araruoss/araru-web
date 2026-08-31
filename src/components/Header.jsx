import { BarChart3, BookOpen, History, House, Layers3, Search, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { apiFetch } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useTema } from '../context/TemaContext.js';
import { Button } from './ui/button';
import ThemeToggleButton from './theme/ThemeToggleButton.jsx';

const navigation = [
  { to: '/', labelKey: 'home', icon: House },
  { to: '/library', labelKey: 'library', icon: BookOpen },
  { to: '/history', labelKey: 'history', icon: History },
  { to: '/estatisticas', labelKey: 'statistics', icon: BarChart3 }
];

export default function Header({ brand = 'Araru', showSearch = true }) {
  const { t } = useLocale();
  const { aplicarTemaDoPerfil } = useTema();
  const [profiles, setProfiles] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    apiFetch('/auth/me').then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setIdentity(data.user);
      setActiveProfile(data.profile);
      if (Array.isArray(data.profiles)) setProfiles(data.profiles);
      aplicarTemaDoPerfil(data.profile?.id, data.profile?.theme);
    }).catch(() => {});
  }, [aplicarTemaDoPerfil]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    }
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  async function openProfiles() {
    setProfileMenuOpen((value) => !value);
    if (profiles.length) return;
    const response = await apiFetch('/profiles');
    if (response.ok) setProfiles((await response.json()).data || []);
  }

  async function selectProfile(id) {
    const response = await apiFetch(`/profiles/${encodeURIComponent(id)}/select`, { method: 'POST' });
    if (response.ok) window.location.reload();
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.assign('/');
  }

  const openSearch = () => window.dispatchEvent(new Event('biblioteca:open-search'));
  const navLink = ({ to, labelKey, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-body-sm transition ${
          isActive ? 'bg-surface-raised text-primary font-medium shadow-subtle' : 'text-secondary hover:bg-surface-raised hover:text-primary'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {t(`navigation.${labelKey}`)}
    </NavLink>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <Link
            to="/"
            aria-label={brand}
            className="flex shrink-0 items-center gap-2.5 rounded-md text-primary transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
          >
            <img src="/brand/araru-favicon.png" alt="" className="h-8 w-8 rounded-md shadow-subtle" />
            <span className="font-semibold tracking-tight text-lg">{brand}</span>
          </Link>
          <nav className="hidden items-center gap-1.5 lg:flex" aria-label={t('navigation.navigation')}>
            {navigation.map(navLink)}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            {showSearch && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('header.search')}
                title={t('header.search')}
                onClick={openSearch}
                className="text-secondary hover:text-primary"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            <ThemeToggleButton profileId={activeProfile?.id} />
            <div className="relative" ref={profileMenuRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('header.readingProfile')}
                title={t('header.readingProfile')}
                aria-expanded={profileMenuOpen}
                onClick={openProfiles}
                className="text-secondary hover:text-primary"
              >
                <UserRound className="h-4 w-4" />
              </Button>
              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label={t('header.readingProfile')}
                  className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-surface p-2 text-primary shadow-raised animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="border-b border-border-subtle pb-1">
                    {profiles.map((profile) => (
                      <button
                        type="button"
                        role="menuitem"
                        key={profile.id}
                        onClick={() => selectProfile(profile.id)}
                        className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-body-sm transition hover:bg-surface-raised ${
                          profile.id === activeProfile?.id ? 'font-medium text-primary bg-surface-raised/50' : 'text-secondary'
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            profile.id === activeProfile?.id ? 'bg-accent shadow-sm' : 'bg-border-strong'
                          }`}
                        />
                        <span className="truncate">{profile.name}</span>
                      </button>
                    ))}
                    <Link
                      to="/settings"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-body-sm text-secondary transition hover:bg-surface-raised hover:text-primary"
                    >
                      {t('header.settings')}
                    </Link>
                    {identity?.role === 'admin' && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-body-sm text-secondary transition hover:bg-surface-raised hover:text-primary"
                      >
                        {t('header.administration')}
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-left text-body-sm text-danger transition hover:bg-danger/10"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Responsive mobile bottom navigation bar with safe area support */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-border-subtle bg-surface/95 backdrop-blur px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] lg:hidden shadow-raised"
        aria-label={t('navigation.navigation')}
      >
        {navigation.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-12 min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1 text-caption transition active:scale-95 ${
                isActive ? 'text-accent font-semibold' : 'text-muted hover:text-primary'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate max-w-[70px] text-[11px] leading-tight">{t(`navigation.${labelKey}`)}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

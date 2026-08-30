import { BarChart3, BookOpen, History, House, Search, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const navLink = ({ to, labelKey, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-body-sm transition ${isActive ? 'bg-surface-raised text-primary' : 'text-secondary hover:bg-surface-raised hover:text-primary'}`}><Icon className="h-4 w-4" />{t(`navigation.${labelKey}`)}</NavLink>;

 return <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/95 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6"><Link to="/" aria-label={brand} className="flex shrink-0 items-center gap-2 rounded-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"><img src="/brand/araru-favicon.png" alt="" className="h-8 w-8 rounded-md" /><span className="font-semibold tracking-tight">{brand}</span></Link><nav className="hidden items-center gap-1 lg:flex" aria-label={t('navigation.navigation')}>{navigation.map(navLink)}</nav><div className="ml-auto flex items-center gap-1">{showSearch && <Button type="button" variant="ghost" size="icon" aria-label={t('header.search')} title={t('header.search')} onClick={openSearch}><Search className="h-4 w-4" /></Button>}<ThemeToggleButton profileId={activeProfile?.id} /><div className="relative"><Button type="button" variant="ghost" size="icon" aria-label={t('header.readingProfile')} title={t('header.readingProfile')} aria-expanded={profileMenuOpen} onClick={openProfiles}><UserRound className="h-4 w-4" /></Button>{profileMenuOpen && <div className="absolute right-0 top-12 z-50 w-64 rounded-md border border-border bg-surface p-2 text-primary shadow-raised"><div className="border-b border-border-subtle pb-1">{profiles.map((profile) => <button type="button" key={profile.id} onClick={() => selectProfile(profile.id)} className={`flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-body-sm hover:bg-surface-raised ${profile.id === activeProfile?.id ? 'text-primary' : 'text-secondary'}`}><span className={`h-2 w-2 rounded-full ${profile.id === activeProfile?.id ? 'bg-accent' : 'bg-border-strong'}`} />{profile.name}</button>)}<Link to="/settings" className="block rounded-md px-3 py-2 text-body-sm text-secondary hover:bg-surface-raised">{t('header.settings')}</Link>{identity?.role === 'admin' && <Link to="/admin" className="block rounded-md px-3 py-2 text-body-sm text-secondary hover:bg-surface-raised">{t('header.administration')}</Link>}<button type="button" onClick={logout} className="mt-1 w-full rounded-md px-3 py-2 text-left text-body-sm text-danger hover:bg-surface-raised">{t('header.logout')}</button></div></div>}</div></div></div><nav className="mx-auto flex max-w-[1440px] items-center justify-around border-t border-border-subtle px-2 py-1 lg:hidden" aria-label={t('navigation.navigation')}>{navigation.map(({ to, labelKey, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex min-h-12 min-w-20 flex-col items-center justify-center gap-0.5 rounded-md text-caption ${isActive ? 'text-accent' : 'text-muted'}`}><Icon className="h-4 w-4" />{t(`navigation.${labelKey}`)}</NavLink>)}</nav></header>;
}

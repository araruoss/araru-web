import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext.jsx';
import { useTema } from '../../context/TemaContext.js';
import { Button } from '../ui/button';

export default function ThemeToggleButton({ profileId }) {
  const { t } = useLocale();
  const { tema, alternarTemaDoPerfil } = useTema();
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches || false);
  const resolvedTheme = tema === 'dark' || (tema === 'system' && systemDark) ? 'dark' : 'light';
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? t('header.useLightTheme') : t('header.useDarkTheme');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="theme-toggle"
      data-theme={resolvedTheme}
      aria-pressed={isDark}
      aria-label={label}
      title={label}
      onClick={() => alternarTemaDoPerfil(profileId)}
    >
      <span className="theme-toggle__icons relative grid h-5 w-5 place-items-center" aria-hidden="true">
        {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      </span>
    </Button>
  );
}

import { useState } from 'react';
import { getStorageItem, setStorageItem } from '../utils/localStorage.js';

const KEY = 'araru:reader-preferences:v1';
const defaults = { readingMode: 'page', theme: 'system', preferredFormat: 'epub' };

export default function ReaderPreferences() {
  const [prefs, setPrefs] = useState(() => ({ ...defaults, ...getStorageItem(KEY, {}) }));
  const update = (field, value) => { const next = { ...prefs, [field]: value }; setPrefs(next); setStorageItem(KEY, next); };
  return <section className="space-y-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><div><h3 className="text-sm font-semibold">Reader preferences</h3><p className="mt-1 text-xs text-slate-500">Stored locally until the server exposes a v1 profile-preferences contract.</p></div><label className="flex items-center justify-between gap-3 text-sm"><span>Reading mode</span><select value={prefs.readingMode} onChange={(event) => update('readingMode', event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-transparent px-3 dark:border-slate-700"><option value="page">Page</option><option value="continuous">Continuous</option><option value="webtoon">Webtoon</option></select></label><label className="flex items-center justify-between gap-3 text-sm"><span>Theme</span><select value={prefs.theme} onChange={(event) => update('theme', event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-transparent px-3 dark:border-slate-700"><option value="system">System</option><option value="light">Light</option><option value="sepia">Sepia</option><option value="dark">Dark</option></select></label><label className="flex items-center justify-between gap-3 text-sm"><span>Preferred format</span><select value={prefs.preferredFormat} onChange={(event) => update('preferredFormat', event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-transparent px-3 dark:border-slate-700"><option value="epub">EPUB</option><option value="mobi">MOBI</option><option value="pdf">PDF</option></select></label></section>;
}

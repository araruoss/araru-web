import Header from '../components/Header.jsx';
import ProfileControls from '../components/ProfileControls.jsx';

export default function ProfilesPage() {
  return <><Header /><main className="mx-auto min-h-dvh max-w-3xl px-4 py-8 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[var(--brand-primary)]">Profiles</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Reading profiles</h1><div className="mt-8"><ProfileControls /></div></main></>;
}

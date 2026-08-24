import { Activity, BookOpen, Database, HardDrive, Languages, Library, Palette, Settings, ShieldCheck, Users, UserRound, Workflow } from 'lucide-react';

export const adminNavigation = [
  { key: 'overview', path: '/admin', icon: Activity },
  { key: 'general', path: '/admin/general', icon: Settings },
  { key: 'appearance', path: '/admin/appearance', icon: Palette },
  { key: 'users', path: '/admin/users', icon: Users },
  { key: 'profiles', path: '/admin/profiles', icon: UserRound },
  { key: 'libraries', path: '/admin/libraries', icon: Library },
  { key: 'storage', path: '/admin/storage', icon: HardDrive },
  { key: 'metadata', path: '/admin/metadata', icon: BookOpen },
  { key: 'jobs', path: '/admin/jobs', icon: Workflow },
  { key: 'backup', path: '/admin/backup', icon: Database },
  { key: 'security', path: '/admin/security', icon: ShieldCheck },
  { key: 'system', path: '/admin/system', icon: Languages }
];

import { BookOpen, Database, HardDrive, Languages, Library, Palette, Settings, ShieldCheck, Users, UserRound, Workflow } from 'lucide-react';

// The API is the authorization source of truth. These requirements only shape
// the interface; every admin endpoint still validates access server-side.
export const settingsNavigation = [
  { key: 'general', path: '/admin/general', icon: Settings, permission: 'admin.access', group: 'management' },
  { key: 'users', path: '/admin/users', icon: Users, permission: 'users.read', fallbackPermission: 'admin.access', group: 'management' },
  { key: 'roles', path: '/admin/roles', icon: UserRound, labelKey: 'roles', permission: 'roles.read', fallbackPermission: 'admin.access', group: 'management' },
  { key: 'libraries', path: '/admin/libraries', icon: Library, permission: 'libraries.read', fallbackPermission: 'admin.access', group: 'content' },
  { key: 'storage', path: '/admin/storage', icon: HardDrive, permission: 'storage.read', fallbackPermission: 'admin.access', group: 'content' },
  { key: 'metadata', path: '/admin/metadata', icon: BookOpen, permission: 'metadata.read', fallbackPermission: 'admin.access', group: 'content' },
  { key: 'jobs', path: '/admin/jobs', icon: Workflow, permission: 'jobs.read', fallbackPermission: 'admin.access', group: 'system' },
  { key: 'backup', path: '/admin/backup', icon: Database, permission: 'backup.read', fallbackPermission: 'admin.access', group: 'system' },
  { key: 'security', path: '/admin/security', icon: ShieldCheck, permission: 'security.read', fallbackPermission: 'admin.access', group: 'system' },
  { key: 'system', path: '/admin/system', icon: Languages, permission: 'system.read', fallbackPermission: 'admin.access', group: 'system' }
];

export const personalNavigation = [
  { key: 'account', path: '/settings', icon: UserRound, group: 'personal' },
  { key: 'appearance', path: '/settings/appearance', icon: Palette, group: 'personal' },
  { key: 'reading', path: '/settings/reading', icon: BookOpen, group: 'personal' }
];

export const canAccess = (item, permissions = []) => {
  const granted = new Set(permissions);
  return !item.permission || granted.has(item.permission) || (item.fallbackPermission && granted.has(item.fallbackPermission));
};

export const adminNavigation = settingsNavigation;

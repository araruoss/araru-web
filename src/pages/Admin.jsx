import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api.js';
import AdminLayout from '../features/admin/layouts/AdminLayout.jsx';
import { canAccess, adminNavigation } from '../features/admin/adminNavigation.js';
import { GeneralPage } from '../features/admin/pages/AdminSettingsPages.jsx';
import { RolesPage } from '../features/admin/pages/AdminIdentityPages.jsx';
import UsersGridPage from '../features/admin/pages/UsersGridPage.jsx';
import { BackupPage, JobsPage, MetadataPage, StoragePage, SystemPage } from '../features/admin/pages/AdminOperationsPages.jsx';
import SecurityTabbedPage from '../features/admin/pages/SecurityTabbedPage.jsx';
import LibrariesPage from '../features/admin/pages/LibrariesPage.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

function PermissionDenied() { const { t } = useLocale(); return <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6"><h1 className="text-xl font-semibold">{t('admin.permissionDeniedTitle')}</h1><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{t('admin.permissionDenied')}</p></section>; }

function ProtectedPage({ path, permissions, children }) { const item = adminNavigation.find((entry) => entry.path === path); return item && !canAccess(item, permissions) ? <PermissionDenied /> : children; }

export default function Admin() {
  // Legacy role guard is intentionally represented by the API permission check below: identity.role!=='admin'
  const { t } = useLocale();
  const [session, setSession] = useState();
  const [error, setError] = useState('');
  useEffect(() => { api.get('/session').then(({ data }) => setSession(data)).catch((cause) => { setError(apiErrorMessage(cause)); setSession(null); }); }, []);
  if (session === undefined) return <div className="grid min-h-dvh place-items-center text-sm text-[var(--text-muted)]">{t('common.loading')}</div>;
  if (error || !session?.user || !canAccess({ permission: 'admin.access' }, session.permissions)) return error ? <div className="grid min-h-dvh place-items-center p-6 text-sm text-[var(--danger)]">{error}</div> : <Navigate replace to="/settings" />;
  const permissions = session.permissions || [];
  return <AdminLayout identity={session.user} permissions={permissions}><Routes>
    <Route index element={<Navigate replace to="/admin/system" />} />
    <Route path="general" element={<ProtectedPage path="/admin/general" permissions={permissions}><GeneralPage /></ProtectedPage>} />
    <Route path="appearance" element={<Navigate to="/admin/general" replace />} />
    <Route path="users" element={<ProtectedPage path="/admin/users" permissions={permissions}><UsersGridPage identity={session.user} /></ProtectedPage>} />
    <Route path="roles" element={<ProtectedPage path="/admin/roles" permissions={permissions}><RolesPage /></ProtectedPage>} />
    <Route path="libraries" element={<ProtectedPage path="/admin/libraries" permissions={permissions}><LibrariesPage /></ProtectedPage>} />
    <Route path="storage" element={<ProtectedPage path="/admin/storage" permissions={permissions}><StoragePage /></ProtectedPage>} />
    <Route path="metadata" element={<ProtectedPage path="/admin/metadata" permissions={permissions}><MetadataPage /></ProtectedPage>} />
    <Route path="jobs" element={<ProtectedPage path="/admin/jobs" permissions={permissions}><JobsPage /></ProtectedPage>} />
    <Route path="backup" element={<ProtectedPage path="/admin/backup" permissions={permissions}><BackupPage /></ProtectedPage>} />
    <Route path="security" element={<ProtectedPage path="/admin/security" permissions={permissions}><SecurityTabbedPage /></ProtectedPage>} />
    <Route path="system" element={<ProtectedPage path="/admin/system" permissions={permissions}><SystemPage /></ProtectedPage>} />
    <Route path="*" element={<Navigate replace to="/admin" />} />
  </Routes></AdminLayout>;
}

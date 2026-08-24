import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from '../lib/api.js';
import AdminLayout from '../features/admin/layouts/AdminLayout.jsx';
import { AppearancePage, GeneralPage } from '../features/admin/pages/AdminSettingsPages.jsx';
import { ProfilesPage, UsersPage } from '../features/admin/pages/AdminIdentityPages.jsx';
import { BackupPage, JobsPage, LibrariesPage, MetadataPage, OverviewPage, SecurityPage, StoragePage, SystemPage } from '../features/admin/pages/AdminOperationsPages.jsx';

export default function Admin(){const[identity,setIdentity]=useState(undefined);useEffect(()=>{api.get('/auth/me').then(({data})=>setIdentity(data.user)).catch(()=>setIdentity(null));},[]);if(identity===undefined)return <div className="grid min-h-dvh place-items-center text-sm text-slate-500">Carregando…</div>;if(!identity||identity.role!=='admin')return <Navigate replace to="/"/>;return <AdminLayout identity={identity}><Routes><Route index element={<OverviewPage/>}/><Route path="general" element={<GeneralPage/>}/><Route path="appearance" element={<AppearancePage/>}/><Route path="users" element={<UsersPage identity={identity}/>}/><Route path="profiles" element={<ProfilesPage/>}/><Route path="libraries" element={<LibrariesPage/>}/><Route path="storage" element={<StoragePage/>}/><Route path="metadata" element={<MetadataPage/>}/><Route path="jobs" element={<JobsPage/>}/><Route path="backup" element={<BackupPage/>}/><Route path="security" element={<SecurityPage/>}/><Route path="system" element={<SystemPage/>}/><Route path="*" element={<Navigate replace to="/admin"/>}/></Routes></AdminLayout>}

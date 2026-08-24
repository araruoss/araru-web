import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { apiFetch, apiUrl } from '../lib/api.js';

export default function BackupControls() {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function restore(file) {
    if (!file) return;
    setBusy(true);
    setStatus('Verificando backup…');
    try {
      const verification = await apiFetch('/backup/verify', { method:'POST',headers:{'Content-Type':'application/gzip'},body:file });
      const verificationData=await verification.json(); if(!verification.ok)throw new Error(verificationData.message||'Backup inválido.');
      if (!window.confirm(`Backup íntegro (schema ${verificationData.data.schemaVersion}). Restaurar e substituir os dados atuais?`)) return;
      setStatus('Restaurando backup…');
      const response = await apiFetch('/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/gzip', 'X-Confirm-Restore': 'RESTORE' },
        body: file
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha ao restaurar backup.');
      setStatus('Backup restaurado. Recarregando…');
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <a href={apiUrl('/backup')} download className="category-panel-item">
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold">Exportar backup</span>
          <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">Metadados, progresso, índice e configurações</span>
        </span>
        <Download className="h-4 w-4 shrink-0 opacity-50" />
      </a>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="category-panel-item w-full disabled:opacity-50">
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold">Restaurar backup</span>
          <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">Substitui os dados persistidos após confirmação</span>
        </span>
        <Upload className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      <input ref={inputRef} type="file" accept=".gz,application/gzip" className="hidden" onChange={(event) => restore(event.target.files?.[0])} />
      {status && <p role="status" className="px-2 text-xs text-slate-500 dark:text-slate-400">{status}</p>}
    </div>
  );
}

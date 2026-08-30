import { ArrowLeft, LoaderCircle, Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export default function SearchInput({ inputRef, value, onChange, onKeyDown, onClose, onClear, placeholder, clearLabel, closeLabel, searching, resultsId, activeDescendant }) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return <div className="search-input-shell">
    <Button type="button" variant="icon" size="icon" className="search-input__mobile-close" onClick={onClose} aria-label={closeLabel}>
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    </Button>
    {searching ? <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-info" aria-hidden="true" /> : <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />}
    <Input ref={inputRef} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} aria-label={placeholder} aria-controls={resultsId} aria-expanded="true" aria-activedescendant={activeDescendant || undefined} role="combobox" autoComplete="off" spellCheck="false" className="search-input" />
    {!value && <kbd className="search-input__shortcut" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>}
    <Button type="button" variant="icon" size="icon" className="search-input__clear" onClick={value ? onClear : onClose} aria-label={value ? clearLabel : closeLabel}>
      <X className="h-4 w-4" aria-hidden="true" />
    </Button>
  </div>;
}

import { AlertCircle, Search } from 'lucide-react';
import { Button } from '../ui/button';

export default function SearchEmptyState({ state, message, retryLabel, onRetry }) {
  const isError = state === 'error';
  return <div className="search-empty" role={isError ? 'alert' : undefined} aria-live="polite">
    {isError ? <AlertCircle className="h-5 w-5 text-danger" aria-hidden="true" /> : <Search className="h-5 w-5 text-muted" aria-hidden="true" />}
    <p>{message}</p>
    {isError && onRetry && <Button type="button" variant="ghost" size="sm" onClick={onRetry}>{retryLabel}</Button>}
  </div>;
}

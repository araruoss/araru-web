import { X } from 'lucide-react';
import { Sheet, SheetContent } from './ui/sheet';
import { Button } from './ui/button';

export default function SlidingPanel({ open, title, onClose, children, side = 'right' }) {
  return <Sheet.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.(); }}><SheetContent side={side}><div className="mb-6 flex items-center justify-between gap-3"><Sheet.Title className="text-heading-sm font-semibold text-primary">{title}</Sheet.Title><Sheet.Close render={<Button type="button" variant="ghost" size="icon" aria-label="Close" />}><X className="h-4 w-4" /></Sheet.Close></div>{children}</SheetContent></Sheet.Root>;
}

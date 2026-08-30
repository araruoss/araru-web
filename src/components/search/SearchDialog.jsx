import { Dialog, DialogContent } from '../ui/dialog';

export default function SearchDialog({ open, onOpenChange, title, children }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <DialogContent backdropClassName="search-dialog-backdrop" className="search-dialog w-[min(92vw,680px)] max-w-none p-3 sm:p-4">
      <Dialog.Title className="sr-only">{title}</Dialog.Title>
      {children}
    </DialogContent>
  </Dialog.Root>;
}

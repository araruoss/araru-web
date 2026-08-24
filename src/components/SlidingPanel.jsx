import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function SlidingPanel({ open, title, onClose, children, side = 'right' }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.aside
          initial={{ x: side === 'right' ? 36 : -36, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: side === 'right' ? 36 : -36, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className={`absolute inset-y-0 w-full max-w-[420px] overflow-y-auto bg-[rgba(250,249,245,0.98)] p-5 shadow-2xl dark:bg-[rgba(18,20,24,0.98)] sm:p-6 ${side === 'right' ? 'right-0 border-l border-slate-200 dark:border-slate-800' : 'left-0 border-r border-slate-200 dark:border-slate-800'}`}
          onClick={(event) => event.stopPropagation()}
          onPanEnd={(_, info) => {
            const deslocamentoParaFechar = side === 'left' ? info.offset.x < -72 : info.offset.x > 72;
            if (deslocamentoParaFechar) onClose();
          }}
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                Biblioteca
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="quiet-action grid h-10 w-10 place-items-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Fechar painel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

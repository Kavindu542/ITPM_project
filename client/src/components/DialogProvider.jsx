import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { registerDialogOpen, unregisterDialogOpen } from '../lib/dialog';

export default function DialogProvider({ children }) {
  const [dialog, setDialog] = React.useState(null);
  const inputRef = React.useRef(null);
  const [promptValue, setPromptValue] = React.useState('');

  const close = React.useCallback((result) => {
    const r = dialog?.resolve;
    setDialog(null);
    setPromptValue('');
    r?.(result);
  }, [dialog?.resolve]);

  React.useEffect(() => {
    registerDialogOpen((payload) => {
      setPromptValue(payload.defaultValue ?? '');
      setDialog(payload);
    });
    return () => unregisterDialogOpen();
  }, []);

  React.useEffect(() => {
    if (dialog?.kind === 'prompt' && inputRef.current) {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select?.();
      }, 50);
      return () => window.clearTimeout(t);
    }
  }, [dialog]);

  React.useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(dialog.kind === 'confirm' ? false : null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  const portal =
    typeof document !== 'undefined' && dialog
      ? createPortal(
          <div
            className="fixed inset-0 z-[10060] flex items-center justify-center p-4"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              aria-label="Close dialog"
              onClick={() => close(dialog.kind === 'confirm' ? false : null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-dialog-title"
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-2xl ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  {dialog.kind === 'confirm' ? (
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        dialog.variant === 'danger'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h2 id="app-dialog-title" className="text-lg font-bold leading-tight">
                      {dialog.title || (dialog.kind === 'prompt' ? 'Enter value' : 'Confirm')}
                    </h2>
                    {dialog.message ? (
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{dialog.message}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {dialog.kind === 'prompt' ? (
                <div className="px-5 py-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    placeholder={dialog.placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        close(promptValue);
                      }
                    }}
                  />
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-800/50">
                <button
                  type="button"
                  className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => close(dialog.kind === 'confirm' ? false : null)}
                >
                  {dialog.cancelText}
                </button>
                <button
                  type="button"
                  className={`inline-flex min-h-[2.75rem] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                    dialog.variant === 'danger'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                  }`}
                  onClick={() =>
                    close(dialog.kind === 'confirm' ? true : promptValue)
                  }
                >
                  {dialog.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {children}
      {portal}
    </>
  );
}

import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { registerToastEmit, unregisterToastEmit } from '../lib/toast';

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ACCENTS = {
  success: {
    bar: 'bg-emerald-500',
    iconWrap: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  error: {
    bar: 'bg-rose-500',
    iconWrap: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
  info: {
    bar: 'bg-blue-500',
    iconWrap: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
};

function ToastItem({ item, onDismiss }) {
  const Icon = ICONS[item.type] || Info;
  const accent = ACCENTS[item.type] || ACCENTS.info;

  React.useEffect(() => {
    const t = window.setTimeout(() => onDismiss(item.id), item.duration);
    return () => window.clearTimeout(t);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-[min(100%,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-md animate-toast-in dark:border-slate-600/80 dark:bg-slate-900/95 dark:text-slate-100 dark:ring-white/10 sm:w-[min(100%,24rem)]"
    >
      <div className="flex min-w-0 flex-1">
        <div className={`w-1 shrink-0 self-stretch ${accent.bar}`} aria-hidden />
        <div className="flex min-w-0 flex-1 items-start gap-3 p-3.5 pr-2">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.iconWrap}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-snug">{item.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        className={`toast-progress h-0.5 w-full origin-left ${accent.bar} opacity-80`}
        style={{ animationDuration: `${item.duration}ms` }}
      />
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [items, setItems] = React.useState([]);

  const onDismiss = React.useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  React.useEffect(() => {
    registerToastEmit((payload) => {
      setItems((prev) => [...prev.slice(-4), payload]);
    });
    return () => unregisterToastEmit();
  }, []);

  const portal =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[10050] flex flex-col items-end gap-3 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:p-5"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {items.map((item) => (
              <ToastItem key={item.id} item={item} onDismiss={onDismiss} />
            ))}
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

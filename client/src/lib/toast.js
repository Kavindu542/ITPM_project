let emitToasts = null;

export function registerToastEmit(fn) {
  emitToasts = fn;
}

export function unregisterToastEmit() {
  emitToasts = null;
}

function nextId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function show(type, message, options = {}) {
  const msg = message == null ? '' : String(message);
  if (!msg.trim()) return;
  const duration =
    options.duration ??
    (type === 'error' ? 6500 : type === 'info' ? 4200 : 4800);
  emitToasts?.({
    id: nextId(),
    type,
    message: msg,
    duration,
  });
}

export const toast = {
  success: (message, options) => show('success', message, options),
  error: (message, options) => show('error', message, options),
  info: (message, options) => show('info', message, options),
};

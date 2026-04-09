let openDialogFn = null;

export function registerDialogOpen(fn) {
  openDialogFn = fn;
}

export function unregisterDialogOpen() {
  openDialogFn = null;
}

/**
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {string} opts.message
 * @param {string} [opts.confirmText]
 * @param {string} [opts.cancelText]
 * @param {'danger'|'primary'} [opts.variant] — danger = red confirm, primary = blue
 * @returns {Promise<boolean>} true if confirmed, false if cancelled
 */
export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    openDialogFn?.({
      kind: 'confirm',
      title: opts.title || 'Confirm',
      message: String(opts.message || ''),
      confirmText: opts.confirmText || 'OK',
      cancelText: opts.cancelText || 'Cancel',
      variant: opts.variant === 'danger' ? 'danger' : 'primary',
      resolve,
    });
  });
}

/**
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {string} opts.message — label / question above the field
 * @param {string} [opts.defaultValue]
 * @param {string} [opts.placeholder]
 * @param {string} [opts.confirmText]
 * @param {string} [opts.cancelText]
 * @returns {Promise<string | null>} entered text, or null if cancelled
 */
export function promptDialog(opts = {}) {
  return new Promise((resolve) => {
    openDialogFn?.({
      kind: 'prompt',
      title: opts.title || '',
      message: String(opts.message || ''),
      defaultValue: opts.defaultValue != null ? String(opts.defaultValue) : '',
      placeholder: opts.placeholder != null ? String(opts.placeholder) : '',
      confirmText: opts.confirmText || 'OK',
      cancelText: opts.cancelText || 'Cancel',
      resolve,
    });
  });
}

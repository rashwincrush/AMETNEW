// Lightweight logging helper with collapsible groups
export const log = {
  ok: (...a) => console.debug('[OK]', ...a),
  info: (...a) => console.debug('[INFO]', ...a),
  warn: (...a) => console.warn('[WARN]', ...a),
  err: (...a) => console.error('[ERR]', ...a),
  group(label, obj) {
    try {
      console.groupCollapsed(label);
      // Show shallow object snapshot to avoid massive logs
      console.debug(obj);
      console.groupEnd();
    } catch (_) {
      console.debug(label, obj);
    }
  }
};

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

export function extractErrorMessage(err: unknown, fallback = 'Error inesperado'): string {
  if (isObject(err)) {
    const nested = getString(err, 'error');
    if (nested) return nested;

    if (typeof err['error'] === 'object' && err['error'] !== null) {
      const errObj = err['error'] as Record<string, unknown>;
      const msg = getString(errObj, 'error');
      if (msg) return msg;

      if (Array.isArray(errObj['details']) && errObj['details'].length > 0) {
        const first = errObj['details'][0];
        if (isObject(first)) {
          const detailMsg = getString(first, 'message');
          if (detailMsg) return detailMsg;
        }
      }
    }

    const msg = getString(err, 'message');
    if (msg) return msg;
  }

  return fallback;
}

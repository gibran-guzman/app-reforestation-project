export function extractErrorMessage(err: unknown, fallback = 'Error inesperado'): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const e = (err as { error: unknown }).error;
    if (typeof e === 'string') return e;
    if (e && typeof e === 'object') {
      const obj = e as Record<string, unknown>;
      if (typeof obj['error'] === 'string') return obj['error'];
      if (Array.isArray(obj['details']) && obj['details'].length > 0) {
        const first = obj['details'][0];
        if (first && typeof first === 'object' && typeof (first as Record<string, unknown>)['message'] === 'string') {
          return (first as Record<string, unknown>)['message'] as string;
        }
      }
    }
  }
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

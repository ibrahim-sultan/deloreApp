export const TZ = 'America/Toronto';

export function formatDate(dateLike) {
  if (!dateLike) return '-';
  try {
    const d = new Date(dateLike);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric', month: 'short', day: '2-digit'
    }).format(d);
  } catch {
    return '-';
  }
}

export function formatDateTime(dateLike) {
  if (!dateLike) return '-';
  try {
    const d = new Date(dateLike);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  } catch {
    return '-';
  }
}

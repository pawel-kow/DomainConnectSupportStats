/**
 * Display of the settings and support statuses (EXPORT_FORMAT.md `settings_status`,
 * `support_status`). Neutral wording: a status describes the last attempt, not the provider.
 * New status values may appear without a format bump and are shown verbatim.
 */

const LABELS: Record<string, string> = {
  ok: 'OK',
  http_error: 'HTTP error',
  connection_error: 'Connection error',
  error: 'Unusable answer',
  dead: 'Given up',
};

export type StatusTone = 'ok' | 'warn' | 'error' | 'neutral';

const TONES: Record<string, StatusTone> = {
  ok: 'ok',
  http_error: 'warn',
  connection_error: 'warn',
  error: 'warn',
  dead: 'error',
};

export function statusLabel(status: string | null | undefined): string {
  if (status === null || status === undefined) return 'Not checked yet';
  return LABELS[status] ?? status;
}

export function statusTone(status: string | null | undefined): StatusTone {
  return (status && TONES[status]) || 'neutral';
}

import { describe, expect, it } from 'vitest';
import { statusLabel, statusTone } from '../../src/lib/status';

describe('statusLabel', () => {
  it('names the contract statuses', () => {
    expect(statusLabel('ok')).toBe('OK');
    expect(statusLabel('http_error')).toBe('HTTP error');
    expect(statusLabel('connection_error')).toBe('Connection error');
    expect(statusLabel('error')).toBe('Unusable answer');
    expect(statusLabel('dead')).toBe('Given up');
  });

  it('shows a new status verbatim and null as unknown', () => {
    expect(statusLabel('rate_limited')).toBe('rate_limited');
    expect(statusLabel(null)).toBe('Not checked yet');
  });
});

describe('statusTone', () => {
  it('maps statuses to badge tones', () => {
    expect(statusTone('ok')).toBe('ok');
    expect(statusTone('connection_error')).toBe('warn');
    expect(statusTone('http_error')).toBe('warn');
    expect(statusTone('error')).toBe('warn');
    expect(statusTone('dead')).toBe('error');
    expect(statusTone('rate_limited')).toBe('neutral');
    expect(statusTone(null)).toBe('neutral');
  });
});

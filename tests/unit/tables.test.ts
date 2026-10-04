import { describe, expect, it } from 'vitest';
import { findTable, oneRecord } from '../../src/lib/data/tables';
import { exampleJson } from '../fixtures';

describe('findTable', () => {
  it('finds a table by its id', () => {
    const overview = exampleJson('overview.json');
    expect(findTable(overview, 'adoption')?.rows.length).toBeGreaterThan(0);
  });

  it('finds a template card table by the suffix after the last slash', () => {
    const card = exampleJson('templates/mail.acme.example/mail.json');
    expect(findTable(card, 'metadata')).toBe(card.tables['mail.acme.example/mail/metadata']);
    expect(findTable(card, 'supporters')).toBe(card.tables['mail.acme.example/mail/supporters']);
  });

  it('returns undefined for an absent table and ignores unknown extra tables', () => {
    const overview = exampleJson('overview.json');
    overview.tables['future_table'] = { title: 'New', columns: [], rows: [], footer: null };
    expect(findTable(overview, 'missing')).toBeUndefined();
    expect(findTable(overview, 'ecosystem')).toBeDefined();
  });
});

describe('oneRecord', () => {
  it('reads a one-record table as rows[0]', () => {
    const stack = exampleJson('stacks/plesk.com.json');
    expect(oneRecord(findTable(stack, 'stack'))?.provider_id).toBe('plesk.com');
    expect(oneRecord(undefined)).toBeUndefined();
  });
});

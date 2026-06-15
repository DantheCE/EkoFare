import { describe, it, expect } from 'vitest';
import { formatRelative } from './datetime';

const base = Date.parse('2026-06-08T12:00:00Z');

describe('formatRelative', () => {
  it('handles just now and minutes', () => {
    expect(formatRelative('2026-06-08T11:59:30Z', base)).toBe('just now');
    expect(formatRelative('2026-06-08T11:45:00Z', base)).toBe('15 min ago');
  });
  it('handles hours and days with pluralisation', () => {
    expect(formatRelative('2026-06-08T11:00:00Z', base)).toBe('1 hour ago');
    expect(formatRelative('2026-06-08T09:00:00Z', base)).toBe('3 hours ago');
    expect(formatRelative('2026-06-07T12:00:00Z', base)).toBe('1 day ago');
    expect(formatRelative('2026-06-06T12:00:00Z', base)).toBe('2 days ago');
  });
  it('handles weeks and months', () => {
    expect(formatRelative('2026-05-25T12:00:00Z', base)).toBe('2 weeks ago');
    expect(formatRelative('2026-04-08T12:00:00Z', base)).toBe('2 months ago');
  });
  it('returns empty string for an invalid date', () => {
    expect(formatRelative('not-a-date', base)).toBe('');
  });
});

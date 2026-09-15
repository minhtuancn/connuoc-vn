import { LunarCalendarError } from './errors.js';

const EXPLICIT_ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;

export function parseExplicitInstant(value: string): number {
  if (!EXPLICIT_ISO_INSTANT.test(value)) {
    throw new LunarCalendarError('INVALID_SOLAR_DATE', 'Expected an ISO-8601 instant with an explicit offset');
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new LunarCalendarError('INVALID_SOLAR_DATE', 'Invalid ISO-8601 instant');
  }
  return timestamp;
}

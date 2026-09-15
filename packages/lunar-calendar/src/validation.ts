import { LunarCalendarError } from './errors.js';
import type { LunarDate, SolarDate } from './types.js';
import { SUPPORTED_SOLAR_YEAR_MAX, SUPPORTED_SOLAR_YEAR_MIN } from './types.js';

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new LunarCalendarError('INVALID_SOLAR_DATE', `${label} must be an integer`);
  }
}

export function validateSolarDate(date: SolarDate): void {
  assertInteger(date.year, 'year');
  assertInteger(date.month, 'month');
  assertInteger(date.day, 'day');
  if (date.year < SUPPORTED_SOLAR_YEAR_MIN || date.year > SUPPORTED_SOLAR_YEAR_MAX) {
    throw new LunarCalendarError(
      'UNSUPPORTED_YEAR',
      `Solar year must be between ${SUPPORTED_SOLAR_YEAR_MIN} and ${SUPPORTED_SOLAR_YEAR_MAX}`,
    );
  }
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > 31) {
    throw new LunarCalendarError('INVALID_SOLAR_DATE', 'Solar month/day is outside calendar bounds');
  }

  const utcDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
  if (
    utcDate.getUTCFullYear() !== date.year ||
    utcDate.getUTCMonth() !== date.month - 1 ||
    utcDate.getUTCDate() !== date.day
  ) {
    throw new LunarCalendarError('INVALID_SOLAR_DATE', 'Solar date does not exist');
  }
}

export function validateLunarDateShape(date: LunarDate): void {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) {
    throw new LunarCalendarError('INVALID_LUNAR_DATE', 'Lunar year/month/day must be integers');
  }
  if (date.year < SUPPORTED_SOLAR_YEAR_MIN || date.year > SUPPORTED_SOLAR_YEAR_MAX) {
    throw new LunarCalendarError(
      'UNSUPPORTED_YEAR',
      `Lunar year must be between ${SUPPORTED_SOLAR_YEAR_MIN} and ${SUPPORTED_SOLAR_YEAR_MAX}`,
    );
  }
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > 30) {
    throw new LunarCalendarError('INVALID_LUNAR_DATE', 'Lunar month/day is outside calendar bounds');
  }
}

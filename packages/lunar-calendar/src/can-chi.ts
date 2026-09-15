import { julianDayFromDate } from './astronomy.js';
import { solarToLunar } from './convert.js';
import type { SolarDate } from './types.js';
import { validateSolarDate } from './validation.js';

export const HEAVENLY_STEMS = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const;

export const EARTHLY_BRANCHES = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const;

export interface CanChi {
  readonly stemIndex: number;
  readonly branchIndex: number;
  readonly stem: (typeof HEAVENLY_STEMS)[number];
  readonly branch: (typeof EARTHLY_BRANCHES)[number];
  readonly label: string;
}

export interface CalendarCanChi {
  readonly year: CanChi;
  readonly month: CanChi;
  readonly day: CanChi;
}

function canChi(stemIndex: number, branchIndex: number): CanChi {
  const normalizedStem = ((stemIndex % 10) + 10) % 10;
  const normalizedBranch = ((branchIndex % 12) + 12) % 12;
  const stem = HEAVENLY_STEMS[normalizedStem]!;
  const branch = EARTHLY_BRANCHES[normalizedBranch]!;
  return { stemIndex: normalizedStem, branchIndex: normalizedBranch, stem, branch, label: `${stem} ${branch}` };
}

export function getYearCanChi(lunarYear: number): CanChi {
  return canChi(lunarYear + 6, lunarYear + 8);
}

/**
 * Traditional lunar-month Can Chi. Leap months repeat the same month number and
 * therefore the same month Can Chi as the corresponding regular month.
 */
export function getMonthCanChi(lunarYear: number, lunarMonth: number): CanChi {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError('lunarMonth must be an integer from 1 to 12');
  }
  const yearStem = ((lunarYear + 6) % 10 + 10) % 10;
  const stem = (yearStem % 5) * 2 + lunarMonth + 1;
  const branch = lunarMonth + 1;
  return canChi(stem, branch);
}

/** Day Can Chi from the proleptic Gregorian date's integral Julian day number. */
export function getDayCanChi(solarDate: SolarDate): CanChi {
  validateSolarDate(solarDate);
  const jdn = julianDayFromDate(solarDate.day, solarDate.month, solarDate.year);
  return canChi(jdn + 9, jdn + 1);
}

export function getCalendarCanChi(solarDate: SolarDate): CalendarCanChi {
  validateSolarDate(solarDate);
  const lunar = solarToLunar(solarDate);
  return {
    year: getYearCanChi(lunar.year),
    month: getMonthCanChi(lunar.year, lunar.month),
    day: getDayCanChi(solarDate),
  };
}

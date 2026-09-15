import {
  dateFromJulianDay,
  julianDayFromDate,
  leapMonthOffset,
  lunarMonth11,
  lunationIndex,
  month11LunationIndex,
  newMoonDay,
} from './astronomy.js';
import { LunarCalendarError } from './errors.js';
import type { LunarDate, SolarDate } from './types.js';
import { VIETNAM_LUNAR_UTC_OFFSET_HOURS } from './types.js';
import { validateLunarDateShape, validateSolarDate } from './validation.js';

function solarToLunarUnchecked(date: SolarDate): LunarDate {
  const timeZone = VIETNAM_LUNAR_UTC_OFFSET_HOURS;
  const dayNumber = julianDayFromDate(date.day, date.month, date.year);
  const k = lunationIndex(dayNumber);
  let monthStart = newMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = newMoonDay(k, timeZone);
  }

  let month11A = lunarMonth11(date.year, timeZone);
  let month11B = month11A;
  let lunarYear: number;

  if (month11A >= monthStart) {
    lunarYear = date.year;
    month11A = lunarMonth11(date.year - 1, timeZone);
  } else {
    lunarYear = date.year + 1;
    month11B = lunarMonth11(date.year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - month11A) / 29);
  let lunarMonth = diff + 11;
  let isLeapMonth = false;

  if (month11B - month11A > 365) {
    const leapDiff = leapMonthOffset(month11A, timeZone);
    if (diff >= leapDiff) {
      lunarMonth = diff + 10;
      if (diff === leapDiff) {
        isLeapMonth = true;
      }
    }
  }

  if (lunarMonth > 12) {
    lunarMonth -= 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }

  return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeapMonth };
}

function lunarToSolarUnchecked(date: LunarDate): SolarDate {
  const timeZone = VIETNAM_LUNAR_UTC_OFFSET_HOURS;
  let month11A: number;
  let month11B: number;

  if (date.month < 11) {
    month11A = lunarMonth11(date.year - 1, timeZone);
    month11B = lunarMonth11(date.year, timeZone);
  } else {
    month11A = lunarMonth11(date.year, timeZone);
    month11B = lunarMonth11(date.year + 1, timeZone);
  }

  const k = month11LunationIndex(month11A);
  let offset = date.month - 11;
  if (offset < 0) {
    offset += 12;
  }

  if (month11B - month11A > 365) {
    const leapOffset = leapMonthOffset(month11A, timeZone);
    let leapMonth = leapOffset - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }

    if (date.isLeapMonth && date.month !== leapMonth) {
      throw new LunarCalendarError(
        'INVALID_LEAP_MONTH',
        `Lunar year ${date.year} does not have leap month ${date.month}`,
      );
    }
    if (date.isLeapMonth || offset >= leapOffset) {
      offset += 1;
    }
  } else if (date.isLeapMonth) {
    throw new LunarCalendarError('INVALID_LEAP_MONTH', `Lunar year ${date.year} has no leap month`);
  }

  const monthStart = newMoonDay(k + offset, timeZone);
  const solar = dateFromJulianDay(monthStart + date.day - 1);
  return { year: solar.year, month: solar.month, day: solar.day };
}

/** Convert Gregorian date to the Vietnamese lunar calendar using UTC+07 calculation rules. */
export function solarToLunar(date: SolarDate): LunarDate {
  validateSolarDate(date);
  return solarToLunarUnchecked(date);
}

/**
 * Convert Vietnamese lunar date to Gregorian date.
 * Impossible day/leap-month combinations are rejected by a conversion round trip.
 */
export function lunarToSolar(date: LunarDate): SolarDate {
  validateLunarDateShape(date);
  const solar = lunarToSolarUnchecked(date);
  validateSolarDate(solar);
  const roundTrip = solarToLunarUnchecked(solar);

  if (
    roundTrip.year !== date.year ||
    roundTrip.month !== date.month ||
    roundTrip.day !== date.day ||
    roundTrip.isLeapMonth !== date.isLeapMonth
  ) {
    throw new LunarCalendarError('INVALID_LUNAR_DATE', 'Lunar date does not exist in the Vietnamese calendar');
  }
  return solar;
}

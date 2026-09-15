const PI2 = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
export const SYNODIC_MONTH_DAYS = 29.530588853;
export const NEW_MOON_REFERENCE_JD = 2_415_020.75933;
const NEW_MOON_INDEX_REFERENCE_JD = 2_415_021.076998695;

export function julianDayFromDate(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  if (jd < 2_299_161) {
    jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32_083;
  }
  return jd;
}

export function dateFromJulianDay(jd: number): { day: number; month: number; year: number } {
  let b: number;
  let c: number;
  if (jd > 2_299_160) {
    const a = jd + 32_044;
    b = Math.floor((4 * a + 3) / 146_097);
    c = a - Math.floor((b * 146_097) / 4);
  } else {
    b = 0;
    c = jd + 32_082;
  }

  const d = Math.floor((4 * c + 3) / 1_461);
  const e = c - Math.floor((1_461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return { day, month, year };
}

export function julianDateFromUnixMilliseconds(timestampMs: number): number {
  return timestampMs / 86_400_000 + 2_440_587.5;
}

export function newMoonJulianDate(k: number): number {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  let jd = 2_415_020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  jd += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * DEG_TO_RAD);

  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;

  let correction = (0.1734 - 0.000393 * t) * Math.sin(m * DEG_TO_RAD);
  correction += 0.0021 * Math.sin(2 * m * DEG_TO_RAD);
  correction -= 0.4068 * Math.sin(mPrime * DEG_TO_RAD);
  correction += 0.0161 * Math.sin(2 * mPrime * DEG_TO_RAD);
  correction -= 0.0004 * Math.sin(3 * mPrime * DEG_TO_RAD);
  correction += 0.0104 * Math.sin(2 * f * DEG_TO_RAD);
  correction -= 0.0051 * Math.sin((m + mPrime) * DEG_TO_RAD);
  correction -= 0.0074 * Math.sin((m - mPrime) * DEG_TO_RAD);
  correction += 0.0004 * Math.sin((2 * f + m) * DEG_TO_RAD);
  correction -= 0.0004 * Math.sin((2 * f - m) * DEG_TO_RAD);
  correction -= 0.0006 * Math.sin((2 * f + mPrime) * DEG_TO_RAD);
  correction += 0.001 * Math.sin((2 * f - mPrime) * DEG_TO_RAD);
  correction += 0.0005 * Math.sin((2 * mPrime + m) * DEG_TO_RAD);

  const deltaT =
    t < -11
      ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
      : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return jd + correction - deltaT;
}

export function newMoonDay(k: number, timeZoneHours: number): number {
  return Math.floor(newMoonJulianDate(k) + 0.5 + timeZoneHours / 24);
}

export function sunLongitudeRadians(julianDate: number): number {
  const t = (julianDate - 2_451_545) / 36_525;
  const t2 = t * t;
  const meanAnomaly = 357.5291 + 35_999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const meanLongitude = 280.46645 + 36_000.76983 * t + 0.0003032 * t2;
  let delta = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(meanAnomaly * DEG_TO_RAD);
  delta += (0.019993 - 0.000101 * t) * Math.sin(2 * meanAnomaly * DEG_TO_RAD);
  delta += 0.00029 * Math.sin(3 * meanAnomaly * DEG_TO_RAD);

  let longitude = (meanLongitude + delta) * DEG_TO_RAD;
  longitude -= PI2 * Math.floor(longitude / PI2);
  return longitude;
}

export function sunLongitudeDegrees(julianDate: number): number {
  return (sunLongitudeRadians(julianDate) / Math.PI) * 180;
}

export function sunLongitudeSector(dayNumber: number, timeZoneHours: number): number {
  return Math.floor((sunLongitudeRadians(dayNumber - 0.5 - timeZoneHours / 24) / Math.PI) * 6);
}

export function lunarMonth11(year: number, timeZoneHours: number): number {
  const offset = julianDayFromDate(31, 12, year) - 2_415_021;
  const k = Math.floor(offset / SYNODIC_MONTH_DAYS);
  let moon = newMoonDay(k, timeZoneHours);
  if (sunLongitudeSector(moon, timeZoneHours) >= 9) {
    moon = newMoonDay(k - 1, timeZoneHours);
  }
  return moon;
}

export function leapMonthOffset(month11: number, timeZoneHours: number): number {
  const k = Math.floor(0.5 + (month11 - NEW_MOON_INDEX_REFERENCE_JD) / SYNODIC_MONTH_DAYS);
  let last = 0;
  let index = 1;
  let arc = sunLongitudeSector(newMoonDay(k + index, timeZoneHours), timeZoneHours);

  do {
    last = arc;
    index += 1;
    arc = sunLongitudeSector(newMoonDay(k + index, timeZoneHours), timeZoneHours);
  } while (arc !== last && index < 14);

  return index - 1;
}

export function lunationIndex(dayNumber: number): number {
  return Math.floor((dayNumber - NEW_MOON_INDEX_REFERENCE_JD) / SYNODIC_MONTH_DAYS);
}

export function month11LunationIndex(month11: number): number {
  return Math.floor(0.5 + (month11 - NEW_MOON_INDEX_REFERENCE_JD) / SYNODIC_MONTH_DAYS);
}

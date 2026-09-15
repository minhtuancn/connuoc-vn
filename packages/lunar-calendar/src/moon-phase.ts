import {
  julianDateFromUnixMilliseconds,
  NEW_MOON_REFERENCE_JD,
  newMoonJulianDate,
  SYNODIC_MONTH_DAYS,
} from './astronomy.js';
import { parseExplicitInstant } from './instant.js';

export type MoonPhaseKey =
  | 'NEW_MOON'
  | 'WAXING_CRESCENT'
  | 'FIRST_QUARTER'
  | 'WAXING_GIBBOUS'
  | 'FULL_MOON'
  | 'WANING_GIBBOUS'
  | 'THIRD_QUARTER'
  | 'WANING_CRESCENT';

export interface MoonPhaseInfo {
  readonly key: MoonPhaseKey;
  readonly phaseFraction: number;
  readonly illuminationFraction: number;
  readonly ageDays: number;
  readonly previousNewMoonJulianDate: number;
  readonly nextNewMoonJulianDate: number;
  readonly method: 'meeus-new-moon-approximation';
}

function classifyPhase(fraction: number): MoonPhaseKey {
  if (fraction < 1 / 16 || fraction >= 15 / 16) return 'NEW_MOON';
  if (fraction < 3 / 16) return 'WAXING_CRESCENT';
  if (fraction < 5 / 16) return 'FIRST_QUARTER';
  if (fraction < 7 / 16) return 'WAXING_GIBBOUS';
  if (fraction < 9 / 16) return 'FULL_MOON';
  if (fraction < 11 / 16) return 'WANING_GIBBOUS';
  if (fraction < 13 / 16) return 'THIRD_QUARTER';
  return 'WANING_CRESCENT';
}

/**
 * Approximate lunar phase from adjacent calculated new moons. This is suitable
 * for calendar UI/education, not navigation or precision astronomical work.
 */
export function getMoonPhaseAt(atUtc: string): MoonPhaseInfo {
  const timestamp = parseExplicitInstant(atUtc);
  const jd = julianDateFromUnixMilliseconds(timestamp);
  let k = Math.floor((jd - NEW_MOON_REFERENCE_JD) / SYNODIC_MONTH_DAYS);
  let previous = newMoonJulianDate(k);

  while (previous > jd) {
    k -= 1;
    previous = newMoonJulianDate(k);
  }

  let next = newMoonJulianDate(k + 1);
  while (next <= jd) {
    k += 1;
    previous = next;
    next = newMoonJulianDate(k + 1);
  }

  const cycleDays = next - previous;
  const ageDays = jd - previous;
  const phaseFraction = ageDays / cycleDays;
  const illuminationFraction = (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;

  return {
    key: classifyPhase(phaseFraction),
    phaseFraction,
    illuminationFraction,
    ageDays,
    previousNewMoonJulianDate: previous,
    nextNewMoonJulianDate: next,
    method: 'meeus-new-moon-approximation',
  };
}

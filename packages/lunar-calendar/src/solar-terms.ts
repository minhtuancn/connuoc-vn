import { julianDateFromUnixMilliseconds, sunLongitudeDegrees } from './astronomy.js';
import { parseExplicitInstant } from './instant.js';

export const SOLAR_TERMS = [
  'Xuân phân',
  'Thanh minh',
  'Cốc vũ',
  'Lập hạ',
  'Tiểu mãn',
  'Mang chủng',
  'Hạ chí',
  'Tiểu thử',
  'Đại thử',
  'Lập thu',
  'Xử thử',
  'Bạch lộ',
  'Thu phân',
  'Hàn lộ',
  'Sương giáng',
  'Lập đông',
  'Tiểu tuyết',
  'Đại tuyết',
  'Đông chí',
  'Tiểu hàn',
  'Đại hàn',
  'Lập xuân',
  'Vũ thủy',
  'Kinh trập',
] as const;

export interface SolarTermInfo {
  readonly index: number;
  readonly name: (typeof SOLAR_TERMS)[number];
  readonly longitudeDegrees: number;
  readonly startsAtLongitudeDegrees: number;
  readonly method: 'solar-longitude-approximation';
}

/** Return the 24-tiết-khí sector containing an explicit instant. */
export function getSolarTermAt(atUtc: string): SolarTermInfo {
  const timestamp = parseExplicitInstant(atUtc);
  const longitudeDegrees = sunLongitudeDegrees(julianDateFromUnixMilliseconds(timestamp));
  const index = Math.floor(longitudeDegrees / 15) % 24;
  return {
    index,
    name: SOLAR_TERMS[index]!,
    longitudeDegrees,
    startsAtLongitudeDegrees: index * 15,
    method: 'solar-longitude-approximation',
  };
}

export interface SolarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface LunarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly isLeapMonth: boolean;
}

export const VIETNAM_LUNAR_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_LUNAR_UTC_OFFSET_HOURS = 7;
export const SUPPORTED_SOLAR_YEAR_MIN = 1900;
export const SUPPORTED_SOLAR_YEAR_MAX = 2100;

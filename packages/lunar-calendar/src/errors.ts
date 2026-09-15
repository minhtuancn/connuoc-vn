export type LunarCalendarErrorCode =
  | 'INVALID_SOLAR_DATE'
  | 'INVALID_LUNAR_DATE'
  | 'UNSUPPORTED_YEAR'
  | 'INVALID_LEAP_MONTH';

export class LunarCalendarError extends Error {
  readonly code: LunarCalendarErrorCode;

  constructor(code: LunarCalendarErrorCode, message: string) {
    super(message);
    this.name = 'LunarCalendarError';
    this.code = code;
  }
}

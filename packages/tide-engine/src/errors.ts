export type TideInputErrorCode =
  | 'INVALID_TIMESTAMP'
  | 'INVALID_TIMEZONE'
  | 'INVALID_RANGE'
  | 'INVALID_INTERVAL'
  | 'TOO_MANY_POINTS'
  | 'INVALID_MODEL'
  | 'INVALID_CONSTITUENT';

export class TideInputError extends Error {
  readonly code: TideInputErrorCode;
  readonly field: string | undefined;

  constructor(code: TideInputErrorCode, message: string, field?: string) {
    super(message);
    this.name = 'TideInputError';
    this.code = code;
    this.field = field;
  }
}

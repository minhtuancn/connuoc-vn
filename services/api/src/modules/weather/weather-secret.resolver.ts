export type WeatherSecretResolutionErrorCode = 'SECRET_UNAVAILABLE';

export class WeatherSecretResolutionError extends Error {
  readonly code: WeatherSecretResolutionErrorCode = 'SECRET_UNAVAILABLE';

  constructor() {
    super('Weather provider secret is unavailable.');
    this.name = 'WeatherSecretResolutionError';
  }
}

export interface WeatherSecretResolver {
  resolve(secretRef: string | null): Promise<string | null>;
}

const ENV_REFERENCE = /^env:\/\/([A-Z_][A-Z0-9_]*)$/;

export class EnvironmentWeatherSecretResolver implements WeatherSecretResolver {
  constructor(
    private readonly environment: Readonly<Record<string, string | undefined>> = process.env,
  ) {}

  async resolve(secretRef: string | null): Promise<string | null> {
    if (secretRef === null) return null;

    const match = ENV_REFERENCE.exec(secretRef);
    if (!match) throw new WeatherSecretResolutionError();

    const variableName = match[1];
    if (!variableName) throw new WeatherSecretResolutionError();
    const value = this.environment[variableName];
    if (typeof value !== 'string' || value.length === 0) {
      throw new WeatherSecretResolutionError();
    }
    return value;
  }
}

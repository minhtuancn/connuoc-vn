import type {
  CurrentWeatherRecord,
  DailyWeatherPoint,
  HourlyWeatherPoint,
  WeatherGridLocation,
  WeatherSourceProvenance,
} from '@connuoc/shared-types';

import type { WeatherHydrologyProviderAdapter } from './contracts.js';

export type WeatherForecastCapability =
  | 'weather.current'
  | 'weather.hourlyForecast'
  | 'weather.dailyForecast';

export interface WeatherForecastRequest {
  readonly capability: WeatherForecastCapability;
  readonly latitude: number;
  readonly longitude: number;
  readonly hours?: number;
  readonly days?: number;
}

interface WeatherBundleBase {
  readonly grid: WeatherGridLocation;
  readonly source: WeatherSourceProvenance;
}

export interface CurrentWeatherBundle extends WeatherBundleBase {
  readonly capability: 'weather.current';
  readonly data: CurrentWeatherRecord;
}

export interface HourlyWeatherBundle extends WeatherBundleBase {
  readonly capability: 'weather.hourlyForecast';
  readonly points: readonly HourlyWeatherPoint[];
}

export interface DailyWeatherBundle extends WeatherBundleBase {
  readonly capability: 'weather.dailyForecast';
  readonly points: readonly DailyWeatherPoint[];
}

export type NormalizedWeatherBundle =
  | CurrentWeatherBundle
  | HourlyWeatherBundle
  | DailyWeatherBundle;

export interface WeatherForecastAdapter extends WeatherHydrologyProviderAdapter {
  fetchWeather(
    request: WeatherForecastRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedWeatherBundle>;
}

export interface WeatherHttpClient {
  getJson(url: URL, signal?: AbortSignal): Promise<unknown>;
}

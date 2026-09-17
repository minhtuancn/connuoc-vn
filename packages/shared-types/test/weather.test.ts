import { describe, expect, it } from 'vitest';

import * as contracts from '../src/index.ts';

describe('weather contracts', () => {
  it('exports the normalized Phase 5B weather contract schemas', () => {
    expect('WeatherFreshnessStateSchema' in contracts).toBe(true);
    expect('WeatherSourceProvenanceSchema' in contracts).toBe(true);
    expect('WeatherGridLocationSchema' in contracts).toBe(true);
    expect('CurrentWeatherRecordSchema' in contracts).toBe(true);
    expect('HourlyWeatherPointSchema' in contracts).toBe(true);
    expect('DailyWeatherPointSchema' in contracts).toBe(true);
    expect('CurrentWeatherResponseSchema' in contracts).toBe(true);
    expect('HourlyWeatherResponseSchema' in contracts).toBe(true);
    expect('DailyWeatherResponseSchema' in contracts).toBe(true);
  });
});

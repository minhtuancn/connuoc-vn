import { describe, expect, it } from 'vitest';

import { findExtrema, getWaterState, predictTide, TideInputError } from '../src/index.ts';
import type { HarmonicTideModel, TidePredictionPoint } from '../src/index.ts';

function hourlyPoint(hour: number, value: number): TidePredictionPoint {
  return {
    timestampUtc: new Date(Date.UTC(2026, 0, 1, hour)).toISOString(),
    value,
  };
}

describe('findExtrema', () => {
  it('quadratically refines a turning point between samples', () => {
    const points = [0, 1, 2, 3].map((hour) => hourlyPoint(hour, 10 - (hour - 1.25) ** 2));
    const [high] = findExtrema(points);

    expect(high?.kind).toBe('HIGH');
    expect(high?.refinement).toBe('quadratic');
    expect(high?.timestampUtc).toBe('2026-01-01T01:15:00.000Z');
    expect(high?.value).toBeCloseTo(10, 10);
  });

  it('collapses a flat plateau into one midpoint extremum', () => {
    const points = [hourlyPoint(0, 0), hourlyPoint(1, 1), hourlyPoint(2, 1), hourlyPoint(3, 1), hourlyPoint(4, 0)];
    const extrema = findExtrema(points);

    expect(extrema).toEqual([
      {
        kind: 'HIGH',
        timestampUtc: '2026-01-01T02:00:00.000Z',
        value: 1,
        refinement: 'plateau',
      },
    ]);
  });

  it('finds semidiurnal-style high/low events from a synthetic harmonic curve', () => {
    const model: HarmonicTideModel = {
      modelId: 'state-test',
      stationId: 'station:test',
      datumId: 'datum:test',
      unit: 'm',
      meanLevel: 2,
      referenceEpochUtc: '2026-01-01T00:00:00Z',
      phaseConvention: 'cosine_lag_degrees',
      constituents: [{ name: 'TEST', amplitude: 1, phaseDegrees: 0, speedDegreesPerHour: 15 }],
    };
    const prediction = predictTide({
      model,
      startUtc: '2025-12-31T18:00:00Z',
      endUtc: '2026-01-02T06:00:00Z',
      intervalSeconds: 3_600,
      timeZone: 'UTC',
    });
    const extrema = findExtrema(prediction.points);

    expect(extrema.map(({ kind, timestampUtc }) => [kind, timestampUtc])).toEqual([
      ['HIGH', '2026-01-01T00:00:00.000Z'],
      ['LOW', '2026-01-01T12:00:00.000Z'],
      ['HIGH', '2026-01-02T00:00:00.000Z'],
    ]);
  });

  it('rejects non-monotonic timestamps', () => {
    expect(() => findExtrema([hourlyPoint(0, 0), hourlyPoint(2, 1), hourlyPoint(1, 0)])).toThrowError(
      TideInputError,
    );
  });
});

describe('getWaterState', () => {
  const model: HarmonicTideModel = {
    modelId: 'state-test',
    stationId: 'station:test',
    datumId: 'datum:test',
    unit: 'm',
    meanLevel: 2,
    referenceEpochUtc: '2026-01-01T00:00:00Z',
    phaseConvention: 'cosine_lag_degrees',
    constituents: [{ name: 'TEST', amplitude: 1, phaseDegrees: 0, speedDegreesPerHour: 15 }],
  };
  const points = predictTide({
    model,
    startUtc: '2025-12-31T18:00:00Z',
    endUtc: '2026-01-02T06:00:00Z',
    intervalSeconds: 3_600,
    timeZone: 'UTC',
  }).points;
  const config = { standSlopeThresholdPerHour: 0.001, extremumWindowSeconds: 30 * 60 } as const;

  it('classifies high/low stand windows separately from rising/falling', () => {
    expect(getWaterState(points, '2026-01-01T00:00:00Z', config)).toBe('NEAR_HIGH_STAND');
    expect(getWaterState(points, '2026-01-01T12:00:00Z', config)).toBe('NEAR_LOW_STAND');
    expect(getWaterState(points, '2026-01-01T06:00:00Z', config)).toBe('FALLING');
    expect(getWaterState(points, '2026-01-01T18:00:00Z', config)).toBe('RISING');
  });

  it('returns UNKNOWN outside the supplied series', () => {
    expect(getWaterState(points, '2026-01-03T00:00:00Z', config)).toBe('UNKNOWN');
  });
});

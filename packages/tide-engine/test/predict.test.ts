import { describe, expect, it } from 'vitest';

import { predictTide, predictTideLevelAt, TideInputError } from '../src/index.ts';
import type { HarmonicTideModel } from '../src/index.ts';

const singleConstituentModel: HarmonicTideModel = {
  modelId: 'synthetic-single',
  modelVersion: '1',
  stationId: 'station:synthetic',
  datumId: 'datum:synthetic',
  unit: 'm',
  meanLevel: 2,
  referenceEpochUtc: '2026-01-01T00:00:00Z',
  phaseConvention: 'cosine_lag_degrees',
  constituents: [
    {
      name: 'TEST',
      amplitude: 1,
      phaseDegrees: 0,
      speedDegreesPerHour: 15,
    },
  ],
};

describe('predictTideLevelAt', () => {
  it('matches a mathematically known single cosine constituent', () => {
    expect(predictTideLevelAt(singleConstituentModel, '2026-01-01T00:00:00Z')).toBeCloseTo(3, 12);
    expect(predictTideLevelAt(singleConstituentModel, '2026-01-01T06:00:00Z')).toBeCloseTo(2, 12);
    expect(predictTideLevelAt(singleConstituentModel, '2026-01-01T12:00:00Z')).toBeCloseTo(1, 12);
    expect(predictTideLevelAt(singleConstituentModel, '2026-01-02T00:00:00Z')).toBeCloseTo(3, 12);
  });

  it('makes the phase convention explicit rather than guessing it', () => {
    const lag = {
      ...singleConstituentModel,
      constituents: [{ ...singleConstituentModel.constituents[0]!, phaseDegrees: 90 }],
    };
    const lead: HarmonicTideModel = { ...lag, phaseConvention: 'cosine_lead_degrees' };

    expect(predictTideLevelAt(lag, '2026-01-01T06:00:00Z')).toBeCloseTo(3, 12);
    expect(predictTideLevelAt(lead, '2026-01-01T06:00:00Z')).toBeCloseTo(1, 12);
  });
});

describe('predictTide', () => {
  it('returns an inclusive UTC series sampled at the requested interval', () => {
    const prediction = predictTide({
      model: singleConstituentModel,
      startUtc: '2026-01-01T00:00:00+00:00',
      endUtc: '2026-01-01T12:00:00Z',
      intervalSeconds: 6 * 60 * 60,
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    expect(prediction.points).toHaveLength(3);
    expect(prediction.points.map((point) => point.timestampUtc)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T06:00:00.000Z',
      '2026-01-01T12:00:00.000Z',
    ]);
    expect(prediction.points[0]?.value).toBeCloseTo(3, 12);
    expect(prediction.points[1]?.value).toBeCloseTo(2, 12);
    expect(prediction.points[2]?.value).toBeCloseTo(1, 12);
    expect(prediction.metadata.timeZone).toBe('Asia/Ho_Chi_Minh');
    expect(prediction.metadata.datumId).toBe('datum:synthetic');
  });

  it('supports multiple constituents by summing contributions', () => {
    const model: HarmonicTideModel = {
      ...singleConstituentModel,
      constituents: [
        singleConstituentModel.constituents[0]!,
        { name: 'SECOND', amplitude: 0.5, phaseDegrees: 0, speedDegreesPerHour: 30 },
      ],
    };

    expect(predictTideLevelAt(model, '2026-01-01T00:00:00Z')).toBeCloseTo(3.5, 12);
    expect(predictTideLevelAt(model, '2026-01-01T06:00:00Z')).toBeCloseTo(1.5, 12);
  });

  it('rejects a missing constituent set with a typed error', () => {
    expect(() =>
      predictTide({
        model: { ...singleConstituentModel, constituents: [] },
        startUtc: '2026-01-01T00:00:00Z',
        endUtc: '2026-01-01T01:00:00Z',
        intervalSeconds: 3_600,
        timeZone: 'UTC',
      }),
    ).toThrowError(TideInputError);
  });

  it('rejects timestamps without explicit offsets and invalid timezones', () => {
    expect(() => predictTideLevelAt(singleConstituentModel, '2026-01-01T00:00:00')).toThrowError(TideInputError);

    expect(() =>
      predictTide({
        model: singleConstituentModel,
        startUtc: '2026-01-01T00:00:00Z',
        endUtc: '2026-01-01T01:00:00Z',
        intervalSeconds: 3_600,
        timeZone: 'Vietnam/Local',
      }),
    ).toThrowError(TideInputError);
  });

  it('rejects phase values outside the documented normalized range', () => {
    const invalidModel: HarmonicTideModel = {
      ...singleConstituentModel,
      constituents: [{ ...singleConstituentModel.constituents[0]!, phaseDegrees: 360 }],
    };
    expect(() => predictTideLevelAt(invalidModel, '2026-01-01T00:00:00Z')).toThrowError(TideInputError);
  });
});

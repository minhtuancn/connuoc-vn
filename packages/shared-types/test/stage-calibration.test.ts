import { describe, expect, it } from 'vitest';

import {
  CalibrationRunSchema,
  RatingCurveSchema,
  StageForecastPointSchema,
} from '../src/stage-calibration.js';

const checksum = 'a'.repeat(64);

function curve() {
  return {
    id: 'rating-curve:station-a:v1',
    stationId: 'station-a',
    riverReachId: 'reach-a',
    version: 'v1',
    datumId: 'VN-2000-local-gauge-a',
    status: 'ACTIVE' as const,
    extrapolationPolicy: 'REJECT' as const,
    dischargeDomain: { minCms: 100, maxCms: 500 },
    stageDomain: { minM: 1.2, maxM: 3.4 },
    validation: {
      periodStart: '2025-01-01T00:00:00Z',
      periodEnd: '2026-01-01T00:00:00Z',
      maeM: 0.08,
      rmseM: 0.12,
      sampleCount: 420,
    },
    artifactChecksumSha256: checksum,
    points: [
      { dischargeCms: 100, stageM: 1.2 },
      { dischargeCms: 250, stageM: 2.0 },
      { dischargeCms: 500, stageM: 3.4 },
    ],
  };
}

describe('Phase 5E stage calibration contracts', () => {
  it('accepts a monotonic validated rating curve with explicit datum and domain', () => {
    expect(RatingCurveSchema.parse(curve())).toMatchObject({
      datumId: 'VN-2000-local-gauge-a',
      dischargeDomain: { minCms: 100, maxCms: 500 },
      status: 'ACTIVE',
    });
  });

  it('rejects unsorted or non-monotonic rating-curve points', () => {
    expect(() =>
      RatingCurveSchema.parse({
        ...curve(),
        points: [
          { dischargeCms: 100, stageM: 1.2 },
          { dischargeCms: 90, stageM: 1.4 },
          { dischargeCms: 500, stageM: 3.4 },
        ],
      }),
    ).toThrow();

    expect(() =>
      RatingCurveSchema.parse({
        ...curve(),
        points: [
          { dischargeCms: 100, stageM: 1.2 },
          { dischargeCms: 250, stageM: 1.1 },
          { dischargeCms: 500, stageM: 3.4 },
        ],
      }),
    ).toThrow();
  });

  it('requires active calibration runs to include reproducibility and held-out MAE/RMSE lead metrics', () => {
    const parsed = CalibrationRunSchema.parse({
      id: 'calibration:station-a:v1',
      stationId: 'station-a',
      riverReachId: 'reach-a',
      modelKind: 'RATING_CURVE',
      modelId: 'piecewise-linear-rating-curve',
      modelVersion: '1',
      featureVersion: 'stage-discharge-pairs-v1',
      datumId: 'VN-2000-local-gauge-a',
      sourceIds: ['source:gauge-a'],
      trainPeriod: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T23:59:59Z',
      },
      validationPeriod: {
        start: '2025-01-01T00:00:00Z',
        end: '2025-06-30T23:59:59Z',
      },
      testPeriod: {
        start: '2025-07-01T00:00:00Z',
        end: '2025-12-31T23:59:59Z',
      },
      splitStrategy: 'chronological-held-out-events-v1',
      artifactChecksumSha256: checksum,
      acceptedRmseM: 0.2,
      status: 'ACTIVE',
      metrics: [
        {
          scope: 'OVERALL',
          name: 'MAE_M',
          valueM: 0.08,
          sampleCount: 100,
          leadSeconds: null,
          segmentKey: null,
        },
        {
          scope: 'OVERALL',
          name: 'RMSE_M',
          valueM: 0.12,
          sampleCount: 100,
          leadSeconds: null,
          segmentKey: null,
        },
        {
          scope: 'LEAD_TIME',
          name: 'MAE_M',
          valueM: 0.09,
          sampleCount: 50,
          leadSeconds: 21_600,
          segmentKey: null,
        },
        {
          scope: 'LEAD_TIME',
          name: 'RMSE_M',
          valueM: 0.13,
          sampleCount: 50,
          leadSeconds: 21_600,
          segmentKey: null,
        },
      ],
    });

    expect(parsed.status).toBe('ACTIVE');
  });

  it('rejects an ACTIVE calibration whose held-out RMSE exceeds its accepted error bound', () => {
    expect(() =>
      CalibrationRunSchema.parse({
        id: 'calibration:station-a:bad',
        stationId: 'station-a',
        riverReachId: 'reach-a',
        modelKind: 'RATING_CURVE',
        modelId: 'piecewise-linear-rating-curve',
        modelVersion: 'bad',
        featureVersion: 'stage-discharge-pairs-v1',
        datumId: 'VN-2000-local-gauge-a',
        sourceIds: ['source:gauge-a'],
        trainPeriod: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z',
        },
        validationPeriod: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-06-30T23:59:59Z',
        },
        testPeriod: {
          start: '2025-07-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
        },
        splitStrategy: 'chronological-held-out-events-v1',
        artifactChecksumSha256: checksum,
        acceptedRmseM: 0.2,
        status: 'ACTIVE',
        metrics: [
          {
            scope: 'OVERALL',
            name: 'MAE_M',
            valueM: 0.18,
            sampleCount: 100,
            leadSeconds: null,
            segmentKey: null,
          },
          {
            scope: 'OVERALL',
            name: 'RMSE_M',
            valueM: 0.3,
            sampleCount: 100,
            leadSeconds: null,
            segmentKey: null,
          },
          {
            scope: 'LEAD_TIME',
            name: 'MAE_M',
            valueM: 0.19,
            sampleCount: 50,
            leadSeconds: 21_600,
            segmentKey: null,
          },
          {
            scope: 'LEAD_TIME',
            name: 'RMSE_M',
            valueM: 0.31,
            sampleCount: 50,
            leadSeconds: 21_600,
            segmentKey: null,
          },
        ],
      }),
    ).toThrow();
  });

  it('requires stage forecasts to carry datum, calibration version and explicit uncertainty basis', () => {
    expect(
      StageForecastPointSchema.parse({
        validAt: '2026-09-19T00:00:00Z',
        leadSeconds: 86_400,
        dischargeCms: 300,
        stageM: 2.28,
        unit: 'm',
        datumId: 'VN-2000-local-gauge-a',
        derivationMethod: 'RATING_CURVE',
        calibrationId: 'rating-curve:station-a:v1',
        calibrationVersion: 'v1',
        sourceDischargeRecordId: 'hydro:forecast:1',
        extrapolated: false,
        confidence: 'VALIDATED_CALIBRATION',
        uncertainty: {
          kind: 'VALIDATION_RMSE',
          valueM: 0.12,
        },
      }),
    ).toMatchObject({
      unit: 'm',
      derivationMethod: 'RATING_CURVE',
      extrapolated: false,
    });
  });
});

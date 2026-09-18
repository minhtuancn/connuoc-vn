import { describe, expect, it } from 'vitest';

import {
  CalibrationRunSummarySchema,
  RatingCurveModelSchema,
  backtestPersistenceBaseline,
  evaluateRatingCurve,
} from '../src/calibration.js';

function curve() {
  return RatingCurveModelSchema.parse({
    id: 'curve:red-river:gauge-01',
    version: 'v2',
    stationId: 'station:gauge-01',
    riverReachId: 'reach:red-river:001',
    calibrationRunId: 'calibration:red-river:gauge-01:v2',
    datumId: 'VN-LOCAL-DATUM-01',
    method: 'PIECEWISE_LINEAR',
    stageUnit: 'm',
    dischargeUnit: 'm3/s',
    validDischargeMinCms: 100,
    validDischargeMaxCms: 400,
    extrapolationPolicy: 'REJECT',
    status: 'ACTIVE',
    points: [
      { dischargeCms: 100, stageM: 2.0 },
      { dischargeCms: 200, stageM: 3.0 },
      { dischargeCms: 400, stageM: 4.5 },
    ],
  });
}

describe('Phase 5E rating-curve contracts', () => {
  it('interpolates stage inside the validated discharge domain', () => {
    expect(
      evaluateRatingCurve(curve(), {
        dischargeCms: 150,
        expectedDatumId: 'VN-LOCAL-DATUM-01',
      }),
    ).toEqual({
      status: 'AVAILABLE',
      dischargeCms: 150,
      stageM: 2.5,
      datumId: 'VN-LOCAL-DATUM-01',
      curveId: 'curve:red-river:gauge-01',
      curveVersion: 'v2',
      calibrationRunId: 'calibration:red-river:gauge-01:v2',
      extrapolated: false,
    });
  });

  it('allows exact boundary values without extrapolation', () => {
    expect(
      evaluateRatingCurve(curve(), {
        dischargeCms: 100,
        expectedDatumId: 'VN-LOCAL-DATUM-01',
      }),
    ).toMatchObject({
      status: 'AVAILABLE',
      stageM: 2,
      extrapolated: false,
    });

    expect(
      evaluateRatingCurve(curve(), {
        dischargeCms: 400,
        expectedDatumId: 'VN-LOCAL-DATUM-01',
      }),
    ).toMatchObject({
      status: 'AVAILABLE',
      stageM: 4.5,
      extrapolated: false,
    });
  });

  it('rejects discharge outside the calibrated domain instead of extrapolating', () => {
    expect(
      evaluateRatingCurve(curve(), {
        dischargeCms: 450,
        expectedDatumId: 'VN-LOCAL-DATUM-01',
      }),
    ).toEqual({
      status: 'OUTSIDE_CALIBRATED_DOMAIN',
      dischargeCms: 450,
      stageM: null,
      datumId: 'VN-LOCAL-DATUM-01',
      curveId: 'curve:red-river:gauge-01',
      curveVersion: 'v2',
      calibrationRunId: 'calibration:red-river:gauge-01:v2',
      extrapolated: false,
    });
  });

  it('rejects incompatible datum before returning a precise stage', () => {
    expect(
      evaluateRatingCurve(curve(), {
        dischargeCms: 150,
        expectedDatumId: 'OTHER-DATUM',
      }),
    ).toEqual({
      status: 'DATUM_MISMATCH',
      dischargeCms: 150,
      stageM: null,
      datumId: 'VN-LOCAL-DATUM-01',
      curveId: 'curve:red-river:gauge-01',
      curveVersion: 'v2',
      calibrationRunId: 'calibration:red-river:gauge-01:v2',
      extrapolated: false,
    });
  });

  it('rejects invalid/non-monotonic curves and inconsistent domain bounds', () => {
    expect(() =>
      RatingCurveModelSchema.parse({
        ...curve(),
        points: [
          { dischargeCms: 100, stageM: 2.0 },
          { dischargeCms: 100, stageM: 2.5 },
        ],
        validDischargeMaxCms: 100,
      }),
    ).toThrow();

    expect(() =>
      RatingCurveModelSchema.parse({
        ...curve(),
        points: [
          { dischargeCms: 100, stageM: 2.0 },
          { dischargeCms: 200, stageM: 1.8 },
        ],
        validDischargeMaxCms: 200,
      }),
    ).toThrow();

    expect(() =>
      RatingCurveModelSchema.parse({
        ...curve(),
        validDischargeMinCms: 50,
      }),
    ).toThrow();
  });

  it('requires reproducible held-out validation evidence for a deployable calibration', () => {
    const result = CalibrationRunSummarySchema.parse({
      id: 'calibration:red-river:gauge-01:v2',
      version: 'v2',
      stationId: 'station:gauge-01',
      riverReachId: 'reach:red-river:001',
      datumId: 'VN-LOCAL-DATUM-01',
      sourceIds: ['source:gauge-a'],
      modelKind: 'RATING_CURVE',
      modelVersion: 'rating-curve-v2',
      featureVersion: 'stage-discharge-pairs-v1',
      splitStrategy: 'CHRONOLOGICAL_HOLDOUT',
      trainPeriod: {
        start: '2024-01-01T00:00:00Z',
        end: '2025-06-30T23:59:59Z',
      },
      validationPeriod: {
        start: '2025-07-01T00:00:00Z',
        end: '2025-12-31T23:59:59Z',
      },
      testPeriod: {
        start: '2026-01-01T00:00:00Z',
        end: '2026-06-30T23:59:59Z',
      },
      validationMetrics: {
        maeM: 0.12,
        rmseM: 0.18,
        sampleCount: 320,
      },
      testMetrics: {
        maeM: 0.15,
        rmseM: 0.21,
        sampleCount: 140,
      },
      acceptedTestRmseM: 0.25,
      metricBreakdowns: [
        {
          datasetSplit: 'TEST',
          leadSeconds: 21600,
          season: null,
          eventSubset: null,
          metrics: {
            maeM: 0.16,
            rmseM: 0.22,
            sampleCount: 60,
          },
        },
      ],
      artifactChecksumSha256:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      deploymentStatus: 'ACTIVE',
    });

    expect(result.testMetrics).toEqual({
      maeM: 0.15,
      rmseM: 0.21,
      sampleCount: 140,
    });
  });

  it('rejects active calibration without held-out MAE/RMSE evidence', () => {
    expect(() =>
      CalibrationRunSummarySchema.parse({
        id: 'calibration:red-river:gauge-01:v3',
        version: 'v3',
        stationId: 'station:gauge-01',
        riverReachId: 'reach:red-river:001',
        datumId: 'VN-LOCAL-DATUM-01',
        sourceIds: ['source:gauge-a'],
        modelKind: 'RATING_CURVE',
        modelVersion: 'rating-curve-v3',
        featureVersion: 'stage-discharge-pairs-v1',
        splitStrategy: 'CHRONOLOGICAL_HOLDOUT',
        trainPeriod: {
          start: '2024-01-01T00:00:00Z',
          end: '2025-06-30T23:59:59Z',
        },
        validationPeriod: {
          start: '2025-07-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
        },
        testPeriod: {
          start: '2026-01-01T00:00:00Z',
          end: '2026-06-30T23:59:59Z',
        },
        validationMetrics: {
          maeM: 0.1,
          rmseM: 0.15,
          sampleCount: 100,
        },
        testMetrics: null,
        acceptedTestRmseM: 0.25,
        metricBreakdowns: [
          {
            datasetSplit: 'TEST',
            leadSeconds: 21600,
            season: null,
            eventSubset: null,
            metrics: {
              maeM: 0.16,
              rmseM: 0.22,
              sampleCount: 60,
            },
          },
        ],
        artifactChecksumSha256:
          'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        deploymentStatus: 'ACTIVE',
      }),
    ).toThrow();
  });


  it('calculates persistence baseline MAE/RMSE by held-out lead bucket without datum mixing', () => {
    const result = backtestPersistenceBaseline(
      [
        {
          originAt: '2026-01-01T00:00:00Z',
          validAt: '2026-01-01T06:00:00Z',
          leadSeconds: 21_600,
          originStageM: 2.0,
          observedStageM: 2.2,
          datumId: 'VN-LOCAL-DATUM-01',
        },
        {
          originAt: '2026-01-02T00:00:00Z',
          validAt: '2026-01-02T06:00:00Z',
          leadSeconds: 21_600,
          originStageM: 2.4,
          observedStageM: 2.5,
          datumId: 'VN-LOCAL-DATUM-01',
        },
        {
          originAt: '2026-01-03T00:00:00Z',
          validAt: '2026-01-03T12:00:00Z',
          leadSeconds: 43_200,
          originStageM: 2.3,
          observedStageM: 2.6,
          datumId: 'VN-LOCAL-DATUM-01',
        },
      ],
      'VN-LOCAL-DATUM-01',
    );

    expect(result.overall).toMatchObject({
      sampleCount: 3,
    });
    expect(result.overall?.maeM).toBeCloseTo(0.2, 10);
    expect(result.byLead.map((item) => item.leadSeconds)).toEqual([
      21_600,
      43_200,
    ]);
    expect(result.byLead[0]?.metrics.sampleCount).toBe(2);

    expect(() =>
      backtestPersistenceBaseline(
        [
          {
            originAt: '2026-01-01T00:00:00Z',
            validAt: '2026-01-01T06:00:00Z',
            leadSeconds: 21_600,
            originStageM: 2.0,
            observedStageM: 2.2,
            datumId: 'OTHER-DATUM',
          },
        ],
        'VN-LOCAL-DATUM-01',
      ),
    ).toThrow(/datum/i);
  });

  it('refuses ACTIVE deployment when held-out RMSE exceeds the accepted threshold', () => {
    expect(() =>
      CalibrationRunSummarySchema.parse({
        id: 'calibration:red-river:gauge-01:bad-rmse',
        version: 'bad-rmse',
        stationId: 'station:gauge-01',
        riverReachId: 'reach:red-river:001',
        datumId: 'VN-LOCAL-DATUM-01',
        sourceIds: ['source:gauge-a'],
        modelKind: 'RATING_CURVE',
        modelVersion: 'rating-curve-bad-rmse',
        featureVersion: 'stage-discharge-pairs-v1',
        splitStrategy: 'CHRONOLOGICAL_HOLDOUT',
        trainPeriod: {
          start: '2024-01-01T00:00:00Z',
          end: '2025-06-30T23:59:59Z',
        },
        validationPeriod: {
          start: '2025-07-01T00:00:00Z',
          end: '2025-12-31T23:59:59Z',
        },
        testPeriod: {
          start: '2026-01-01T00:00:00Z',
          end: '2026-06-30T23:59:59Z',
        },
        validationMetrics: {
          maeM: 0.1,
          rmseM: 0.15,
          sampleCount: 100,
        },
        testMetrics: {
          maeM: 0.2,
          rmseM: 0.3,
          sampleCount: 80,
        },
        acceptedTestRmseM: 0.25,
        metricBreakdowns: [
          {
            datasetSplit: 'TEST',
            leadSeconds: 21600,
            season: null,
            eventSubset: null,
            metrics: {
              maeM: 0.21,
              rmseM: 0.31,
              sampleCount: 40,
            },
          },
        ],
        artifactChecksumSha256:
          'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        deploymentStatus: 'ACTIVE',
      }),
    ).toThrow(/RMSE/i);
  });
});

import { describe, expect, it } from 'vitest';

import {
  CalibrationRunSchema,
  RatingCurveDefinitionSchema,
  StageDerivationResultSchema,
} from '../src/river-rise.js';

function curve() {
  return {
    id: 'rating:station:test:v1',
    stationId: 'station:test',
    riverReachId: 'reach:test',
    version: 'v1',
    datumId: 'datum:local:test',
    stageUnit: 'm' as const,
    curveKind: 'PIECEWISE_LINEAR' as const,
    status: 'ACTIVE' as const,
    points: [
      { dischargeCms: 100, stageM: 1.2 },
      { dischargeCms: 200, stageM: 1.8 },
      { dischargeCms: 400, stageM: 2.7 },
    ],
    validFrom: '2026-09-01T00:00:00Z',
    validTo: null,
    calibrationRunId: 'calibration:test:v1',
    validation: {
      sampleCount: 120,
      maeM: 0.08,
      rmseM: 0.11,
      biasM: 0.01,
      validationStart: '2026-06-01T00:00:00Z',
      validationEnd: '2026-08-31T23:59:59Z',
      leadMetrics: [
        {
          leadSeconds: 21_600,
          sampleCount: 40,
          maeM: 0.1,
          rmseM: 0.13,
        },
      ],
    },
  };
}

describe('Phase 5E river-rise contracts', () => {
  it('accepts a versioned monotonic rating curve with datum and validation evidence', () => {
    expect(RatingCurveDefinitionSchema.parse(curve())).toMatchObject({
      datumId: 'datum:local:test',
      curveKind: 'PIECEWISE_LINEAR',
      status: 'ACTIVE',
      validation: { sampleCount: 120, rmseM: 0.11 },
    });
  });

  it('rejects non-monotonic discharge or stage control points', () => {
    expect(() =>
      RatingCurveDefinitionSchema.parse({
        ...curve(),
        points: [
          { dischargeCms: 100, stageM: 1.2 },
          { dischargeCms: 100, stageM: 1.8 },
        ],
      }),
    ).toThrow();

    expect(() =>
      RatingCurveDefinitionSchema.parse({
        ...curve(),
        points: [
          { dischargeCms: 100, stageM: 1.8 },
          { dischargeCms: 200, stageM: 1.7 },
        ],
      }),
    ).toThrow();
  });

  it('requires explicit validation evidence before a curve can be ACTIVE', () => {
    expect(() =>
      RatingCurveDefinitionSchema.parse({
        ...curve(),
        status: 'ACTIVE',
        validation: null,
      }),
    ).toThrow();
  });

  it('accepts reproducible calibration metadata and artifact checksum', () => {
    expect(
      CalibrationRunSchema.parse({
        id: 'calibration:test:v1',
        stationId: 'station:test',
        riverReachId: 'reach:test',
        modelFamily: 'RATING_CURVE_PIECEWISE_LINEAR',
        modelVersion: 'v1',
        featureVersion: 'stage-discharge-pairs-v1',
        sourceIds: ['source:gauge:test'],
        trainingStart: '2025-01-01T00:00:00Z',
        trainingEnd: '2026-03-31T23:59:59Z',
        validationStart: '2026-04-01T00:00:00Z',
        validationEnd: '2026-06-30T23:59:59Z',
        testStart: '2026-07-01T00:00:00Z',
        testEnd: '2026-08-31T23:59:59Z',
        splitStrategy: 'TIME_ORDERED_HOLDOUT',
        metrics: {
          sampleCount: 120,
          maeM: 0.08,
          rmseM: 0.11,
          biasM: 0.01,
          validationStart: '2026-04-01T00:00:00Z',
          validationEnd: '2026-06-30T23:59:59Z',
          leadMetrics: [],
        },
        artifactSha256: 'a'.repeat(64),
        status: 'ACTIVE',
        baselineModelFamily: 'PERSISTENCE',
        baselineRmseM: 0.19,
      }),
    ).toMatchObject({
      status: 'ACTIVE',
      artifactSha256: 'a'.repeat(64),
      baselineModelFamily: 'PERSISTENCE',
    });
  });

  it('rejects invalid calibration period ordering', () => {
    expect(() =>
      CalibrationRunSchema.parse({
        id: 'calibration:test:bad',
        stationId: 'station:test',
        riverReachId: 'reach:test',
        modelFamily: 'RATING_CURVE_PIECEWISE_LINEAR',
        modelVersion: 'v1',
        featureVersion: 'pairs-v1',
        sourceIds: ['source:gauge:test'],
        trainingStart: '2026-05-01T00:00:00Z',
        trainingEnd: '2026-04-01T00:00:00Z',
        validationStart: '2026-06-01T00:00:00Z',
        validationEnd: '2026-06-30T00:00:00Z',
        testStart: '2026-07-01T00:00:00Z',
        testEnd: '2026-08-01T00:00:00Z',
        splitStrategy: 'TIME_ORDERED_HOLDOUT',
        metrics: curve().validation,
        artifactSha256: 'b'.repeat(64),
        status: 'CANDIDATE',
        baselineModelFamily: null,
        baselineRmseM: null,
      }),
    ).toThrow();
  });

  it('keeps precise stage separate from insufficient-data responses', () => {
    expect(
      StageDerivationResultSchema.parse({
        state: 'AVAILABLE',
        dischargeCms: 200,
        stageM: 1.8,
        stageUnit: 'm',
        datumId: 'datum:local:test',
        calibrationId: 'rating:station:test:v1',
        calibrationVersion: 'v1',
        domainStatus: 'INTERPOLATED',
        uncertaintyM: 0.11,
        limitations: [],
      }).state,
    ).toBe('AVAILABLE');

    expect(
      StageDerivationResultSchema.parse({
        state: 'INSUFFICIENT_DATA',
        reason: 'ABOVE_CALIBRATED_DOMAIN',
        dischargeCms: 900,
        requiredDatumId: 'datum:local:test',
        availableDatumId: 'datum:local:test',
        calibrationId: 'rating:station:test:v1',
        limitations: ['No extrapolation beyond calibrated discharge domain.'],
      }).state,
    ).toBe('INSUFFICIENT_DATA');
  });
});

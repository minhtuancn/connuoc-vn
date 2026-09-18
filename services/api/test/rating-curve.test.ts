import { describe, expect, it } from 'vitest';

import type { RatingCurveDefinition } from '@connuoc/shared-types';

import { deriveStageFromRatingCurve } from '../src/modules/river-rise/rating-curve.js';

function curve(): RatingCurveDefinition {
  return {
    id: 'rating:station:test:v1',
    stationId: 'station:test',
    riverReachId: 'reach:test',
    version: 'v1',
    datumId: 'datum:local:test',
    stageUnit: 'm',
    curveKind: 'PIECEWISE_LINEAR',
    status: 'ACTIVE',
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
      leadMetrics: [],
    },
  };
}

describe('deriveStageFromRatingCurve', () => {
  it('interpolates stage linearly inside the calibrated discharge domain', () => {
    expect(
      deriveStageFromRatingCurve(curve(), {
        dischargeCms: 150,
        requiredDatumId: 'datum:local:test',
      }),
    ).toEqual({
      state: 'AVAILABLE',
      dischargeCms: 150,
      stageM: 1.5,
      stageUnit: 'm',
      datumId: 'datum:local:test',
      calibrationId: 'rating:station:test:v1',
      calibrationVersion: 'v1',
      domainStatus: 'INTERPOLATED',
      uncertaintyM: 0.11,
      limitations: [],
    });
  });

  it('uses exact curve points at both calibrated boundaries', () => {
    expect(
      deriveStageFromRatingCurve(curve(), {
        dischargeCms: 100,
        requiredDatumId: 'datum:local:test',
      }),
    ).toMatchObject({
      state: 'AVAILABLE',
      stageM: 1.2,
      domainStatus: 'BOUNDARY',
    });

    expect(
      deriveStageFromRatingCurve(curve(), {
        dischargeCms: 400,
        requiredDatumId: 'datum:local:test',
      }),
    ).toMatchObject({
      state: 'AVAILABLE',
      stageM: 2.7,
      domainStatus: 'BOUNDARY',
    });
  });

  it('rejects incompatible datum instead of pretending equal units are comparable', () => {
    expect(
      deriveStageFromRatingCurve(curve(), {
        dischargeCms: 200,
        requiredDatumId: 'datum:national:vn',
      }),
    ).toEqual({
      state: 'INSUFFICIENT_DATA',
      reason: 'DATUM_MISMATCH',
      dischargeCms: 200,
      requiredDatumId: 'datum:national:vn',
      availableDatumId: 'datum:local:test',
      calibrationId: 'rating:station:test:v1',
      limitations: [
        'Stage datum is incompatible with the requested vertical reference.',
      ],
    });
  });

  it('rejects discharge below the calibrated domain', () => {
    expect(
      deriveStageFromRatingCurve(curve(), {
        dischargeCms: 99,
        requiredDatumId: 'datum:local:test',
      }),
    ).toEqual({
      state: 'INSUFFICIENT_DATA',
      reason: 'BELOW_CALIBRATED_DOMAIN',
      dischargeCms: 99,
      requiredDatumId: 'datum:local:test',
      availableDatumId: 'datum:local:test',
      calibrationId: 'rating:station:test:v1',
      limitations: ['No extrapolation below the calibrated discharge domain.'],
    });
  });

  it('rejects discharge above the calibrated domain', () => {
    expect(
      deriveStageFromRatingCurve(curve(), {
        dischargeCms: 401,
        requiredDatumId: 'datum:local:test',
      }),
    ).toEqual({
      state: 'INSUFFICIENT_DATA',
      reason: 'ABOVE_CALIBRATED_DOMAIN',
      dischargeCms: 401,
      requiredDatumId: 'datum:local:test',
      availableDatumId: 'datum:local:test',
      calibrationId: 'rating:station:test:v1',
      limitations: ['No extrapolation above the calibrated discharge domain.'],
    });
  });

  it('rejects curves that are not active or lack validation evidence', () => {
    expect(
      deriveStageFromRatingCurve(
        { ...curve(), status: 'CANDIDATE' },
        {
          dischargeCms: 200,
          requiredDatumId: 'datum:local:test',
        },
      ),
    ).toMatchObject({
      state: 'INSUFFICIENT_DATA',
      reason: 'INVALID_CURVE',
    });
  });
});

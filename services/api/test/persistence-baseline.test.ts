import { describe, expect, it } from 'vitest';

import { evaluatePersistenceBaseline } from '../src/modules/calibration/persistence-baseline.js';

describe('persistence stage baseline', () => {
  it('reports overall and lead-time MAE/RMSE on compatible held-out truth', () => {
    const result = evaluatePersistenceBaseline([
      {
        baselineStageM: 2.0,
        truthStageM: 2.2,
        baselineDatumId: 'VN-DATUM',
        truthDatumId: 'VN-DATUM',
        leadSeconds: 3600,
      },
      {
        baselineStageM: 2.0,
        truthStageM: 2.4,
        baselineDatumId: 'VN-DATUM',
        truthDatumId: 'VN-DATUM',
        leadSeconds: 7200,
      },
      {
        baselineStageM: 3.0,
        truthStageM: 2.8,
        baselineDatumId: 'VN-DATUM',
        truthDatumId: 'VN-DATUM',
        leadSeconds: 3600,
      },
    ]);

    expect(result.overall).toEqual({
      maeM: 0.26666666666666666,
      rmseM: expect.closeTo(Math.sqrt(0.08), 12),
      sampleCount: 3,
    });
    expect(result.byLeadSeconds).toEqual([
      {
        leadSeconds: 3600,
        metrics: {
          maeM: expect.closeTo(0.2, 12),
          rmseM: expect.closeTo(0.2, 12),
          sampleCount: 2,
        },
      },
      {
        leadSeconds: 7200,
        metrics: {
          maeM: expect.closeTo(0.4, 12),
          rmseM: expect.closeTo(0.4, 12),
          sampleCount: 1,
        },
      },
    ]);
    expect(result.rejectedDatumMismatchCount).toBe(0);
  });

  it('excludes incompatible datum pairs and reports the rejection count', () => {
    const result = evaluatePersistenceBaseline([
      {
        baselineStageM: 1,
        truthStageM: 1.5,
        baselineDatumId: 'DATUM-A',
        truthDatumId: 'DATUM-B',
        leadSeconds: 3600,
      },
      {
        baselineStageM: 1,
        truthStageM: 1.2,
        baselineDatumId: 'DATUM-A',
        truthDatumId: 'DATUM-A',
        leadSeconds: 3600,
      },
    ]);

    expect(result.overall).toEqual({
      maeM: expect.closeTo(0.2, 12),
      rmseM: expect.closeTo(0.2, 12),
      sampleCount: 1,
    });
    expect(result.rejectedDatumMismatchCount).toBe(1);
  });

  it('returns no metric when there is no compatible held-out truth', () => {
    expect(
      evaluatePersistenceBaseline([
        {
          baselineStageM: 1,
          truthStageM: 2,
          baselineDatumId: 'A',
          truthDatumId: 'B',
          leadSeconds: 3600,
        },
      ]),
    ).toEqual({
      overall: null,
      byLeadSeconds: [],
      rejectedDatumMismatchCount: 1,
    });
  });

  it('rejects invalid stage/lead inputs rather than hiding bad evaluation data', () => {
    expect(() =>
      evaluatePersistenceBaseline([
        {
          baselineStageM: Number.NaN,
          truthStageM: 2,
          baselineDatumId: 'A',
          truthDatumId: 'A',
          leadSeconds: 3600,
        },
      ]),
    ).toThrow();

    expect(() =>
      evaluatePersistenceBaseline([
        {
          baselineStageM: 1,
          truthStageM: 2,
          baselineDatumId: 'A',
          truthDatumId: 'A',
          leadSeconds: -1,
        },
      ]),
    ).toThrow();
  });
});

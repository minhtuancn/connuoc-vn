import { describe, expect, it } from 'vitest';

import type { RainfallRecord } from '@connuoc/shared-types';

import { deriveRainfallAccumulations } from '../src/rainfall-accumulation.js';

function record(
  id: string,
  validStart: string,
  validEnd: string,
  amountMm: number,
  sourceId = 'fixture-rain',
): RainfallRecord {
  return {
    id,
    productKind: 'SATELLITE_ESTIMATE',
    validStart,
    validEnd,
    accumulationSeconds:
      (Date.parse(validEnd) - Date.parse(validStart)) / 1000,
    amountMm,
    unit: 'mm',
    spatial: {
      representation: 'GRID_CELL',
      latitude: 19.5,
      longitude: 105.5,
      resolutionKm: 10,
      stationId: null,
    },
    quality: { state: 'VALID', flags: [] },
    source: {
      sourceId,
      providerConfigId: null,
      productId: 'fixture-product',
      productVersion: '1',
      modelRunAt: null,
      observedAt: validEnd,
      fetchedAt: '2026-09-17T03:05:00Z',
      attributionText: 'Fixture rainfall',
      attributionUrl: null,
    },
  };
}

describe('deriveRainfallAccumulations', () => {
  const complete = [
    record('r1', '2026-09-17T00:00:00Z', '2026-09-17T00:30:00Z', 1),
    record('r2', '2026-09-17T00:30:00Z', '2026-09-17T01:00:00Z', 2),
    record('r3', '2026-09-17T01:00:00Z', '2026-09-17T01:30:00Z', 0.5),
    record('r4', '2026-09-17T01:30:00Z', '2026-09-17T02:00:00Z', 1.5),
    record('r5', '2026-09-17T02:00:00Z', '2026-09-17T02:30:00Z', 1),
    record('r6', '2026-09-17T02:30:00Z', '2026-09-17T03:00:00Z', 2),
  ];

  it('derives exact 1h and 3h windows ending at the requested instant', () => {
    const result = deriveRainfallAccumulations(
      complete,
      '2026-09-17T03:00:00Z',
      [3600, 10800],
      'rainfall-accum-v1',
    );

    expect(result[0]).toMatchObject({
      windowSeconds: 3600,
      amountMm: 3,
      coverageRatio: 1,
      complete: true,
      derivationVersion: 'rainfall-accum-v1',
      inputRecordIds: ['r5', 'r6'],
      sourceIds: ['fixture-rain'],
    });
    expect(result[1]).toMatchObject({
      windowSeconds: 10800,
      amountMm: 8,
      coverageRatio: 1,
      complete: true,
      inputRecordIds: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
    });
  });

  it('marks a window incomplete when an interval is missing instead of inventing rainfall', () => {
    const result = deriveRainfallAccumulations(
      complete.filter((item) => item.id !== 'r5'),
      '2026-09-17T03:00:00Z',
      [3600],
      'rainfall-accum-v1',
    );

    expect(result[0]).toMatchObject({
      amountMm: 2,
      coverageRatio: 0.5,
      complete: false,
      inputRecordIds: ['r6'],
    });
  });

  it('uses the open-left, closed-right window boundary', () => {
    const result = deriveRainfallAccumulations(
      complete,
      '2026-09-17T03:00:00Z',
      [3600],
      'rainfall-accum-v1',
    );
    expect(result[0]?.inputRecordIds).toEqual(['r5', 'r6']);
  });

  it('preserves deterministic unique source lineage', () => {
    const mixed = [
      ...complete.slice(0, 4),
      record('r5', '2026-09-17T02:00:00Z', '2026-09-17T02:30:00Z', 1, 'source-b'),
      record('r6', '2026-09-17T02:30:00Z', '2026-09-17T03:00:00Z', 2, 'source-a'),
    ];
    const result = deriveRainfallAccumulations(
      mixed,
      '2026-09-17T03:00:00Z',
      [3600],
      'rainfall-accum-v1',
    );
    expect(result[0]?.sourceIds).toEqual(['source-a', 'source-b']);
  });

  it('rejects overlapping intervals so rainfall cannot be double-counted', () => {
    expect(() =>
      deriveRainfallAccumulations(
        [
          record('a', '2026-09-17T02:00:00Z', '2026-09-17T02:45:00Z', 1),
          record('b', '2026-09-17T02:30:00Z', '2026-09-17T03:00:00Z', 1),
        ],
        '2026-09-17T03:00:00Z',
        [3600],
        'rainfall-accum-v1',
      ),
    ).toThrow(/overlap/i);
  });
});

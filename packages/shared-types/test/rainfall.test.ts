import { describe, expect, it } from 'vitest';

import { RainfallRecordSchema } from '../src/rainfall.js';

function satelliteRecord() {
  return {
    id: 'rain:fixture:1',
    productKind: 'SATELLITE_ESTIMATE' as const,
    validStart: '2026-09-17T01:30:00Z',
    validEnd: '2026-09-17T02:00:00Z',
    accumulationSeconds: 1800,
    amountMm: 4.2,
    unit: 'mm' as const,
    spatial: {
      representation: 'GRID_CELL' as const,
      latitude: 19.5,
      longitude: 105.5,
      resolutionKm: 10,
      stationId: null,
    },
    quality: { state: 'VALID' as const, flags: [] },
    source: {
      sourceId: 'nasa-gpm-imerg',
      providerConfigId: null,
      productId: 'IMERG-Early',
      productVersion: 'V07B',
      modelRunAt: null,
      observedAt: '2026-09-17T02:00:00Z',
      fetchedAt: '2026-09-17T02:10:00Z',
      attributionText: 'NASA GPM IMERG',
      attributionUrl: 'https://gpm.nasa.gov/data/imerg',
    },
  };
}

describe('rainfall shared contracts', () => {
  it('accepts a satellite estimate with explicit interval, resolution and provenance', () => {
    expect(RainfallRecordSchema.parse(satelliteRecord())).toMatchObject({
      productKind: 'SATELLITE_ESTIMATE',
      accumulationSeconds: 1800,
      amountMm: 4.2,
      spatial: { representation: 'GRID_CELL', resolutionKm: 10 },
      source: { sourceId: 'nasa-gpm-imerg', productId: 'IMERG-Early' },
    });
  });

  it('rejects non-positive valid intervals', () => {
    const record = satelliteRecord();
    expect(() =>
      RainfallRecordSchema.parse({ ...record, validStart: record.validEnd }),
    ).toThrow();
  });

  it('rejects accumulationSeconds that disagree with the valid interval', () => {
    expect(() =>
      RainfallRecordSchema.parse({ ...satelliteRecord(), accumulationSeconds: 3600 }),
    ).toThrow();
  });

  it('rejects negative rainfall', () => {
    expect(() => RainfallRecordSchema.parse({ ...satelliteRecord(), amountMm: -0.1 })).toThrow();
  });

  it('requires gauge observations to use GAUGE spatial metadata and a station id', () => {
    const record = satelliteRecord();
    expect(() =>
      RainfallRecordSchema.parse({
        ...record,
        productKind: 'GAUGE_OBSERVATION',
      }),
    ).toThrow();

    expect(
      RainfallRecordSchema.parse({
        ...record,
        productKind: 'GAUGE_OBSERVATION',
        spatial: {
          representation: 'GAUGE',
          latitude: 19.5,
          longitude: 105.5,
          resolutionKm: null,
          stationId: 'station:rain:001',
        },
      }).spatial.stationId,
    ).toBe('station:rain:001');
  });

  it('does not allow estimated/model products to masquerade as gauge records', () => {
    const record = satelliteRecord();
    expect(() =>
      RainfallRecordSchema.parse({
        ...record,
        spatial: {
          representation: 'GAUGE',
          latitude: 19.5,
          longitude: 105.5,
          resolutionKm: null,
          stationId: 'station:rain:001',
        },
      }),
    ).toThrow();
  });
});

import { describe, expect, it } from 'vitest';

import {
  BasinSchema,
  CoordinateSchema,
  DataQualitySchema,
  DataSourceSchema,
  DatumSchema,
  ForecastRunSchema,
  IsoInstantSchema,
  StationSchema,
  WaterLevelObservationSchema,
} from '../src/index.ts';

const source = {
  id: 'nchmf',
  name: 'National reference source',
  authority: 'authoritative',
  accessMethod: 'publication',
  redistribution: 'validation_only',
} as const;

const datum = {
  id: 'datum:local-001',
  name: 'Local gauge datum',
  kind: 'local_gauge',
  unit: 'm',
  sourceId: 'nchmf',
} as const;

const station = {
  id: 'station:nghia-phong-test',
  name: 'Nghĩa Phong test station',
  aliases: ['Nghia Phong'],
  type: 'water_level',
  status: 'active',
  coordinate: { latitude: 20.08, longitude: 106.18 },
  timeZone: 'Asia/Ho_Chi_Minh',
  datumId: 'datum:local-001',
  basinId: 'basin:ninh-co',
  sourceIds: ['nchmf'],
} as const;

describe('shared domain contracts', () => {
  it('accepts traceable source, datum and station metadata', () => {
    expect(DataSourceSchema.parse(source).id).toBe('nchmf');
    expect(DatumSchema.parse(datum).unit).toBe('m');
    expect(StationSchema.parse(station).timeZone).toBe('Asia/Ho_Chi_Minh');
  });

  it('applies defaults for collection/status fields', () => {
    const basin = BasinSchema.parse({ id: 'basin:ninh-co', name: 'Ninh Cơ' });
    expect(basin.aliases).toEqual([]);
    expect(basin.sourceIds).toEqual([]);
  });

  it('rejects coordinates outside geographic bounds', () => {
    expect(CoordinateSchema.safeParse({ latitude: 91, longitude: 106 }).success).toBe(false);
    expect(CoordinateSchema.safeParse({ latitude: 20, longitude: 181 }).success).toBe(false);
  });

  it('requires an explicit timezone that the runtime recognizes', () => {
    expect(StationSchema.safeParse({ ...station, timeZone: 'Vietnam/Local' }).success).toBe(false);
    expect(StationSchema.safeParse({ ...station, timeZone: 'UTC' }).success).toBe(true);
  });

  it('requires ISO timestamps with an explicit offset', () => {
    expect(IsoInstantSchema.safeParse('2026-09-15T10:00:00Z').success).toBe(true);
    expect(IsoInstantSchema.safeParse('2026-09-15T17:00:00+07:00').success).toBe(true);
    expect(IsoInstantSchema.safeParse('2026-09-15T17:00:00').success).toBe(false);
  });

  it('does not allow a water-level observation to omit datum or source', () => {
    const observation = {
      stationId: station.id,
      observedAt: '2026-09-15T17:00:00+07:00',
      value: 1.42,
      unit: 'm',
      datumId: datum.id,
      sourceId: source.id,
      origin: 'observed',
    } as const;

    expect(WaterLevelObservationSchema.safeParse(observation).success).toBe(true);
    expect(
      WaterLevelObservationSchema.safeParse({
        stationId: observation.stationId,
        observedAt: observation.observedAt,
        value: observation.value,
        unit: observation.unit,
        sourceId: observation.sourceId,
        origin: observation.origin,
      }).success,
    ).toBe(false);
  });

  it('validates forecast time ranges and explicit prediction metadata', () => {
    const run = {
      id: 'forecast:tide-20260915',
      stationId: station.id,
      kind: 'astronomical_tide',
      modelId: 'harmonic-v1',
      generatedAt: '2026-09-15T00:00:00Z',
      validFrom: '2026-09-15T00:00:00Z',
      validTo: '2026-09-16T00:00:00Z',
      unit: 'm',
      datumId: datum.id,
    } as const;

    expect(ForecastRunSchema.safeParse(run).success).toBe(true);
    expect(
      ForecastRunSchema.safeParse({
        ...run,
        validFrom: '2026-09-16T00:00:00Z',
        validTo: '2026-09-15T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('bounds quality confidence and uses typed quality flags', () => {
    expect(DataQualitySchema.safeParse({ confidence: 0.9, flags: ['stale'] }).success).toBe(true);
    expect(DataQualitySchema.safeParse({ confidence: 1.1, flags: [] }).success).toBe(false);
    expect(DataQualitySchema.safeParse({ confidence: 0.5, flags: ['made_up_flag'] }).success).toBe(false);
  });
});

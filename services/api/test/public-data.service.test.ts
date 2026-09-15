import { describe, expect, it } from 'vitest';

import { PublicDataService } from '../src/modules/public-data/public-data.service.js';
import type {
  PublicDataRepository,
  StationRecord,
  TideModelRecord,
  WaterLevelPageRecord,
} from '../src/modules/public-data/public-data.types.js';

const station: StationRecord = {
  publicId: 'fixture-station',
  name: 'Fixture Station',
  stationType: 'water_level',
  timeZone: 'Asia/Ho_Chi_Minh',
  latitude: 20.25,
  longitude: 106.08,
  defaultDatumId: 'local-gauge-fixture',
  aliases: ['Tram thu nghiem'],
  provenance: {
    sourceKey: 'fixture-water-level',
    importRunId: 'import-run-1',
    rawChecksumSha256: 'a'.repeat(64),
    parserVersion: 'fixture-water-level@1',
    normalizerVersion: 'water-level-canonical@1',
    observedAt: '2026-09-15T00:00:00.000Z',
  },
};

const tideModel: TideModelRecord = {
  stationPublicId: station.publicId,
  stationTimeZone: station.timeZone,
  modelId: 'fixture-harmonic',
  modelVersion: '1.0.0',
  datumId: 'local-gauge-fixture',
  unit: 'm',
  meanLevel: 1,
  referenceEpochUtc: '2026-01-01T00:00:00.000Z',
  phaseConvention: 'cosine_lag_degrees',
  constituents: [
    {
      name: 'M2',
      amplitude: 0.5,
      phaseDegrees: 0,
      speedDegreesPerHour: 28.9841042,
    },
  ],
  provenance: {
    sourceKey: 'fixture-water-level',
    importRunId: 'import-run-model-1',
  },
};

class FakeRepository implements PublicDataRepository {
  async searchLocations() {
    return { items: [station], hasMore: false };
  }

  async findStation(publicId: string) {
    return publicId === station.publicId ? station : null;
  }

  async listWaterLevels(): Promise<WaterLevelPageRecord> {
    return {
      station,
      hasMore: false,
      items: [
        {
          sourceRecordKey: 'obs-1',
          observedAt: '2026-09-15T00:00:00.000Z',
          value: 123.4,
          unit: 'cm',
          datumId: 'local-gauge-fixture',
          qualityState: 'GOOD',
          provenance: station.provenance!,
        },
      ],
    };
  }

  async findActiveTideModel(publicId: string) {
    return publicId === station.publicId ? tideModel : null;
  }
}

const fixedNow = () => new Date('2026-09-15T12:00:00.000Z');

describe('PublicDataService', () => {
  it('preserves station provenance and explicit datum metadata', async () => {
    const service = new PublicDataService(new FakeRepository(), fixedNow);
    const result = await service.getStation('fixture-station');

    expect(result).toMatchObject({
      id: 'fixture-station',
      defaultDatumId: 'local-gauge-fixture',
      provenance: {
        sourceKey: 'fixture-water-level',
        importRunId: 'import-run-1',
        rawChecksumSha256: 'a'.repeat(64),
      },
      meta: { generatedAt: '2026-09-15T12:00:00.000Z' },
    });
  });

  it('returns water-level records with observation provenance and deterministic pagination metadata', async () => {
    const service = new PublicDataService(new FakeRepository(), fixedNow);
    const result = await service.getWaterLevels('fixture-station', {
      limit: 20,
      offset: 0,
      startUtc: null,
      endUtc: null,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      value: 123.4,
      unit: 'cm',
      datumId: 'local-gauge-fixture',
      provenance: { parserVersion: 'fixture-water-level@1' },
    });
    expect(result.meta).toEqual({
      generatedAt: '2026-09-15T12:00:00.000Z',
      latestObservedAt: '2026-09-15T00:00:00.000Z',
      nextCursor: null,
    });
  });

  it('delegates tide prediction to the harmonic engine and exposes model provenance', async () => {
    const service = new PublicDataService(new FakeRepository(), fixedNow);
    const result = await service.getTide('fixture-station', {
      startUtc: '2026-01-01T00:00:00.000Z',
      endUtc: '2026-01-01T02:00:00.000Z',
      intervalSeconds: 3600,
    });

    expect(result.points).toHaveLength(3);
    expect(result.points[0]?.value).toBeCloseTo(1.5, 10);
    expect(result.meta).toMatchObject({
      generatedAt: '2026-09-15T12:00:00.000Z',
      modelId: 'fixture-harmonic',
      modelVersion: '1.0.0',
      datumId: 'local-gauge-fixture',
      unit: 'm',
      timeZone: 'Asia/Ho_Chi_Minh',
      provenance: { sourceKey: 'fixture-water-level', importRunId: 'import-run-model-1' },
    });
  });

  it('delegates Gregorian conversion to the Vietnamese lunar-calendar package', () => {
    const service = new PublicDataService(new FakeRepository(), fixedNow);
    expect(service.getCalendar({ year: 2024, month: 2, day: 10 })).toEqual({
      solarDate: { year: 2024, month: 2, day: 10 },
      lunarDate: { year: 2024, month: 1, day: 1, isLeapMonth: false },
      timeZone: 'Asia/Ho_Chi_Minh',
      meta: { generatedAt: '2026-09-15T12:00:00.000Z' },
    });
  });
});

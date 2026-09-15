import { predictTide, type HarmonicTideModel } from '@connuoc/tide-engine';
import {
  solarToLunar,
  VIETNAM_LUNAR_TIME_ZONE,
  type SolarDate,
} from '@connuoc/lunar-calendar';

import {
  PublicDataError,
  type PageInput,
  type PublicDataRepository,
  type TideQueryInput,
  type WaterLevelQueryInput,
} from './public-data.types.js';

function encodeOffsetCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url');
}

export class PublicDataService {
  constructor(
    private readonly repository: PublicDataRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private generatedAt(): string {
    return this.clock().toISOString();
  }

  async searchLocations(query: string, page: PageInput) {
    const result = await this.repository.searchLocations(query, page.limit, page.offset);
    return {
      items: result.items.map((item) => ({
        id: item.publicId,
        name: item.name,
        stationType: item.stationType,
        timeZone: item.timeZone,
        location: { latitude: item.latitude, longitude: item.longitude },
        aliases: item.aliases,
      })),
      meta: {
        generatedAt: this.generatedAt(),
        nextCursor: result.hasMore ? encodeOffsetCursor(page.offset + page.limit) : null,
      },
    };
  }

  async getStation(publicId: string) {
    const station = await this.repository.findStation(publicId);
    if (!station) {
      throw new PublicDataError('STATION_NOT_FOUND', `Station '${publicId}' was not found.`);
    }

    return {
      id: station.publicId,
      name: station.name,
      stationType: station.stationType,
      timeZone: station.timeZone,
      location: { latitude: station.latitude, longitude: station.longitude },
      aliases: station.aliases,
      defaultDatumId: station.defaultDatumId,
      provenance: station.provenance,
      meta: { generatedAt: this.generatedAt() },
    };
  }

  async getWaterLevels(publicId: string, query: WaterLevelQueryInput) {
    const page = await this.repository.listWaterLevels({ publicId, ...query });
    if (!page) {
      throw new PublicDataError('STATION_NOT_FOUND', `Station '${publicId}' was not found.`);
    }

    const latestObservedAt = page.items[0]?.observedAt ?? null;
    return {
      station: {
        id: page.station.publicId,
        name: page.station.name,
        timeZone: page.station.timeZone,
        defaultDatumId: page.station.defaultDatumId,
      },
      items: page.items,
      meta: {
        generatedAt: this.generatedAt(),
        latestObservedAt,
        nextCursor: page.hasMore ? encodeOffsetCursor(query.offset + query.limit) : null,
      },
    };
  }

  async getTide(publicId: string, query: TideQueryInput) {
    const storedModel = await this.repository.findActiveTideModel(publicId);
    if (!storedModel) {
      throw new PublicDataError(
        'TIDE_MODEL_NOT_FOUND',
        `No active harmonic tide model is available for station '${publicId}'.`,
      );
    }

    const model: HarmonicTideModel = {
      modelId: storedModel.modelId,
      ...(storedModel.modelVersion === null ? {} : { modelVersion: storedModel.modelVersion }),
      stationId: storedModel.stationPublicId,
      datumId: storedModel.datumId,
      unit: storedModel.unit,
      meanLevel: storedModel.meanLevel,
      referenceEpochUtc: storedModel.referenceEpochUtc,
      phaseConvention: storedModel.phaseConvention,
      constituents: storedModel.constituents,
    };

    try {
      const prediction = predictTide({
        model,
        startUtc: query.startUtc,
        endUtc: query.endUtc,
        intervalSeconds: query.intervalSeconds,
        timeZone: storedModel.stationTimeZone,
      });

      return {
        stationId: storedModel.stationPublicId,
        startUtc: prediction.startUtc,
        endUtc: prediction.endUtc,
        intervalSeconds: prediction.intervalSeconds,
        points: prediction.points,
        meta: {
          generatedAt: this.generatedAt(),
          modelId: prediction.metadata.modelId,
          modelVersion: prediction.metadata.modelVersion ?? null,
          datumId: prediction.metadata.datumId,
          unit: prediction.metadata.unit,
          timeZone: prediction.metadata.timeZone,
          phaseConvention: prediction.metadata.phaseConvention,
          referenceEpochUtc: prediction.metadata.referenceEpochUtc,
          constituentCount: prediction.metadata.constituentCount,
          provenance: storedModel.provenance,
        },
      };
    } catch (error) {
      throw new PublicDataError(
        'INVALID_TIDE_MODEL',
        `Stored tide model for station '${publicId}' is incompatible with the deterministic tide engine.`,
        { cause: error },
      );
    }
  }

  getCalendar(solarDate: SolarDate) {
    return {
      solarDate,
      lunarDate: solarToLunar(solarDate),
      timeZone: VIETNAM_LUNAR_TIME_ZONE,
      meta: { generatedAt: this.generatedAt() },
    };
  }
}

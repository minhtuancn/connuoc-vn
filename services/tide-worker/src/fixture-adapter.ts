import { readFile } from 'node:fs/promises';

import {
  DatumIdSchema,
  IsoInstantSchema,
  StationTypeSchema,
  TimeZoneSchema,
  WaterLevelUnitSchema,
} from '@connuoc/shared-types';
import { z } from 'zod';

import type {
  NormalizedImportBatch,
  RawSourcePayload,
  SourceAdapter,
} from './contracts.js';

const QualityStateSchema = z.enum(['GOOD', 'SUSPECT', 'BAD', 'UNKNOWN']);

const HeaderSchema = z
  .object({
    sourceKey: z.string().trim().min(1).max(160),
    payloadKey: z.string().trim().min(1).max(300),
    capturedAt: IsoInstantSchema,
  })
  .passthrough();

const FixtureDocumentSchema = z
  .object({
    sourceKey: z.string().trim().min(1).max(160),
    payloadKey: z.string().trim().min(1).max(300),
    capturedAt: IsoInstantSchema,
    station: z
      .object({
        publicId: z.string().trim().min(1).max(128),
        name: z.string().trim().min(1).max(160),
        stationType: StationTypeSchema,
        timeZone: TimeZoneSchema,
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
        defaultDatumId: DatumIdSchema.optional(),
      })
      .strict(),
    observations: z
      .array(
        z
          .object({
            sourceRecordKey: z.string().trim().min(1).max(300),
            observedAt: IsoInstantSchema,
            value: z.number().finite(),
            unit: WaterLevelUnitSchema,
            datumId: DatumIdSchema.optional(),
            qualityState: QualityStateSchema.default('UNKNOWN'),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type FixtureWaterLevelDocument = z.infer<typeof FixtureDocumentSchema>;

export class FixtureWaterLevelAdapter implements SourceAdapter<FixtureWaterLevelDocument> {
  readonly sourceName = 'Repository water-level fixture';
  readonly sourceType = 'fixture';
  readonly adapterVersion = 'fixture-adapter-v1';
  readonly parserVersion = 'fixture-parser-v1';
  readonly normalizerVersion = 'water-level-normalizer-v1';

  constructor(private readonly fixtureUrl: URL) {}

  get sourceKey(): string {
    return 'fixture-water-level';
  }

  async read(): Promise<RawSourcePayload> {
    const bytes = await readFile(this.fixtureUrl);
    const header = HeaderSchema.parse(JSON.parse(bytes.toString('utf8')));

    return {
      sourceKey: header.sourceKey,
      payloadKey: header.payloadKey,
      capturedAt: header.capturedAt,
      mediaType: 'application/json',
      storageUri: this.fixtureUrl.toString(),
      bytes,
    };
  }

  parse(raw: RawSourcePayload): FixtureWaterLevelDocument {
    const document = FixtureDocumentSchema.parse(
      JSON.parse(Buffer.from(raw.bytes).toString('utf8')),
    );

    if (document.sourceKey !== raw.sourceKey || document.payloadKey !== raw.payloadKey) {
      throw new Error('Fixture payload identity changed between read and parse');
    }

    return document;
  }

  normalize(parsed: FixtureWaterLevelDocument): NormalizedImportBatch {
    return {
      station: {
        publicId: parsed.station.publicId,
        name: parsed.station.name,
        stationType: parsed.station.stationType,
        timeZone: parsed.station.timeZone,
        latitude: parsed.station.latitude,
        longitude: parsed.station.longitude,
        ...(parsed.station.defaultDatumId === undefined
          ? {}
          : { defaultDatumId: parsed.station.defaultDatumId }),
      },
      observations: parsed.observations.map((observation) => ({
        sourceRecordKey: observation.sourceRecordKey,
        observedAt: observation.observedAt,
        value: observation.value,
        unit: observation.unit,
        ...(observation.datumId === undefined ? {} : { datumId: observation.datumId }),
        qualityState: observation.qualityState,
      })),
    };
  }
}

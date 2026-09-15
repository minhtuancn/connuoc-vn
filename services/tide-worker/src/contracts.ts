import type { StationType, WaterLevelUnit } from '@connuoc/shared-types';

export type ObservationQualityState = 'GOOD' | 'SUSPECT' | 'BAD' | 'UNKNOWN';

export interface RawSourcePayload {
  readonly sourceKey: string;
  readonly payloadKey: string;
  readonly capturedAt: string;
  readonly mediaType: string;
  readonly storageUri: string;
  readonly bytes: Uint8Array;
}

export interface NormalizedStation {
  readonly publicId: string;
  readonly name: string;
  readonly stationType: StationType;
  readonly timeZone: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly defaultDatumId?: string;
}

export interface NormalizedObservation {
  readonly sourceRecordKey: string;
  readonly observedAt: string;
  readonly value: number;
  readonly unit: WaterLevelUnit;
  readonly datumId?: string;
  readonly qualityState: ObservationQualityState;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NormalizedImportBatch {
  readonly station: NormalizedStation;
  readonly observations: readonly NormalizedObservation[];
}

export interface SourceAdapter<TParsed = unknown> {
  readonly sourceKey: string;
  readonly sourceName: string;
  readonly sourceType: string;
  readonly adapterVersion: string;
  readonly parserVersion: string;
  readonly normalizerVersion: string;
  read(): Promise<RawSourcePayload>;
  parse(raw: RawSourcePayload): TParsed;
  normalize(parsed: TParsed): NormalizedImportBatch;
}

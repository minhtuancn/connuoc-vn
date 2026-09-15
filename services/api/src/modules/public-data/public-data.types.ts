export type WaterLevelUnit = 'm' | 'cm' | 'mm';
export type QualityState = 'GOOD' | 'SUSPECT' | 'BAD' | 'UNKNOWN';
export type HarmonicPhaseConvention = 'cosine_lag_degrees' | 'cosine_lead_degrees';

export interface ObservationProvenance {
  readonly sourceKey: string;
  readonly importRunId: string;
  readonly rawChecksumSha256: string;
  readonly parserVersion: string;
  readonly normalizerVersion: string;
  readonly observedAt: string;
}

export interface ModelProvenance {
  readonly sourceKey: string | null;
  readonly importRunId: string | null;
}

export interface LocationRecord {
  readonly publicId: string;
  readonly name: string;
  readonly stationType: string;
  readonly timeZone: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly aliases: readonly string[];
}

export interface StationRecord extends LocationRecord {
  readonly defaultDatumId: string | null;
  readonly provenance: ObservationProvenance | null;
}

export interface WaterLevelRecord {
  readonly sourceRecordKey: string;
  readonly observedAt: string;
  readonly value: number;
  readonly unit: WaterLevelUnit;
  readonly datumId: string | null;
  readonly qualityState: QualityState;
  readonly provenance: ObservationProvenance;
}

export interface WaterLevelPageRecord {
  readonly station: StationRecord;
  readonly items: readonly WaterLevelRecord[];
  readonly hasMore: boolean;
}

export interface HarmonicConstituentRecord {
  readonly name: string;
  readonly amplitude: number;
  readonly phaseDegrees: number;
  readonly speedDegreesPerHour: number;
}

export interface TideModelRecord {
  readonly stationPublicId: string;
  readonly stationTimeZone: string;
  readonly modelId: string;
  readonly modelVersion: string | null;
  readonly datumId: string;
  readonly unit: WaterLevelUnit;
  readonly meanLevel: number;
  readonly referenceEpochUtc: string;
  readonly phaseConvention: HarmonicPhaseConvention;
  readonly constituents: readonly HarmonicConstituentRecord[];
  readonly provenance: ModelProvenance;
}

export interface SearchPageRecord {
  readonly items: readonly LocationRecord[];
  readonly hasMore: boolean;
}

export interface PublicDataRepository {
  searchLocations(query: string, limit: number, offset: number): Promise<SearchPageRecord>;
  findStation(publicId: string): Promise<StationRecord | null>;
  listWaterLevels(input: {
    publicId: string;
    startUtc: string | null;
    endUtc: string | null;
    limit: number;
    offset: number;
  }): Promise<WaterLevelPageRecord | null>;
  findActiveTideModel(publicId: string): Promise<TideModelRecord | null>;
}

export type PublicDataErrorCode =
  | 'STATION_NOT_FOUND'
  | 'TIDE_MODEL_NOT_FOUND'
  | 'INVALID_TIDE_MODEL'
  | 'DATABASE_UNAVAILABLE';

export class PublicDataError extends Error {
  override readonly name = 'PublicDataError';

  constructor(
    readonly code: PublicDataErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export interface PageInput {
  readonly limit: number;
  readonly offset: number;
}

export interface WaterLevelQueryInput extends PageInput {
  readonly startUtc: string | null;
  readonly endUtc: string | null;
}

export interface TideQueryInput {
  readonly startUtc: string;
  readonly endUtc: string;
  readonly intervalSeconds: number;
}

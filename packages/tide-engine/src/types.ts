export type TideUnit = 'm' | 'cm' | 'mm';

/** Phase convention is explicit because source tables do not all encode phase identically. */
export type HarmonicPhaseConvention = 'cosine_lag_degrees' | 'cosine_lead_degrees';

export interface HarmonicConstituent {
  readonly name: string;
  readonly amplitude: number;
  /** Phase in degrees, normalized to [0, 360). */
  readonly phaseDegrees: number;
  /** Angular speed in degrees per mean solar hour. */
  readonly speedDegreesPerHour: number;
}

export interface HarmonicTideModel {
  readonly modelId: string;
  readonly modelVersion?: string;
  readonly stationId: string;
  readonly datumId: string;
  readonly unit: TideUnit;
  /** Constant datum-relative mean/offset in the same unit as amplitudes. */
  readonly meanLevel: number;
  /** Explicit instant to which constituent phases refer. */
  readonly referenceEpochUtc: string;
  readonly phaseConvention: HarmonicPhaseConvention;
  readonly constituents: readonly HarmonicConstituent[];
}

export interface TidePredictionRequest {
  readonly model: HarmonicTideModel;
  readonly startUtc: string;
  readonly endUtc: string;
  /** Positive sampling interval in seconds. */
  readonly intervalSeconds: number;
  /** IANA timezone preserved as presentation metadata. Prediction timestamps remain UTC. */
  readonly timeZone: string;
}

export interface TidePredictionPoint {
  readonly timestampUtc: string;
  readonly value: number;
}

export interface TidePredictionMetadata {
  readonly modelId: string;
  readonly modelVersion?: string;
  readonly stationId: string;
  readonly datumId: string;
  readonly unit: TideUnit;
  readonly phaseConvention: HarmonicPhaseConvention;
  readonly referenceEpochUtc: string;
  readonly timeZone: string;
  readonly constituentCount: number;
}

export interface TidePrediction {
  readonly metadata: TidePredictionMetadata;
  readonly startUtc: string;
  readonly endUtc: string;
  readonly intervalSeconds: number;
  readonly points: readonly TidePredictionPoint[];
}

export type TideExtremumKind = 'HIGH' | 'LOW';
export type TideExtremumRefinement = 'quadratic' | 'sample' | 'plateau';

export interface TideExtremum {
  readonly kind: TideExtremumKind;
  readonly timestampUtc: string;
  readonly value: number;
  readonly refinement: TideExtremumRefinement;
}

export interface ExtremaOptions {
  /** Absolute value difference treated as flat. Defaults to 1e-12 in series units. */
  readonly flatTolerance?: number;
}

export type WaterState =
  | 'RISING'
  | 'FALLING'
  | 'NEAR_HIGH_STAND'
  | 'NEAR_LOW_STAND'
  | 'UNKNOWN';

/** Thresholds belong to a model/version or caller policy, never presentation logic. */
export interface WaterStateConfig {
  readonly standSlopeThresholdPerHour: number;
  readonly extremumWindowSeconds: number;
  readonly flatTolerance?: number;
}

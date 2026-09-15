import { TideInputError } from './errors.js';
import type { HarmonicTideModel, TidePredictionRequest } from './types.js';

const EXPLICIT_ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;
export const MAX_PREDICTION_POINTS = 1_000_000;

export function parseExplicitInstant(value: string, field: string): number {
  if (!EXPLICIT_ISO_INSTANT.test(value)) {
    throw new TideInputError(
      'INVALID_TIMESTAMP',
      `${field} must be an ISO-8601 timestamp with an explicit UTC designator or offset`,
      field,
    );
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new TideInputError('INVALID_TIMESTAMP', `${field} is not a valid timestamp`, field);
  }
  return parsed;
}

export function assertTimeZone(value: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
  } catch {
    throw new TideInputError('INVALID_TIMEZONE', `Unknown IANA timezone: ${value}`, 'timeZone');
  }
}

function assertFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new TideInputError('INVALID_MODEL', `${field} must be finite`, field);
  }
}

export function validateHarmonicModel(model: HarmonicTideModel): number {
  if (model.modelId.trim().length === 0 || model.stationId.trim().length === 0 || model.datumId.trim().length === 0) {
    throw new TideInputError('INVALID_MODEL', 'modelId, stationId and datumId must be non-empty');
  }
  if (!['m', 'cm', 'mm'].includes(model.unit)) {
    throw new TideInputError('INVALID_MODEL', `Unsupported tide unit: ${model.unit}`, 'unit');
  }
  if (!['cosine_lag_degrees', 'cosine_lead_degrees'].includes(model.phaseConvention)) {
    throw new TideInputError('INVALID_MODEL', `Unsupported phase convention: ${String(model.phaseConvention)}`, 'phaseConvention');
  }

  assertFinite(model.meanLevel, 'meanLevel');
  const referenceEpochMs = parseExplicitInstant(model.referenceEpochUtc, 'referenceEpochUtc');

  if (model.constituents.length === 0) {
    throw new TideInputError('INVALID_MODEL', 'At least one harmonic constituent is required', 'constituents');
  }

  const names = new Set<string>();
  model.constituents.forEach((constituent, index) => {
    const prefix = `constituents[${index}]`;
    const name = constituent.name.trim();
    if (name.length === 0) {
      throw new TideInputError('INVALID_CONSTITUENT', `${prefix}.name must be non-empty`, `${prefix}.name`);
    }
    if (names.has(name)) {
      throw new TideInputError('INVALID_CONSTITUENT', `Duplicate constituent name: ${name}`, `${prefix}.name`);
    }
    names.add(name);

    if (!Number.isFinite(constituent.amplitude) || constituent.amplitude < 0) {
      throw new TideInputError('INVALID_CONSTITUENT', `${prefix}.amplitude must be finite and non-negative`, `${prefix}.amplitude`);
    }
    if (!Number.isFinite(constituent.phaseDegrees) || constituent.phaseDegrees < 0 || constituent.phaseDegrees >= 360) {
      throw new TideInputError('INVALID_CONSTITUENT', `${prefix}.phaseDegrees must be in [0, 360)`, `${prefix}.phaseDegrees`);
    }
    if (!Number.isFinite(constituent.speedDegreesPerHour) || constituent.speedDegreesPerHour <= 0) {
      throw new TideInputError(
        'INVALID_CONSTITUENT',
        `${prefix}.speedDegreesPerHour must be finite and positive`,
        `${prefix}.speedDegreesPerHour`,
      );
    }
  });

  return referenceEpochMs;
}

export function validatePredictionRequest(request: TidePredictionRequest): {
  readonly startMs: number;
  readonly endMs: number;
  readonly referenceEpochMs: number;
  readonly intervalMs: number;
  readonly pointCount: number;
} {
  const referenceEpochMs = validateHarmonicModel(request.model);
  const startMs = parseExplicitInstant(request.startUtc, 'startUtc');
  const endMs = parseExplicitInstant(request.endUtc, 'endUtc');
  assertTimeZone(request.timeZone);

  if (endMs < startMs) {
    throw new TideInputError('INVALID_RANGE', 'endUtc must be at or after startUtc', 'endUtc');
  }
  if (!Number.isInteger(request.intervalSeconds) || request.intervalSeconds <= 0) {
    throw new TideInputError('INVALID_INTERVAL', 'intervalSeconds must be a positive integer', 'intervalSeconds');
  }

  const intervalMs = request.intervalSeconds * 1_000;
  const pointCount = Math.floor((endMs - startMs) / intervalMs) + 1;
  if (pointCount > MAX_PREDICTION_POINTS) {
    throw new TideInputError(
      'TOO_MANY_POINTS',
      `Prediction would create ${pointCount} points; maximum is ${MAX_PREDICTION_POINTS}`,
    );
  }

  return { startMs, endMs, referenceEpochMs, intervalMs, pointCount };
}

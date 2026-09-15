import type {
  HarmonicTideModel,
  TidePrediction,
  TidePredictionPoint,
  TidePredictionRequest,
} from './types.js';
import { parseExplicitInstant, validateHarmonicModel, validatePredictionRequest } from './validation.js';

const MILLISECONDS_PER_HOUR = 3_600_000;
const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Evaluate the deterministic harmonic model at one instant.
 *
 * `cosine_lag_degrees`: h = Z0 + Σ A cos(ωΔt - g)
 * `cosine_lead_degrees`: h = Z0 + Σ A cos(ωΔt + g)
 */
export function predictTideLevelAt(model: HarmonicTideModel, atUtc: string): number {
  const referenceEpochMs = validateHarmonicModel(model);
  const atMs = parseExplicitInstant(atUtc, 'atUtc');
  const elapsedHours = (atMs - referenceEpochMs) / MILLISECONDS_PER_HOUR;
  const phaseSign = model.phaseConvention === 'cosine_lag_degrees' ? -1 : 1;

  return model.constituents.reduce((level, constituent) => {
    const angleDegrees = constituent.speedDegreesPerHour * elapsedHours + phaseSign * constituent.phaseDegrees;
    return level + constituent.amplitude * Math.cos(angleDegrees * DEGREES_TO_RADIANS);
  }, model.meanLevel);
}

export function predictTide(request: TidePredictionRequest): TidePrediction {
  const { startMs, referenceEpochMs, intervalMs, pointCount } = validatePredictionRequest(request);
  const { model } = request;
  const phaseSign = model.phaseConvention === 'cosine_lag_degrees' ? -1 : 1;
  const points: TidePredictionPoint[] = new Array<TidePredictionPoint>(pointCount);

  for (let index = 0; index < pointCount; index += 1) {
    const timestampMs = startMs + index * intervalMs;
    const elapsedHours = (timestampMs - referenceEpochMs) / MILLISECONDS_PER_HOUR;
    let value = model.meanLevel;

    for (const constituent of model.constituents) {
      const angleDegrees = constituent.speedDegreesPerHour * elapsedHours + phaseSign * constituent.phaseDegrees;
      value += constituent.amplitude * Math.cos(angleDegrees * DEGREES_TO_RADIANS);
    }

    points[index] = {
      timestampUtc: new Date(timestampMs).toISOString(),
      value,
    };
  }

  return {
    metadata: {
      modelId: model.modelId,
      ...(model.modelVersion === undefined ? {} : { modelVersion: model.modelVersion }),
      stationId: model.stationId,
      datumId: model.datumId,
      unit: model.unit,
      phaseConvention: model.phaseConvention,
      referenceEpochUtc: new Date(referenceEpochMs).toISOString(),
      timeZone: request.timeZone,
      constituentCount: model.constituents.length,
    },
    startUtc: new Date(startMs).toISOString(),
    endUtc: new Date(parseExplicitInstant(request.endUtc, 'endUtc')).toISOString(),
    intervalSeconds: request.intervalSeconds,
    points,
  };
}

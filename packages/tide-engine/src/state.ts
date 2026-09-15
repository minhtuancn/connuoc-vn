import { TideInputError } from './errors.js';
import { findExtrema, parseSeries } from './series.js';
import type { TidePredictionPoint, WaterState, WaterStateConfig } from './types.js';
import { parseExplicitInstant } from './validation.js';

function validateConfig(config: WaterStateConfig): void {
  if (!Number.isFinite(config.standSlopeThresholdPerHour) || config.standSlopeThresholdPerHour < 0) {
    throw new TideInputError(
      'INVALID_STATE_CONFIG',
      'standSlopeThresholdPerHour must be finite and non-negative',
      'standSlopeThresholdPerHour',
    );
  }
  if (!Number.isFinite(config.extremumWindowSeconds) || config.extremumWindowSeconds < 0) {
    throw new TideInputError(
      'INVALID_STATE_CONFIG',
      'extremumWindowSeconds must be finite and non-negative',
      'extremumWindowSeconds',
    );
  }
  if (config.flatTolerance !== undefined && (!Number.isFinite(config.flatTolerance) || config.flatTolerance < 0)) {
    throw new TideInputError('INVALID_STATE_CONFIG', 'flatTolerance must be finite and non-negative', 'flatTolerance');
  }
}

/** Determine water state at one instant from the predicted astronomical tide curve. */
export function getWaterState(
  points: readonly TidePredictionPoint[],
  atUtc: string,
  config: WaterStateConfig,
): WaterState {
  validateConfig(config);
  const parsed = parseSeries(points, 2);
  const atMs = parseExplicitInstant(atUtc, 'atUtc');
  if (atMs < parsed[0]!.timestampMs || atMs > parsed[parsed.length - 1]!.timestampMs) {
    return 'UNKNOWN';
  }

  if (points.length >= 3) {
    const extrema = findExtrema(points, { ...(config.flatTolerance === undefined ? {} : { flatTolerance: config.flatTolerance }) });
    let nearestKind: 'HIGH' | 'LOW' | undefined;
    let nearestDistanceMs = Number.POSITIVE_INFINITY;
    for (const extremum of extrema) {
      const distanceMs = Math.abs(parseExplicitInstant(extremum.timestampUtc, 'extremum.timestampUtc') - atMs);
      if (distanceMs < nearestDistanceMs) {
        nearestDistanceMs = distanceMs;
        nearestKind = extremum.kind;
      }
    }
    if (nearestKind !== undefined && nearestDistanceMs <= config.extremumWindowSeconds * 1_000) {
      return nearestKind === 'HIGH' ? 'NEAR_HIGH_STAND' : 'NEAR_LOW_STAND';
    }
  }

  let leftIndex = 0;
  while (leftIndex < parsed.length - 2 && parsed[leftIndex + 1]!.timestampMs < atMs) {
    leftIndex += 1;
  }
  const left = parsed[leftIndex]!;
  const right = parsed[leftIndex + 1]!;
  const hours = (right.timestampMs - left.timestampMs) / 3_600_000;
  const slopePerHour = (right.value - left.value) / hours;

  if (Math.abs(slopePerHour) <= config.standSlopeThresholdPerHour) {
    return 'UNKNOWN';
  }
  return slopePerHour > 0 ? 'RISING' : 'FALLING';
}

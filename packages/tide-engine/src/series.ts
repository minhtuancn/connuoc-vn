import { TideInputError } from './errors.js';
import type {
  ExtremaOptions,
  TideExtremum,
  TideExtremumKind,
  TidePredictionPoint,
} from './types.js';
import { parseExplicitInstant } from './validation.js';

interface ParsedPoint {
  readonly timestampMs: number;
  readonly value: number;
}

function validateFlatTolerance(value: number | undefined): number {
  const tolerance = value ?? 1e-12;
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new TideInputError('INVALID_SERIES', 'flatTolerance must be finite and non-negative', 'flatTolerance');
  }
  return tolerance;
}

export function parseSeries(points: readonly TidePredictionPoint[], minimumLength = 2): ParsedPoint[] {
  if (points.length < minimumLength) {
    throw new TideInputError('INVALID_SERIES', `Series requires at least ${minimumLength} points`, 'points');
  }

  let previousTimestamp = Number.NEGATIVE_INFINITY;
  return points.map((point, index) => {
    const timestampMs = parseExplicitInstant(point.timestampUtc, `points[${index}].timestampUtc`);
    if (timestampMs <= previousTimestamp) {
      throw new TideInputError('INVALID_SERIES', 'Series timestamps must be strictly increasing', 'points');
    }
    if (!Number.isFinite(point.value)) {
      throw new TideInputError('INVALID_SERIES', 'Series values must be finite', `points[${index}].value`);
    }
    previousTimestamp = timestampMs;
    return { timestampMs, value: point.value };
  });
}

function refineQuadratic(
  previous: ParsedPoint,
  center: ParsedPoint,
  next: ParsedPoint,
  kind: TideExtremumKind,
): TideExtremum {
  const x1 = (previous.timestampMs - center.timestampMs) / 1_000;
  const x3 = (next.timestampMs - center.timestampMs) / 1_000;
  const slope1 = (previous.value - center.value) / x1;
  const slope3 = (next.value - center.value) / x3;
  const denominator = x1 - x3;
  const a = denominator === 0 ? 0 : (slope1 - slope3) / denominator;
  const b = slope1 - a * x1;

  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) < Number.EPSILON) {
    return {
      kind,
      timestampUtc: new Date(center.timestampMs).toISOString(),
      value: center.value,
      refinement: 'sample',
    };
  }

  const vertexSeconds = -b / (2 * a);
  if (!Number.isFinite(vertexSeconds) || vertexSeconds < x1 || vertexSeconds > x3) {
    return {
      kind,
      timestampUtc: new Date(center.timestampMs).toISOString(),
      value: center.value,
      refinement: 'sample',
    };
  }

  const value = a * vertexSeconds * vertexSeconds + b * vertexSeconds + center.value;
  return {
    kind,
    timestampUtc: new Date(center.timestampMs + vertexSeconds * 1_000).toISOString(),
    value,
    refinement: 'quadratic',
  };
}

/**
 * Detect high/low astronomical tide events from a monotonic-time prediction series.
 * Sharp turning points are refined with a local three-point quadratic; exact flat
 * plateaus are represented by their midpoint instead of generating duplicates.
 */
export function findExtrema(
  points: readonly TidePredictionPoint[],
  options: ExtremaOptions = {},
): TideExtremum[] {
  const parsed = parseSeries(points, 3);
  const tolerance = validateFlatTolerance(options.flatTolerance);
  const extrema: TideExtremum[] = [];

  let index = 1;
  while (index < parsed.length - 1) {
    const previous = parsed[index - 1]!;
    const current = parsed[index]!;
    const next = parsed[index + 1]!;
    const before = current.value - previous.value;
    const after = next.value - current.value;

    if (before > tolerance && after < -tolerance) {
      extrema.push(refineQuadratic(previous, current, next, 'HIGH'));
      index += 1;
      continue;
    }
    if (before < -tolerance && after > tolerance) {
      extrema.push(refineQuadratic(previous, current, next, 'LOW'));
      index += 1;
      continue;
    }

    if (Math.abs(after) <= tolerance && Math.abs(before) > tolerance) {
      const plateauStart = index;
      let plateauEnd = index + 1;
      while (
        plateauEnd < parsed.length - 1 &&
        Math.abs(parsed[plateauEnd + 1]!.value - parsed[plateauEnd]!.value) <= tolerance
      ) {
        plateauEnd += 1;
      }

      if (plateauEnd < parsed.length - 1) {
        const afterPlateau = parsed[plateauEnd + 1]!.value - parsed[plateauEnd]!.value;
        const isHigh = before > tolerance && afterPlateau < -tolerance;
        const isLow = before < -tolerance && afterPlateau > tolerance;
        if (isHigh || isLow) {
          const start = parsed[plateauStart]!;
          const end = parsed[plateauEnd]!;
          extrema.push({
            kind: isHigh ? 'HIGH' : 'LOW',
            timestampUtc: new Date((start.timestampMs + end.timestampMs) / 2).toISOString(),
            value: (start.value + end.value) / 2,
            refinement: 'plateau',
          });
        }
      }
      index = plateauEnd + 1;
      continue;
    }

    index += 1;
  }

  return extrema;
}

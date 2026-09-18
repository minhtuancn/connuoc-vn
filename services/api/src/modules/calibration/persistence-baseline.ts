import type { CalibrationMetrics } from '@connuoc/shared-types';

export interface PersistenceBaselineCase {
  readonly baselineStageM: number;
  readonly truthStageM: number;
  readonly baselineDatumId: string;
  readonly truthDatumId: string;
  readonly leadSeconds: number;
}

export interface PersistenceLeadMetrics {
  readonly leadSeconds: number;
  readonly metrics: CalibrationMetrics;
}

export interface PersistenceBaselineResult {
  readonly overall: CalibrationMetrics | null;
  readonly byLeadSeconds: readonly PersistenceLeadMetrics[];
  readonly rejectedDatumMismatchCount: number;
}

function validateCase(value: PersistenceBaselineCase): void {
  if (
    !Number.isFinite(value.baselineStageM) ||
    !Number.isFinite(value.truthStageM)
  ) {
    throw new RangeError('persistence baseline stage values must be finite');
  }
  if (
    value.baselineDatumId.trim().length === 0 ||
    value.truthDatumId.trim().length === 0
  ) {
    throw new RangeError('persistence baseline datum ids must not be empty');
  }
  if (!Number.isInteger(value.leadSeconds) || value.leadSeconds < 0) {
    throw new RangeError('persistence baseline leadSeconds must be a non-negative integer');
  }
}

function metrics(errors: readonly number[]): CalibrationMetrics | null {
  if (errors.length === 0) return null;
  const absolute = errors.map((error) => Math.abs(error));
  const maeM =
    absolute.reduce((sum, value) => sum + value, 0) / absolute.length;
  const rmseM = Math.sqrt(
    errors.reduce((sum, value) => sum + value * value, 0) / errors.length,
  );
  return {
    maeM,
    rmseM,
    sampleCount: errors.length,
  };
}

export function evaluatePersistenceBaseline(
  cases: readonly PersistenceBaselineCase[],
): PersistenceBaselineResult {
  const accepted: Array<PersistenceBaselineCase & { error: number }> = [];
  let rejectedDatumMismatchCount = 0;

  for (const item of cases) {
    validateCase(item);
    if (item.baselineDatumId !== item.truthDatumId) {
      rejectedDatumMismatchCount += 1;
      continue;
    }
    accepted.push({
      ...item,
      error: item.baselineStageM - item.truthStageM,
    });
  }

  const grouped = new Map<number, number[]>();
  for (const item of accepted) {
    const values = grouped.get(item.leadSeconds) ?? [];
    values.push(item.error);
    grouped.set(item.leadSeconds, values);
  }

  const byLeadSeconds = [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([leadSeconds, errors]) => {
      const result = metrics(errors);
      if (!result) {
        throw new Error('lead-time baseline group unexpectedly has no samples');
      }
      return {
        leadSeconds,
        metrics: result,
      };
    });

  return {
    overall: metrics(accepted.map((item) => item.error)),
    byLeadSeconds,
    rejectedDatumMismatchCount,
  };
}

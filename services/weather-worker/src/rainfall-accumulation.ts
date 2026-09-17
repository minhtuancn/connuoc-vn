import type { RainfallRecord } from '@connuoc/shared-types';

export const SUPPORTED_RAINFALL_ACCUMULATION_WINDOWS_SECONDS = [
  3_600,
  10_800,
  21_600,
  43_200,
  86_400,
  259_200,
  604_800,
] as const;

export type RainfallAccumulationWindowSeconds =
  (typeof SUPPORTED_RAINFALL_ACCUMULATION_WINDOWS_SECONDS)[number];

export interface DerivedRainfallAccumulation {
  readonly endUtc: string;
  readonly windowSeconds: number;
  readonly amountMm: number | null;
  readonly coverageRatio: number;
  readonly complete: boolean;
  readonly derivationVersion: string;
  readonly inputRecordIds: readonly string[];
  readonly sourceIds: readonly string[];
}

interface TimedRecord {
  readonly record: RainfallRecord;
  readonly startMs: number;
  readonly endMs: number;
}

function timed(records: readonly RainfallRecord[]): TimedRecord[] {
  return records
    .map((record) => ({
      record,
      startMs: Date.parse(record.validStart),
      endMs: Date.parse(record.validEnd),
    }))
    .sort((left, right) =>
      left.startMs - right.startMs ||
      left.endMs - right.endMs ||
      left.record.id.localeCompare(right.record.id),
    );
}

function assertNoOverlaps(records: readonly TimedRecord[]): void {
  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1]!;
    const current = records[index]!;
    if (current.startMs < previous.endMs) {
      throw new RangeError(
        `Rainfall intervals overlap: ${previous.record.id} and ${current.record.id}`,
      );
    }
  }
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function deriveRainfallAccumulations(
  records: readonly RainfallRecord[],
  endUtc: string,
  windowsSeconds: readonly number[],
  derivationVersion: string,
): DerivedRainfallAccumulation[] {
  const endMs = Date.parse(endUtc);
  if (!Number.isFinite(endMs)) {
    throw new RangeError('endUtc must be a valid ISO instant');
  }
  if (derivationVersion.trim().length === 0) {
    throw new RangeError('derivationVersion must not be empty');
  }

  const normalized = timed(records);
  assertNoOverlaps(normalized);

  return windowsSeconds.map((windowSeconds) => {
    if (!Number.isInteger(windowSeconds) || windowSeconds <= 0) {
      throw new RangeError('windowSeconds must contain positive integers');
    }

    const startMs = endMs - windowSeconds * 1000;
    const included = normalized.filter(
      ({ startMs: recordStart, endMs: recordEnd }) =>
        recordStart >= startMs && recordEnd <= endMs && recordEnd > startMs,
    );

    const coverageSeconds = included.reduce(
      (total, item) => total + (item.endMs - item.startMs) / 1000,
      0,
    );
    const coverageRatio = Math.min(1, coverageSeconds / windowSeconds);
    const hasMissing = included.some(
      ({ record }) => record.quality.state === 'MISSING',
    );
    const amountMm = hasMissing
      ? null
      : included.reduce((total, { record }) => total + record.amountMm, 0);

    return {
      endUtc,
      windowSeconds,
      amountMm,
      coverageRatio,
      complete: coverageSeconds === windowSeconds,
      derivationVersion,
      inputRecordIds: included.map(({ record }) => record.id).sort(),
      sourceIds: uniqueSorted(
        included.map(({ record }) => record.source.sourceId),
      ),
    };
  });
}

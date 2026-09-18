import { RainfallRecordSchema } from '@connuoc/shared-types';

import type {
  NormalizedRainfallBundle,
  RainfallObjectReference,
} from './rainfall-contracts.js';

export type ImergValueSemantics = 'RATE_MM_PER_HOUR' | 'ACCUMULATION_MM';

export interface ImergGridCellInput {
  readonly sourceId: string;
  readonly productId: string;
  readonly productVersion: string | null;
  readonly validStart: string;
  readonly validEnd: string;
  readonly value: number;
  readonly valueSemantics: ImergValueSemantics;
  readonly latitude: number;
  readonly longitude: number;
  readonly resolutionKm: number;
  readonly fetchedAt: string;
  readonly attributionText: string;
  readonly attributionUrl: string | null;
  readonly objectReference: RainfallObjectReference | null;
}

function assertFiniteCoordinate(latitude: number, longitude: number): void {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new RangeError('IMERG coordinate is outside valid latitude/longitude bounds');
  }
}

function assertObjectReference(reference: RainfallObjectReference | null): void {
  if (reference === null) return;
  if (reference.uri.trim().length === 0) {
    throw new RangeError('IMERG object reference URI must not be empty');
  }
  if (
    reference.checksumSha256 !== null &&
    !/^[0-9a-f]{64}$/u.test(reference.checksumSha256)
  ) {
    throw new RangeError('IMERG object reference checksum must be lowercase SHA-256');
  }
}

function amountFromInput(input: ImergGridCellInput, durationSeconds: number): number {
  if (!Number.isFinite(input.value) || input.value < 0) {
    throw new RangeError('IMERG rainfall value must be a non-negative finite number');
  }

  if (input.valueSemantics === 'RATE_MM_PER_HOUR') {
    return input.value * (durationSeconds / 3600);
  }
  if (input.valueSemantics === 'ACCUMULATION_MM') {
    return input.value;
  }
  throw new RangeError('IMERG value semantics must be explicitly declared');
}

export function normalizeImergGridCell(
  input: ImergGridCellInput,
): NormalizedRainfallBundle {
  assertFiniteCoordinate(input.latitude, input.longitude);
  if (!Number.isFinite(input.resolutionKm) || input.resolutionKm <= 0) {
    throw new RangeError('IMERG resolutionKm must be positive');
  }
  assertObjectReference(input.objectReference);

  const startMs = Date.parse(input.validStart);
  const endMs = Date.parse(input.validEnd);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new RangeError('IMERG valid interval is invalid');
  }
  const durationSeconds = (endMs - startMs) / 1000;
  const amountMm = amountFromInput(input, durationSeconds);

  const record = RainfallRecordSchema.parse({
    id: `rain:imerg:${input.productId}:${input.productVersion ?? 'unknown'}:${input.validEnd}:${input.latitude}:${input.longitude}`,
    productKind: 'SATELLITE_ESTIMATE',
    validStart: new Date(startMs).toISOString().replace('.000Z', 'Z'),
    validEnd: new Date(endMs).toISOString().replace('.000Z', 'Z'),
    accumulationSeconds: durationSeconds,
    amountMm,
    unit: 'mm',
    spatial: {
      representation: 'GRID_CELL',
      latitude: input.latitude,
      longitude: input.longitude,
      resolutionKm: input.resolutionKm,
      stationId: null,
    },
    quality: {
      state: 'ESTIMATED',
      flags: input.productId.toLowerCase().includes('early')
        ? ['SATELLITE', 'NRT']
        : ['SATELLITE'],
    },
    source: {
      sourceId: input.sourceId,
      providerConfigId: null,
      productId: input.productId,
      productVersion: input.productVersion,
      modelRunAt: null,
      observedAt: new Date(endMs).toISOString().replace('.000Z', 'Z'),
      fetchedAt: input.fetchedAt,
      attributionText: input.attributionText,
      attributionUrl: input.attributionUrl,
    },
  });

  return {
    capability: 'rainfall.satellite',
    records: [record],
    ...(input.objectReference === null
      ? {}
      : { objectReferences: [input.objectReference] }),
  };
}

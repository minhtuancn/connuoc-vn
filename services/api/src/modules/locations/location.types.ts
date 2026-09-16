import type { AdministrativeAreaKind } from '@connuoc/shared-types';

export interface LocationSearchOptions {
  readonly query: string;
  readonly effectiveAt: Date;
  readonly limit: number;
}

export interface PointResolveOptions {
  readonly latitude: number;
  readonly longitude: number;
  readonly effectiveAt: Date;
}

export interface AdministrativeAreaRecord {
  readonly publicId: string;
  readonly officialCode: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly kind: AdministrativeAreaKind;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly isCurrent: boolean;
  readonly geometrySourceId: string | null;
}

export interface AdministrativeAreaSuccessorRef {
  readonly publicId: string;
  readonly relationship: 'MERGED_INTO' | 'SPLIT_TO' | 'RENAMED_TO' | 'REORGANIZED_TO';
  readonly effectiveAt: string;
}

export interface LocationSearchResult {
  readonly matchKind: 'CURRENT' | 'HISTORICAL';
  readonly area: AdministrativeAreaRecord;
  readonly successors: readonly AdministrativeAreaSuccessorRef[];
}

export interface ResolvedLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly spatialRepresentation: 'POINT';
  readonly administrativeAreas: readonly AdministrativeAreaRecord[];
}

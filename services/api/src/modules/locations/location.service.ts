import { Injectable } from '@nestjs/common';

import { LocationRepository } from './location.repository.js';
import type {
  LocationSearchOptions,
  LocationSearchResult,
  PointResolveOptions,
  ResolvedLocation,
} from './location.types.js';

@Injectable()
export class LocationService {
  constructor(private readonly repository: LocationRepository) {}

  search(options: LocationSearchOptions): Promise<readonly LocationSearchResult[]> {
    return this.repository.search(options);
  }

  resolvePoint(options: PointResolveOptions): Promise<ResolvedLocation> {
    return this.repository.resolvePoint(options);
  }
}

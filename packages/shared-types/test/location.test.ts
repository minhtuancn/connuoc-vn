import { describe, expect, it } from 'vitest';

import { AdministrativeAreaRefSchema, ForecastLocationSchema } from '../src/index.ts';

const province = {
  publicId: 'area:vn:31',
  officialCode: '31',
  name: 'Hải Phòng',
  normalizedName: 'hai phong',
  kind: 'CENTRAL_CITY',
  effectiveFrom: '2025-07-01',
  effectiveTo: null,
  isCurrent: true,
} as const;

describe('location contracts', () => {
  it('accepts a current two-tier administrative reference', () => {
    expect(AdministrativeAreaRefSchema.parse(province).kind).toBe('CENTRAL_CITY');
  });

  it('rejects invalid forecast coordinates', () => {
    const base = {
      latitude: 20.1,
      longitude: 106.2,
      timeZone: 'Asia/Ho_Chi_Minh',
      administrativeAreas: [province],
      spatialRepresentation: 'POINT',
    } as const;

    expect(ForecastLocationSchema.safeParse({ ...base, latitude: 91 }).success).toBe(false);
    expect(ForecastLocationSchema.safeParse({ ...base, longitude: 181 }).success).toBe(false);
  });

  it('rejects invalid effective date ranges', () => {
    expect(
      AdministrativeAreaRefSchema.safeParse({
        ...province,
        effectiveFrom: '2026-09-18',
        effectiveTo: '2026-09-17',
        isCurrent: false,
      }).success,
    ).toBe(false);
  });

  it('rejects any current historical district', () => {
    expect(
      AdministrativeAreaRefSchema.safeParse({
        ...province,
        kind: 'HISTORICAL_DISTRICT',
        isCurrent: true,
      }).success,
    ).toBe(false);
  });

  it('requires current records to be open-ended but does not infer current from null effectiveTo', () => {
    expect(
      AdministrativeAreaRefSchema.safeParse({
        ...province,
        effectiveTo: '2026-12-31',
        isCurrent: true,
      }).success,
    ).toBe(false);

    expect(
      AdministrativeAreaRefSchema.safeParse({
        ...province,
        effectiveTo: null,
        isCurrent: false,
      }).success,
    ).toBe(true);
  });
});

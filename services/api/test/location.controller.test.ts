import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { LocationController } from '../src/modules/locations/location.controller.js';
import type { LocationService } from '../src/modules/locations/location.service.js';

function createController() {
  const resolvePoint = vi.fn().mockResolvedValue({
    latitude: 19.5,
    longitude: 105.5,
    spatialRepresentation: 'POINT',
    administrativeAreas: [],
  });
  const service = { resolvePoint } as unknown as LocationService;
  return { controller: new LocationController(service), resolvePoint };
}

describe('LocationController', () => {
  it('validates coordinates and forwards a stable effective date', async () => {
    const { controller, resolvePoint } = createController();

    await expect(
      controller.resolve({ lat: '19.5', lon: '105.5', effectiveAt: '2026-09-17' }),
    ).resolves.toMatchObject({
      latitude: 19.5,
      longitude: 105.5,
      spatialRepresentation: 'POINT',
      timeZone: null,
      effectiveAt: '2026-09-17',
    });

    expect(resolvePoint).toHaveBeenCalledWith({
      latitude: 19.5,
      longitude: 105.5,
      effectiveAt: new Date('2026-09-17T00:00:00.000Z'),
    });
  });

  it.each([
    { lat: '91', lon: '105' },
    { lat: '-91', lon: '105' },
    { lat: '20', lon: '181' },
    { lat: '20', lon: '-181' },
    { lat: 'abc', lon: '105' },
  ])('rejects invalid coordinate query %#', async (query) => {
    const { controller } = createController();
    await expect(controller.resolve(query)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['2026-02-30', '17-09-2026', '2026-13-01'])('rejects invalid effectiveAt %s', async (effectiveAt) => {
    const { controller } = createController();
    await expect(
      controller.resolve({ lat: '20', lon: '105', effectiveAt }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

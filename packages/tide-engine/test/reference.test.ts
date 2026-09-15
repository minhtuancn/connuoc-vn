import { describe, expect, it } from 'vitest';

import reference from './fixtures/tide-reference.json' with { type: 'json' };
import {
  findExtrema,
  predictTide,
  predictTideLevelAt,
  type HarmonicTideModel,
} from '../src/index.ts';

const model = reference.analyticGolden.model as HarmonicTideModel;

describe('tide analytic golden reference', () => {
  it.each(reference.analyticGolden.levels)('matches $atUtc closed-form level', ({ atUtc, expected }) => {
    expect(predictTideLevelAt(model, atUtc)).toBeCloseTo(expected, 12);
  });

  it('finds the closed-form low/high/low events over 24 hours', () => {
    const prediction = predictTide({
      model,
      startUtc: '2026-01-01T00:00:00Z',
      endUtc: '2026-01-02T00:00:00Z',
      intervalSeconds: 600,
      timeZone: 'UTC',
    });
    const extrema = findExtrema(prediction.points);

    expect(extrema).toHaveLength(reference.analyticGolden.events24h.length);
    for (const [index, expected] of reference.analyticGolden.events24h.entries()) {
      const actual = extrema[index];
      expect(actual?.kind).toBe(expected.kind);
      expect(actual?.timestampUtc).toBe(expected.timestampUtc);
      expect(actual?.value).toBeCloseTo(expected.expected, 10);
    }
  });
});

describe('external tide reference capability boundary', () => {
  it('pins the independent MIT reference implementation and published vectors', () => {
    expect(reference.externalReference.project).toBe('openwatersio/neaps');
    expect(reference.externalReference.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(reference.externalReference.license).toBe('MIT');
    expect(reference.externalReference.publishedVectors.firstTimelineLevel).toBeCloseTo(-1.46903456, 8);
    expect(reference.externalReference.publishedVectors.firstExtremeLevel).toBeCloseTo(-1.67283933, 8);
  });

  it('does not claim direct compatibility with astronomy/nodal-corrected vectors', () => {
    expect(reference.externalReference.compatibility).toBe('not-directly-comparable');
    expect(reference.engineCapability.notSupported).toContain('nodal amplitude factor f');
    expect(reference.engineCapability.notSupported).toContain('nodal phase correction u');
    expect(reference.engineCapability.notSupported).toContain(
      'astronomical argument V0 derived from Doodson/IHO coefficients',
    );
  });
});

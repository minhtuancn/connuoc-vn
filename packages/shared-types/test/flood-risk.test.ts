import { describe, expect, it } from 'vitest';

import {
  FloodRiskAssessmentSchema,
  evaluateDeterministicFloodRisk,
} from '../src/flood-risk.js';

const baseInput = {
  scope: {
    kind: 'REACH' as const,
    id: 'reach:test:001',
    latitude: 19.5,
    longitude: 105.5,
  },
  validFrom: '2026-09-18T00:00:00Z',
  validTo: '2026-09-19T00:00:00Z',
  generatedAt: '2026-09-18T00:00:00Z',
  rainfall: {
    freshness: 'FRESH' as const,
    coverageRatio: 1,
    oneHourMm: 2,
    threeHourMm: 5,
    twentyFourHourMm: 20,
    seventyTwoHourMm: 35,
    disagreementRatio: 0.05,
    sourceIds: ['rain:test'],
  },
  river: {
    freshness: 'FRESH' as const,
    currentDischargeCms: 300,
    peakDischargeCms: 330,
    exceededReturnPeriodYears: null,
    disagreementRatio: 0.05,
    sourceIds: ['hydro:test'],
  },
  stage: {
    freshness: 'FRESH' as const,
    evidenceStatus: 'AVAILABLE' as const,
    maxRiseM: 0.05,
    peakStageM: 2.1,
    datumId: 'VN-LOCAL-DATUM-01',
    sourceIds: ['stage:test'],
  },
  tide: null,
  susceptibility: {
    level: 'LOW' as const,
    sourceId: 'susceptibility:test',
    resolutionMeters: 90,
    limitation: 'Coarse terrain susceptibility baseline.',
  },
};

describe('deterministic flood-risk engine', () => {
  it('is deterministic and keeps probability absent without a calibrated probability model', () => {
    const first = evaluateDeterministicFloodRisk(baseInput);
    const second = evaluateDeterministicFloodRisk(baseInput);

    expect(second).toEqual(first);
    expect(first.riskLevel).toBe('LOW');
    expect(first.confidence).toBe('HIGH');
    expect('probabilityRange' in first).toBe(false);
    expect('probabilityCalibration' in first).toBe(false);
  });

  it.each([
    [
      'MODERATE',
      {
        ...baseInput,
        rainfall: {
          ...baseInput.rainfall,
          oneHourMm: 28,
          twentyFourHourMm: 55,
        },
      },
    ],
    [
      'HIGH',
      {
        ...baseInput,
        rainfall: {
          ...baseInput.rainfall,
          oneHourMm: 30,
          twentyFourHourMm: 110,
        },
        river: {
          ...baseInput.river,
          exceededReturnPeriodYears: 5,
        },
      },
    ],
    [
      'VERY_HIGH',
      {
        ...baseInput,
        rainfall: {
          ...baseInput.rainfall,
          oneHourMm: 52,
          twentyFourHourMm: 160,
          seventyTwoHourMm: 230,
        },
        river: {
          ...baseInput.river,
          exceededReturnPeriodYears: 10,
        },
        stage: {
          ...baseInput.stage,
          maxRiseM: 0.7,
        },
      },
    ],
    [
      'EXTREME',
      {
        ...baseInput,
        rainfall: {
          ...baseInput.rainfall,
          oneHourMm: 65,
          twentyFourHourMm: 240,
          seventyTwoHourMm: 380,
        },
        river: {
          ...baseInput.river,
          exceededReturnPeriodYears: 50,
        },
        stage: {
          ...baseInput.stage,
          maxRiseM: 1.7,
        },
        susceptibility: {
          ...baseInput.susceptibility,
          level: 'VERY_HIGH' as const,
        },
      },
    ],
  ] as const)(
    'produces %s at the configured deterministic transition',
    (expected, input) => {
      const result = evaluateDeterministicFloodRisk(input);
      expect(result.riskLevel).toBe(expected);
      expect(result.hydrologicHazard.score).toBeGreaterThan(0);
      expect(result.drivers.length).toBeGreaterThan(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    },
  );

  it('fails closed when river discharge is missing or stale', () => {
    const missing = evaluateDeterministicFloodRisk({
      ...baseInput,
      river: null,
    });
    expect(missing).toMatchObject({
      riskLevel: 'INSUFFICIENT_DATA',
      confidence: 'LOW',
    });
    expect(missing.limitations).toContain(
      'FRESH_RIVER_DISCHARGE_REQUIRED',
    );

    const stale = evaluateDeterministicFloodRisk({
      ...baseInput,
      river: {
        ...baseInput.river,
        freshness: 'STALE' as const,
      },
    });
    expect(stale.riskLevel).toBe('INSUFFICIENT_DATA');
    expect(stale.limitations).toContain(
      'STALE_RIVER_DISCHARGE_NOT_USED_AS_LIVE',
    );
  });

  it('requires at least two fresh hydrologic driver groups', () => {
    const result = evaluateDeterministicFloodRisk({
      ...baseInput,
      rainfall: null,
      stage: null,
      tide: null,
    });

    expect(result.riskLevel).toBe('INSUFFICIENT_DATA');
    expect(result.limitations).toContain(
      'INSUFFICIENT_INDEPENDENT_DRIVER_GROUPS',
    );
  });

  it('downgrades confidence for missing calibrated stage without fabricating stage evidence', () => {
    const result = evaluateDeterministicFloodRisk({
      ...baseInput,
      stage: {
        freshness: 'FRESH',
        evidenceStatus: 'INSUFFICIENT_DATA',
        maxRiseM: null,
        peakStageM: null,
        datumId: null,
        sourceIds: [],
      },
    });

    expect(result.riskLevel).not.toBe('INSUFFICIENT_DATA');
    expect(result.confidence).toBe('MEDIUM');
    expect(result.limitations).toContain(
      'CALIBRATED_STAGE_UNAVAILABLE',
    );
    expect(
      result.drivers.some(
        (driver) =>
          driver.id === 'stage-rise' &&
          driver.state === 'MISSING',
      ),
    ).toBe(true);
  });

  it('downgrades confidence when comparable sources materially disagree', () => {
    const result = evaluateDeterministicFloodRisk({
      ...baseInput,
      rainfall: {
        ...baseInput.rainfall,
        disagreementRatio: 0.8,
      },
      river: {
        ...baseInput.river,
        disagreementRatio: 0.7,
      },
    });

    expect(result.confidence).toBe('LOW');
    expect(result.limitations).toEqual(
      expect.arrayContaining([
        'RAINFALL_SOURCE_DISAGREEMENT',
        'RIVER_SOURCE_DISAGREEMENT',
      ]),
    );
  });

  it('keeps hazard, susceptibility and local impact as separate concepts', () => {
    const result = evaluateDeterministicFloodRisk({
      ...baseInput,
      susceptibility: {
        ...baseInput.susceptibility,
        level: 'VERY_HIGH',
      },
    });

    expect(result.hydrologicHazard).toMatchObject({
      level: 'LOW',
    });
    expect(result.inundationSusceptibility).toMatchObject({
      level: 'VERY_HIGH',
    });
    expect(result.localImpact).toEqual({
      level: 'UNKNOWN',
      reasons: [],
    });
    expect(result.limitations).toContain(
      'LOCAL_IMPACT_DATA_UNAVAILABLE',
    );
  });

  it('rejects numerical probability when calibration evidence is absent or incomplete', () => {
    expect(() =>
      FloodRiskAssessmentSchema.parse({
        ...evaluateDeterministicFloodRisk(baseInput),
        probabilityRange: {
          min: 0.2,
          max: 0.4,
        },
      }),
    ).toThrow();

    expect(() =>
      FloodRiskAssessmentSchema.parse({
        ...evaluateDeterministicFloodRisk(baseInput),
        probabilityCalibration: {
          id: 'probability:test:v1',
          version: 'v1',
          status: 'VALIDATED',
          eventDefinition:
            'Flood event = observed gauge stage exceeds locally defined warning threshold.',
          validationPeriod: {
            start: '2024-01-01T00:00:00Z',
            end: '2025-12-31T23:59:59Z',
          },
          sampleCount: 200,
          brierScore: 0.15,
        },
      }),
    ).toThrow();
  });
});

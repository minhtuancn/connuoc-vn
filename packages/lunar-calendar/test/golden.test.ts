import { describe, expect, it } from 'vitest';

import golden from './fixtures/vietnamese-lunar-golden.json' with { type: 'json' };
import { getCalendarCanChi, getSolarTermAt, lunarToSolar, solarToLunar } from '../src/index.ts';

type SolarDate = { year: number; month: number; day: number };
type LunarDate = SolarDate & { isLeapMonth: boolean };

type Fixture = {
  id: string;
  solar: SolarDate;
  lunar: LunarDate;
  verifiedFacts: {
    dayCanChi?: string;
    solarTerm?: string;
  };
  sources: string[];
};

const fixtures = golden.fixtures as Fixture[];

describe('Vietnamese lunar factual golden fixtures', () => {
  it.each(fixtures)('$id converts solar → lunar from independent factual references', (fixture) => {
    expect(fixture.sources.length).toBeGreaterThan(0);
    expect(solarToLunar(fixture.solar)).toEqual(fixture.lunar);
  });

  it.each(fixtures)('$id converts the factual lunar date back to the cited solar date', (fixture) => {
    expect(lunarToSolar(fixture.lunar)).toEqual(fixture.solar);
  });

  it.each(fixtures.filter((fixture) => fixture.verifiedFacts.dayCanChi !== undefined))(
    '$id matches independently published day Can Chi',
    (fixture) => {
      expect(getCalendarCanChi(fixture.solar).day.label).toBe(fixture.verifiedFacts.dayCanChi);
    },
  );

  it.each(fixtures.filter((fixture) => fixture.verifiedFacts.solarTerm !== undefined))(
    '$id matches independently published solar term at Vietnam local noon',
    (fixture) => {
      const { year, month, day } = fixture.solar;
      const instantUtc = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T05:00:00Z`;
      expect(getSolarTermAt(instantUtc).name).toBe(fixture.verifiedFacts.solarTerm);
    },
  );
});

describe('Vietnamese lunar generated round-trip coverage', () => {
  it('round-trips representative dates whose solar and lunar years stay inside the supported range', () => {
    // The factual 1900 Tết fixture above validates the exact lower boundary. January 1900 dates
    // can legitimately belong to lunar year 1899, which is intentionally outside the public API range.
    const representativeYears = [1901, 1910, 1925, 1940, 1950, 1965, 1980, 1995, 2000, 2010, 2025, 2040, 2060, 2080, 2100];

    for (const year of representativeYears) {
      for (const [month, day] of [
        [4, 12],
        [7, 20],
        [10, 8],
      ] as const) {
        const solar = { year, month, day };
        expect(lunarToSolar(solarToLunar(solar))).toEqual(solar);
      }
    }
  });
});

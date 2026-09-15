import { describe, expect, it } from 'vitest';

import { lunarToSolar, solarToLunar, LunarCalendarError } from '../src/index.ts';

describe('Vietnamese solar to lunar conversion', () => {
  it.each([
    [{ year: 2024, month: 2, day: 10 }, { year: 2024, month: 1, day: 1, isLeapMonth: false }],
    [{ year: 2025, month: 1, day: 29 }, { year: 2025, month: 1, day: 1, isLeapMonth: false }],
    [{ year: 2026, month: 2, day: 17 }, { year: 2026, month: 1, day: 1, isLeapMonth: false }],
  ])('converts known Tết date %o', (solar, expectedLunar) => {
    expect(solarToLunar(solar)).toEqual(expectedLunar);
  });

  it('distinguishes the regular and leap sixth lunar months of 2025', () => {
    expect(solarToLunar({ year: 2025, month: 6, day: 25 })).toEqual({
      year: 2025,
      month: 6,
      day: 1,
      isLeapMonth: false,
    });
    expect(solarToLunar({ year: 2025, month: 7, day: 25 })).toEqual({
      year: 2025,
      month: 6,
      day: 1,
      isLeapMonth: true,
    });
  });

  it('converts the current project reference date consistently', () => {
    expect(solarToLunar({ year: 2026, month: 9, day: 15 })).toEqual({
      year: 2026,
      month: 8,
      day: 5,
      isLeapMonth: false,
    });
  });
});

describe('Vietnamese lunar to solar conversion', () => {
  it('round-trips regular and leap month starts', () => {
    expect(lunarToSolar({ year: 2025, month: 6, day: 1, isLeapMonth: false })).toEqual({
      year: 2025,
      month: 6,
      day: 25,
    });
    expect(lunarToSolar({ year: 2025, month: 6, day: 1, isLeapMonth: true })).toEqual({
      year: 2025,
      month: 7,
      day: 25,
    });
  });

  it('round-trips representative dates across year boundaries', () => {
    const dates = [
      { year: 2024, month: 12, day: 31 },
      { year: 2025, month: 1, day: 1 },
      { year: 2026, month: 9, day: 15 },
      { year: 2030, month: 6, day: 20 },
    ];

    for (const solar of dates) {
      expect(lunarToSolar(solarToLunar(solar))).toEqual(solar);
    }
  });

  it('rejects invalid Gregorian and impossible leap-month inputs', () => {
    expect(() => solarToLunar({ year: 2025, month: 2, day: 30 })).toThrowError(LunarCalendarError);
    expect(() => lunarToSolar({ year: 2026, month: 6, day: 1, isLeapMonth: true })).toThrowError(
      LunarCalendarError,
    );
  });
});

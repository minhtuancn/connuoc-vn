import { describe, expect, it } from 'vitest';

import { getCalendarCanChi, getMoonPhaseAt, getSolarTermAt } from '../src/index.ts';

describe('Can Chi metadata', () => {
  it('matches independently published Vietnamese calendar metadata for 15/09/2026', () => {
    const result = getCalendarCanChi({ year: 2026, month: 9, day: 15 });
    expect(result.year.label).toBe('Bính Ngọ');
    expect(result.month.label).toBe('Đinh Dậu');
    expect(result.day.label).toBe('Nhâm Thìn');
  });
});

describe('24 solar terms', () => {
  it('classifies 15/09/2026 in the Bạch lộ solar-longitude sector', () => {
    const term = getSolarTermAt('2026-09-15T05:00:00Z');
    expect(term.name).toBe('Bạch lộ');
    expect(term.longitudeDegrees).toBeGreaterThanOrEqual(165);
    expect(term.longitudeDegrees).toBeLessThan(180);
  });
});

describe('moon phase', () => {
  it('tracks the September 2026 new moon closely', () => {
    const phase = getMoonPhaseAt('2026-09-11T03:27:00Z');
    expect(phase.key).toBe('NEW_MOON');
    expect(phase.illuminationFraction).toBeLessThan(0.01);
  });

  it('classifies 15/09/2026 as waxing crescent with a plausible illumination', () => {
    const phase = getMoonPhaseAt('2026-09-15T05:00:00Z');
    expect(phase.key).toBe('WAXING_CRESCENT');
    expect(phase.illuminationFraction).toBeGreaterThan(0.1);
    expect(phase.illuminationFraction).toBeLessThan(0.3);
    expect(phase.ageDays).toBeGreaterThan(3);
    expect(phase.ageDays).toBeLessThan(5);
  });
});

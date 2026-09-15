import { describe, expect, it } from 'vitest';

import {
  createVietnameseSearchDocument,
  greatCircleDistanceMeters,
  matchesVietnameseSearch,
  normalizeVietnameseSearchText,
  normalizeWhitespace,
  stripVietnameseDiacritics,
} from '../src/index.ts';

describe('Vietnamese text normalization', () => {
  it('preserves canonical whitespace normalization without stripping accents', () => {
    expect(normalizeWhitespace('  Nghĩa   Phong  ')).toBe('Nghĩa Phong');
  });

  it('normalizes Vietnamese diacritics including Đ/đ', () => {
    expect(stripVietnameseDiacritics('Đồng bằng sông Hồng')).toBe('Dong bang song Hong');
    expect(normalizeVietnameseSearchText('  Ninh Cơ  ')).toBe('ninh co');
    expect(normalizeVietnameseSearchText('Cửa Lạch-Giang')).toBe('cua lach giang');
  });

  it('matches canonical Vietnamese names with unaccented queries', () => {
    const document = createVietnameseSearchDocument('Nghĩa Phong', ['Xã Nghĩa Phong', 'Nghia Phong']);

    expect(document.canonicalName).toBe('Nghĩa Phong');
    expect(matchesVietnameseSearch(document, 'nghia phong')).toBe(true);
    expect(matchesVietnameseSearch(document, 'NGHĨA')).toBe(true);
    expect(matchesVietnameseSearch(document, 'ninh co')).toBe(false);
  });

  it('deduplicates derived aliases without mutating canonical display text', () => {
    const document = createVietnameseSearchDocument('Ninh Cơ', [' Ninh Co ', 'Ninh Co', 'Ninh Cơ']);
    expect(document.canonicalName).toBe('Ninh Cơ');
    expect(document.aliases).toEqual(['Ninh Co']);
    expect(document.normalizedNames).toEqual(['ninh co']);
  });
});

describe('great-circle distance', () => {
  it('returns zero for the same coordinate', () => {
    expect(greatCircleDistanceMeters({ latitude: 20, longitude: 106 }, { latitude: 20, longitude: 106 })).toBe(0);
  });

  it('returns a realistic distance for one degree of latitude', () => {
    const distance = greatCircleDistanceMeters(
      { latitude: 20, longitude: 106 },
      { latitude: 21, longitude: 106 },
    );
    expect(distance).toBeGreaterThan(110_000);
    expect(distance).toBeLessThan(112_000);
  });

  it('rejects invalid coordinates', () => {
    expect(() =>
      greatCircleDistanceMeters({ latitude: 91, longitude: 106 }, { latitude: 20, longitude: 106 }),
    ).toThrow(RangeError);
  });
});

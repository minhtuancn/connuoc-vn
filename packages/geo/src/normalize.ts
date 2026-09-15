/** Collapse repeated whitespace while preserving the original diacritics/casing. */
export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

/**
 * Remove Vietnamese diacritics for derived search keys only.
 * Canonical/display values must never be replaced with this output.
 */
export function stripVietnameseDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/đ/gu, 'd')
    .replace(/Đ/gu, 'D');
}

/**
 * Build a stable, diacritic-insensitive Vietnamese search key.
 * Punctuation becomes spaces so names such as `Cửa Lạch-Giang` remain searchable
 * by ordinary whitespace-separated terms.
 */
export function normalizeVietnameseSearchText(value: string): string {
  return normalizeWhitespace(
    stripVietnameseDiacritics(value)
      .toLocaleLowerCase('vi-VN')
      .replace(/[^\p{L}\p{N}]+/gu, ' '),
  );
}

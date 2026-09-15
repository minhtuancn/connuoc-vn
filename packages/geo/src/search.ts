import { normalizeVietnameseSearchText, normalizeWhitespace } from './normalize.js';

export interface VietnameseSearchDocument {
  readonly canonicalName: string;
  readonly aliases: readonly string[];
  readonly normalizedNames: readonly string[];
}

/** Build immutable derived search keys while keeping the canonical source name intact. */
export function createVietnameseSearchDocument(
  canonicalName: string,
  aliases: readonly string[] = [],
): VietnameseSearchDocument {
  const cleanCanonical = normalizeWhitespace(canonicalName);
  if (cleanCanonical.length === 0) {
    throw new RangeError('canonicalName must not be empty');
  }

  const cleanAliases = aliases
    .map(normalizeWhitespace)
    .filter((value) => value.length > 0 && value !== cleanCanonical);

  const uniqueAliases = [...new Set(cleanAliases)];
  const normalizedNames = [...new Set([cleanCanonical, ...uniqueAliases].map(normalizeVietnameseSearchText))];

  return {
    canonicalName: cleanCanonical,
    aliases: uniqueAliases,
    normalizedNames,
  };
}

/**
 * Token-based AND matching across canonical name and aliases.
 * `nghia phong` therefore matches `Nghĩa Phong`, while every query token must
 * occur in at least one normalized name.
 */
export function matchesVietnameseSearch(
  document: VietnameseSearchDocument,
  query: string,
): boolean {
  const normalizedQuery = normalizeVietnameseSearchText(query);
  if (normalizedQuery.length === 0) {
    return false;
  }

  const tokens = normalizedQuery.split(' ');
  return tokens.every((token) => document.normalizedNames.some((name) => name.includes(token)));
}

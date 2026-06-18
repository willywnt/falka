/*
 * Pure matching helpers for the command palette's entity-jump (kept React-free
 * so they unit-test without hooks). A typed/scanned code is matched against the
 * already-cached sales/PO/opname lists with SQL-LIKE `contains` semantics, so
 * "001" surfaces every S…/PO…/OP… code that contains it, exact hits first.
 */

export const MAX_CODE_HITS = 5;

export interface CodeCandidateFlags {
  readonly sale: boolean;
  readonly purchase: boolean;
  readonly opname: boolean;
}

/**
 * Which entity-code lists a (partial) code-looking query should search. A code
 * fragment is an optional 1–2 letter prefix + ≥2 digits ("001", "s00001",
 * "po12"). A bare-digit fragment is ambiguous so it searches all three; a
 * letter-prefixed one biases to its entity (so "s00001" doesn't fetch POs).
 */
export function codeCandidateFlags(query: string): CodeCandidateFlags {
  const term = query.trim();
  const isFragment = /^[a-z]{0,2}\d{2,}$/i.test(term);
  if (!isFragment) return { sale: false, purchase: false, opname: false };

  const startsDigit = /^\d/.test(term);
  return {
    sale: startsDigit || /^s/i.test(term),
    purchase: startsDigit || /^po/i.test(term),
    opname: startsDigit || /^op/i.test(term),
  };
}

/** Contains-match (SQL LIKE) on a `code` field — exact hits first, then capped. */
export function matchCodeHits<T extends { code: string }>(
  items: readonly T[] | undefined,
  query: string,
  max: number = MAX_CODE_HITS,
): T[] {
  const lower = query.trim().toLowerCase();
  if (!items || !lower) return [];

  const matched = items.filter((item) => item.code.toLowerCase().includes(lower));
  const exact = matched.filter((item) => item.code.toLowerCase() === lower);
  const partial = matched.filter((item) => item.code.toLowerCase() !== lower);
  return [...exact, ...partial].slice(0, max);
}

import { expandQueryToken } from './search-synonyms';

/*
 * A tiny, dependency-free fuzzy matcher for the command palette (§13 — prefer a
 * homegrown scorer over a search library). It ranks an entry against a query by
 * the BEST way each query token matches, then orders results by match quality.
 *
 * Honest by construction: the tier of a whole match is the WORST tier among its
 * tokens (so "kasir zzz" can never masquerade as an exact hit), and highlight
 * spans are emitted ONLY for the title — alias/keyword hits help an entry rank
 * but never paint a <mark> over text the user can't see.
 */

/** Match quality, best → worst. This order IS the ranking order. */
export type MatchTier =
  | 'exact'
  | 'prefix'
  | 'word-prefix'
  | 'substring'
  | 'acronym'
  | 'subsequence';

/** Half-open `[start, end)` range into the original-cased title. */
export type Span = readonly [start: number, end: number];

/** One non-title field an entry can match on (keywords, section label, …). */
export interface SearchField {
  readonly text: string;
  readonly weight: number;
}

/** A precomputed search target: display title (span source) + extra match fields. */
export interface Searchable {
  readonly title: string;
  readonly fields: readonly SearchField[];
}

export interface MatchResult {
  readonly score: number;
  readonly tier: MatchTier;
  /** Spans into the title only — keyword/alias hits rank but stay unhighlighted. */
  readonly titleSpans: readonly Span[];
}

export interface HighlightSegment {
  readonly text: string;
  readonly marked: boolean;
}

const TIER_RANK: Record<MatchTier, number> = {
  exact: 600,
  prefix: 500,
  'word-prefix': 400,
  substring: 300,
  acronym: 200,
  subsequence: 100,
};

/** The title outweighs keywords/section at the same tier. */
const TITLE_WEIGHT = 3;
/** Small nudge so an entry whose title carries every token edges out alias hits. */
const TITLE_BONUS = 6;
/** A synonym/typo expansion may never claim a tier richer than a plain substring. */
const SYNONYM_TIER_CAP: MatchTier = 'substring';
/** Characters that delimit words for word-prefix and acronym matching. */
const WORD_SEPARATOR = /[\s()/·\-&,.]/;

/** Precompute an entry's searchable shape once; field text is lowercased here. */
export function toSearchable(title: string, fields: readonly SearchField[]): Searchable {
  return {
    title,
    fields: fields.map((field) => ({ text: field.text.toLowerCase(), weight: field.weight })),
  };
}

interface RawMatch {
  readonly tier: MatchTier;
  /** In-tier tie-breaker (0–4): earlier/tighter matches score higher. */
  readonly fine: number;
  readonly spans: readonly Span[];
}

function wordStarts(text: string): number[] {
  const starts: number[] = [];
  let inWord = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i] ?? '';
    const isSeparator = ch === '' || WORD_SEPARATOR.test(ch);
    if (!isSeparator && !inWord) {
      starts.push(i);
      inWord = true;
    } else if (isSeparator) {
      inWord = false;
    }
  }
  return starts;
}

/** Initials of the first `candidate.length` words equal the candidate. */
function matchAcronym(candidate: string, starts: readonly number[], text: string): Span[] | null {
  if (starts.length < candidate.length) return null;
  const spans: Span[] = [];
  for (let i = 0; i < candidate.length; i += 1) {
    const start = starts[i];
    if (start === undefined || text[start] !== candidate[i]) return null;
    spans.push([start, start + 1]);
  }
  return spans;
}

/** Greedy left-to-right subsequence — typo/skip tolerant; rewards tight, early hits. */
function matchSubsequence(candidate: string, text: string): { fine: number; spans: Span[] } | null {
  let ci = 0;
  let prev = -1;
  let gaps = 0;
  let firstIdx = -1;
  const spans: Span[] = [];

  for (let xi = 0; xi < text.length && ci < candidate.length; xi += 1) {
    if (text[xi] !== candidate[ci]) continue;
    if (firstIdx === -1) firstIdx = xi;
    if (prev !== -1 && xi > prev + 1) gaps += xi - prev - 1;
    const last = spans[spans.length - 1];
    if (last && last[1] === xi) {
      spans[spans.length - 1] = [last[0], xi + 1];
    } else {
      spans.push([xi, xi + 1]);
    }
    prev = xi;
    ci += 1;
  }

  if (ci < candidate.length) return null;
  const gapPenalty = Math.min(4, gaps);
  const startPenalty = firstIdx > 0 ? Math.min(2, Math.floor(firstIdx / 4)) : 0;
  return { fine: Math.max(0, 4 - gapPenalty - startPenalty), spans };
}

/** Best way `candidate` matches `text` (already lowercased), richest tier first. */
function matchText(candidate: string, text: string): RawMatch | null {
  if (!candidate) return null;
  if (text === candidate) return { tier: 'exact', fine: 4, spans: [[0, candidate.length]] };
  if (text.startsWith(candidate))
    return { tier: 'prefix', fine: 4, spans: [[0, candidate.length]] };

  const starts = wordStarts(text);
  for (let w = 0; w < starts.length; w += 1) {
    const start = starts[w];
    if (start === undefined || start === 0) continue;
    if (text.startsWith(candidate, start)) {
      return {
        tier: 'word-prefix',
        fine: Math.max(0, 4 - w),
        spans: [[start, start + candidate.length]],
      };
    }
  }

  const idx = text.indexOf(candidate);
  if (idx >= 0) {
    return {
      tier: 'substring',
      fine: Math.max(0, 4 - Math.floor(idx / 3)),
      spans: [[idx, idx + candidate.length]],
    };
  }

  // Only short tokens are acronym candidates, so "po" can't shadow long titles.
  if (candidate.length >= 2 && candidate.length <= 3) {
    const acronymSpans = matchAcronym(candidate, starts, text);
    if (acronymSpans) return { tier: 'acronym', fine: 2, spans: acronymSpans };
  }

  const seq = matchSubsequence(candidate, text);
  if (seq) return { tier: 'subsequence', fine: seq.fine, spans: seq.spans };

  return null;
}

function capTier(tier: MatchTier, isSynonym: boolean): MatchTier {
  if (!isSynonym) return tier;
  return TIER_RANK[tier] > TIER_RANK[SYNONYM_TIER_CAP] ? SYNONYM_TIER_CAP : tier;
}

function matchScore(tier: MatchTier, fine: number, weight: number): number {
  return TIER_RANK[tier] + weight * 5 + fine;
}

/**
 * Score a query against a target. Every whitespace token must match somewhere
 * (AND semantics — preserves the old substring matcher so nothing regresses);
 * an unmatched token returns null. The whole-match tier is the worst token tier.
 */
export function scoreEntry(query: string, target: Searchable): MatchResult | null {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const titleLower = target.title.toLowerCase();
  let totalScore = 0;
  let worstRank = Number.POSITIVE_INFINITY;
  let worstTier: MatchTier = 'exact';
  const titleSpans: Span[] = [];
  let allTokensHitTitle = true;

  for (const token of tokens) {
    const candidates = expandQueryToken(token);
    let bestScore = -1;
    let bestTier: MatchTier | null = null;
    let tokenTitleSpans: readonly Span[] | null = null;

    for (let c = 0; c < candidates.length; c += 1) {
      const candidate = candidates[c];
      if (candidate === undefined) continue;
      const isSynonym = c > 0;

      const titleMatch = matchText(candidate, titleLower);
      if (titleMatch) {
        const tier = capTier(titleMatch.tier, isSynonym);
        const score = matchScore(tier, titleMatch.fine, TITLE_WEIGHT);
        // Keep the best-scoring title hit's spans so highlights track the strongest match.
        if (tokenTitleSpans === null || score > bestScore) tokenTitleSpans = titleMatch.spans;
        if (score > bestScore) {
          bestScore = score;
          bestTier = tier;
        }
      }

      for (const field of target.fields) {
        const fieldMatch = matchText(candidate, field.text);
        if (!fieldMatch) continue;
        const tier = capTier(fieldMatch.tier, isSynonym);
        const score = matchScore(tier, fieldMatch.fine, field.weight);
        if (score > bestScore) {
          bestScore = score;
          bestTier = tier;
        }
      }
    }

    if (bestTier === null) return null;

    totalScore += bestScore;
    const rank = TIER_RANK[bestTier];
    if (rank < worstRank) {
      worstRank = rank;
      worstTier = bestTier;
    }
    if (tokenTitleSpans) {
      for (const span of tokenTitleSpans) titleSpans.push(span);
    } else {
      allTokensHitTitle = false;
    }
  }

  return {
    score: totalScore + (allTokensHitTitle ? TITLE_BONUS : 0),
    tier: worstTier,
    titleSpans: mergeSpans(titleSpans, target.title.length),
  };
}

/** Sort comparator: richer tier first, then raw score. Callers add their own stable tail. */
export function compareMatches(a: MatchResult, b: MatchResult): number {
  const tierDelta = TIER_RANK[b.tier] - TIER_RANK[a.tier];
  if (tierDelta !== 0) return tierDelta;
  return b.score - a.score;
}

function mergeSpans(spans: readonly Span[], max: number): Span[] {
  const clamped = spans
    .map(
      ([start, end]): Span => [Math.max(0, Math.min(start, max)), Math.max(0, Math.min(end, max))],
    )
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  const merged: Span[] = [];
  for (const span of clamped) {
    const last = merged[merged.length - 1];
    if (last && span[0] <= last[1]) {
      merged[merged.length - 1] = [last[0], Math.max(last[1], span[1])];
    } else {
      merged.push(span);
    }
  }
  return merged;
}

/**
 * Split `text` into highlighted / plain segments for the given spans. Pure (no
 * JSX) so it is node-testable; the React wrapper in `highlight.tsx` maps these
 * to `<mark>`/text nodes.
 */
export function toHighlightSegments(
  text: string,
  spans: readonly Span[],
): readonly HighlightSegment[] {
  const merged = mergeSpans(spans, text.length);
  if (merged.length === 0) return text ? [{ text, marked: false }] : [];

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), marked: false });
    segments.push({ text: text.slice(start, end), marked: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), marked: false });
  return segments;
}

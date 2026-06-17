import { Fragment, type ReactNode } from 'react';

import { toHighlightSegments, type Span } from './fuzzy-search';

/**
 * Wrap the matched ranges of `text` in `<mark className="search-mark">`, leaving
 * the rest plain. A thin JSX shell over the pure `toHighlightSegments` so all
 * span logic stays node-testable. Pass `[]` for rows that aren't fuzzy-scored.
 */
export function highlightSpans(text: string, spans: readonly Span[]): ReactNode[] {
  return toHighlightSegments(text, spans).map((segment, index) =>
    segment.marked ? (
      <mark key={`m${index}`} className="search-mark">
        {segment.text}
      </mark>
    ) : (
      <Fragment key={`t${index}`}>{segment.text}</Fragment>
    ),
  );
}

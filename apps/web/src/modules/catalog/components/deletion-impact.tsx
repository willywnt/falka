import type { DeletionBlockers } from '../types';

/** Shows a delete preflight: hard blockers (destructive) + soft warnings (muted). */
export function DeletionImpact({
  blockers,
  isLoading,
}: {
  blockers: DeletionBlockers | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <p className="text-muted-foreground text-sm">Checking…</p>;
  if (!blockers || (blockers.reasons.length === 0 && blockers.warnings.length === 0)) return null;

  return (
    <div className="space-y-2">
      {blockers.reasons.length > 0 ? (
        <ul className="border-destructive/30 bg-destructive/5 text-destructive space-y-1 rounded-md border p-3 text-sm">
          {blockers.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      {blockers.warnings.length > 0 ? (
        <ul className="text-muted-foreground bg-muted/30 space-y-1 rounded-md border p-3 text-sm">
          {blockers.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
